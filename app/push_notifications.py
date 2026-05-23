import firebase_admin
from firebase_admin import credentials, messaging
from datetime import datetime
import os
from config.settings import FIREBASE_SERVICE_ACCOUNT_PATH

LOG_FILE = "data/push_logs.txt"

_initialized = False


def _init_app():
    global _initialized
    if _initialized:
        return True
    path = FIREBASE_SERVICE_ACCOUNT_PATH
    if not path or not os.path.exists(path):
        print("Push not configured: service account file not found")
        return False
    try:
        cred = credentials.Certificate(path)
        firebase_admin.initialize_app(cred)
        _initialized = True
        return True
    except Exception as e:
        print(f"Firebase init error: {e}")
        return False


def send_push_notification(token: str, title: str, body: str, data: dict = None) -> bool:
    if not _init_app():
        return False
    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=token,
        )
        resp = messaging.send(message)
        _save_log(token[:20], title, "sent")
        return True
    except Exception as e:
        print(f"Push notification error: {e}")
        _save_log(token[:20], title, f"error: {e}")
        return False


def send_vehicle_push(token: str, vehicle_number: str, days_left: int):
    if days_left < 0:
        title = f"\u26a0\ufe0f Tax Expired: {vehicle_number}"
        body = f"Vehicle tax expired {-days_left} day(s) ago. Renew immediately!"
    elif days_left <= 1:
        title = f"\ud83d\udd34 Final Reminder: {vehicle_number}"
        body = f"Tax expires tomorrow! Please renew your vehicle tax."
    elif days_left <= 3:
        title = f"\ud83d\udfe0 Urgent: {vehicle_number}"
        body = f"Tax expires in {days_left} day(s). Renew soon to avoid penalties."
    else:
        title = f"\ud83d\udd35 Reminder: {vehicle_number}"
        body = f"Tax expires in {days_left} day(s). Please plan renewal."
    data = {"vehicle": vehicle_number, "days_left": str(days_left), "type": "tax_reminder"}
    return send_push_notification(token, title, body, data)


def send_bulk_push(tokens: list, title: str, body: str, data: dict = None) -> bool:
    if not _init_app():
        return False
    if not tokens:
        return False
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            tokens=tokens,
        )
        resp = messaging.send_each(message)
        print(f"Bulk push sent to {resp.success_count}/{len(tokens)} device(s)")
        return resp.success_count > 0
    except Exception as e:
        print(f"Bulk push error: {e}")
        return False


def _save_log(token_prefix, title, status):
    import os as _os
    _os.makedirs("data", exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.now()} | {token_prefix}... | {title} | {status}\n")
