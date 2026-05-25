import pandas as pd
from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers import get_current_user, get_db, get_cursor

exports_bp = Blueprint("exports", __name__)


@exports_bp.route("/api/export_users")
@jwt_required()
def export_users():

    username = get_jwt_identity()
    user = get_current_user(username)

    if not user:
        return jsonify({"error": "Unauthorized. Please login again."}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    query = """
        SELECT id, username, email, phone, role,
               subscription_status, subscription_expiry
        FROM users
    """

    conn = get_db()
    df = pd.read_sql_query(query, conn)
    conn.close()

    file_name = "all_users.xlsx"
    df.to_excel(file_name, index=False)

    return send_file(file_name, as_attachment=True)


@exports_bp.route("/api/export_user/<int:id>")
@jwt_required()
def export_user(id):

    username = get_jwt_identity()

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute("""
        SELECT username
        FROM users
        WHERE id=%s
    """, (id,))

    user = cur.fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    username_value = user["username"]

    query = """
        SELECT id, vehicle_number, expiry_date, phone, owner,
               chassis_last5, state_name, vahan_owner_name, added_by
        FROM vehicles
        WHERE added_by=%s
    """

    df = pd.read_sql_query(query, conn, params=(username_value,))
    conn.close()

    file_name = f"{username_value}_vehicles.xlsx"
    df.to_excel(file_name, index=False)

    return send_file(file_name, as_attachment=True)
