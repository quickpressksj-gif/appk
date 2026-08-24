import asyncio
from app.db.client import database

async def inspect_orders():
    await database.connect()
    orders = await database.find_many("customer_orders")
    print(f"Total orders in customer_orders: {len(orders)}")
    for o in orders:
        partner_obj = o.get("partner") or {}
        p_id = partner_obj.get("id") or o.get("partner_id") or o.get("partnerId") or o.get("store_id")
        p_name = partner_obj.get("name") or partner_obj.get("businessName")
        print(f"Order: {o.get('_id') or o.get('id')} | Code: {o.get('order_code') or o.get('code')} | Status: {o.get('status')} | Partner: {p_name} ({p_id}) | Amount: ₹{o.get('amount') or o.get('pricing', {}).get('finalTotal')}")

if __name__ == "__main__":
    asyncio.run(inspect_orders())
