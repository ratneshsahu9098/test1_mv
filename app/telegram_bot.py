import requests
from datetime import datetime
from config.settings import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

LOG_FILE = "data/telegram_logs.txt"


def send_telegram_message(message: str, chat_id: str = None) -> bool:
    if not TELEGRAM_BOT_TOKEN:
        print("Telegram not configured: TELEGRAM_BOT_TOKEN not set")
        return False

    target = chat_id or TELEGRAM_CHAT_ID
    if not target:
        print("Telegram not configured: no chat_id available")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": target, "text": message, "parse_mode": "HTML"}

    try:
        resp = requests.post(url, data=payload, timeout=15)
        if resp.status_code == 200:
            _save_log(target, "sent")
            print(f"Telegram alert sent to {target}")
            return True
        else:
            print(f"Telegram send failed: {resp.text}")
            _save_log(target, f"failed: {resp.status_code}")
            return False
    except Exception as e:
        print(f"Telegram send error: {e}")
        _save_log(target, f"error: {e}")
        return False


def send_vehicle_reminder(vehicle_number: str, owner: str, expiry_date: str, days_left: int, chat_id: str = None):
    if days_left < 0:
        icon = "\u26a0\ufe0f"
        label = "EXPIRED"
        color = "red"
    elif days_left <= 1:
        icon = "\ud83d\udd34"
        label = "FINAL REMINDER"
        color = "red"
    elif days_left <= 3:
        icon = "\ud83d\udfe0"
        label = "URGENT"
        color = "orange"
    else:
        icon = "\ud83d\udd35"
        label = "REMINDER"
        color = "blue"

    message = (
        f"{icon} <b>MV Tax {label}</b>\n"
        f"\n"
        f"\ud83d\ude98 Vehicle: <b>{vehicle_number}</b>\n"
        f"\ud83d\udcc5 Expiry: {expiry_date}\n"
        f"\u23f3 Days Left: <b>{abs(days_left)} day(s)</b>\n"
        f"\ud83d\udc64 Owner: {owner}\n"
        f"\n"
        f"Please renew your vehicle tax on time."
    )
    return send_telegram_message(message, chat_id)


def _save_log(chat_id, status):
    import os
    os.makedirs("data", exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.now()} | {chat_id} | {status}\n")
