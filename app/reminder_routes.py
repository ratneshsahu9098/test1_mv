from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers import get_current_user, get_db, get_cursor
from app.email_sender import send_reminder_email, send_expired_email
from app.telegram_bot import send_vehicle_reminder
from app.push_notifications import send_vehicle_push, send_bulk_push
from app.checker import get_reminder_tier

reminder_bp = Blueprint("reminder", __name__)


def ensure_logs_table():
    conn = get_db()
    cur = get_cursor(conn)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notification_logs (
            id SERIAL PRIMARY KEY,
            vehicle_number TEXT,
            channel TEXT,
            message TEXT,
            success INTEGER DEFAULT 1,
            sent_at TEXT
        )
    """)
    conn.commit()
    conn.close()


def add_notification_log(vehicle_number, channel, message, success=True):
    try:
        conn = get_db()
        ensure_logs_table()
        cur = get_cursor(conn)
        cur.execute(
            "INSERT INTO notification_logs (vehicle_number, channel, message, success, sent_at) VALUES (%s, %s, %s, %s, %s)",
            (vehicle_number, channel, message, int(success), datetime.now().isoformat()),
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


@reminder_bp.route("/api/notification_logs", methods=["GET"])
@jwt_required()
def get_notification_logs():
    ensure_logs_table()
    conn = get_db()
    cur = get_cursor(conn)
    cur.execute("SELECT * FROM notification_logs ORDER BY id DESC LIMIT 100")
    rows = cur.fetchall()
    conn.close()
    return jsonify({"logs": [dict(r) for r in rows]})


@reminder_bp.route("/api/save_fcm_token", methods=["POST"])
@jwt_required()
def save_fcm_token():
    username = get_jwt_identity()
    data = request.get_json() or {}
    fcm_token = data.get("fcm_token")
    if not fcm_token:
        return jsonify({"error": "Missing fcm_token"}), 400

    conn = get_db()
    cur = get_cursor(conn)
    cur.execute(
        "CREATE TABLE IF NOT EXISTS fcm_tokens (id SERIAL PRIMARY KEY, username TEXT, token TEXT UNIQUE, created_at TEXT)"
    )
    cur.execute(
        "INSERT INTO fcm_tokens (username, token, created_at) VALUES (%s, %s, %s) ON CONFLICT (token) DO UPDATE SET username = EXCLUDED.username, created_at = EXCLUDED.created_at",
        (username, fcm_token, datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "FCM token saved"})


@reminder_bp.route("/api/send_reminder", methods=["POST"])
@jwt_required()
def send_reminder():
    username = get_jwt_identity()
    user = get_current_user(username)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    vehicle_id = data.get("vehicle_id")
    channel = data.get("channel", "telegram")

    conn = get_db()
    cur = get_cursor(conn)
    cur.execute(
        "SELECT vehicle_number, expiry_date, phone, owner, email FROM vehicles WHERE id=%s",
        (vehicle_id,),
    )
    vehicle = cur.fetchone()
    conn.close()

    if not vehicle:
        return jsonify({"error": "Vehicle not found"}), 404

    vnum = vehicle["vehicle_number"]
    expiry = vehicle["expiry_date"]
    phone = vehicle["phone"]
    owner = vehicle["owner"]
    email = vehicle["email"]
    today = datetime.now()

    try:
        expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
        days_left = (expiry_date - today).days
    except ValueError:
        return jsonify({"error": "Invalid expiry date"}), 400

    tier = get_reminder_tier(days_left)

    if channel == "telegram":
        send_vehicle_reminder(vnum, owner, expiry, days_left)
        add_notification_log(vnum, "telegram", f"{tier} reminder — {days_left} day(s) left")
        return jsonify({"message": "Telegram reminder sent", "tier": tier})

    elif channel == "email":
        if not email:
            conn2 = get_db()
            cur2 = get_cursor(conn2)
            cur2.execute("SELECT email FROM users WHERE username=%s", (username,))
            row2 = cur2.fetchone()
            conn2.close()
            email = row2["email"] if row2 and row2["email"] else ""
        if not email:
            return jsonify({"error": "No email on record for this vehicle"}), 400
        if days_left < 0:
            send_expired_email(email, vnum, owner, expiry, abs(days_left))
        else:
            send_reminder_email(email, vnum, owner, expiry, days_left)
        add_notification_log(vnum, "email", f"{tier} reminder sent to {email}")
        return jsonify({"message": "Email reminder sent", "tier": tier})

    elif channel == "push":
        conn3 = get_db()
        cur3 = get_cursor(conn3)
        cur3.execute("SELECT token FROM fcm_tokens WHERE username=%s", (username,))
        fcm_row = cur3.fetchone()
        conn3.close()
        if not fcm_row:
            return jsonify({"error": "No FCM token for this user. Enable browser notifications in Settings."}), 400
        send_vehicle_push(fcm_row["token"], vnum, days_left)
        add_notification_log(vnum, "push", f"{tier} push sent")
        return jsonify({"message": "Push notification sent", "tier": tier})

    elif channel == "all":
        send_vehicle_reminder(vnum, owner, expiry, days_left)
        add_notification_log(vnum, "telegram", f"{tier} reminder — {days_left} day(s) left")
        if email:
            if days_left < 0:
                send_expired_email(email, vnum, owner, expiry, abs(days_left))
            else:
                send_reminder_email(email, vnum, owner, expiry, days_left)
            add_notification_log(vnum, "email", f"{tier} reminder sent to {email}")
        conn3 = get_db()
        cur3 = get_cursor(conn3)
        cur3.execute("SELECT token FROM fcm_tokens WHERE username=%s", (username,))
        fcm_row = cur3.fetchone()
        conn3.close()
        if fcm_row:
            send_vehicle_push(fcm_row["token"], vnum, days_left)
            add_notification_log(vnum, "push", f"{tier} push sent")
        return jsonify({"message": "All reminders sent", "tier": tier})

    return jsonify({"error": "Invalid channel"}), 400


@reminder_bp.route("/api/send_bulk_reminders", methods=["POST"])
@jwt_required()
def send_bulk_reminders():
    username = get_jwt_identity()
    user = get_current_user(username)
    if not user or user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    channel = data.get("channel", "telegram")

    conn = get_db()
    cur = get_cursor(conn)
    cur.execute(
        "SELECT id, vehicle_number, expiry_date, phone, owner, email FROM vehicles"
    )
    vehicles = cur.fetchall()
    conn.close()

    today = datetime.now()
    sent = {"telegram": 0, "email": 0}

    for v in vehicles:
        vid = v["id"]
        vnum = v["vehicle_number"]
        expiry = v["expiry_date"]
        phone = v["phone"]
        owner = v["owner"]
        email = v["email"]
        try:
            expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
            days_left = (expiry_date - today).days
        except ValueError:
            continue

        tier = get_reminder_tier(days_left)
        if tier == "safe":
            continue

        if channel in ("telegram", "all"):
            send_vehicle_reminder(vnum, owner, expiry, days_left)
            sent["telegram"] += 1

        if channel in ("email", "all") and email:
            if days_left < 0:
                send_expired_email(email, vnum, owner, expiry, abs(days_left))
            else:
                send_reminder_email(email, vnum, owner, expiry, days_left)
            sent["email"] += 1

    if channel in ("push", "all"):
        conn2 = get_db()
        cur2 = get_cursor(conn2)
        cur2.execute("SELECT DISTINCT token FROM fcm_tokens")
        all_tokens = [r["token"] for r in cur2.fetchall()]
        conn2.close()
        if all_tokens:
            send_bulk_push(all_tokens, "MV Tax Reminder", "Some of your vehicles need tax renewal.")

    return jsonify({"message": "Bulk reminders sent", "sent": sent})


@reminder_bp.route("/api/reminder_stats", methods=["GET"])
@jwt_required()
def reminder_stats():
    username = get_jwt_identity()
    user = get_current_user(username)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db()
    cur = get_cursor(conn)

    if user["role"] == "admin":
        cur.execute("SELECT expiry_date, email, notification_enabled FROM vehicles")
    else:
        cur.execute(
            "SELECT expiry_date, email, notification_enabled FROM vehicles WHERE added_by=%s",
            (username,),
        )

    rows = cur.fetchall()
    conn.close()

    today = datetime.now()
    stats = {"total": len(rows), "needs_reminder": 0, "has_email": 0, "notifications_on": 0}

    for row in rows:
        expiry = row["expiry_date"]
        email = row["email"]
        notif_enabled = row["notification_enabled"]
        if email:
            stats["has_email"] += 1
        if notif_enabled:
            stats["notifications_on"] += 1
        try:
            expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
            days_left = (expiry_date - today).days
            if days_left <= 7:
                stats["needs_reminder"] += 1
        except (ValueError, TypeError):
            pass

    return jsonify(stats)
