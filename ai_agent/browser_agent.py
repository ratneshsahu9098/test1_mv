import asyncio
import base64
import os
import re
import json
from playwright.async_api import async_playwright, TimeoutError as PwTimeout

SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

from .prompts import PAGE_ANALYSIS_PROMPT, DATA_EXTRACTION_PROMPT, ERROR_RECOVERY_PROMPT, AI_AGENT_SYSTEM_PROMPT
from .utils import get_state_name, parse_ai_json, get_openai_api_key


class AIBrowserAgent:
    def __init__(self, vehicle_number, chassis_last5):
        self.vehicle_number = vehicle_number.upper()
        self.chassis_last5 = chassis_last5
        self.state_name = get_state_name(vehicle_number)
        self.state_code = vehicle_number[:2].upper()
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.captcha_state = None
        self.logs = []
        self._openai_client = None

    def _get_openai_client(self):
        if self._openai_client is None:
            import openai
            api_key = get_openai_api_key()
            self._openai_client = openai.OpenAI(api_key=api_key) if api_key else None
        return self._openai_client

    async def ask_ai(self, prompt, system=None):
        client = self._get_openai_client()
        if not client:
            return None
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system or AI_AGENT_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1000,
            )
            return response.choices[0].message.content
        except Exception as e:
            self.log(f"AI call failed: {e}")
            return None

    def log(self, message):
        self.logs.append(message)

    async def start_browser(self, headless=True):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--incognito",
            ],
        )
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36",
            viewport={"width": 1366, "height": 768},
            locale="en-IN",
        )
        self.page = await self.context.new_page()
        self.page.set_default_timeout(30000)

    async def close(self):
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception:
            pass

    async def get_page_state(self):
        state = {
            "url": self.page.url,
            "title": await self.page.title(),
            "text": await self.page.evaluate("document.body.innerText"),
        }
        try:
            state["elements"] = await self.page.evaluate("""() => {
                const els = [];
                document.querySelectorAll('input, select, button, a, label, textarea, [role=button], .ui-button, .ui-dialog').forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        els.push({
                            tag: el.tagName,
                            type: el.type || '',
                            id: el.id,
                            cls: el.className?.slice(0,60),
                            text: (el.innerText || el.value || '').trim().slice(0,80),
                            placeholder: el.placeholder || '',
                            visible: r.top < window.innerHeight && r.bottom > 0,
                            x: Math.round(r.x), y: Math.round(r.y)
                        });
                    }
                });
                return els;
            }""")
        except Exception:
            state["elements"] = []
        return state

    async def screenshot_base64(self):
        try:
            screenshot = await self.page.screenshot(full_page=True, type="png")
            return base64.b64encode(screenshot).decode()
        except Exception:
            return None

    async def handle_popups(self):
        dismissed = 0
        try:
            await self.page.evaluate("""() => {
                document.querySelectorAll('.ui-dialog, [role=dialog], .modal, .popup').forEach(el => el.remove());
            }""")
            dismissed += 1
        except Exception:
            pass
        try:
            for selector in ["img[alt='close']", "button:has-text('Close')", "button:has-text('OK')", ".ui-dialog-titlebar-close"]:
                try:
                    btn = await self.page.query_selector(selector)
                    if btn:
                        await btn.click(force=True)
                        await asyncio.sleep(0.5)
                        dismissed += 1
                except Exception:
                    pass
        except Exception:
            pass
        return dismissed

    async def navigate_to_parivahan(self):
        url = "https://parivahan.gov.in/en/content/vehicle-related-services"
        self.log(f"Opening Parivahan for {self.vehicle_number} ({self.state_name})")
        for attempt in range(3):
            try:
                await self.page.goto(url, wait_until="networkidle", timeout=120000)
                self.log("Parivahan loaded")
                return True
            except Exception as e:
                self.log(f"Navigation attempt {attempt+1} failed: {e}")
                await asyncio.sleep(3)
        return False

    async def select_state(self):
        try:
            await self.page.wait_for_selector("select.select-css-vehicle-related-services", timeout=30000)
            self.log(f"Selecting state: {self.state_name}")
            await self.page.select_option("select.select-css-vehicle-related-services", label=self.state_name)
            try:
                await self.page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass
            await asyncio.sleep(1)
            try:
                if await self.page.locator("text=Previous session is already active").is_visible():
                    self.log("Session popup detected — closing")
                    await self.page.click("img[alt='close']", force=True)
                    await self.page.reload()
                    await self.page.wait_for_load_state("networkidle")
                    await self.page.wait_for_selector("select.select-css-vehicle-related-services", timeout=15000)
                    await self.page.select_option("select.select-css-vehicle-related-services", label=self.state_name)
                    try:
                        await self.page.wait_for_load_state("networkidle", timeout=15000)
                    except Exception:
                        pass
            except Exception:
                pass
            try:
                await self.page.click("button:has-text('Close')", timeout=5000)
                await asyncio.sleep(1)
            except Exception:
                pass
            await self.handle_popups()
            return True
        except Exception as e:
            self.log(f"State selection failed: {e}")
            return False

    async def click_vehicle_registration(self):
        for retry in range(3):
            try:
                await self.handle_popups()
                await self.page.wait_for_selector("text=Vehicle Registration No.", timeout=8000)
                await self.page.click("text=Vehicle Registration No.", timeout=5000)
                try:
                    await self.page.wait_for_load_state("networkidle", timeout=10000)
                except Exception:
                    pass
                await asyncio.sleep(1)
                self.log("Vehicle Registration No. selected")
                return True
            except Exception as e:
                self.log(f"Vehicle Registration click retry {retry+1}: {e}")
                await self.page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"vehicle_reg_retry_{retry}.png"))
                await asyncio.sleep(2)
        return False

    async def fill_vehicle_form(self):
        try:
            await self.page.wait_for_selector("#regnid", timeout=15000)
            await self.page.locator("#regnid").click()
            await self.page.locator("#regnid").fill("")
            await self.page.fill("#regnid", self.vehicle_number)
            self.log("Vehicle number entered")
            await asyncio.sleep(0.5)
            checkbox = self.page.locator(".ui-chkbox-box").first
            if await checkbox.count() > 0:
                await checkbox.click()
                self.log("Checkbox checked")
            try:
                await self.page.wait_for_load_state("networkidle", timeout=10000)
            except Exception:
                pass
            await asyncio.sleep(0.5)
            await self.page.click("#proccedHomeButtonId")
            self.log("Proceed clicked")
            await asyncio.sleep(3)
            return True
        except Exception as e:
            self.log(f"Form fill failed: {e}")
            try:
                await self.page.screenshot(path=os.path.join(SCREENSHOT_DIR, "ai_form_fill_error.png"), full_page=True)
            except Exception:
                pass
            return False

    async def check_for_captcha(self):
        page_text = await self.page.evaluate("document.body.innerText")
        has_captcha_text = "captcha" in page_text.lower()
        has_recaptcha = False
        try:
            has_recaptcha = await self.page.query_selector("iframe[src*='recaptcha'], .g-recaptcha, #captcha, img[alt*='captcha']") is not None
        except Exception:
            pass
        if has_captcha_text or has_recaptcha:
            self.log("CAPTCHA detected")
            screenshot = await self.screenshot_base64()
            return {
                "detected": True,
                "screenshot": screenshot,
                "page_text": page_text[:500],
            }
        return {"detected": False}

    async def solve_captcha(self, captcha_input):
        try:
            for selector in ["#captcha", "input[name*='captcha']", "input[id*='captcha']", "input[placeholder*='captcha']"]:
                field = await self.page.query_selector(selector)
                if field:
                    await field.fill(captcha_input)
                    self.log("CAPTCHA filled")
                    break
            submit_btn = await self.page.query_selector("#proccedHomeButtonId, button[type=submit], input[type=submit]")
            if submit_btn:
                await submit_btn.click()
                await asyncio.sleep(3)
                self.log("CAPTCHA submitted")
            return True
        except Exception as e:
            self.log(f"CAPTCHA solve failed: {e}")
            return False

    async def handle_auth_dialog(self):
        try:
            await asyncio.sleep(3)
            auth_handled = False
            for attempt in range(3):
                try:
                    dialogs = self.page.locator(".ui-dialog")
                    count = await dialogs.count()
                    self.log(f"Auth dialogs found: {count}")
                    for i in range(count):
                        dialog = dialogs.nth(i)
                        if not await dialog.is_visible():
                            continue
                        buttons = dialog.locator("button")
                        for j in range(await buttons.count()):
                            try:
                                btn_text = await buttons.nth(j).inner_text()
                                btn_visible = await buttons.nth(j).is_visible()
                                self.log(f"Dialog {i} Button {j}: {btn_text} Visible={btn_visible}")
                                if "Proceed" in btn_text and btn_visible:
                                    await buttons.nth(j).click(force=True)
                                    self.log("Auth Proceed clicked")
                                    auth_handled = True
                                    break
                            except Exception:
                                continue
                        if auth_handled:
                            break
                    if not auth_handled:
                        self.log("Auth dialog not found, trying JS removal")
                        await self.page.evaluate("""() => {
                            document.querySelectorAll('.ui-dialog').forEach(d => d.remove());
                        }""")
                        await asyncio.sleep(1)
                except Exception as ex:
                    self.log(f"Auth attempt {attempt+1}: {ex}")
                if auth_handled:
                    break
                await asyncio.sleep(1)
            try:
                await self.page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass
            self.log(f"Auth handled: {auth_handled}")
            return auth_handled
        except Exception as e:
            self.log(f"Auth dialog handling failed: {e}")
            return False

    async def proceed_to_tax(self):
        try:
            self.log(f"Page URL: {self.page.url}")
            page_text = await self.page.evaluate("document.body.innerText")
            self.log(f"Page text (first 200): {page_text[:200]}")

            # Strategy 1: wait properly for #trigger1 (same as working fetch_vehicle.py)
            try:
                self.log("Waiting for #trigger1...")
                await self.page.wait_for_selector("#trigger1", timeout=20000)
                await self.page.locator("#trigger1").click(force=True)
                self.log("Pay Your Tax clicked (#trigger1)")
                try:
                    await self.page.wait_for_load_state("networkidle", timeout=15000)
                except Exception:
                    pass
                await asyncio.sleep(2)
                return True
            except Exception:
                self.log("#trigger1 not found, trying fallback selectors")

            # Strategy 2: try alternative selectors
            selectors = [
                "a:has-text('Pay Your Tax')",
                "button:has-text('Pay Your Tax')",
                "a:has-text('Proceed')",
                ".ui-state-highlight a",
                "a:has-text('Tax')",
                "button:has-text('Tax')",
            ]
            for sel in selectors:
                try:
                    el = await self.page.wait_for_selector(sel, timeout=5000)
                    if el:
                        self.log(f"Found element: {sel}")
                        await el.click(force=True)
                        try:
                            await self.page.wait_for_load_state("networkidle", timeout=15000)
                        except Exception:
                            pass
                        await asyncio.sleep(2)
                        return True
                except Exception:
                    continue

            # Strategy 3: try finding any visible link/button with Tax-related text
            try:
                self.log("Trying AI-assisted element discovery...")
                elements = await self.page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('a, button, span, div[role=button], input[type=submit]'))
                        .filter(e => e.offsetHeight > 0)
                        .map(e => ({
                            tag: e.tagName,
                            id: e.id,
                            text: (e.innerText || e.value || '').trim().slice(0, 60),
                            href: e.href || '',
                            cls: (e.className || '').slice(0, 40)
                        }))
                        .filter(e => /tax|pay|proceed|trigger|submit|continue/i.test(e.text));
                }""")
                self.log(f"Tax-related elements found: {elements}")
                for el_info in elements:
                    try:
                        sel = f"#{el_info['id']}" if el_info['id'] else f"a:has-text('{el_info['text'][:20]}')"
                        el = await self.page.query_selector(sel)
                        if el:
                            await el.click(force=True)
                            self.log(f"Clicked: {el_info['text']}")
                            try:
                                await self.page.wait_for_load_state("networkidle", timeout=15000)
                            except Exception:
                                pass
                            await asyncio.sleep(2)
                            return True
                    except Exception:
                        continue
            except Exception as e:
                self.log(f"AI discovery failed: {e}")

            self.log("No tax proceed button found with any strategy")
            try:
                await self.page.screenshot(path=os.path.join(SCREENSHOT_DIR, "ai_no_trigger.png"), full_page=True)
            except Exception:
                pass
            return False
        except Exception as e:
            self.log(f"Proceed to tax failed: {e}")
            try:
                await self.page.screenshot(path=os.path.join(SCREENSHOT_DIR, "ai_proceed_tax_error.png"), full_page=True)
            except Exception:
                pass
            return False

    async def fill_chassis_and_verify(self):
        try:
            chassis_selector = "#form_eapp\\:tf_chasis_no"
            await self.page.wait_for_selector(chassis_selector, timeout=15000)
            await self.page.fill(chassis_selector, self.chassis_last5)
            self.log("Chassis entered")
            verify_btn = await self.page.query_selector("#form_eapp\\:validate_button")
            if not verify_btn:
                self.log("Verify button not found")
                return False
            await verify_btn.click(force=True)
            self.log("Verify Details clicked")
            await asyncio.sleep(3)
            try:
                await self.page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass
            await asyncio.sleep(2)
            return True
        except Exception as e:
            self.log(f"Chassis verify failed: {e}")
            return False

    async def handle_challan(self):
        try:
            page_text = await self.page.evaluate("document.body.innerText")
            if "challan" not in page_text.lower():
                return False
            self.log("Challan detected — dismissing overlay")
            await self.page.screenshot(path=os.path.join(SCREENSHOT_DIR, "challan_detected.png"), full_page=True)
            await self.page.keyboard.press("Escape")
            await asyncio.sleep(1.5)
            await self.page.mouse.click(10, 10)
            await asyncio.sleep(1.5)
            await self.page.evaluate("document.querySelector('.ui-dialog')?.remove()")
            await asyncio.sleep(1.5)
            await self.page.evaluate("document.querySelectorAll('[role=dialog], .ui-dialog, .modal, .overlay, .ui-widget-overlay')?.forEach(e=>e.remove())")
            await asyncio.sleep(1.5)
            dialog_left = await self.page.locator(".ui-dialog:visible").count() > 0
            if dialog_left:
                self.log("Could not dismiss challan overlay — continuing anyway")
                return True
            self.log("Challan dismissed")
            return False
        except Exception:
            return False

    async def submit_tax_query(self):
        try:
            has_submit = await self.page.locator("#form_eapp\\:tf_show_button").count() > 0
            if has_submit:
                await self.page.locator("#form_eapp\\:tf_show_button").click(force=True)
                self.log("Tax query submitted")
                await asyncio.sleep(3)
                return True
            self.log("No submit button — trying direct extraction")
            return False
        except Exception as e:
            self.log(f"Tax query submit failed: {e}")
            return False

    async def extract_tax_data(self):
        try:
            try:
                await self.page.wait_for_selector("#taxFrom\\:tf_tax_upto", timeout=15000)
            except Exception:
                page_text = await self.page.evaluate("document.body.innerText")
                self.log(f"Tax field not found. Page text: {page_text[:300]}")
                elements = await self.page.evaluate("""() => Array.from(document.querySelectorAll('input, select, button, span, label, div')).filter(e => e.offsetHeight>0).map(e => e.id || e.name || e.innerText?.trim()?.slice(0,40)).filter(Boolean).slice(0,20)""")
                self.log(f"Visible elements: {elements}")
                return {}
            page_text = await self.page.evaluate("document.body.innerText")
            result = {}
            tax_el = await self.page.query_selector("#taxFrom\\:tf_tax_upto")
            if tax_el:
                result["tax_upto"] = await tax_el.inner_text()
            owner_el = await self.page.query_selector("#taxFrom\\:tf_owner_name")
            if owner_el:
                try:
                    result["owner_name"] = await owner_el.input_value()
                except Exception:
                    result["owner_name"] = await owner_el.inner_text()
            if not result.get("tax_upto"):
                ai_result = await self.ask_ai(DATA_EXTRACTION_PROMPT.format(page_text=page_text[:3000]))
                if ai_result:
                    parsed = parse_ai_json(ai_result)
                    if parsed:
                        result.update(parsed)
            return result
        except Exception as e:
            self.log(f"Data extraction failed: {e}")
            return {}

    async def run(self):
        try:
            if not self.state_name:
                return {"success": False, "error": f"Unknown state code: {self.state_code}", "logs": self.logs}
            await self.start_browser(headless=True)
            ok = await self.navigate_to_parivahan()
            if not ok:
                await self.close()
                return {"success": False, "error": "Could not reach Parivahan", "logs": self.logs}
            ok = await self.select_state()
            if not ok:
                await self.close()
                return {"success": False, "error": "State selection failed", "logs": self.logs}
            await self.handle_popups()
            ok = await self.click_vehicle_registration()
            if not ok:
                await self.close()
                return {"success": False, "error": "Could not click Vehicle Registration", "logs": self.logs}
            ok = await self.fill_vehicle_form()
            if not ok:
                await self.close()
                return {"success": False, "error": "Could not fill vehicle form", "logs": self.logs}
            captcha_status = await self.check_for_captcha()
            if captcha_status["detected"]:
                return {
                    "success": False,
                    "captcha_needed": True,
                    "captcha_image": captcha_status["screenshot"],
                    "logs": self.logs,
                }
            await self.handle_auth_dialog()
            try:
                await self.page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass
            self.log(f"URL after auth: {self.page.url}")
            ok = await self.proceed_to_tax()
            if not ok:
                await self.close()
                return {"success": False, "error": "Could not proceed to tax page", "logs": self.logs}
            ok = await self.fill_chassis_and_verify()
            if not ok:
                await self.close()
                return {"success": False, "error": "Could not fill chassis details", "logs": self.logs}
            has_challan = await self.handle_challan()
            if has_challan:
                self.log("Challan could not be dismissed — trying extraction anyway")
            await self.submit_tax_query()
            data = await self.extract_tax_data()
            await self.close()
            if data.get("tax_upto"):
                return {"success": True, "data": data, "logs": self.logs}
            if has_challan:
                return {"success": False, "error": "Pending challan(s) — tax details unavailable", "challan_pending": True, "logs": self.logs}
            return {"success": False, "error": "Could not extract tax data", "logs": self.logs}
        except Exception as e:
            self.log(f"Agent error: {e}")
            try:
                await self.page.screenshot(path=os.path.join(SCREENSHOT_DIR, "ai_agent_error.png"), full_page=True)
            except Exception:
                pass
            try:
                await self.close()
            except Exception:
                pass
            return {"success": False, "error": str(e), "logs": self.logs}

    RETRYABLE_ERRORS = [
        "Could not proceed to tax page",
        "Could not fill vehicle form",
        "Could not click Vehicle Registration",
        "State selection failed",
        "Could not reach Parivahan",
        "Could not fill chassis details",
        "Could not extract tax data",
    ]

    async def run_with_retry(self, max_retries=3):
        for attempt in range(1, max_retries + 1):
            self.log(f"=== Run attempt {attempt}/{max_retries} ===")
            result = await self.run()
            if result.get("success") or result.get("captcha_needed"):
                return result
            error = result.get("error", "")
            is_retryable = any(e in error for e in self.RETRYABLE_ERRORS)
            if not is_retryable or attempt == max_retries:
                return result
            self.log(f"Retryable error, retrying in 3s... ({attempt}/{max_retries})")
            await asyncio.sleep(3)
        return result

    async def run_with_captcha(self, captcha_input=None):
        if captcha_input is not None:
            await self.solve_captcha(captcha_input)
            await self.handle_auth_dialog()
            ok = await self.proceed_to_tax()
            if not ok:
                await self.close()
                return {"success": False, "error": "Could not proceed to tax page", "logs": self.logs}
            ok = await self.fill_chassis_and_verify()
            if not ok:
                await self.close()
                return {"success": False, "error": "Could not fill chassis details", "logs": self.logs}
            await self.submit_tax_query()
            data = await self.extract_tax_data()
            await self.close()
            if data.get("tax_upto"):
                return {"success": True, "data": data, "logs": self.logs}
            return {"success": False, "error": "Could not extract tax data", "logs": self.logs}
