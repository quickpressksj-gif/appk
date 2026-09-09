"""Automated Unit & Integration Test for Partner Dispatch OTP Handover Enforcement.

Validates that:
1. Dispatch OTP must be exactly 4 digits numeric.
2. Missing or wrong Dispatch OTP is rejected with remaining attempts count.
3. Partner CANNOT handover clean laundry to Captain without entering correct Dispatch OTP.
4. Correct Dispatch OTP transitions order to OUT_FOR_DELIVERY, transfers custody to Rider, and marks dispatchOtpVerified=True.
5. Re-using verified OTP is blocked.
6. Customer Doorstep Delivery OTP is blocked if order was not handed over via Dispatch OTP.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch

from app.services.smart_2ride_engine import smart_2ride_engine
from app.services import order_lifecycle as lifecycle


@pytest.mark.asyncio
async def test_dispatch_otp_format_validation():
    """Verify that non-4-digit or non-numeric Dispatch OTPs are rejected immediately."""
    with pytest.raises(ValueError, match="valid 4-digit numeric Dispatch OTP"):
        await smart_2ride_engine.verify_partner_dispatch_otp("ord-test-1", "12", "prt-1")

    with pytest.raises(ValueError, match="valid 4-digit numeric Dispatch OTP"):
        await smart_2ride_engine.verify_partner_dispatch_otp("ord-test-1", "abcd", "prt-1")

    with pytest.raises(ValueError, match="valid 4-digit numeric Dispatch OTP"):
        await smart_2ride_engine.verify_partner_dispatch_otp("ord-test-1", "", "prt-1")


@pytest.mark.asyncio
async def test_dispatch_otp_wrong_code_rejected():
    """Verify that entering the wrong Dispatch OTP increments attempts and raises PermissionError."""
    fake_order = {
        "_id": "ord-test-wrong-otp",
        "status": lifecycle.READY_FOR_DELIVERY,
        "otp": {
            "dispatch": {
                "code": "5387",
                "attempts": 0,
                "maxAttempts": 5,
                "verified": False,
            }
        },
        "assignedRiderId": "rdr-1",
        "partnerId": "prt-1",
    }

    with patch("app.services.order_lifecycle.find_order", new=AsyncMock(return_value=fake_order)):
        with pytest.raises(PermissionError, match="Invalid Partner Dispatch OTP"):
            await smart_2ride_engine.verify_partner_dispatch_otp(
                "ord-test-wrong-otp", "9999", "prt-1"
            )

    # Verify attempt was incremented
    assert fake_order["otp"]["dispatch"]["attempts"] == 1
    assert fake_order["otp"]["dispatch"]["verified"] is False


@pytest.mark.asyncio
async def test_dispatch_otp_correct_handover_success():
    """Verify that entering the valid Dispatch OTP transitions order to OUT_FOR_DELIVERY."""
    fake_order = {
        "_id": "ord-test-success",
        "status": lifecycle.READY_FOR_DELIVERY,
        "otp": {
            "dispatch": {
                "code": "5387",
                "attempts": 0,
                "maxAttempts": 5,
                "verified": False,
            }
        },
        "assignedRiderId": "rdr-1",
        "partnerId": "prt-1",
        "code": "QP-5387",
    }

    mock_update_one = AsyncMock()
    mock_record_event = AsyncMock()
    mock_broadcast = AsyncMock()

    with patch("app.services.order_lifecycle.find_order", new=AsyncMock(return_value=fake_order)), \
         patch("app.db.client.database.collection") as mock_col, \
         patch("app.services.order_lifecycle.record_event", new=mock_record_event), \
         patch("app.services.smart_2ride_engine.broadcast_order_event", new=mock_broadcast), \
         patch("app.services.partner_activity_logger.log_partner_activity", new=AsyncMock()):

        mock_col.return_value.update_one = mock_update_one

        res = await smart_2ride_engine.verify_partner_dispatch_otp(
            "ord-test-success", "5387", "prt-1"
        )

        assert res["ok"] is True
        assert res["status"] == lifecycle.OUT_FOR_DELIVERY
        assert res["dispatchedTo"] == "rdr-1"
        assert fake_order["otp"]["dispatch"]["verified"] is True

        # Verify DB updates were called with OUT_FOR_DELIVERY and custody="rider"
        assert mock_update_one.called
        update_call_args = mock_update_one.call_args_list[0][0][1]["$set"]
        assert update_call_args["status"] == lifecycle.OUT_FOR_DELIVERY
        assert update_call_args["dispatchOtpVerified"] is True
        assert update_call_args["custody"] == "rider"


@pytest.mark.asyncio
async def test_dispatch_otp_re_use_blocked():
    """Verify that an already verified Dispatch OTP cannot be reused."""
    fake_order = {
        "_id": "ord-test-reused",
        "status": lifecycle.OUT_FOR_DELIVERY,
        "otp": {
            "dispatch": {
                "code": "5387",
                "attempts": 0,
                "maxAttempts": 5,
                "verified": True,
            }
        },
        "assignedRiderId": "rdr-1",
        "partnerId": "prt-1",
    }

    with patch("app.services.order_lifecycle.find_order", new=AsyncMock(return_value=fake_order)):
        with pytest.raises(ValueError, match="already been verified and used"):
            await smart_2ride_engine.verify_partner_dispatch_otp(
                "ord-test-reused", "5387", "prt-1"
            )


@pytest.mark.asyncio
async def test_doorstep_delivery_requires_dispatch_otp_verification():
    """Verify that doorstep delivery OTP is blocked if order has not completed dispatch OTP handover."""
    fake_order = {
        "_id": "ord-test-premature-delivery",
        "status": lifecycle.READY_FOR_DELIVERY,
        "dispatchOtpVerified": False,
        "otp": {
            "dispatch": {"code": "5387", "verified": False},
            "delivery": {"code": "7291", "verified": False, "attempts": 0, "maxAttempts": 5},
        },
        "assignedRiderId": "rdr-1",
    }

    with patch("app.services.order_lifecycle.find_order", new=AsyncMock(return_value=fake_order)):
        with pytest.raises(PermissionError, match="not been handed over from partner store with Dispatch OTP"):
            await smart_2ride_engine.verify_delivery_otp(
                "ord-test-premature-delivery", "7291", "rdr-1"
            )
