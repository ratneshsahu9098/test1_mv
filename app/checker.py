from datetime import datetime
from helpers import get_db, get_cursor
from config.settings import ALERT_DAYS, REMINDER_DAYS
from app.telegram_bot import send_vehicle_reminder
from app.email_sender import send_reminder_email, send_expired_email
from app.push_notifications import send_vehicle_push


def get_reminder_tier(days_left: int) -> str:
    if days_left < 0:
        return "expired"
    if days_left <= 1:
        return "final"
    if days_left <= 3:
        return "urgent"
    if days_left <= ALERT_DAYS:
        return "warning"
    return "safe"


def check_expiry():
    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT id, vehicle_number, expiry_date, phone, owner, email, notification_enabled, added_by
        FROM vehicles
    """)
    rows = cur.fetchall()

    cur.execute("SELECT username, token FROM fcm_tokens")
    fcm_map = {}
    for row in cur.fetchall():
        uname = row["username"]
        token = row["token"]
        fcm_map.setdefault(uname, []).append(token)

    conn.close()

    today = datetime.now()
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking vehicle expiry dates...\n")

    stats = {"total": 0, "skipped": 0, "telegram": 0, "email": 0, "push": 0}

    for row in rows:
        vid = row["id"]
        vehicle = row["vehicle_number"]
        expiry_date = row["expiry_date"]
        phone = row["phone"]
        owner = row["owner"]
        email = row["email"]
        notif_enabled = row["notification_enabled"]
        added_by = row["added_by"]

        if not expiry_date:
            print(f"  {vehicle}: no expiry date, skipping.")
            stats["skipped"] += 1
            continue

        if not notif_enabled:
            stats["skipped"] += 1
            continue

        try:
            expiry = datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            print(f"  {vehicle}: invalid expiry '{expiry_date}', skipping.")
            stats["skipped"] += 1
            continue

        days_left = (expiry - today).days
        tier = get_reminder_tier(days_left)

        if tier == "safe":
            continue

        stats["total"] += 1
        print(f"  {vehicle}: {days_left} day(s) left [{tier}]")

        # Send Telegram alert
        send_vehicle_reminder(vehicle, owner, expiry_date, days_left)
        stats["telegram"] += 1

        # Send email if available
        if email:
            if days_left < 0:
                send_expired_email(email, vehicle, owner, expiry_date, abs(days_left))
            else:
                send_reminder_email(email, vehicle, owner, expiry_date, days_left)
            stats["email"] += 1

    # Send push notification per vehicle to the user who added it
    stats["push"] = 0
    for row in rows:
        vid = row["id"]
        vehicle = row["vehicle_number"]
        expiry_date = row["expiry_date"]
        phone = row["phone"]
        owner = row["owner"]
        email = row["email"]
        notif_enabled = row["notification_enabled"]
        added_by = row["added_by"]
        if not expiry_date or not notif_enabled:
            continue
        try:
            expiry = datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            continue
        days_left = (expiry - today).days
        tier = get_reminder_tier(days_left)
        if tier == "safe":
            continue
        tokens = fcm_map.get(added_by or owner, [])
        for token in tokens:
            send_vehicle_push(token, vehicle, days_left)
            stats["push"] += 1

    print(f"\nSummary: {stats['total']} alerts sent "
          f"(Telegram: {stats['telegram']}, Email: {stats['email']}, "
          f"Push: {stats['push']}, Skipped: {stats['skipped']})\n")

    return stats
