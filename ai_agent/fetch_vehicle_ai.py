from .captcha_handler import create_task, start_agent, get_task, submit_captcha, cleanup_old_tasks
from .browser_agent import AIBrowserAgent
from .parser import parse_ai_extraction_result, parse_tax_date


def ai_fetch_vehicle(vehicle_number, chassis_last5):
    task_id = create_task(vehicle_number, chassis_last5)
    start_agent(task_id, vehicle_number, chassis_last5)
    return task_id


def get_fetch_status(task_id):
    task = get_task(task_id)
    if not task:
        return None
    response = {
        "task_id": task["id"],
        "status": task["status"],
        "logs": task.get("logs", []),
        "vehicle_number": task["vehicle_number"],
    }
    if task["status"] == "complete":
        data = task.get("result", {})
        if isinstance(data, dict) and "tax_upto" in data:
            response["result"] = {
                "tax_upto": parse_tax_date(data.get("tax_upto")),
                "owner_name": data.get("owner_name", ""),
                "vehicle_number": data.get("vehicle_number", task["vehicle_number"]),
                "fuel_type": data.get("fuel_type"),
                "model": data.get("model"),
            }
        else:
            response["result"] = data
    elif task["status"] == "captcha_needed":
        response["captcha_image"] = task.get("captcha_image")
    elif task["status"] == "error":
        response["error"] = task.get("result", {}).get("error", "Unknown error")
    return response


def submit_ai_captcha(task_id, captcha_input):
    return submit_captcha(task_id, captcha_input)
