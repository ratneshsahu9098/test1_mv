from playwright.sync_api import sync_playwright
import json
import sys
import time
import os

VEHICLE_NUMBER = sys.argv[1]
CHASSIS_LAST5 = sys.argv[2]

STATE_CODE = VEHICLE_NUMBER[:2]

STATE_MAP = {
    "WB": "West Bengal", "BR": "Bihar", "OD": "Odisha", "PB": "Punjab",
    "HR": "Haryana", "KL": "Kerala", "TS": "Telangana", "JK": "Jammu and Kashmir",
    "UK": "Uttarakhand", "GA": "Goa", "MH": "Maharashtra", "MP": "Madhya Pradesh",
    "DL": "Delhi", "UP": "Uttar Pradesh", "RJ": "Rajasthan", "CG": "Chhattisgarh",
    "GJ": "Gujarat", "KA": "Karnataka", "TN": "Tamil Nadu", "AP": "Andhra Pradesh",
    "NL": "Nagaland", "AS": "Assam", "HP": "Himachal Pradesh", "PY": "Puducherry",
    "AN": "Andaman and Nicobar", "CH": "Chandigarh", "DN": "Dadra and Nagar Haveli",
    "DD": "Daman and Diu", "LD": "Lakshadweep", "MN": "Manipur", "ML": "Meghalaya",
    "MZ": "Mizoram", "OR": "Odisha", "SK": "Sikkim", "TR": "Tripura",
    "AR": "Arunachal Pradesh", "JH": "Jharkhand",
}

STATE_NAME = STATE_MAP.get(STATE_CODE)
if not STATE_NAME:
    print(json.dumps({"success": False, "error": f"Unsupported state code: {STATE_CODE}"}))
    sys.exit(1)

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

DEBUG = os.getenv("FETCH_DEBUG", "0") == "1"

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=not DEBUG,
        slow_mo=300,
        args=[
            "--incognito",
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-sandbox",
        ],
    )
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36",
        viewport={"width": 1366, "height": 768},
        locale="en-IN",
    )
    page = context.new_page()
    page.set_default_timeout(30000)

    try:
        context.clear_cookies()
        url = "https://parivahan.gov.in/en/content/vehicle-related-services"

        for attempt in range(3):
            try:
                print(f"Opening Parivahan Attempt {attempt+1}")
                page.goto(url, wait_until="networkidle", timeout=120000)
                print("Parivahan loaded")
                break
            except Exception as e:
                print(f"Retry failed: {e}")
                time.sleep(5)
                if attempt == 2:
                    raise Exception("Parivahan not reachable")

        page.wait_for_selector("select.select-css-vehicle-related-services", timeout=30000)
        print("Parivahan opened")
        print(f"Detected state: {STATE_NAME}")

        page.select_option("select.select-css-vehicle-related-services", label=STATE_NAME)
        print(f"Selected state: {STATE_NAME}")
        page.wait_for_load_state("networkidle")

        try:
            if page.locator("text=Previous session is already active").is_visible():
                print("Active session popup detected")
                page.click("img[alt='close']", force=True)
                print("Popup closed")
                page.reload()
                page.wait_for_load_state("networkidle")
        except Exception:
            print("No active session popup")

        print(f"VAHAN page opened (URL: {page.url})")

        try:
            page.click("button:has-text('Close')", timeout=5000)
            print("Popup closed")
            page.wait_for_timeout(2000)
            print(f"After close URL: {page.url}")
        except Exception:
            print("No popup found")

        for retry in range(3):
            try:
                page.wait_for_selector("text=Vehicle Registration No.", timeout=5000)
                page.click("text=Vehicle Registration No.", timeout=5000)
                break
            except Exception as e:
                print(f"Vehicle Registration click attempt {retry+1} failed: {e}")
                print(f"Page URL: {page.url}")
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"vehicle_reg_retry_{retry}.png"), full_page=True)
                page.wait_for_timeout(2000)
                if retry == 2:
                    raise

        print("Vehicle Registration selected")
        print(f"After selection URL: {page.url}")
        page.wait_for_selector("#regnid", timeout=15000)

        page.locator("#regnid").click()
        page.locator("#regnid").fill("")
        page.fill("#regnid", VEHICLE_NUMBER)
        print("Vehicle entered")

        page.locator(".ui-chkbox-box").first.click()
        print("Checkbox checked")
        page.wait_for_load_state("networkidle")

        page.click("#proccedHomeButtonId")
        print("Proceed clicked")

        page.wait_for_timeout(3000)

        captcha_detected = (
            page.locator("text=Captcha").count() > 0
            or page.locator("iframe").count() > 0
        )
        if captcha_detected:
            result = {
                "success": False,
                "vehicle_number": VEHICLE_NUMBER,
                "error": "CAPTCHA detected — manual intervention required",
            }
            print(json.dumps(result))
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "captcha.png"), full_page=True)
            context.close()
            browser.close()
            sys.exit(0)

        auth_proceed_clicked = False
        try:
            dialogs = page.locator(".ui-dialog")
            dialog_count = dialogs.count()
            print(f"Dialogs found: {dialog_count}")

            for i in range(dialog_count):
                dialog = dialogs.nth(i)
                if not dialog.is_visible():
                    continue
                buttons = dialog.locator("button")
                for j in range(buttons.count()):
                    try:
                        btn = buttons.nth(j)
                        text = btn.inner_text()
                        visible = btn.is_visible()
                        print(f"Dialog {i} Button {j}: {text} | Visible={visible}")
                        if "Proceed" in text and visible:
                            btn.click(force=True)
                            print("Authentication Proceed clicked")
                            auth_proceed_clicked = True
                            break
                    except Exception:
                        continue
                if auth_proceed_clicked:
                    break
        except Exception as e:
            print("Dialog processing failed:", e)

        page.wait_for_load_state("networkidle")

        page.wait_for_selector("#trigger1", timeout=15000)
        page.locator("#trigger1").click(force=True)
        print("Pay Your Tax clicked")

        page.wait_for_selector("#form_eapp\\:tf_chasis_no", timeout=15000)
        page.fill("#form_eapp\\:tf_chasis_no", CHASSIS_LAST5)
        print("Chassis entered")

        verify_btn = page.locator("#form_eapp\\:validate_button")
        verify_btn.wait_for(state="visible", timeout=15000)
        verify_btn.click(force=True)
        print("Verify Details clicked")
        page.wait_for_timeout(3000)

        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            print("Network did not reach idle (continuing)")
        page.wait_for_timeout(2000)

        challan_pending = False
        if "challan" in page.evaluate("document.body.innerText").lower():
            print("Challan detected — dismissing overlay")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "challan_detected.png"), full_page=True)
            page.keyboard.press("Escape")
            page.wait_for_timeout(1500)
            page.mouse.click(10, 10)
            page.wait_for_timeout(1500)
            page.evaluate("document.querySelector('.ui-dialog')?.remove()")
            page.wait_for_timeout(1500)
            page.evaluate("document.querySelectorAll('[role=dialog], .ui-dialog, .modal, .overlay')?.forEach(e=>e.remove())")
            page.wait_for_timeout(1500)
            page.evaluate("document.querySelectorAll('.ui-widget-overlay, .blockUI, .blockOverlay')?.forEach(e=>e.remove())")
            page.wait_for_timeout(1500)
            dialog_still = page.locator(".ui-dialog:visible").count() > 0
            if dialog_still:
                challan_pending = True
                print("Could not dismiss challan overlay — trying extraction anyway")

        submit_found = page.locator("#form_eapp\\:tf_show_button").count() > 0
        tax_found = page.locator("#taxFrom\\:tf_tax_upto").count() > 0

        if submit_found:
            print("Submit button found — proceeding")
            submit_btn = page.locator("#form_eapp\\:tf_show_button")
            submit_btn.wait_for(state="visible", timeout=15000)
            submit_btn.click(force=True)
            print("Submit clicked")
            page.wait_for_timeout(3000)
        elif tax_found:
            print("Tax data already visible — extracting directly")
        else:
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "verify_fail.png"), full_page=True)
            page_text = page.evaluate("document.body.innerText")
            print(f"Page after verify: {page_text[:500]}")
            all_inputs = page.evaluate("""() => Array.from(document.querySelectorAll('input, select, textarea, button, span, label, div')).filter(e => e.offsetHeight > 0).map(e => ({id: e.id, type: e.type || e.tagName, value: e.value || e.innerText?.trim()?.slice(0,50) || '', name: e.name})).slice(0,30)""")
            print(f"Page elements: {all_inputs}")
            print("Neither submit button nor tax field found — trying direct tax extraction")
            page.wait_for_timeout(5000)

        try:
            page.wait_for_selector("#taxFrom\\:tf_tax_upto", timeout=15000)
        except Exception:
            page_text = page.evaluate("document.body.innerText")
            print(f"Final page text: {page_text[:500]}")
            if challan_pending:
                result = {
                    "success": False,
                    "vehicle_number": VEHICLE_NUMBER,
                    "challan_pending": True,
                    "error": "Pending challan(s) — tax details unavailable",
                }
            else:
                result = {
                    "success": False,
                    "vehicle_number": VEHICLE_NUMBER,
                    "error": "Tax details not found after verify",
                }
            print(json.dumps(result))
            context.close()
            browser.close()
            sys.exit(0)
        print(page.url)
        page.wait_for_selector("#taxFrom\\:tf_tax_upto", timeout=15000)

        tax_element = page.locator("#taxFrom\\:tf_tax_upto")
        count = tax_element.count()
        print("Tax elements found:", count)

        if count > 0:
            tax_upto = tax_element.first.inner_text()
            owner_element = page.locator("#taxFrom\\:tf_owner_name")
            owner_name = owner_element.first.input_value() if owner_element.count() > 0 else ""
            result = {
                "success": True,
                "vehicle_number": VEHICLE_NUMBER,
                "tax_upto": tax_upto,
                "owner_name": owner_name,
            }
            print(json.dumps(result))
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "final_tax_page.png"), full_page=True)
            print("Final screenshot saved")
        else:
            if challan_pending:
                result = {
                    "success": False,
                    "vehicle_number": VEHICLE_NUMBER,
                    "challan_pending": True,
                    "error": "Pending challan(s) — tax details unavailable",
                }
            else:
                result = {
                    "success": False,
                    "vehicle_number": VEHICLE_NUMBER,
                    "error": "Tax upto element not found",
                }
            print(json.dumps(result))

    except Exception as e:
        import traceback
        error_result = {
            "success": False,
            "vehicle_number": VEHICLE_NUMBER,
            "error": f"{type(e).__name__}: {str(e)}",
        }
        print(json.dumps(error_result))
        traceback.print_exc()
        try:
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error.png"), full_page=True)
        except Exception:
            pass

    context.close()
    browser.close()
