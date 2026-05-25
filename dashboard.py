from datetime import datetime, timedelta
import os
import threading
import bcrypt
from flask import Flask, jsonify, render_template, request, redirect, session, send_from_directory, send_file
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from dotenv import load_dotenv

from helpers import UPLOAD_FOLDER, get_current_user, auto_downgrade_expired, get_db, get_cursor

from routes.auth import auth_bp
from routes.vehicles import vehicles_bp
from routes.users import users_bp
from routes.subscriptions import subscriptions_bp
from routes.exports import exports_bp
from app.reminder_routes import reminder_bp

from app.scheduler import start_scheduler
# from routes.ai_agent import ai_agent_bp  # removed for deployment (needs Playwright + OpenAI)
from routes.requests import requests_bp

load_dotenv()

app = Flask(__name__)

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
else:
    CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS.split(",")}}, supports_credentials=True)

app.secret_key = os.getenv("FLASK_SECRET_KEY") or os.urandom(32).hex()
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") or app.secret_key
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

jwt = JWTManager(app)

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Health check
@app.route("/api/health")
def health_check():
    return jsonify({"status": "healthy"})


# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(vehicles_bp)
app.register_blueprint(users_bp)
app.register_blueprint(subscriptions_bp)
app.register_blueprint(exports_bp)
app.register_blueprint(reminder_bp)
# app.register_blueprint(ai_agent_bp)  # removed for deployment
app.register_blueprint(requests_bp)

# Start scheduler in background thread
scheduler_thread = threading.Thread(target=start_scheduler, daemon=True)
scheduler_thread.start()

# -------------------------
# CREATE DATABASE TABLES
# -------------------------

conn = get_db()
cur = get_cursor(conn)

# USERS TABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    role TEXT
)
""")

# Ensure subscription columns exist (safe migration)
try:
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'")
except Exception:
    try:
        conn.rollback()
    except Exception:
        pass

try:
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expiry TEXT")
except Exception:
    try:
        conn.rollback()
    except Exception:
        pass

# DEFAULT ADMIN
cur.execute(
    """
    INSERT INTO users (username, password, role)
    VALUES (%s, %s, %s)
    ON CONFLICT (username) DO NOTHING
    """,
    ("admin", bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode(), "admin"),
)

# DEFAULT STAFF
cur.execute(
    """
    INSERT INTO users (username, password, role)
    VALUES (%s, %s, %s)
    ON CONFLICT (username) DO NOTHING
    """,
    ("staff1", bcrypt.hashpw("staff123".encode(), bcrypt.gensalt()).decode(), "staff"),
)

# DEFAULT VIEWER
cur.execute(
    """
    INSERT INTO users (username, password, role)
    VALUES (%s, %s, %s)
    ON CONFLICT (username) DO NOTHING
    """,
    ("viewer1", bcrypt.hashpw("viewer123".encode(), bcrypt.gensalt()).decode(), "viewer"),
)

# VEHICLES TABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number TEXT,
    expiry_date TEXT,
    phone TEXT,
    owner TEXT,
    chassis_last5 TEXT,
    state_name TEXT,
    support_document TEXT,
    vahan_owner_name TEXT,
    added_by TEXT
)
""")

# DELETED VEHICLES TABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS deleted_vehicles (
    id SERIAL PRIMARY KEY,
    original_vehicle_id INTEGER,
    vehicle_number TEXT,
    expiry_date TEXT,
    phone TEXT,
    owner TEXT,
    chassis_last5 TEXT,
    state_name TEXT,
    support_document TEXT,
    deleted_by TEXT,
    deleted_at TEXT
)
""")

# HISTORY TABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS vehicle_history (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER,
    vehicle_number TEXT,
    expiry_date TEXT,
    phone TEXT,
    owner TEXT,
    edited_at TEXT
)
""")

# DELETED USERS TABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS deleted_users (
    id SERIAL PRIMARY KEY,
    original_id INTEGER,
    username TEXT,
    email TEXT,
    phone TEXT,
    password TEXT,
    role TEXT,
    subscription_status TEXT DEFAULT 'free',
    subscription_expiry TEXT,
    deleted_at TEXT
)
""")

# PAYMENTS TABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER,
    currency TEXT,
    plan TEXT,
    status TEXT,
    paid_at TEXT
)
""")

# REQUESTS TABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username TEXT,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    admin_response TEXT,
    created_at TEXT,
    resolved_at TEXT
)
""")

# RESET TOKENS TABLE (admin-approved password resets)
cur.execute("""
CREATE TABLE IF NOT EXISTS reset_tokens (
    id SERIAL PRIMARY KEY,
    username TEXT,
    token TEXT UNIQUE,
    used INTEGER DEFAULT 0,
    created_at TEXT
)
""")

# FCM TOKENS TABLE (push notifications)
cur.execute("""
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id SERIAL PRIMARY KEY,
    username TEXT,
    token TEXT UNIQUE,
    created_at TEXT
)
""")

# Ensure notification columns exist on vehicles (safe migration)
try:
    cur.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS email TEXT")
except Exception:
    try:
        conn.rollback()
    except Exception:
        pass

try:
    cur.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS notification_enabled INTEGER DEFAULT 1")
except Exception:
    try:
        conn.rollback()
    except Exception:
        pass

# Database indexes for performance
try:
    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_number ON vehicles(vehicle_number)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_added_by ON vehicles(added_by)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_expiry_date ON vehicles(expiry_date)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_vehicle_history_vehicle_id ON vehicle_history(vehicle_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)")
except Exception:
    try:
        conn.rollback()
    except Exception:
        pass

conn.commit()
conn.close()

# Run auto-downgrade on startup (check for expired subs)
try:
    auto_downgrade_expired()
except Exception as e:
    print(f"Auto-downgrade on startup failed: {e}")

# -------------------------
# DASHBOARD STATS API
# -------------------------


@app.route("/api/dashboard_stats", methods=["GET"])
@jwt_required()
def dashboard_stats():

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db()
    cur = get_cursor(conn)

    if user["role"] == "admin":
        cur.execute("SELECT expiry_date FROM vehicles")
    else:
        cur.execute(
            "SELECT expiry_date FROM vehicles WHERE added_by=%s",
            (username,),
        )

    rows = cur.fetchall()
    today = datetime.now()

    total_vehicles = len(rows)
    expired = 0
    expiring_soon = 0
    active_vehicles = 0

    for row in rows:
        try:
            expiry = datetime.strptime(row["expiry_date"], "%Y-%m-%d")
            diff = (expiry - today).days
            if diff < 0:
                expired += 1
            elif diff <= 7:
                expiring_soon += 1
            else:
                active_vehicles += 1
        except Exception:
            pass

    total_users = 0
    active_users = 0
    total_deleted_users = 0
    users_by_role = {"admin": 0, "staff": 0, "viewer": 0}
    users_by_subscription = {"active": 0, "free": 0, "expired": 0}

    if user["role"] == "admin":
        cur.execute("SELECT role, subscription_status FROM users")
        user_rows = cur.fetchall()
        total_users = len(user_rows)

        for row in user_rows:
            role = row["role"]
            sub_status = row["subscription_status"]
            if role in users_by_role:
                users_by_role[role] += 1
            if role in ("admin", "staff"):
                active_users += 1
            status_key = sub_status or "free"
            if status_key in users_by_subscription:
                users_by_subscription[status_key] += 1

        cur.execute("SELECT COUNT(*) AS count FROM deleted_users")
        total_deleted_users = cur.fetchone()["count"]

    conn.close()

    response = jsonify(
        {
            "total_vehicles": total_vehicles,
            "expired": expired,
            "expiring_soon": expiring_soon,
            "active_vehicles": active_vehicles,
            "total_users": total_users,
            "active_users": active_users,
            "total_deleted_users": total_deleted_users,
            "users_by_role": users_by_role,
            "users_by_subscription": users_by_subscription,
        }
    )
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response


# -------------------------
# LEGACY HTML ROUTES
# -------------------------


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/login", methods=["GET", "POST"])
def login():

    error = None

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT password
            FROM users
            WHERE username=%s
            OR phone=%s
            """,
            (username, username),
        )

        user = cur.fetchone()
        conn.close()

        if user and bcrypt.checkpw(password.encode(), user["password"].encode()):
            session["user"] = username
            return redirect("/")
        else:
            error = "Invalid credentials"

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():

    session.pop("user", None)
    return redirect("/login")


@app.route("/")
def home():

    if "user" not in session:
        return redirect("/login")

    search = request.args.get("search", "")

    conn = get_db()
    cur = get_cursor(conn)

    if search:
        cur.execute(
            """
            SELECT * FROM vehicles
            WHERE vehicle_number LIKE %s
            OR owner LIKE %s
            """,
            (f"%{search}%", f"%{search}%"),
        )
    else:
        cur.execute("""
            SELECT * FROM vehicles
        """)

    vehicles = cur.fetchall()

    today = datetime.today()

    total_vehicles = len(vehicles)
    expired_count = 0
    expiring_count = 0
    active_count = 0

    for vehicle in vehicles:
        try:
            expiry = datetime.strptime(vehicle["expiry_date"], "%Y-%m-%d")
            days_left = (expiry - today).days

            if days_left < 0:
                expired_count += 1
            elif days_left <= 7:
                expiring_count += 1
            else:
                active_count += 1
        except (ValueError, TypeError):
            expired_count += 1

    current_date = today.strftime("%Y-%m-%d")
    warning_date = (today + timedelta(days=7)).strftime("%Y-%m-%d")

    conn.close()

    return render_template(
        "index.html",
        vehicles=vehicles,
        search=search,
        total_vehicles=total_vehicles,
        expired_count=expired_count,
        expiring_count=expiring_count,
        active_count=active_count,
        current_date=current_date,
        warning_date=warning_date,
    )


@app.route("/edit/<int:id>")
def edit_page(id):

    if "user" not in session:
        return redirect("/login")

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT * FROM vehicles WHERE id=%s
    """, (id,))

    vehicle = cur.fetchone()
    conn.close()

    return render_template("edit.html", vehicle=vehicle)


@app.route("/update/<int:id>", methods=["POST"])
def update_vehicle_form(id):

    if "user" not in session:
        return redirect("/login")

    vehicle_number = request.form["vehicle_number"]
    expiry_date = request.form["expiry_date"]
    phone = request.form["phone"]
    owner = request.form["owner"]
    email = request.form.get("email", "")

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
        UPDATE vehicles
        SET vehicle_number=%s, expiry_date=%s, phone=%s, owner=%s, email=%s
        WHERE id=%s
        """,
        (vehicle_number, expiry_date, phone, owner, email, id),
    )

    conn.commit()
    conn.close()

    return redirect("/")


@app.route("/report")
def generate_report():

    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet

    if "user" not in session:
        return redirect("/login")

    pdf_file = "vehicle_report.pdf"

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT * FROM vehicles
    """)

    vehicles = cur.fetchall()
    conn.close()

    doc = SimpleDocTemplate(pdf_file)
    styles = getSampleStyleSheet()
    elements = []

    title = Paragraph("MV Tax Vehicle Report", styles["Title"])
    elements.append(title)
    elements.append(Spacer(1, 20))

    data = [["ID", "Vehicle", "Expiry", "Phone", "Owner"]]

    for vehicle in vehicles:
        data.append([vehicle["id"], vehicle["vehicle_number"], vehicle["expiry_date"], vehicle["phone"], vehicle["owner"]])

    table = Table(data)

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.black),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ]
        )
    )

    elements.append(table)
    doc.build(elements)

    return send_file(pdf_file, as_attachment=True)


# -------------------------
# RUN APP
# -------------------------

if __name__ == "__main__":
    app.run(debug=False, use_reloader=False, threaded=True)
