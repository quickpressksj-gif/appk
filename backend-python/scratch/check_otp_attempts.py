import asyncio
from app.db.client import database

async def check_attempts():
    await database.connect()
    attempts = await database.find_many("otp_attempts")
    print(f"Total OTP attempts: {len(attempts)}")
    for a in attempts[-20:]:
        print(f"  - Phone: {a.get('phone')} | Role: {a.get('role')} | Time: {a.get('created_at')}")

if __name__ == "__main__":
    asyncio.run(check_attempts())
