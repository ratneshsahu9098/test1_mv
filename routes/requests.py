import secrets
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers import FRONTEND_URL, get_current_user, get_db, get_cursor

requests_bp = Blueprint("requests", __name__)


@requests_bp.route("/api/requests", methods=["GET"])
@jwt_required()
def get_requests():
    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    conn = get_db()
    cur = get_cursor(conn)

    if user["role"] == "admin":
        cur.execute("SELECT * FROM requests ORDER BY created_at DESC")
    else:
        cur.execute("SELECT * FROM requests WHERE username=%s ORDER BY created_at DESC", (username,))

    rows = cur.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "username": r["username"],
            "title": r["title"],
            "description": r["description"],
            "status": r["status"],
            "admin_response": r["admin_response"],
            "created_at": r["created_at"],
            "resolved_at": r["resolved_at"],
        })

    return jsonify(result)


@requests_bp.route("/api/requests", methods=["POST"])
@jwt_required()
def create_request():
    username = get_jwt_identity()
    data = request.get_json()
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not description:
        return jsonify({"error": "Description is required"}), 400

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user = get_current_user(username)
    user_id = user["id"] if user else 0
    conn = get_db()
    cur = get_cursor(conn)
    cur.execute(
        "INSERT INTO requests (user_id, username, title, description, status, created_at) VALUES (%s, %s, %s, %s, 'pending', %s)",
        (user_id, username, title, description, now),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Request submitted"})


@requests_bp.route("/api/requests/<int:req_id>", methods=["PUT"])
@jwt_required()
def update_request(req_id):
    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    status = data.get("status")
    admin_response = (data.get("admin_response") or "").strip()

    conn = get_db()
    cur = get_cursor(conn)
    cur.execute("SELECT * FROM requests WHERE id=%s", (req_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Request not found"}), 404

    resolved_at = None
    reset_link = None
    if status in ("resolved", "rejected"):
        resolved_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    is_password_reset = "password reset" in existing["title"].lower()

    if is_password_reset and status == "resolved":
        req_username = existing["username"]
        token = secrets.token_urlsafe(32)
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(
            "INSERT INTO reset_tokens (username, token, used, created_at) VALUES (%s, %s, 0, %s)",
            (req_username, token, now_str),
        )
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        if admin_response:
            admin_response += f"\n\nPassword Reset Link: {reset_link}"
        else:
            admin_response = f"Password Reset Link: {reset_link}"

    cur.execute(
        "UPDATE requests SET status=%s, admin_response=%s, resolved_at=%s WHERE id=%s",
        (status or existing["status"], admin_response or existing["admin_response"], resolved_at, req_id),
    )

    if is_password_reset and status == "resolved" and reset_link:
        cur.execute("SELECT email FROM users WHERE username=%s", (existing["username"],))
        user_row = cur.fetchone()
        if user_row and user_row["email"]:
            try:
                from app.email_sender import send_password_reset_resolved_notification
                send_password_reset_resolved_notification(user_row["email"], reset_link)
            except Exception as e:
                print(f"Failed to send reset link to user: {e}")

    conn.commit()
    conn.close()

    return jsonify({"message": "Request updated", "reset_link": reset_link})


@requests_bp.route("/api/requests/<int:req_id>", methods=["DELETE"])
@jwt_required()
def delete_request(req_id):
    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    conn = get_db()
    cur = get_cursor(conn)
    cur.execute("DELETE FROM requests WHERE id=%s", (req_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Request deleted"})
