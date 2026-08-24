import asyncio
from app.db.client import database

async def clear_attempts():
    await database.connect()
    res = await database.collection("otp_attempts").delete_many({})
    print(f"Cleared {res.deleted_count if hasattr(res, 'deleted_count') else res} old rate limit attempts.")

if __name__ == "__main__":
    asyncio.run(clear_attempts())
