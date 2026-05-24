import os
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime
from config.settings import EMAIL_ADDRESS, EMAIL_PASSWORD, EMAIL_SENDER_NAME
from app.email_templates import (
    build_reminder_html,
    build_expired_html,
    build_monthly_summary_html,
    build_password_reset_request_html,
    build_password_reset_resolved_html,
)

LOG_FILE = "data/email_logs.txt"


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("Email not configured: EMAIL_ADDRESS or EMAIL_PASSWORD not set")
        return False

    try:
        msg = EmailMessage()
        msg["From"] = f"{EMAIL_SENDER_NAME} <{EMAIL_ADDRESS}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content("Please view this email in an HTML-compatible client.")
        msg.add_alternative(html_body, subtype="html")

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)

        _save_log(to_email, subject, "sent")
        print(f"Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        print(f"Email failed to {to_email}: {e}")
        _save_log(to_email, subject, f"failed: {e}")
        return False


def send_reminder_email(to_email: str, vehicle_number: str, owner: str, expiry_date: str, days_left: int):
    subject = f"Reminder: Vehicle {vehicle_number} tax expires in {days_left} day(s)"
    html = build_reminder_html(vehicle_number, owner, expiry_date, days_left)
    return send_email(to_email, subject, html)


def send_expired_email(to_email: str, vehicle_number: str, owner: str, expiry_date: str, days_ago: int):
    subject = f"Expired: Vehicle {vehicle_number} tax expired {days_ago} day(s) ago"
    html = build_expired_html(vehicle_number, owner, expiry_date, days_ago)
    return send_email(to_email, subject, html)


def send_password_reset_request_notification(to_email: str, username: str):
    subject = f"Password Reset Request from {username}"
    html = build_password_reset_request_html(username)
    return send_email(to_email, subject, html)


def send_password_reset_resolved_notification(to_email: str, reset_link: str):
    subject = "Your Password Reset Request Has Been Approved"
    html = build_password_reset_resolved_html(reset_link)
    return send_email(to_email, subject, html)


def send_monthly_summary(to_email: str, username: str, summary_data: dict):
    subject = "MV Tax - Monthly Vehicle Summary"
    html = build_monthly_summary_html(username, summary_data)
    return send_email(to_email, subject, html)


def _save_log(recipient, subject, status):
    os.makedirs("data", exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.now()} | {recipient} | {subject} | {status}\n")
