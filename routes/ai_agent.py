from datetime import datetime
import sqlite3
import asyncio
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers import DB_FILE, get_current_user

from ai_agent.browser_agent import AIBrowserAgent

ai_agent_bp = Blueprint("ai_agent", __name__)


def _run_agent_sync(vehicle_number, chassis_last5, captcha=None):
    agent = AIBrowserAgent(vehicle_number, chassis_last5)

    async def _run():
        try:
            result = await agent.run_with_retry(max_retries=1)
            if result.get("captcha_needed") and captcha:
                await agent.start_browser(headless=True)
                result = await agent.run_with_captcha(captcha)
            return result
        finally:
            try:
                await agent.close()
            except Exception:
                pass

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_run())
    finally:
        loop.close()


@ai_agent_bp.route("/api/ai_fetch", methods=["POST"])
@jwt_required()
def ai_fetch():
    username = get_jwt_identity()
    user = get_current_user(username)
    if user["role"] == "viewer":
        return jsonify({"error": "Viewer access denied"}), 403

    data = request.get_json()
    vehicle_number = (data.get("vehicle_number") or "").strip().upper()
    chassis_last5 = (data.get("chassis_last5") or "").strip()
    captcha = (data.get("captcha") or "").strip()

    if not vehicle_number or len(vehicle_number) < 4:
        return jsonify({"error": "Invalid vehicle number"}), 400
    if not chassis_last5 or len(chassis_last5) != 5:
        return jsonify({"error": "Chassis last 5 digits required"}), 400

    result = _run_agent_sync(vehicle_number, chassis_last5, captcha)

    if result.get("success"):
        return jsonify({"success": True, "data": result.get("data", {}), "logs": result.get("logs", [])})

    if result.get("captcha_needed"):
        return jsonify({
            "success": False,
            "captcha_needed": True,
            "captcha_image": result.get("captcha_image"),
            "logs": result.get("logs", []),
        })

    return jsonify({
        "success": False,
        "error": result.get("error", "Fetch failed"),
        "logs": result.get("logs", []),
        "challan_pending": result.get("challan_pending", False),
    })


@ai_agent_bp.route("/api/ai_fetch/existing", methods=["POST"])
@jwt_required()
def ai_fetch_existing():
    username = get_jwt_identity()
    user = get_current_user(username)
    if user["role"] == "viewer":
        return jsonify({"error": "Viewer access denied"}), 403

    data = request.get_json()
    vehicle_id = data.get("vehicle_id")
    captcha = (data.get("captcha") or "").strip()

    if not vehicle_id:
        return jsonify({"error": "Vehicle ID required"}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT vehicle_number, chassis_last5 FROM vehicles WHERE id=?", (vehicle_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Vehicle not found"}), 404

    vehicle_number, chassis_last5 = row
    result = _run_agent_sync(vehicle_number, chassis_last5, captcha)

    if result.get("captcha_needed"):
        return jsonify({
            "success": False,
            "captcha_needed": True,
            "captcha_image": result.get("captcha_image"),
            "logs": result.get("logs", []),
            "vehicle_id": vehicle_id,
        })

    if result.get("success"):
        fetched = result.get("data", {})
        updates = {}
        if fetched.get("tax_upto"):
            updates["expiry"] = fetched["tax_upto"]
        if fetched.get("owner_name"):
            updates["owner"] = fetched["owner_name"]
        if updates:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE vehicles SET expiry_date=?, vahan_owner_name=? WHERE id=?",
                (updates.get("expiry", ""), updates.get("owner", ""), vehicle_id),
            )
            conn.commit()
            conn.close()
        return jsonify({
            "success": True,
            "data": {"vehicle_number": vehicle_number, **updates},
            "logs": result.get("logs", []),
        })

    return jsonify({
        "success": False,
        "error": result.get("error", "Fetch failed"),
        "logs": result.get("logs", []),
        "challan_pending": result.get("challan_pending", False),
    })
