import re
import json
import os

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


def get_state_name(vehicle_number):
    state_code = vehicle_number[:2].upper()
    return STATE_MAP.get(state_code)


def parse_ai_json(text):
    try:
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return json.loads(text)
    except (json.JSONDecodeError, AttributeError):
        return None


def get_openai_api_key():
    return os.getenv("OPENAI_API_KEY")


def is_ai_available():
    return bool(get_openai_api_key())
