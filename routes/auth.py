from datetime import datetime, timedelta
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from helpers import check_subscription, get_current_user, get_db, get_cursor

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/login", methods=["POST"])
def api_login():

    data = request.get_json()
    login_input = data.get("username")
    password = data.get("password")

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
       SELECT
            id,
            username,
            email,
            phone,
            password,
            role,
            subscription_status,
            subscription_expiry
        FROM users
        WHERE username=%s
        OR phone=%s
    """,
        (login_input, login_input),
    )

    user = cur.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    user_data = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "phone": user["phone"],
        "password": user["password"],
        "role": user["role"],
        "subscription_status": user["subscription_status"],
        "subscription_expiry": user["subscription_expiry"],
    }

    if not bcrypt.checkpw(password.encode(), user_data["password"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    calculated_role = check_subscription(user_data)
    token = create_access_token(identity=user_data["username"])

    return jsonify(
        {
            "token": token,
            "role": calculated_role,
            "id": user_data["id"],
            "username": user_data["username"],
            "email": user_data["email"],
            "phone": user_data["phone"],
            "subscription_status": user_data["subscription_status"],
            "subscription_expiry": user_data["subscription_expiry"],
        }
    )


@auth_bp.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    role = "viewer"

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if not phone.isdigit() or len(phone) != 10:
        return jsonify({"error": "Invalid phone number"}), 400

    if not email:
        email = None

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
        SELECT id
        FROM users
        WHERE username=%s
        """,
        (username,),
    )

    existing_user = cur.fetchone()

    if existing_user:
        conn.close()
        return jsonify({"error": "Username already exists"}), 409

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    cur.execute(
        """
        SELECT id
        FROM users
        WHERE phone=%s
        """,
        (phone,),
    )

    existing_phone = cur.fetchone()

    if existing_phone:
        conn.close()
        return jsonify({"error": "Phone number already exists"}), 409

    if email:
        cur.execute(
            """
            SELECT id
            FROM users
            WHERE email=%s
            """,
            (email,),
        )
        existing_email = cur.fetchone()
        if existing_email:
            conn.close()
            return jsonify({"error": "Email already exists"}), 409

    try:
        cur.execute(
            """
        INSERT INTO users (
            username,
            email,
            phone,
            password,
            role
        )
        VALUES (%s, %s, %s, %s, %s)
        """,
            (username, email, phone, hashed_password, role),
        )
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

    conn.commit()
    conn.close()

    return jsonify({"message": "Registration successful"})


@auth_bp.route("/api/forgot_password", methods=["POST"])
def forgot_password():

    data = request.get_json()
    username = data.get("username")

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
        SELECT id
        FROM users
        WHERE username=%s
        """,
        (username,),
    )

    user = cur.fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    from datetime import datetime
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        "INSERT INTO requests (user_id, username, title, description, status, created_at) VALUES (%s, %s, %s, %s, 'pending', %s)",
        (user["id"], username, "Password Reset Request", f"Username: {username}\n\nI forgot my password. Please approve a password reset.", now),
    )

    cur.execute("SELECT email FROM users WHERE role='admin' AND email IS NOT NULL AND email != ''")
    admin_row = cur.fetchone()
    conn.commit()
    conn.close()

    if admin_row and admin_row["email"]:
        try:
            from app.email_sender import send_password_reset_request_notification
            send_password_reset_request_notification(admin_row["email"], username)
        except Exception as e:
            print(f"Failed to notify admin: {e}")

    return jsonify({"message": "Reset request sent to admin for approval"})


@auth_bp.route("/api/reset_password", methods=["POST"])
def reset_password():

    data = request.get_json()
    username = data.get("username")
    phone = (data.get("phone") or "").strip()
    new_password = data.get("new_password")

    if not username or not phone or not new_password:
        return jsonify({"error": "Username, phone and password required"}), 400

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
        SELECT id, phone
        FROM users
        WHERE username=%s
        """,
        (username,),
    )

    user = cur.fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    user_phone = (user["phone"] or "").strip()

    if not user_phone:
        conn.close()
        return jsonify({"error": "No phone number linked to this account"}), 400

    if user_phone != phone:
        conn.close()
        return jsonify({"error": "Mobile number does not match this account"}), 403

    hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

    cur.execute(
        """
        UPDATE users
        SET password=%s
        WHERE username=%s
        """,
        (hashed_password, username),
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Password reset successful"})


@auth_bp.route("/api/reset-with-token", methods=["POST"])
def reset_with_token():
    data = request.get_json()
    token = (data.get("token") or "").strip()
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"error": "Token and new password required"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("SELECT username FROM reset_tokens WHERE token=%s AND used=0", (token,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Invalid or expired token"}), 400

    username = row["username"]
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    cur.execute("UPDATE users SET password=%s WHERE username=%s", (hashed, username))
    cur.execute("UPDATE reset_tokens SET used=1 WHERE token=%s", (token,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password reset successful"})


@auth_bp.route("/api/change_password", methods=["POST"])
@jwt_required()
def change_password():

    username = get_jwt_identity()
    user = get_current_user(username)
    data = request.get_json()
    new_password = data.get("new_password")
    hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
        UPDATE users
        SET password=%s
        WHERE username=%s
    """,
        (hashed_password, user["username"]),
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Password updated"})


@auth_bp.route("/api/update_profile", methods=["PUT"])
@jwt_required()
def update_profile():

    current_username = get_jwt_identity()
    data = request.get_json()
    email = data.get("email")
    phone = data.get("phone")
    new_username = data.get("username")
    password = data.get("password")

    if current_username == "admin":
        new_username = "admin"
        if email is None:
            email = ""
        if phone is None:
            phone = ""

    conn = get_db()
    cur = get_cursor(conn)

    if password:
        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            """
            UPDATE users
            SET username=%s, email=%s, phone=%s, password=%s
            WHERE username=%s
            """,
            (new_username, email, phone, hashed_password, current_username),
        )
    else:
        cur.execute(
            """
            UPDATE users
            SET username=%s, email=%s, phone=%s
            WHERE username=%s
            """,
            (new_username, email, phone, current_username),
        )

    if new_username != current_username:
        cur.execute(
            """
            UPDATE vehicles
            SET added_by=%s
            WHERE added_by=%s
            """,
            (new_username, current_username),
        )

    conn.commit()
    conn.close()

    if new_username != current_username:
        new_token = create_access_token(identity=new_username)
        return jsonify({"message": "Profile updated", "token": new_token, "username": new_username})

    return jsonify({"message": "Profile updated"})
