from datetime import datetime, timedelta
import hmac
import hashlib
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, get_current_user, get_db, get_cursor

subscriptions_bp = Blueprint("subscriptions", __name__)


@subscriptions_bp.route("/api/create_order", methods=["POST"])
@jwt_required()
def create_order():

    if not RAZORPAY_KEY_SECRET:
        return jsonify({"error": "Razorpay not configured"}), 500

    auth = (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
    headers = {"Content-Type": "application/json"}
    payload = {
        "amount": 1900,
        "currency": "INR",
        "receipt": f"receipt_{datetime.now().timestamp()}",
        "notes": {"plan": "staff_pro"},
    }

    try:
        response = requests.post(
            "https://api.razorpay.com/v1/orders",
            json=payload,
            auth=auth,
            headers=headers,
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subscriptions_bp.route("/api/verify_payment", methods=["POST"])
@jwt_required()
def verify_payment():

    try:
        data = request.json
        username = get_jwt_identity()

        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_signature = data.get("razorpay_signature")

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return jsonify({"error": "Missing payment details"}), 400

        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        if expected_signature != razorpay_signature:
            return jsonify({"error": "Invalid payment signature"}), 400

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute("SELECT id FROM users WHERE username=%s", (username,))
        user = cur.fetchone()

        if not user:
            conn.close()
            return jsonify({"error": "User not found"}), 404

        user_id = user["id"]
        expiry_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        now_iso = datetime.now().isoformat()

        cur.execute(
            """
            UPDATE users
            SET role = 'staff', subscription_status = 'active', subscription_expiry = %s
            WHERE id = %s
            """,
            (expiry_date, user_id),
        )

        cur.execute(
            """
            INSERT INTO payments (
                user_id, razorpay_payment_id, razorpay_order_id,
                razorpay_signature, amount, currency, plan, status, paid_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id, razorpay_payment_id, razorpay_order_id,
                razorpay_signature, 1900, "INR", "staff_pro", "completed", now_iso,
            ),
        )

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Payment verified, subscription activated",
            "subscription_expiry": expiry_date,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subscriptions_bp.route("/api/upgrade_subscription", methods=["POST"])
@jwt_required()
def upgrade_subscription():

    try:
        username = get_jwt_identity()
        current_user = get_current_user(username)

        if not current_user or current_user["role"] != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json
        user_id = data.get("user_id")
        expiry_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            UPDATE users
            SET role = %s, subscription_status = %s, subscription_expiry = %s
            WHERE id = %s
            """,
            ("staff", "active", expiry_date, user_id),
        )

        cur.execute(
            """
            INSERT INTO payments (
                user_id, amount, currency, plan, status, paid_at
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (user_id, 1900, "INR", "staff_pro", "completed", datetime.now().isoformat()),
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "Subscription upgraded"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subscriptions_bp.route("/api/subscription_status", methods=["GET"])
@jwt_required()
def subscription_status():

    username = get_jwt_identity()

    conn = get_db()
    cur = get_cursor(conn)

    cur.execute(
        """
        SELECT role, subscription_status, subscription_expiry
        FROM users
        WHERE username=%s
        """,
        (username,),
    )

    user = cur.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    role = user["role"]
    status = user["subscription_status"]
    expiry = user["subscription_expiry"]

    result = {
        "role": role,
        "subscription_status": status,
        "subscription_expiry": expiry,
    }

    if status == "active" and expiry:
        expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
        days_left = (expiry_date - datetime.now()).days
        result["days_left"] = max(days_left, 0)
    else:
        result["days_left"] = 0

    return jsonify(result)
