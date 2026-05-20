from playwright.sync_api import sync_playwright
import json
import sys
import time


# -------------------------
# VEHICLE NUMBER
# -------------------------

VEHICLE_NUMBER = sys.argv[1]
CHASSIS_LAST5 = sys.argv[2]

STATE_CODE = VEHICLE_NUMBER[:2]


# -------------------------
# STATE MAP
# -------------------------

STATE_MAP = {
    "WB": "West Bengal",
    "BR": "Bihar",
    "OD": "Odisha",
    "PB": "Punjab",
    "HR": "Haryana",
    "KL": "Kerala",
    "TS": "Telangana",
    "JK": "Jammu and Kashmir",
    "UK": "Uttarakhand",
    "GA": "Goa",
    "MH": "Maharashtra",
    "MP": "Madhya Pradesh",
    "DL": "Delhi",
    "UP": "Uttar Pradesh",
    "RJ": "Rajasthan",
    "CG": "Chhattisgarh",
    "GJ": "Gujarat",
    "KA": "Karnataka",
    "TN": "Tamil Nadu",
}

STATE_NAME = STATE_MAP.get(STATE_CODE)

if not STATE_NAME:

    print(f"Unsupported state code: {STATE_CODE}")

    sys.exit()

# -------------------------
# PLAYWRIGHT
# -------------------------

with sync_playwright() as p:

    DEBUG = False

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

        # -------------------------
        # OPEN PARIVAHAN
        # -------------------------

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

        page.wait_for_selector(
            "select.select-css-vehicle-related-services", timeout=30000
        )

        print("Parivahan opened")

        print(f"Detected state: {STATE_NAME}")
        # -------------------------
        # SELECT STATE
        # -------------------------

        page.select_option(
            "select.select-css-vehicle-related-services", label=STATE_NAME
        )

        print(f"Selected state: {STATE_NAME}")

        page.wait_for_load_state("networkidle")
        # -------------------------
        # HANDLE ACTIVE SESSION POPUP
        # -------------------------

        try:

            popup_text = page.locator("text=Previous session is already active")

            if popup_text.is_visible():

                print("Active session popup detected")

                page.click("img[alt='close']", force=True)

                print("Popup closed")

                page.reload()

                page.wait_for_load_state("networkidle")

        except:

            print("No active session popup")
        # -------------------------
        # WAIT FOR VAHAN PAGE
        # -------------------------

        print("VAHAN page opened")

        # -------------------------
        # CLOSE POPUP
        # -------------------------

        try:

            page.click("button:has-text('Close')", timeout=5000)

            print("Popup closed")

        except:

            print("No popup found")

        # -------------------------
        # CLICK VEHICLE REGISTRATION
        # -------------------------

        page.click("text=Vehicle Registration No.")

        print("Vehicle Registration selected")

        page.wait_for_selector("#regnid", timeout=15000)

        # -------------------------
        # ENTER VEHICLE NUMBER
        # -------------------------

        page.fill("#regnid", VEHICLE_NUMBER)

        print("Vehicle entered")

        # -------------------------
        # CHECK CHECKBOX
        # -------------------------

        page.locator(".ui-chkbox-box").first.click()

        print("Checkbox checked")

        page.wait_for_load_state("networkidle")

        # -------------------------
        # CLICK PROCEED
        # -------------------------

        page.click("#proccedHomeButtonId")

        print("Proceed clicked")

        # -------------------------
        # CAPTCHA DETECTION
        # -------------------------

        page.wait_for_timeout(3000)

        if (
            page.locator("text=Captcha").count() > 0
            or page.locator("iframe").count() > 0
        ):

            print("CAPTCHA_DETECTED")

            page.screenshot(path="captcha.png", full_page=True)

            browser.close()

            sys.exit()

        # -------------------------
        # WAIT FOR SECOND POPUP
        # -------------------------

        # -------------------------
        # CLICK SECOND PROCEED
        # -------------------------
        # -------------------------
        # SECOND PROCEED
        # -------------------------

        # -------------------------
        # AUTHENTICATION PROCEED
        # -------------------------

        try:

            dialogs = page.locator(".ui-dialog")

            dialog_count = dialogs.count()

            print(f"Dialogs found: {dialog_count}")

            for i in range(dialog_count):

                dialog = dialogs.nth(i)

                if dialog.is_visible():

                    buttons = dialog.locator("button")

                    btn_count = buttons.count()

                    for j in range(btn_count):

                        btn = buttons.nth(j)

                        try:

                            text = btn.inner_text()

                            visible = btn.is_visible()

                            print(
                                f"Dialog {i} "
                                f"Button {j}: "
                                f"{text} | "
                                f"Visible={visible}"
                            )

                            if "Proceed" in text and visible:

                                btn.click(force=True)

                                print("Authentication Proceed clicked")

                                raise SystemExit

                        except Exception as e:

                            print(e)

        except SystemExit:

            pass

        except Exception as e:

            print("Second Proceed failed")

            print(e)

        page.wait_for_load_state("networkidle")

        # -------------------------
        # CLICK PAY YOUR TAX
        # -------------------------

        page.wait_for_selector("#trigger1", timeout=15000)

        page.locator("#trigger1").click(force=True)

        print("Pay Your Tax clicked")

        page.wait_for_selector("#form_eapp\\:tf_chasis_no", timeout=15000)
        # -------------------------
        # ENTER CHASSIS LAST 5
        # -------------------------

        page.fill("#form_eapp\\:tf_chasis_no", CHASSIS_LAST5)

        print("Chassis entered")

        page.wait_for_selector("#form_eapp\\:validate_button", timeout=15000)

        # -------------------------
        # CLICK VERIFY DETAILS
        # -------------------------

        page.wait_for_selector("#form_eapp\\:validate_button", timeout=15000)

        verify_btn = page.locator("#form_eapp\\:validate_button")

        verify_btn.wait_for(state="visible", timeout=15000)

        verify_btn.click(force=True)

        print("Verify Details clicked")

        # -------------------------
        # CHECK RESULT
        # -------------------------

        page.wait_for_load_state("networkidle")

        # NO CHALLAN FLOW

        if page.locator("#form_eapp\\:tf_show_button").count() > 0:

            print("No challan detected")

            page.wait_for_selector("#form_eapp\\:tf_show_button", timeout=15000)

            submit_btn = page.locator("#form_eapp\\:tf_show_button")

            submit_btn.wait_for(state="visible", timeout=15000)

            submit_btn.click(force=True)

            print("Submit clicked")

        # CHALLAN FLOW

        elif page.locator("text=challan").count() > 0:

            print("Pending challan detected")

        else:

            print("Unknown response")

        page.wait_for_selector("#taxFrom\\:tf_tax_upto", timeout=15000)
        print(page.url)
        page.wait_for_timeout(2000)

        # -------------------------
        # EXTRACT TAX UPTO
        # -------------------------

        page.wait_for_selector("#taxFrom\\:tf_tax_upto", timeout=15000)

        tax_element = page.locator("#taxFrom\\:tf_tax_upto")

        count = tax_element.count()

        print("Tax elements found:", count)

        if count > 0:

            tax_upto = tax_element.first.inner_text()

            # -------------------------
            # EXTRACT OWNER NAME
            # -------------------------

            owner_element = page.locator("#taxFrom\\:tf_owner_name")

            owner_count = owner_element.count()

            owner_name = ""

            if owner_count > 0:

                owner_name = owner_element.first.input_value()

            result = {
                "success": True,
                "vehicle_number": VEHICLE_NUMBER,
                "tax_upto": tax_upto,
                "owner_name": owner_name,
            }

            print(json.dumps(result))

            page.screenshot(path="final_tax_page.png", full_page=True)

            print("Final screenshot saved")

        else:

            print("TAX_UPTO not found")

    except Exception as e:

        print("ERROR:")

        print(e)

        try:

            page.screenshot(path="error.png", full_page=True)

            print("Error screenshot saved")

        except:

            print("Screenshot failed")

    context.close()
    browser.close()
