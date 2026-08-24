import asyncio
from app.config import get_settings
from app.db.client import database
from app.db.repositories import otp_attempts
from app.api.auth import _normalize_phone

async def test_otp():
    await database.connect()
    settings = get_settings()
    phone = _normalize_phone("8279538461")
    count = await otp_attempts.sends_in_last_hour(phone)
    print(f"Phone: {phone}")
    print(f"Max sends per hour in settings: {settings.otp_max_sends_per_hour}")
    print(f"Current sends in last hour: {count}")

if __name__ == "__main__":
    asyncio.run(test_otp())
