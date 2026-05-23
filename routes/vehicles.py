from datetime import datetime, timedelta
import json
import os
import subprocess
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from helpers import UPLOAD_FOLDER, get_current_user, get_db, get_cursor

FETCH_RUNNING = False

vehicles_bp = Blueprint("vehicles", __name__)


@vehicles_bp.route("/api/vehicles", methods=["GET"])
@jwt_required()
def api_get_vehicles():

    conn = get_db()
    cur = get_cursor(conn)
    username = get_jwt_identity()
    user = get_current_user(username)

    if user["role"] == "admin":
        cur.execute("""
        SELECT * FROM vehicles
        """)
    else:
        cur.execute(
            """
            SELECT * FROM vehicles
            WHERE added_by=%s
            """,
            (username,),
        )

    vehicles = cur.fetchall()
    conn.close()

    vehicle_list = []

    for vehicle in vehicles:
        vehicle_list.append(
            {
                "id": vehicle["id"],
                "vehicle_number": vehicle["vehicle_number"],
                "expiry_date": vehicle["expiry_date"],
                "phone": vehicle["phone"],
                "owner": vehicle["owner"],
                "chassis_last5": vehicle["chassis_last5"],
                "state_name": vehicle["state_name"],
                "support_document": vehicle["support_document"],
                "vahan_owner_name": vehicle["vahan_owner_name"],
                "added_by": vehicle["added_by"],
                "email": vehicle.get("email", ""),
            }
        )

    return jsonify(vehicle_list)


@vehicles_bp.route("/api/add_vehicle", methods=["POST"])
@jwt_required()
def add_vehicle_api():

    print("ADD VEHICLE API CALLED")

    vehicle_number = request.form.get("vehicle_number")
    if not vehicle_number or len(vehicle_number.strip()) < 4:
        return jsonify({"error": "Invalid vehicle number"}), 400

    expiry_date = request.form.get("expiry_date")
    phone = request.form.get("phone")
    owner = request.form.get("owner")
    chassis_last5 = request.form.get("chassis_last5")
    state_name = request.form.get("state_name")
    email = request.form.get("email", "")
    file = request.files.get("support_document")
    username = get_jwt_identity()

    support_document = ""
    print(vehicle_number, expiry_date, phone, owner, chassis_last5, state_name, email)

    if file:
        safe_name = secure_filename(file.filename or "")
        if safe_name:
            support_document = f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}_{safe_name}"
            file.save(os.path.join(UPLOAD_FOLDER, support_document))

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS
    vehicle_history (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER,
        vehicle_number TEXT,
        expiry_date TEXT,
        phone TEXT,
        owner TEXT,
        edited_at TEXT
    )
    """)

    cur.execute(
        """
    INSERT INTO vehicles (
        vehicle_number, expiry_date, phone, owner, chassis_last5,
        state_name, support_document, vahan_owner_name, added_by, email
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """,
        (vehicle_number, expiry_date, phone, owner, chassis_last5, state_name, support_document, "", username, email),
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Vehicle added"})


@vehicles_bp.route("/api/update_vehicle/<int:id>", methods=["PUT"])
@jwt_required()
def update_vehicle_api(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if user["role"] == "viewer":
        return jsonify({"error": "Viewer access denied"}), 403

    data = request.get_json()

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("SELECT * FROM vehicles WHERE id=%s", (id,))
    old_vehicle = cur.fetchone()

    if not old_vehicle:
        conn.close()
        return jsonify({"error": "Vehicle not found"}), 404

    vehicle_number = data.get("vehicle_number") or old_vehicle["vehicle_number"]
    expiry_date = data.get("expiry") or old_vehicle["expiry_date"]
    phone = data.get("phone") or old_vehicle["phone"]
    owner = data.get("owner") or old_vehicle["owner"]
    chassis_last5 = data.get("chassis_last5") or old_vehicle["chassis_last5"]
    email = data.get("email") if data.get("email") is not None else old_vehicle.get("email", "")
    state_name = old_vehicle["state_name"]
    support_document = old_vehicle["support_document"]

    cur.execute(
        """
        INSERT INTO vehicle_history (
            vehicle_id, vehicle_number, expiry_date, phone, owner, edited_at
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            old_vehicle["id"], old_vehicle["vehicle_number"], old_vehicle["expiry_date"],
            old_vehicle["phone"], old_vehicle["owner"],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )

    cur.execute(
        """
        UPDATE vehicles
        SET vehicle_number=%s, expiry_date=%s, phone=%s, owner=%s,
            chassis_last5=%s, state_name=%s, support_document=%s, email=%s
        WHERE id=%s
        """,
        (vehicle_number, expiry_date, phone, owner, chassis_last5, state_name, support_document, email, id),
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Vehicle updated"})


@vehicles_bp.route("/api/delete_vehicle/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_vehicle_api(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT * FROM vehicles WHERE id=%s
    """, (id,))

    vehicle = cur.fetchone()

    cur.execute(
        """
        INSERT INTO deleted_vehicles (
            original_vehicle_id, vehicle_number, expiry_date, phone, owner,
            chassis_last5, state_name, support_document, deleted_by, deleted_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """,
        (
            vehicle["id"], vehicle["vehicle_number"], vehicle["expiry_date"], vehicle["phone"], vehicle["owner"],
            vehicle["chassis_last5"], vehicle["state_name"], vehicle["support_document"], user["username"],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )

    cur.execute("""
        DELETE FROM vehicles WHERE id=%s
    """, (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Vehicle deleted"})


@vehicles_bp.route("/api/restore_vehicle/<int:id>", methods=["POST"])
@jwt_required()
def restore_vehicle(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT * FROM deleted_vehicles WHERE id=%s
    """, (id,))

    vehicle = cur.fetchone()

    if not vehicle:
        conn.close()
        return jsonify({"error": "Vehicle not found"}), 404

    cur.execute(
        """
        INSERT INTO vehicles (
            vehicle_number, expiry_date, phone, owner, chassis_last5,
            state_name, support_document
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """,
        (vehicle["vehicle_number"], vehicle["expiry_date"], vehicle["phone"], vehicle["owner"], vehicle["chassis_last5"], vehicle["state_name"], vehicle["support_document"]),
    )

    cur.execute("""
        DELETE FROM deleted_vehicles WHERE id=%s
    """, (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Vehicle restored"})


@vehicles_bp.route("/api/vehicle_history/<int:id>", methods=["GET"])
@jwt_required()
def vehicle_history_api(id):

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
    SELECT vehicle_number, expiry_date, phone, owner, edited_at
    FROM vehicle_history
    WHERE vehicle_id=%s
    ORDER BY id DESC
    """,
        (id,),
    )

    history = cur.fetchall()
    conn.close()

    result = []

    for row in history:
        result.append(
            {
                "vehicle_number": row["vehicle_number"],
                "expiry_date": row["expiry_date"],
                "phone": row["phone"],
                "owner": row["owner"],
                "edited_at": row["edited_at"],
            }
        )

    return jsonify(result)


@vehicles_bp.route("/api/fetch_vehicle_info/<vehicle_number>")
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

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
        SELECT chassis_last5
        FROM vehicles
        WHERE vehicle_number=%s
        """,
        (vehicle_number,),
    )

    row = cur.fetchone()
    conn.close()

    if not row:
        FETCH_RUNNING = False
        return jsonify({"error": "Vehicle not found"}), 404

    chassis_last5 = row["chassis_last5"]

    try:

        result = subprocess.run(
            ["python", "fetch_vehicle.py", vehicle_number, chassis_last5],
            capture_output=True,
            text=True,
            timeout=180,
        )

        print(result.stdout)
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
            return jsonify({"error": "JSON output not found", "output": result.stdout, "stderr": result.stderr}), 500

        data = json.loads(json_line)

        if data.get("challan_pending"):
            FETCH_RUNNING = False
            return jsonify({"error": data.get("error", "Pending challans"), "challan_pending": True, "output": result.stdout}), 400

        tax_upto = data.get("tax_upto")
        owner_name = data.get("owner_name")

        if not tax_upto:
            FETCH_RUNNING = False
            return jsonify({"error": "Tax extraction failed", "output": result.stdout}), 500

        tax_upto = datetime.strptime(tax_upto, "%d-%b-%Y").strftime("%Y-%m-%d")

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            UPDATE vehicles
            SET expiry_date=%s, vahan_owner_name=%s
            WHERE vehicle_number=%s
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

    except subprocess.TimeoutExpired as e:

        FETCH_RUNNING = False
        return jsonify({"error": "Fetch timed out", "output": e.output or ""}), 408


@vehicles_bp.route("/api/deleted_vehicles", methods=["GET"])
@jwt_required()
def get_deleted_vehicles():

    username = get_jwt_identity()
    user = get_current_user(username)

    if user["role"] not in ("admin", "staff"):
        return jsonify({"error": "Access denied"}), 403

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT *
        FROM deleted_vehicles
        ORDER BY id DESC
    """)

    rows = cur.fetchall()
    conn.close()

    deleted = []

    for row in rows:
        deleted.append(
            {
                "id": row["id"],
                "original_vehicle_id": row["original_vehicle_id"],
                "vehicle_number": row["vehicle_number"],
                "expiry_date": row["expiry_date"],
                "phone": row["phone"],
                "owner": row["owner"],
                "deleted_by": row["deleted_by"],
                "deleted_at": row["deleted_at"],
            }
        )

    return jsonify(deleted)


@vehicles_bp.route("/api/permanent_delete_vehicle/<int:id>", methods=["DELETE"])
@jwt_required()
def permanent_delete_vehicle(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        DELETE FROM deleted_vehicles
        WHERE id=%s
    """, (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Vehicle permanently deleted"})
