import json
import sqlite3
import subprocess
import time
import asyncio
from datetime import datetime, timedelta

DB_FILE = "vehicles.db"


def auto_fetch_vehicles():

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT v.id, v.vehicle_number, v.chassis_last5
        FROM vehicles v
        WHERE v.chassis_last5 IS NOT NULL AND v.chassis_last5 != ''
        AND v.added_by IN (
            SELECT username FROM users WHERE role IN ('admin', 'staff')
        )
    """,
    )

    vehicles = cursor.fetchall()
    conn.close()

    total = len(vehicles)
    print(f"\n[AUTO-FETCH] Starting fetch for {total} vehicles at {datetime.now()}\n")

    if total == 0:
        print("[AUTO-FETCH] No vehicles eligible for auto-fetch")
        return

    success = 0
    failed = 0

    for vid, vnum, chassis in vehicles:

        print(f"[AUTO-FETCH] Fetching {vnum}...")

        try:

            result = subprocess.run(
                ["python", "fetch_vehicle.py", vnum, chassis],
                capture_output=True,
                text=True,
                timeout=180,
            )

            output = result.stdout.strip()
            lines = output.splitlines()

            json_line = None

            for line in reversed(lines):
                line = line.strip()
                if line.startswith("{") and line.endswith("}"):
                    json_line = line
                    break

            if json_line:

                data = json.loads(json_line)
                tax_upto = data.get("tax_upto")
                owner_name = data.get("owner_name")

                if tax_upto:

                    tax_upto = datetime.strptime(tax_upto, "%d-%b-%Y").strftime(
                        "%Y-%m-%d"
                    )

                    conn = sqlite3.connect(DB_FILE)
                    c = conn.cursor()
                    c.execute(
                        """
                        UPDATE vehicles
                        SET expiry_date=?, vahan_owner_name=?
                        WHERE id=?
                    """,
                        (tax_upto, owner_name, vid),
                    )
                    conn.commit()
                    conn.close()

                    print(f"[AUTO-FETCH] {vnum} updated: tax upto {tax_upto}")
                    success += 1

                else:

                    print(f"[AUTO-FETCH] {vnum}: tax_upto not found in response")
                    failed += 1

            else:

                print(f"[AUTO-FETCH] {vnum}: JSON output not found")
                failed += 1

        except subprocess.TimeoutExpired:

            print(f"[AUTO-FETCH] {vnum}: Timed out")
            failed += 1

        except Exception as e:

            print(f"[AUTO-FETCH] {vnum}: Error - {e}")
            failed += 1

        time.sleep(2)

    print(f"\n[AUTO-FETCH] Complete: {success} success, {failed} failed out of {total}\n")


def auto_fetch_expiring_vehicles():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    today = datetime.now()
    seven_days = (today + timedelta(days=7)).strftime("%Y-%m-%d")

    cursor.execute(
        """
        SELECT v.id, v.vehicle_number, v.chassis_last5, v.expiry_date
        FROM vehicles v
        WHERE v.chassis_last5 IS NOT NULL AND v.chassis_last5 != ''
        AND v.expiry_date <= ?
        AND v.added_by IN (
            SELECT username FROM users WHERE role IN ('admin', 'staff')
        )
        ORDER BY v.expiry_date ASC
        """,
        (seven_days,),
    )

    vehicles = cursor.fetchall()
    conn.close()

    print(f"\n[AUTO-FETCH-EXPIRING] Checking {len(vehicles)} expired/due-soon vehicles at {datetime.now()}\n")

    if not vehicles:
        print("[AUTO-FETCH-EXPIRING] No expired or due-soon vehicles found")
        return

    success = 0
    failed = 0

    for vid, vnum, chassis, expiry in vehicles:
        try:
            expiry_dt = datetime.strptime(expiry, "%Y-%m-%d") if expiry else today
            days_left = (expiry_dt - today).days
            status = "EXPIRED" if days_left < 0 else "DUE SOON"
            print(f"[AUTO-FETCH-EXPIRING] [{status}] {vnum} (expires {expiry}, {days_left}d left)")

            result = subprocess.run(
                ["python", "fetch_vehicle.py", vnum, chassis],
                capture_output=True,
                text=True,
                timeout=180,
            )

            output = result.stdout.strip()
            lines = output.splitlines()
            json_line = None
            for line in reversed(lines):
                line = line.strip()
                if line.startswith("{") and line.endswith("}"):
                    json_line = line
                    break

            if json_line:
                data = json.loads(json_line)
                tax_upto = data.get("tax_upto")
                owner_name = data.get("owner_name")
                if tax_upto:
                    new_expiry = datetime.strptime(tax_upto, "%d-%b-%Y").strftime("%Y-%m-%d")
                    conn = sqlite3.connect(DB_FILE)
                    c = conn.cursor()
                    c.execute(
                        "UPDATE vehicles SET expiry_date=?, vahan_owner_name=? WHERE id=?",
                        (new_expiry, owner_name, vid),
                    )
                    conn.commit()
                    conn.close()
                    print(f"  -> Updated: tax upto {new_expiry}")
                    success += 1
                else:
                    print(f"  -> No tax_upto in response")
                    failed += 1
            else:
                print(f"  -> No JSON in output")
                failed += 1

        except subprocess.TimeoutExpired:
            print(f"  -> Timed out")
            failed += 1
        except Exception as e:
            print(f"  -> Error: {e}")
            failed += 1

        time.sleep(2)

    print(f"\n[AUTO-FETCH-EXPIRING] Complete: {success} success, {failed} failed out of {len(vehicles)}\n")
