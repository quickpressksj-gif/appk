import asyncio
import sys
import requests
import socketio

BASE_URL = "http://localhost:8000"

RIDER_HEADERS = {
    "Authorization": "Bearer jwt_rider_9876543210",
    "Content-Type": "application/json"
}

PARTNER_HEADERS = {
    "Authorization": "Bearer jwt_partner_9876543211",
    "Content-Type": "application/json"
}

async def main():
    print("🚀 Starting Unified Online/Offline Engine Integration Tests...")
    
    # 1. Test Backend Health
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ Backend Health Status: {resp.status_code}")
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

    # 2. Setup Socket.IO Client to test live broadcast events
    sio = socketio.AsyncClient()
    received_events = []

    @sio.on("connect")
    async def on_connect():
        print("⚡ Socket.IO Connected to backend")

    @sio.on("rider.status_changed")
    async def on_rider_status(data):
        print(f"🔔 Received 'rider.status_changed' event: {data}")
        received_events.append(("rider.status_changed", data))

    @sio.on("rider.online_status")
    async def on_rider_online_status(data):
        print(f"🔔 Received 'rider.online_status' event: {data}")
        received_events.append(("rider.online_status", data))

    @sio.on("partner.status_changed")
    async def on_partner_status(data):
        print(f"🔔 Received 'partner.status_changed' event: {data}")
        received_events.append(("partner.status_changed", data))

    @sio.on("partner.online_status")
    async def on_partner_online_status(data):
        print(f"🔔 Received 'partner.online_status' event: {data}")
        received_events.append(("partner.online_status", data))

    try:
        await sio.connect(BASE_URL, socketio_path="/socket.io", transports=["websocket", "polling"])
        print("✅ Socket.IO client successfully connected and listening for live events")
    except Exception as e:
        print(f"⚠️ Socket.IO connect warning: {e}")

    await asyncio.sleep(0.5)

    # 3. Test Rider Status Flow
    print("\n--- Testing Rider Online/Offline API & DB Engine ---")
    
    # Toggle Rider Online
    rider_toggle_on = requests.post(f"{BASE_URL}/api/rider/online", json={"online": True}, headers=RIDER_HEADERS, timeout=5)
    print(f"👉 Rider Toggle ON response: {rider_toggle_on.status_code} - {rider_toggle_on.json()}")
    assert rider_toggle_on.status_code == 200, f"Rider toggle ON failed: {rider_toggle_on.text}"
    assert rider_toggle_on.json().get("isOnline") is True, "Rider isOnline should be True"

    # Get Rider Status
    rider_status_on = requests.get(f"{BASE_URL}/api/rider/status", headers=RIDER_HEADERS, timeout=5)
    print(f"👉 Rider Status ON check: {rider_status_on.status_code} - {rider_status_on.json()}")
    assert rider_status_on.status_code == 200
    assert rider_status_on.json().get("isOnline") is True

    # Rider Heartbeat
    rider_hb = requests.post(f"{BASE_URL}/api/rider/heartbeat", json={"isOnline": True, "batteryLevel": 92}, headers=RIDER_HEADERS, timeout=5)
    print(f"👉 Rider Heartbeat response: {rider_hb.status_code} - {rider_hb.json()}")
    assert rider_hb.status_code == 200

    # Wait for broadcast delivery
    await asyncio.sleep(0.5)

    # Toggle Rider Offline
    rider_toggle_off = requests.post(f"{BASE_URL}/api/rider/online", json={"online": False}, headers=RIDER_HEADERS, timeout=5)
    print(f"👉 Rider Toggle OFF response: {rider_toggle_off.status_code} - {rider_toggle_off.json()}")
    assert rider_toggle_off.status_code == 200
    assert rider_toggle_off.json().get("isOnline") is False

    # Get Rider Status Offline
    rider_status_off = requests.get(f"{BASE_URL}/api/rider/status", headers=RIDER_HEADERS, timeout=5)
    print(f"👉 Rider Status OFF check: {rider_status_off.status_code} - {rider_status_off.json()}")
    assert rider_status_off.status_code == 200
    assert rider_status_off.json().get("isOnline") is False

    await asyncio.sleep(0.5)

    # 4. Setup / Onboard Test Partner Store
    print("\n--- Setting up / Onboarding Test Partner Store ---")
    onboard_payload = {
        "businessName": "QuickPress Test Hub",
        "ownerName": "Test Merchant",
        "phone": "+919876543211",
        "email": "testmerchant@example.com",
        "category": "laundry",
        "address": "100 MG Road, Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "area": "Indiranagar",
        "pincode": "560038",
        "openingTime": "08:00",
        "closingTime": "22:00",
        "pickupRadiusKm": 10,
        "deliveryRadiusKm": 10,
        "agreementSigned": True
    }
    onboard_resp = requests.post(f"{BASE_URL}/api/partner/onboarding", json=onboard_payload, headers=PARTNER_HEADERS, timeout=5)
    print(f"👉 Partner Onboarding response: {onboard_resp.status_code}")
    assert onboard_resp.status_code == 200, f"Onboarding failed: {onboard_resp.text}"

    # 5. Test Partner Status Flow
    print("\n--- Testing Partner Online/Offline API & DB Engine ---")
    
    # Toggle Partner Online
    partner_toggle_on = requests.post(f"{BASE_URL}/api/partner/status", json={"isOnline": True, "isStoreOpen": True}, headers=PARTNER_HEADERS, timeout=5)
    print(f"👉 Partner Toggle ON response: {partner_toggle_on.status_code} - {partner_toggle_on.json()}")
    assert partner_toggle_on.status_code == 200
    assert partner_toggle_on.json().get("isOnline") is True
    assert partner_toggle_on.json().get("isStoreOpen") is True

    # Get Partner Status
    partner_status_on = requests.get(f"{BASE_URL}/api/partner/status", headers=PARTNER_HEADERS, timeout=5)
    print(f"👉 Partner Status ON check: {partner_status_on.status_code} - {partner_status_on.json()}")
    assert partner_status_on.status_code == 200
    assert partner_status_on.json().get("isOnline") is True

    await asyncio.sleep(0.5)

    # Toggle Partner Offline
    partner_toggle_off = requests.post(f"{BASE_URL}/api/partner/status", json={"isOnline": False, "isStoreOpen": False}, headers=PARTNER_HEADERS, timeout=5)
    print(f"👉 Partner Toggle OFF response: {partner_toggle_off.status_code} - {partner_toggle_off.json()}")
    assert partner_toggle_off.status_code == 200
    assert partner_toggle_off.json().get("isOnline") is False
    assert partner_toggle_off.json().get("isStoreOpen") is False

    # Get Partner Status Offline
    partner_status_off = requests.get(f"{BASE_URL}/api/partner/status", headers=PARTNER_HEADERS, timeout=5)
    print(f"👉 Partner Status OFF check: {partner_status_off.status_code} - {partner_status_off.json()}")
    assert partner_status_off.status_code == 200
    assert partner_status_off.json().get("isOnline") is False

    await asyncio.sleep(0.5)

    # 6. Live Map Verification
    print("\n--- Testing Live Map Telemetry Engine ---")
    maps_live = requests.get(f"{BASE_URL}/api/maps/live", timeout=5)
    print(f"👉 Live Map status: {maps_live.status_code}, telemetry units: {len(maps_live.json().get('telemetry', []))}")
    assert maps_live.status_code == 200

    # Wait briefly for socket events
    await asyncio.sleep(1.0)
    print(f"\n🎉 Total Realtime Socket.IO Events captured: {len(received_events)}")
    for ev, data in received_events:
        print(f"   ✓ {ev} -> {data}")

    assert len(received_events) >= 4, f"Expected at least 4 live Socket.IO events, got {len(received_events)}"

    if sio.connected:
        await sio.disconnect()

    print("\n✨ ALL INTEGRATION TESTS PASSED 100%! Unified Online/Offline Engine is Real-Time and Live across DB, API & WebSockets.")
    return True

if __name__ == "__main__":
    asyncio.run(main())
