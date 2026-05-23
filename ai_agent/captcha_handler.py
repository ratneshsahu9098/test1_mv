import asyncio
import uuid
import time
import threading

from .browser_agent import AIBrowserAgent

_captcha_tasks = {}
_task_lock = threading.Lock()


def create_task(vehicle_number, chassis_last5):
    task_id = str(uuid.uuid4())[:8]
    with _task_lock:
        _captcha_tasks[task_id] = {
            "id": task_id,
            "vehicle_number": vehicle_number,
            "chassis_last5": chassis_last5,
            "status": "starting",
            "result": None,
            "captcha_image": None,
            "logs": [],
            "agent": None,
            "captcha_event": threading.Event(),
            "captcha_solution": None,
            "created_at": time.time(),
        }
    return task_id


def get_task(task_id):
    with _task_lock:
        task = _captcha_tasks.get(task_id)
        if task:
            return {
                "id": task["id"],
                "status": task["status"],
                "result": task.get("result"),
                "captcha_image": task.get("captcha_image"),
                "logs": task.get("logs", []),
                "vehicle_number": task["vehicle_number"],
                "error": task.get("result", {}).get("error") if isinstance(task.get("result"), dict) else None,
            }
        return None


def update_task(task_id, **kwargs):
    with _task_lock:
        if task_id in _captcha_tasks:
            _captcha_tasks[task_id].update(kwargs)


def cleanup_old_tasks(max_age=300):
    now = time.time()
    with _task_lock:
        expired = [tid for tid, t in _captcha_tasks.items() if now - t.get("created_at", 0) > max_age]
        for tid in expired:
            agent = _captcha_tasks[tid].get("agent")
            if agent:
                try:
                    loop = _captcha_tasks[tid].get("_loop")
                    if loop:
                        asyncio.run_coroutine_threadsafe(agent.close(), loop)
                except Exception:
                    pass
            del _captcha_tasks[tid]


def wait_for_captcha_solution(task_id, timeout=300):
    task = _captcha_tasks.get(task_id)
    if not task:
        return None
    event = task.get("captcha_event")
    if event and event.wait(timeout):
        with _task_lock:
            sol = _captcha_tasks[task_id].get("captcha_solution")
            _captcha_tasks[task_id]["captcha_solution"] = None
            return sol
    return None


def run_agent_in_thread(task_id, vehicle_number, chassis_last5):
    async def _run():
        agent = AIBrowserAgent(vehicle_number, chassis_last5)
        update_task(task_id, status="running", agent=agent)
        result = await agent.run_with_retry(max_retries=1)
        if result.get("captcha_needed"):
            update_task(
                task_id,
                status="captcha_needed",
                captcha_image=result.get("captcha_image"),
                logs=result.get("logs", []),
            )
            captcha_input = wait_for_captcha_solution(task_id)
            if captcha_input:
                update_task(task_id, status="solving", logs=result.get("logs", []))
                result = await agent.run_with_captcha(captcha_input)
                if result.get("success"):
                    update_task(task_id, status="complete", result=result.get("data"), logs=result.get("logs", []))
                else:
                    update_task(task_id, status="error", result={"error": result.get("error")}, logs=result.get("logs", []))
            else:
                update_task(task_id, status="error", result={"error": "CAPTCHA timeout or cancelled"}, logs=result.get("logs", []))
        elif result.get("success"):
            update_task(task_id, status="complete", result=result.get("data"), logs=result.get("logs", []))
        else:
            update_task(task_id, status="error", result={"error": result.get("error")}, logs=result.get("logs", []))
        try:
            await agent.close()
        except Exception:
            pass

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    with _task_lock:
        if task_id in _captcha_tasks:
            _captcha_tasks[task_id]["_loop"] = loop
    loop.run_until_complete(_run())
    loop.close()


def start_agent(task_id, vehicle_number, chassis_last5):
    thread = threading.Thread(
        target=run_agent_in_thread,
        args=(task_id, vehicle_number, chassis_last5),
        daemon=True,
    )
    thread.start()


def submit_captcha(task_id, captcha_input):
    with _task_lock:
        if task_id not in _captcha_tasks:
            return False
        _captcha_tasks[task_id]["captcha_solution"] = captcha_input
        event = _captcha_tasks[task_id].get("captcha_event")
        if event:
            event.set()
    return True
