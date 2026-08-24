import asyncio, json
from app.db.client import database

async def inspect_sample_order():
    await database.connect()
    order = await database.find_one("customer_orders", {"_id": "ord-QP1056"})
    print("Sample order ord-QP1056:")
    print(json.dumps(order, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(inspect_sample_order())
