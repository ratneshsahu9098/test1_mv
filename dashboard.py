from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from flask import *
from flask import jsonify, request
from flask_jwt_extended import *
import bcrypt
from flask_cors import CORS
import requests
from datetime import datetime
import json
import os
import pandas as pd
from flask import send_file
from flask import send_from_directory

UPLOAD_FOLDER = "uploads"

FETCH_RUNNING = False

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

import sqlite3

app = Flask(__name__)


CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.secret_key = "supersecretkey"
# app.config["JWT_SECRET_KEY"] = "jwt-secret-key"
app.config["JWT_SECRET_KEY"] = "mv_tax_dashboard_super_secret_key_2026_secure"

jwt = JWTManager(app)


def get_current_user(username):

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        SELECT role

        FROM users

        WHERE username=?

        """,
        (username,),
    )

    row = cursor.fetchone()

    conn.close()

    if not row:

        return None

    return {"username": username, "role": row[0]}


def send_whatsapp_message(phone, message):

    url = "https://api.ultramsg.com/" "instance175927" "/messages/chat"

    payload = {"token": "YOUR_TOKEN", "to": f"91{phone}", "body": message}

    response = requests.post(url, data=payload)

    print(response.text)


DB_FILE = "vehicles.db"


@app.route("/api/export_users")
@jwt_required()
def export_users():

    conn = sqlite3.connect(DB_FILE)

    df = pd.read_sql_query("SELECT * FROM users", conn)

    conn.close()

    file_name = "users.xlsx"

    df.to_excel(file_name, index=False)

    return send_file(file_name, as_attachment=True)


# Single user Export Data
@app.route("/api/export_user/<int:id>")
@jwt_required()
def export_user(id):

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    # -------------------------
    # GET USERNAME
    # -------------------------

    cursor.execute(
        """

        SELECT username

        FROM users

        WHERE id=?

        """,
        (id,),
    )

    row = cursor.fetchone()

    if not row:

        conn.close()

        return jsonify({"error": "User not found"}), 404

    username = row[0]

    # -------------------------
    # EXPORT VEHICLES
    # -------------------------

    query = """

    SELECT
        vehicle_number,
        owner,
        phone,
        expiry_date,
        chassis_last5,
        state_name,
        vahan_owner_name,
        added_by

    FROM vehicles

    WHERE added_by=?

    """

    df = pd.read_sql_query(query, conn, params=(username,))

    conn.close()

    file_name = f"{username}_vehicles.xlsx"

    df.to_excel(file_name, index=False)

    return send_file(file_name, as_attachment=True)


# -------------------------
# CREATE DATABASE TABLES
# -------------------------

conn = sqlite3.connect(DB_FILE)

cursor = conn.cursor()

# USERS TABLE

cursor.execute("""

CREATE TABLE IF NOT EXISTS
users (

    id INTEGER
    PRIMARY KEY AUTOINCREMENT,

    username TEXT UNIQUE,

    password TEXT,

    role TEXT

)

""")
# DEFAULT ADMIN

cursor.execute(
    """

    INSERT OR IGNORE INTO users (

        username,
        password,
        role

    )

    VALUES (?, ?, ?)

""",
    ("admin", bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode(), "admin"),
)

# DEFAULT STAFF

cursor.execute(
    """

    INSERT OR IGNORE INTO users (

        username,
        password,
        role

    )

    VALUES (?, ?, ?)

""",
    ("staff1", bcrypt.hashpw("staff123".encode(), bcrypt.gensalt()).decode(), "staff"),
)

# DEFAULT VIEWER

cursor.execute(
    """

    INSERT OR IGNORE INTO users (

        username,
        password,
        role

    )

    VALUES (?, ?, ?)

""",
    (
        "viewer1",
        bcrypt.hashpw("viewer123".encode(), bcrypt.gensalt()).decode(),
        "viewer",
    ),
)

# UPLOAD FILES


@app.route("/uploads/<filename>")
def uploaded_file(filename):

    return send_from_directory(UPLOAD_FOLDER, filename)


# VEHICLES TABLE

cursor.execute("""

CREATE TABLE IF NOT EXISTS
vehicles (

    id INTEGER
    PRIMARY KEY AUTOINCREMENT,

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

cursor.execute("""

CREATE TABLE IF NOT EXISTS
deleted_vehicles (

    id INTEGER
    PRIMARY KEY AUTOINCREMENT,

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

cursor.execute("""

CREATE TABLE IF NOT EXISTS
vehicle_history (

    id INTEGER
    PRIMARY KEY AUTOINCREMENT,

    vehicle_id INTEGER,

    vehicle_number TEXT,

    expiry_date TEXT,

    phone TEXT,

    owner TEXT,

    edited_at TEXT
)

""")

conn.commit()

conn.close()

# -------------------------
# VEHICLE HISTORY API
# -------------------------


@app.route("/api/vehicle_history/<int:id>", methods=["GET"])
@jwt_required()
def vehicle_history_api(id):

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

    SELECT
        vehicle_number,
        expiry_date,
        phone,
        owner,
        edited_at

    FROM vehicle_history

    WHERE vehicle_id=?

    ORDER BY id DESC

    """,
        (id,),
    )

    history = cursor.fetchall()

    conn.close()

    result = []

    for row in history:

        result.append(
            {
                "vehicle_number": row[0],
                "expiry_date": row[1],
                "phone": row[2],
                "owner": row[3],
                "edited_at": row[4],
            }
        )

    return jsonify(result)


@app.route("/api/fetch_vehicle_info/<vehicle_number>")
@jwt_required()
def fetch_vehicle_info(vehicle_number):

    global FETCH_RUNNING

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] == "viewer":

        FETCH_RUNNING = False

        return jsonify({"error": "Viewer access denied"}), 403

    if FETCH_RUNNING:

        return jsonify({"error": "Fetch already running"}), 429

    FETCH_RUNNING = True

    import subprocess

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        SELECT chassis_last5

        FROM vehicles

        WHERE vehicle_number=?

        """,
        (vehicle_number,),
    )

    row = cursor.fetchone()

    conn.close()

    if not row:

        FETCH_RUNNING = False
        return jsonify({"error": "Vehicle not found"}), 404

    chassis_last5 = row[0]

    try:

        result = subprocess.run(
            ["python", "fetch_vehicle.py", vehicle_number, chassis_last5],
            capture_output=True,
            text=True,
            timeout=180,
        )

        print(result.stdout)

        # -------------------------
        # EXTRACT TAX DATE
        # -------------------------

        output = result.stdout

        tax_upto = None
        owner_name = None

        output = result.stdout.strip()

        print(output)

        lines = output.splitlines()

        json_line = None

        for line in reversed(lines):

            line = line.strip()

            if line.startswith("{") and line.endswith("}"):

                json_line = line

                break

        if not json_line:

            FETCH_RUNNING = False

            return jsonify({"error": "JSON output not found"}), 500

        data = json.loads(json_line)

        tax_upto = data.get("tax_upto")

        owner_name = data.get("owner_name")

        # -------------------------
        # TAX EXTRACTION FAILED
        # -------------------------

        if not tax_upto:

            FETCH_RUNNING = False

            return jsonify({"error": "Tax extraction failed"}), 500

        # -------------------------
        # CONVERT DATE FORMAT
        # -------------------------

        from datetime import datetime

        tax_upto = datetime.strptime(tax_upto, "%d-%b-%Y").strftime("%Y-%m-%d")

        # -------------------------
        # UPDATE DATABASE
        # -------------------------

        conn = sqlite3.connect(DB_FILE)

        cursor = conn.cursor()

        cursor.execute(
            """

            UPDATE vehicles

            SET
                expiry_date=?,
                vahan_owner_name=?

            WHERE vehicle_number=?

            """,
            (tax_upto, owner_name, vehicle_number),
        )

        conn.commit()

        conn.close()

        print(f"Updated DB: {tax_upto}")

        FETCH_RUNNING = False

        return jsonify(
            {"vehicle": vehicle_number, "output": result.stdout, "error": result.stderr}
        )

    except subprocess.TimeoutExpired:

        FETCH_RUNNING = False
        return jsonify({"error": "Fetch timed out"}), 408


# -------------------------
# ADD VEHICLE API
# -------------------------


@app.route("/api/add_vehicle", methods=["POST"])
@jwt_required()
def add_vehicle_api():
    print("ADD VEHICLE API CALLED")  # temp

    vehicle_number = request.form.get("vehicle_number")

    expiry_date = request.form.get("expiry_date")

    phone = request.form.get("phone")

    owner = request.form.get("owner")

    chassis_last5 = request.form.get("chassis_last5")

    state_name = request.form.get("state_name")

    file = request.files.get("support_document")

    username = get_jwt_identity()

    support_document = ""
    # temp
    print(vehicle_number)

    print(expiry_date)

    print(phone)

    print(owner)

    print(chassis_last5)

    print(state_name)

    if file:

        support_document = file.filename

        file.save(os.path.join(UPLOAD_FOLDER, support_document))

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("""

CREATE TABLE IF NOT EXISTS
vehicle_history (

    id INTEGER
    PRIMARY KEY AUTOINCREMENT,

    vehicle_id INTEGER,

    vehicle_number TEXT,

    expiry_date TEXT,

    phone TEXT,

    owner TEXT,

    edited_at TEXT
    
)

""")

    cursor.execute(
        """

    INSERT INTO vehicles (

        vehicle_number,
        expiry_date,
        phone,
        owner,
        chassis_last5,
        state_name,
        support_document,
        vahan_owner_name,
        added_by

    )

    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

    """,
        (
            vehicle_number,
            expiry_date,
            phone,
            owner,
            chassis_last5,
            state_name,
            support_document,
            "",
            username,
        ),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "Vehicle added"})


# -------------------------
# LOGIN
# -------------------------


@app.route("/login", methods=["GET", "POST"])
def login():

    error = None

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        # Simple admin login
        if username == "admin" and password == "app@9098":

            session["user"] = username

            return redirect("/")

        else:
            error = "Invalid credentials"

    return render_template("login.html", error=error)


# -------------------------
# LOGOUT
# -------------------------


@app.route("/logout")
def logout():

    session.pop("user", None)

    return redirect("/login")


# -------------------------
# DELETE VEHICLE API
# -------------------------


@app.route("/api/delete_vehicle/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_vehicle_api(id):

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    # -------------------------
    # GET VEHICLE DATA
    # -------------------------

    cursor.execute(
        """

        SELECT *

        FROM vehicles

        WHERE id=?

        """,
        (id,),
    )

    vehicle = cursor.fetchone()

    # -------------------------
    # SAVE INTO deleted_vehicles
    # -------------------------

    from datetime import datetime

    cursor.execute(
        """

        INSERT INTO deleted_vehicles (

            original_vehicle_id,

            vehicle_number,
            expiry_date,
            phone,
            owner,
            chassis_last5,
            state_name,
            support_document,

            deleted_by,
            deleted_at

        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    """,
        (
            vehicle[0],
            vehicle[1],
            vehicle[2],
            vehicle[3],
            vehicle[4],
            vehicle[5],
            vehicle[6],
            vehicle[7],
            user["username"],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )

    # -------------------------
    # DELETE ORIGINAL
    # -------------------------

    cursor.execute(
        """

        DELETE FROM vehicles

        WHERE id=?

    """,
        (id,),
    )
    conn.commit()

    conn.close()

    return jsonify({"message": "Vehicle deleted"})


# -------------------------
# RESTORE VEHICLE API
# -------------------------


@app.route("/api/restore_vehicle/<int:id>", methods=["POST"])
@jwt_required()
def restore_vehicle(id):

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    # -------------------------
    # GET DELETED VEHICLE
    # -------------------------

    cursor.execute(
        """

        SELECT *

        FROM deleted_vehicles

        WHERE id=?

""",
        (id,),
    )

    vehicle = cursor.fetchone()

    if not vehicle:

        conn.close()

        return jsonify({"error": "Vehicle not found"}), 404

    # -------------------------
    # RESTORE TO vehicles
    # -------------------------

    cursor.execute(
        """

        INSERT INTO vehicles (

            vehicle_number,
            expiry_date,
            phone,
            owner,
            chassis_last5,
            state_name,
            support_document

        )

        VALUES (?, ?, ?, ?, ?, ?, ?)

""",
        (
            vehicle[2],
            vehicle[3],
            vehicle[4],
            vehicle[5],
            vehicle[6],
            vehicle[7],
            vehicle[8],
        ),
    )

    # -------------------------
    # REMOVE FROM deleted table
    # -------------------------

    cursor.execute(
        """

        DELETE FROM deleted_vehicles

        WHERE id=?

""",
        (id,),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "Vehicle restored"})


@app.route("/api/update_vehicle/<int:id>", methods=["PUT"])
@jwt_required()
def update_vehicle_api(id):

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] == "viewer":

        return jsonify({"error": "Viewer access denied"}), 403

    data = request.get_json()

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("SELECT * FROM vehicles WHERE id=?", (id,))

    old_vehicle = cursor.fetchone()

    if not old_vehicle:

        conn.close()

        return jsonify({"error": "Vehicle not found"}), 404

    vehicle_number = data.get("vehicle_number") or old_vehicle[1]

    expiry_date = data.get("expiry") or old_vehicle[2]

    phone = data.get("phone") or old_vehicle[3]

    owner = data.get("owner") or old_vehicle[4]

    chassis_last5 = data.get("chassis_last5") or old_vehicle[5]

    state_name = old_vehicle[6]

    support_document = old_vehicle[7]

    from datetime import datetime

    cursor.execute(
        """
        INSERT INTO vehicle_history (
            vehicle_id,
            vehicle_number,
            expiry_date,
            phone,
            owner,
            edited_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            old_vehicle[0],
            old_vehicle[1],
            old_vehicle[2],
            old_vehicle[3],
            old_vehicle[4],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )

    cursor.execute(
        """
        UPDATE vehicles
        SET
            vehicle_number=?,
            expiry_date=?,
            phone=?,
            owner=?,
            chassis_last5=?,
            state_name=?,
            support_document=?
        WHERE id=?
        """,
        (
            vehicle_number,
            expiry_date,
            phone,
            owner,
            chassis_last5,
            state_name,
            support_document,
            id,
        ),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "Vehicle updated"})


# -------------------------
# HOME PAGE
# -------------------------


@app.route("/")
def home():

    if "user" not in session:
        return redirect("/login")

    search = request.args.get("search", "")

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    if search:

        cursor.execute(
            """

        SELECT *
        FROM vehicles

        WHERE
            vehicle_number LIKE ?
            OR owner LIKE ?

        """,
            (f"%{search}%", f"%{search}%"),
        )

    else:

        cursor.execute("""
        SELECT *
        FROM vehicles
        """)

    vehicles = cursor.fetchall()

    # -------------------------
    # ANALYTICS
    # -------------------------

    from datetime import datetime

    today = datetime.today()

    total_vehicles = len(vehicles)

    expired_count = 0
    expiring_count = 0
    active_count = 0
    for vehicle in vehicles:

        expiry = datetime.strptime(vehicle[2], "%Y-%m-%d")

        days_left = (expiry - today).days

        if days_left < 0:

            expired_count += 1

        elif days_left <= 7:

            expiring_count += 1

        else:

            active_count += 1

    from datetime import timedelta

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


# -------------------------
# EDIT PAGE
# -------------------------


@app.route("/edit/<int:id>")
def edit_page(id):

    if "user" not in session:
        return redirect("/login")

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """
    SELECT *
    FROM vehicles
    WHERE id=?
    """,
        (id,),
    )

    vehicle = cursor.fetchone()

    conn.close()

    return render_template("edit.html", vehicle=vehicle)


# -------------------------
# UPDATE
# -------------------------


@app.route("/update/<int:id>", methods=["POST"])
def update_vehicle_form(id):

    if "user" not in session:
        return redirect("/login")

    vehicle_number = request.form["vehicle_number"]
    expiry_date = request.form["expiry_date"]
    phone = request.form["phone"]
    owner = request.form["owner"]

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

    UPDATE vehicles

    SET
        vehicle_number=?,
        expiry_date=?,
        phone=?,
        owner=?

    WHERE id=?

    """,
        (vehicle_number, expiry_date, phone, owner, id),
    )

    conn.commit()
    conn.close()

    return redirect("/")


# -------------------------
# PDF REPORT
# -------------------------


@app.route("/report")
def generate_report():

    if "user" not in session:
        return redirect("/login")

    from reportlab.platypus import (
        SimpleDocTemplate,
        Table,
        TableStyle,
        Paragraph,
        Spacer,
    )

    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet

    from flask import send_file

    import sqlite3

    pdf_file = "vehicle_report.pdf"

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("""
    SELECT *
    FROM vehicles
    """)

    vehicles = cursor.fetchall()

    conn.close()

    doc = SimpleDocTemplate(pdf_file)

    styles = getSampleStyleSheet()

    elements = []

    title = Paragraph("MV Tax Vehicle Report", styles["Title"])

    elements.append(title)

    elements.append(Spacer(1, 20))

    data = [["ID", "Vehicle", "Expiry", "Phone", "Owner"]]

    for vehicle in vehicles:

        data.append([vehicle[0], vehicle[1], vehicle[2], vehicle[3], vehicle[4]])

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
# API - GET VEHICLES
# -------------------------


@app.route("/api/vehicles", methods=["GET"])
@jwt_required()
def api_get_vehicles():

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("""
    SELECT *
    FROM vehicles
    """)

    vehicles = cursor.fetchall()

    conn.close()

    vehicle_list = []

    for vehicle in vehicles:

        vehicle_list.append(
            {
                "id": vehicle[0],
                "vehicle_number": vehicle[1],
                "expiry_date": vehicle[2],
                "phone": vehicle[3],
                "owner": vehicle[4],
                "chassis_last5": vehicle[5],
                "state_name": vehicle[6],
                "support_document": vehicle[7],
                "vahan_owner_name": vehicle[8],
                "added_by": vehicle[9],
            }
        )

    return jsonify(vehicle_list)


# -------------------------
# API - ADD VEHICLE-Deleted
# -------------------------


# API - DELETE VEHICLE - REMOVED
# -------------------------
# -------------------------
# API - GET USERS
# -------------------------


@app.route("/api/users", methods=["GET"])
@jwt_required()
def get_users():

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("""

        SELECT
            id,
            username,
            role

        FROM users

""")

    rows = cursor.fetchall()

    conn.close()

    users = []

    for row in rows:

        users.append({"id": row[0], "username": row[1], "role": row[2]})

    return jsonify(users)


# -------------------------
# API - ADD USER
# -------------------------


@app.route("/api/add_user", methods=["POST"])
@jwt_required()
def add_user():

    username = get_jwt_identity()

    user = get_current_user(username)

    if role == "admin":

        return jsonify({"error": "Cannot create admin"}), 403

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()

    username = data.get("username")

    password = data.get("password")
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    role = data.get("role")

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        INSERT INTO users (

            username,
            password,
            role

        )

        VALUES (?, ?, ?)

""",
        (username, hashed_password, role),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "User added"})


# -------------------------
# API - DELETE USER
# -------------------------


@app.route("/api/delete_user/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_user(id):

    username = get_jwt_identity()

    user = get_current_user(username)
    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

            SELECT id

            FROM users

            WHERE username=?

        """,
        (user["username"],),
    )

    current_user = cursor.fetchone()

    if current_user and current_user[0] == id:

        conn.close()

        return jsonify({"error": "Cannot delete your own account"}), 400

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        DELETE FROM users

        WHERE id=?

""",
        (id,),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "User deleted"})


@app.route("/api/update_user_role/<int:id>", methods=["PUT"])
@jwt_required()
def update_user_role(id):

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()

    new_role = data.get("role")

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        UPDATE users

        SET role=?

        WHERE id=?

        """,
        (new_role, id),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "Role updated"})


# ADMIN PANEL
@app.route("/api/update_user/<int:id>", methods=["PUT"])
@jwt_required()
def update_user(id):

    username = get_jwt_identity()

    current_user = get_current_user(username)

    if current_user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()

    new_username = data.get("username")
    new_password = data.get("password")
    hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("SELECT username FROM users WHERE id=?", (id,))

    target_user = cursor.fetchone()

    if target_user and target_user[0] == "admin":

        conn.close()

        return jsonify({"error": "Admin cannot be edited"}), 403

    cursor.execute(
        """

        UPDATE users

        SET username=?,
            password=?

        WHERE id=?

        """,
        (new_username, hashed_password, id),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "User updated"})


# -------------------------
# API - CHANGE PASSWORD
# -------------------------


@app.route("/api/change_password", methods=["POST"])
@jwt_required()
def change_password():

    username = get_jwt_identity()

    user = get_current_user(username)

    data = request.get_json()

    new_password = data.get("new_password")
    hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        UPDATE users

        SET password=?

        WHERE username=?

""",
        (hashed_password, user["username"]),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "Password updated"})


@app.route("/api/update_profile", methods=["PUT"])
@jwt_required()
def update_profile():

    current_username = get_jwt_identity()

    data = request.get_json()

    new_username = data.get("username")

    new_password = data.get("password")

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    # -------------------------
    # HASH PASSWORD
    # -------------------------

    if new_password:

        hashed_password = bcrypt.hashpw(
            new_password.encode(), bcrypt.gensalt()
        ).decode()

        cursor.execute(
            """

            UPDATE users

            SET
                username=?,
                password=?

            WHERE username=?

            """,
            (new_username, hashed_password, current_username),
        )

    else:

        cursor.execute(
            """

            UPDATE users

            SET username=?

            WHERE username=?

            """,
            (new_username, current_username),
        )

    conn.commit()

    conn.close()

    return jsonify({"message": "Profile updated"})


# -------------------------
# API LOGIN
# -------------------------


@app.route("/api/login", methods=["POST"])
def api_login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        SELECT
            id,
            password,
            role

        FROM users

        WHERE username=?

    """,
        (username,),
    )

    user = cursor.fetchone()

    conn.close()

    if user and bcrypt.checkpw(password.encode(), user[1].encode()):

        token = create_access_token(identity=username)

        return jsonify({"token": token, "role": user[2], "username": username})

    return jsonify({"error": "Invalid credentials"}), 401


# -------------------------
# GET DELETED VEHICLES
# -------------------------


@app.route("/api/deleted_vehicles", methods=["GET"])
@jwt_required()
def get_deleted_vehicles():

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("""

        SELECT *

        FROM deleted_vehicles

        ORDER BY id DESC

""")

    rows = cursor.fetchall()

    conn.close()

    deleted = []

    for row in rows:

        deleted.append(
            {
                "id": row[0],
                "original_vehicle_id": row[1],
                "vehicle_number": row[2],
                "expiry_date": row[3],
                "phone": row[4],
                "owner": row[5],
                "deleted_by": row[9],
                "deleted_at": row[10],
            }
        )

    return jsonify(deleted)


# -------------------------
# PERMANENT DELETE VEHICLE
# -------------------------


@app.route("/api/permanent_delete_vehicle/<int:id>", methods=["DELETE"])
@jwt_required()
def permanent_delete_vehicle(id):

    username = get_jwt_identity()

    user = get_current_user(username)

    if user["role"] != "admin":

        return jsonify({"error": "Admin access required"}), 403

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute(
        """

        DELETE FROM deleted_vehicles

        WHERE id=?

""",
        (id,),
    )

    conn.commit()

    conn.close()

    return jsonify({"message": "Vehicle permanently deleted"})


# -------------------------
# RUN APP
# -------------------------

if __name__ == "__main__":

    app.run(debug=True)
