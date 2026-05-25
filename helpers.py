from datetime import datetime, timedelta
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
UPLOAD_FOLDER = "uploads"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    print("WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. Payments will fail.")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Detect if PostgreSQL is configured; fall back to SQLite for local dev
_using_postgres = bool(DATABASE_URL)


def get_db():
    if _using_postgres:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    import sqlite3
    conn = sqlite3.connect("vehicles.db")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def get_cursor(conn):
    if _using_postgres:
        from psycopg2.extras import RealDictCursor
        return conn.cursor(cursor_factory=RealDictCursor)
    return conn.cursor()


def check_subscription(user):
    if user["role"] == "admin":
        return "admin"

    expiry = user.get("subscription_expiry")
    status = user.get("subscription_status")

    if status == "active" and expiry:
        expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
        if expiry_date >= datetime.now():
            return "staff"

    if status == "active" and expiry:
        expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
        if expiry_date < datetime.now():
            conn = get_db()
            cur = get_cursor(conn)
            cur.execute(
                "UPDATE users SET role = 'viewer', subscription_status = 'expired' WHERE id = %s",
                (user["id"],),
            )
            conn.commit()
            conn.close()
            user["role"] = "viewer"
            user["subscription_status"] = "expired"

    return "viewer"


def get_current_user(username):
    conn = get_db()
    cur = get_cursor(conn)
    cur.execute("SELECT id, role FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    return {"id": row["id"], "username": username, "role": row["role"]}


def send_whatsapp_message(phone, message):
    instance_id = os.getenv("ULTRAMSG_INSTANCE_ID")
    token = os.getenv("ULTRAMSG_TOKEN")
    if not instance_id or not token:
        print("WhatsApp not configured: ULTRAMSG_INSTANCE_ID or ULTRAMSG_TOKEN not set")
        return
    url = f"https://api.ultramsg.com/{instance_id}/messages/chat"
    payload = {"token": token, "to": f"91{phone}", "body": message}
    response = requests.post(url, data=payload)
    print(response.text)


def auto_downgrade_expired():
    conn = get_db()
    cur = get_cursor(conn)
    cur.execute(
        "SELECT id, username, subscription_expiry FROM users WHERE role = 'staff' AND subscription_status = 'active'"
    )
    users = cur.fetchall()
    now = datetime.now()

    for user in users:
        user_id, username, expiry = user["id"], user["username"], user["subscription_expiry"]
        if expiry:
            expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
            if expiry_date < now:
                cur.execute(
                    "UPDATE users SET role = 'viewer', subscription_status = 'expired' WHERE id = %s",
                    (user_id,),
                )
                print(f"Auto-downgraded user '{username}' (expired {expiry})")

    conn.commit()
    conn.close()
