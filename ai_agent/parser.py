from datetime import datetime


def parse_tax_date(date_str):
    if not date_str or date_str == "null":
        return None
    for fmt in ["%d-%b-%Y", "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"]:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            continue
    return date_str


def parse_ai_extraction_result(extracted):
    return {
        "vehicle_number": extracted.get("vehicle_number", ""),
        "owner_name": extracted.get("owner_name", ""),
        "tax_upto": parse_tax_date(extracted.get("tax_upto")),
        "fuel_type": extracted.get("fuel_type"),
        "model": extracted.get("model"),
        "registration_date": extracted.get("registration_date"),
    }


def build_fetch_result(success, data=None, error=None, captcha_needed=False, captcha_image=None, challan_pending=False):
    result = {"success": success}
    if data:
        result.update(data)
    if error:
        result["error"] = error
    if captcha_needed:
        result["captcha_needed"] = True
    if captcha_image:
        result["captcha_image"] = captcha_image
    if challan_pending:
        result["challan_pending"] = True
    return result
