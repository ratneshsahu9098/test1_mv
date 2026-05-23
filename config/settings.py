from dotenv import load_dotenv
import os

load_dotenv()

# --- Existing ---
ALERT_DAYS = 7
SCHEDULE_TIME = os.getenv("SCHEDULE_TIME", "09:00")

# --- Telegram ---
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# --- Gmail SMTP ---
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_SENDER_NAME = os.getenv("EMAIL_SENDER_NAME", "MV Tax Reminder")

# --- Firebase Cloud Messaging ---
FCM_SERVER_KEY = os.getenv("FCM_SERVER_KEY")
FCM_SENDER_ID = os.getenv("VITE_FIREBASE_MESSAGING_SENDER_ID", "766664836702")
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")

# --- Reminder Tiers (days before expiry) ---
REMINDER_DAYS = [7, 3, 1]
