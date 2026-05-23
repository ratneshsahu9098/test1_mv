from apscheduler.schedulers.background import BackgroundScheduler
from app.checker import check_expiry
# from app.auto_fetcher import auto_fetch_vehicles, auto_fetch_expiring_vehicles  # removed for deployment (needs Playwright)
from config.settings import SCHEDULE_TIME

scheduler = BackgroundScheduler(daemon=True)


def start_scheduler():
    hour, minute = SCHEDULE_TIME.split(":")

    print(f"\nMV TAX SCHEDULER STARTED (daily at {SCHEDULE_TIME})...\n")

    scheduler.add_job(
        check_expiry,
        "cron",
        hour=int(hour),
        minute=int(minute),
        id="check_expiry",
        replace_existing=True,
    )

    check_expiry()
    scheduler.start()
