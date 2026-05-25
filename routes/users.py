from datetime import datetime, timedelta
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers import get_current_user, get_db, get_cursor

users_bp = Blueprint("users", __name__)


@users_bp.route("/api/users", methods=["GET"])
@jwt_required()
def get_users():

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT u.id, u.username, u.email, u.phone, u.role,
               u.subscription_status, u.subscription_expiry,
               COUNT(v.id) AS vehicle_count
        FROM users u
        LEFT JOIN vehicles v ON v.added_by = u.username
        GROUP BY u.id, u.username, u.email, u.phone, u.role,
                 u.subscription_status, u.subscription_expiry
        ORDER BY u.id
    """)

    rows = cur.fetchall()

    users = []

    for row in rows:
        users.append(
            {
                "id": row["id"],
                "username": row["username"],
                "email": row["email"],
                "phone": row["phone"],
                "role": row["role"],
                "subscription_status": row["subscription_status"],
                "subscription_expiry": row["subscription_expiry"],
                "vehicle_count": row["vehicle_count"],
            }
        )

    conn.close()

    return jsonify(users)


@users_bp.route("/api/add_user", methods=["POST"])
@jwt_required()
def add_user():

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    new_username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip() or None
    phone = (data.get("phone") or "").strip() or None
    password = data.get("password")
    role = (data.get("role") or "").strip()

    if not new_username or not password or not role:
        return jsonify({"error": "Username, password and role are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if role not in ("staff", "viewer"):
        return jsonify({"error": "Invalid role"}), 400

    if phone and (not phone.isdigit() or len(phone) != 10):
        return jsonify({"error": "Invalid phone number"}), 400

    if role == "admin":
        return jsonify({"error": "Cannot create admin"}), 403

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn = get_db()
    cur = get_cursor(conn)

    try:
        cur.execute(
            """
            INSERT INTO users (username, email, phone, password, role)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (new_username, email, phone, hashed_password, role),
        )
        conn.commit()
    except Exception as e:
        conn.close()
        message = str(e)
        if "users.username" in message or "users_username_key" in message:
            return jsonify({"error": "Username already exists"}), 409
        if "users.phone" in message or "users_phone_key" in message:
            return jsonify({"error": "Phone number already exists"}), 409
        if "users.email" in message or "users_email_key" in message:
            return jsonify({"error": "Email already exists"}), 409
        return jsonify({"error": "User already exists"}), 409

    conn.close()
    return jsonify({"message": "User added successfully"})


@users_bp.route("/api/delete_user/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_user(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    if user["id"] == id:
        return jsonify({"error": "Cannot delete your own account"}), 400

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT role FROM users WHERE id=%s
    """, (id,))

    target_user = cur.fetchone()

    if not target_user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if target_user["role"] == "admin":
        conn.close()
        return jsonify({"error": "Admin account cannot be deleted"}), 403

    cur.execute("""
        SELECT id, username, email, phone, password, role,
               subscription_status, subscription_expiry
        FROM users WHERE id=%s
    """, (id,))

    user_data = cur.fetchone()

    cur.execute(
        """
        INSERT INTO deleted_users (
            original_id, username, email, phone, password, role,
            subscription_status, subscription_expiry, deleted_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            user_data["id"], user_data["username"], user_data["email"], user_data["phone"],
            user_data["password"], user_data["role"], user_data["subscription_status"], user_data["subscription_expiry"],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )

    cur.execute("""
        DELETE FROM users WHERE id=%s
    """, (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "User deleted"})


@users_bp.route("/api/user_subscription/<int:id>", methods=["POST"])
@jwt_required()
def user_subscription(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user or user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    action = (data.get("action") or "").strip().lower()

    if action not in ("upgrade", "extend", "downgrade"):
        return jsonify({"error": "Invalid action"}), 400

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT role, subscription_status, subscription_expiry
        FROM users WHERE id=%s
    """, (id,))

    target = cur.fetchone()

    if not target:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    target_role = target["role"]
    target_status = target["subscription_status"]
    target_expiry = target["subscription_expiry"]

    if target_role == "admin":
        conn.close()
        return jsonify({"error": "Admin subscription cannot be changed"}), 403

    if action == "downgrade":
        cur.execute(
            """
            UPDATE users
            SET role=%s, subscription_status=%s, subscription_expiry=%s
            WHERE id=%s
            """,
            ("viewer", "free", None, id),
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Subscription downgraded to Free"})

    days = 30
    if action == "extend":
        try:
            days = int(data.get("days") or 30)
        except (TypeError, ValueError):
            conn.close()
            return jsonify({"error": "Invalid extension days"}), 400
        if days < 1 or days > 365:
            conn.close()
            return jsonify({"error": "Extension days must be between 1 and 365"}), 400

    today = datetime.now().date()
    base_date = today

    if target_expiry:
        try:
            expiry_date = datetime.strptime(target_expiry, "%Y-%m-%d").date()
            if expiry_date > today:
                base_date = expiry_date
        except ValueError:
            base_date = today

    new_expiry = (base_date + timedelta(days=days)).strftime("%Y-%m-%d")

    cur.execute(
        """
        UPDATE users
        SET role=%s, subscription_status=%s, subscription_expiry=%s
        WHERE id=%s
        """,
        ("staff", "active", new_expiry, id),
    )

    conn.commit()
    conn.close()

    if action == "upgrade":
        return jsonify({"message": "Subscription upgraded to Staff Pro"})

    return jsonify({"message": f"Subscription extended by {days} day(s)"})


@users_bp.route("/api/update_user_role/<int:id>", methods=["PUT"])
@jwt_required()
def update_user_role(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    new_role = data.get("role")

    if new_role not in ("admin", "staff", "viewer"):
        return jsonify({"error": "Invalid role"}), 400

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("SELECT role FROM users WHERE id=%s", (id,))
    target_user = cur.fetchone()

    if not target_user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if new_role == "admin":
        conn.close()
        return jsonify({"error": "Cannot set role to admin"}), 403

    cur.execute("""
        UPDATE users
        SET role=%s
        WHERE id=%s
    """, (new_role, id))

    conn.commit()
    conn.close()

    return jsonify({"message": "Role updated"})


@users_bp.route("/api/update_user/<int:id>", methods=["PUT"])
@jwt_required()
def update_user(id):

    username = get_jwt_identity()
    current_user = get_current_user(username)

    if not current_user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    if current_user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    new_username = data.get("username")
    new_password = data.get("password")
    email = data.get("email")
    phone = data.get("phone")

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("SELECT username FROM users WHERE id=%s", (id,))
    target_user = cur.fetchone()

    if not target_user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if target_user["username"] == "admin":
        conn.close()
        return jsonify({"error": "Admin cannot be edited"}), 403

    old_username = target_user["username"]

    if new_password:
        hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            """
            UPDATE users
            SET username=%s, email=%s, phone=%s, password=%s
            WHERE id=%s
            """,
            (new_username, email, phone, hashed_password, id),
        )
    else:
        cur.execute(
            """
            UPDATE users
            SET username=%s, email=%s, phone=%s
            WHERE id=%s
            """,
            (new_username, email, phone, id),
        )

    if new_username != old_username:
        cur.execute(
            """
            UPDATE vehicles
            SET added_by=%s
            WHERE added_by=%s
            """,
            (new_username, old_username),
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "User updated"})


@users_bp.route("/api/deleted_users", methods=["GET"])
@jwt_required()
def get_deleted_users():

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user or user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT id, original_id, username, email, phone, role,
               subscription_status, subscription_expiry, deleted_at
        FROM deleted_users
        ORDER BY id DESC
    """)

    rows = cur.fetchall()
    conn.close()

    result = []

    for row in rows:
        result.append(
            {
                "id": row["id"],
                "original_id": row["original_id"],
                "username": row["username"],
                "email": row["email"],
                "phone": row["phone"],
                "role": row["role"],
                "subscription_status": row["subscription_status"],
                "subscription_expiry": row["subscription_expiry"],
                "deleted_at": row["deleted_at"],
            }
        )

    return jsonify(result)


@users_bp.route("/api/restore_user/<int:id>", methods=["POST"])
@jwt_required()
def restore_user(id):

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user or user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT original_id, username, email, phone, password, role,
               subscription_status, subscription_expiry
        FROM deleted_users
        WHERE id=%s
    """, (id,))

    deleted = cur.fetchone()

    if not deleted:
        conn.close()
        return jsonify({"error": "Deleted user not found"}), 404

    try:
        cur.execute(
            """
            INSERT INTO users (username, email, phone, password, role,
                               subscription_status, subscription_expiry)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (deleted["username"], deleted["email"], deleted["phone"], deleted["password"],
             deleted["role"], deleted["subscription_status"], deleted["subscription_expiry"]),
        )
    except Exception as e:
        conn.close()
        message = str(e)
        if "users.username" in message or "users_username_key" in message:
            return jsonify({"error": "Username already exists"}), 409
        if "users.phone" in message or "users_phone_key" in message:
            return jsonify({"error": "Phone number already exists"}), 409
        return jsonify({"error": "User data conflicts with existing users"}), 409

    cur.execute("DELETE FROM deleted_users WHERE id=%s", (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "User restored"})
