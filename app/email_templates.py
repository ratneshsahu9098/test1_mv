def build_reminder_html(vehicle_number: str, owner: str, expiry_date: str, days_left: int) -> str:
    urgency = "critical"
    color = "#ef4444"
    if days_left > 3:
        urgency = "warning"
        color = "#f97316"
    if days_left > 7:
        urgency = "notice"
        color = "#3b82f6"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:40px;text-align:center">
<h1 style="color:#ffffff;margin:0;font-size:24px">&#128663; MV Tax Reminder</h1>
</td></tr>
<tr><td style="padding:40px">
<p style="color:#6b7280;font-size:14px;margin:0 0 20px">Dear {owner},</p>
<p style="color:#374151;font-size:16px;margin:0 0 16px">Your vehicle <strong>{vehicle_number}</strong> tax is due soon.</p>
<div style="background:{color}10;border:1px solid {color}30;border-radius:12px;padding:20px;margin:20px 0">
<table width="100%">
<tr><td style="color:#6b7280;font-size:13px;padding:4px 0">Vehicle</td><td style="text-align:right;font-weight:bold;color:#111827">{vehicle_number}</td></tr>
<tr><td style="color:#6b7280;font-size:13px;padding:4px 0">Expiry Date</td><td style="text-align:right;font-weight:bold;color:#111827">{expiry_date}</td></tr>
<tr><td style="color:#6b7280;font-size:13px;padding:4px 0">Days Left</td><td style="text-align:right;font-weight:bold;color:{color}">{days_left} day(s)</td></tr>
</table>
</div>
<p style="color:#374151;font-size:14px;margin:16px 0 0">Please renew your vehicle tax to avoid penalties.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">
<p style="color:#9ca3af;font-size:12px;margin:0">MV Tax &bull; Vehicle Tax Management Platform</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>"""


def build_expired_html(vehicle_number: str, owner: str, expiry_date: str, days_ago: int) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:40px;text-align:center">
<h1 style="color:#ffffff;margin:0;font-size:24px">&#10060; Vehicle Tax Expired</h1>
</td></tr>
<tr><td style="padding:40px">
<p style="color:#6b7280;font-size:14px;margin:0 0 20px">Dear {owner},</p>
<p style="color:#374151;font-size:16px;margin:0 0 16px">Your vehicle <strong>{vehicle_number}</strong> tax has expired.</p>
<div style="background:#ef444410;border:1px solid #ef444430;border-radius:12px;padding:20px;margin:20px 0">
<table width="100%">
<tr><td style="color:#6b7280;font-size:13px;padding:4px 0">Vehicle</td><td style="text-align:right;font-weight:bold;color:#111827">{vehicle_number}</td></tr>
<tr><td style="color:#6b7280;font-size:13px;padding:4px 0">Expired On</td><td style="text-align:right;font-weight:bold;color:#111827">{expiry_date}</td></tr>
<tr><td style="color:#6b7280;font-size:13px;padding:4px 0">Days Overdue</td><td style="text-align:right;font-weight:bold;color:#dc2626">{days_ago} day(s)</td></tr>
</table>
</div>
<p style="color:#374151;font-size:14px;margin:16px 0 0">Please renew immediately to avoid fines and legal action.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">
<p style="color:#9ca3af;font-size:12px;margin:0">MV Tax &bull; Vehicle Tax Management Platform</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>"""


def build_monthly_summary_html(username: str, data: dict) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,#059669,#10b981);padding:40px;text-align:center">
<h1 style="color:#ffffff;margin:0;font-size:24px">&#128200; Monthly Summary</h1>
</td></tr>
<tr><td style="padding:40px">
<p style="color:#6b7280;font-size:14px;margin:0 0 20px">Hello {username},</p>
<p style="color:#374151;font-size:16px;margin:0 0 20px">Here is your monthly vehicle summary:</p>
<div style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0">
<table width="100%">
<tr><td style="padding:8px 0;color:#6b7280">Total Vehicles</td><td style="text-align:right;font-weight:bold;color:#111827">{data.get('total', 0)}</td></tr>
<tr><td style="padding:8px 0;color:#6b7280">Active</td><td style="text-align:right;font-weight:bold;color:#059669">{data.get('active', 0)}</td></tr>
<tr><td style="padding:8px 0;color:#6b7280">Expiring Soon</td><td style="text-align:right;font-weight:bold;color:#f97316">{data.get('expiring', 0)}</td></tr>
<tr><td style="padding:8px 0;color:#6b7280">Expired</td><td style="text-align:right;font-weight:bold;color:#dc2626">{data.get('expired', 0)}</td></tr>
</table>
</div>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">
<p style="color:#9ca3af;font-size:12px;margin:0">MV Tax &bull; Vehicle Tax Management Platform</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>"""
