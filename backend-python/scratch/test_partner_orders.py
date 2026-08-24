import asyncio
from app.db.client import database
from app.db.partner_repositories import partner_order_repository

async def test_partner_orders():
    await database.connect()
    # Test for PRT-259692
    orders = await partner_order_repository.list("PRT-259692")
    print(f"Orders for PRT-259692: {len(orders['items'])} order(s) found")
    for o in orders["items"]:
        print(f"  - Order Code: {o.get('code')} | Customer: {o.get('customerName')} | Status: {o.get('status')} | Amount: ₹{o.get('amount')}")

if __name__ == "__main__":
    asyncio.run(test_partner_orders())
