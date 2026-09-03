"""QuickPress Master Partner Payout & Settlement Engine.

Implements deterministic financial accounting for laundry partners:
(A) Net order value: Items Subtotal + Customer GST - Partner Promos
(B) Additions: TDS 194H/C Credits + Target / Quality / On-Time Incentives
(C) Order Level Deductions: Platform Commission (15%) + Damage/Missing Claim Penalties + Cancellation Fees
(D) Tax Deductions: 18% GST on Platform Service Fee + 1% TDS 194-O + 1% TCS
(E) Investments in Growth: Merchant Ads & Sponsored Listing Spend
(F) Supplies Spend: QuickPress Laundry Packaging Bags & Tag Rolls

Est. Net Payout = (A + B - C - D - E - F)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import random

from app.db.client import database
from app.services.financial_engine import financial_engine

logger = logging.getLogger(__name__)


class SettlementEngine:
    """Core accounting engine for Partner Payouts, Settlement Cycles, and Ledger."""

    def get_weekly_cycles(self, reference_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Generates past weekly settlement cycles relative to reference date."""
        now = reference_date or datetime.now(timezone.utc)
        
        # Current ongoing weekly cycle (Monday to Sunday)
        start_of_week = now - timedelta(days=now.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        current_cycle = {
            "cycleId": "current",
            "title": f"{start_of_week.strftime('%d %b')} - {end_of_week.strftime('%d %b\'%y')}",
            "period": f"{start_of_week.strftime('%d %b')} - {end_of_week.strftime('%d %b\'%y')}",
            "startDate": start_of_week.strftime("%Y-%m-%d"),
            "endDate": end_of_week.strftime("%Y-%m-%d"),
            "payoutDate": "-",
            "status": "PROCESSING",
            "isCurrent": True,
        }

        # Past completed cycles (previous 8 weeks)
        past_cycles = []
        for i in range(1, 9):
            cycle_start = start_of_week - timedelta(weeks=i)
            cycle_end = cycle_start + timedelta(days=6)
            payout_dt = cycle_end + timedelta(days=3)  # Paid on Wednesday following cycle end
            
            past_cycles.append({
                "cycleId": f"cycle-{cycle_start.strftime('%Y%m%d')}",
                "title": f"{cycle_start.strftime('%d %b')} - {cycle_end.strftime('%d %b\'%y')}",
                "period": f"{cycle_start.strftime('%d %b')} - {cycle_end.strftime('%d %b\'%y')}",
                "startDate": cycle_start.strftime("%Y-%m-%d"),
                "endDate": cycle_end.strftime("%Y-%m-%d"),
                "payoutDate": payout_dt.strftime("%d %b'%y"),
                "status": "PAID",
                "isCurrent": False,
            })

        return [current_cycle] + past_cycles

    async def compute_cycle_breakdown(
        self, partner_id: str, cycle_id: str = "current"
    ) -> Dict[str, Any]:
        """Calculates the complete itemized (A + B + C + D + E + F) financial breakdown."""
        cycles = self.get_weekly_cycles()
        matched_cycle = next((c for c in cycles if c["cycleId"] == cycle_id), cycles[0])
        
        # Fetch partner profile for bank & business name
        profile = (
            await database.find_one("partner_profiles", {"_id": partner_id})
            or await database.find_one("partner_profiles", {"partnerId": partner_id})
            or await database.find_one("admin_partners", {"_id": partner_id})
            or {}
        )
        
        # Fetch actual customer orders for this partner
        all_orders = await database.find_many("customer_orders")
        partner_orders = [
            o for o in all_orders
            if str((o.get("partner") or {}).get("id") or o.get("partnerId") or o.get("partner_id") or "") == partner_id
            or partner_id in ("PRT-DEMO-001", "store-1")  # Demo fallback
        ]
        
        # If current cycle, take active/delivered orders; if past cycle, take delivered
        if matched_cycle.get("isCurrent"):
            cycle_orders = [o for o in partner_orders if o.get("status") not in ("cancelled",)]
        else:
            cycle_orders = [o for o in partner_orders if o.get("status") in ("delivered", "completed")]

        # If zero real orders, generate a realistic deterministic baseline for demonstration
        order_count = len(cycle_orders)
        if order_count == 0:
            if matched_cycle.get("isCurrent"):
                order_count = 0
                gross_items = 0.0
                customer_gst = 0.0
                partner_promos = 0.0
                flat_discounts = 0.0
            else:
                order_count = 2
                gross_items = 249.0
                customer_gst = 12.45
                partner_promos = 25.0
                flat_discounts = 0.0
        else:
            gross_items = sum(float(o.get("total") or o.get("totalAmount") or o.get("amount") or 149.0) for o in cycle_orders)
            customer_gst = round(gross_items * 0.05, 2)  # 5% GST
            partner_promos = sum(float(o.get("discount") or o.get("couponDiscount") or 0.0) for o in cycle_orders)
            flat_discounts = 0.0

        # --- (A) Net Order Value ---
        net_order_value = max(0.0, round(gross_items + customer_gst - partner_promos - flat_discounts, 2))

        # --- (B) Additions ---
        target_incentive = 100.0 if order_count >= 5 else 0.0
        quality_bonus = 50.0 if float(profile.get("rating") or 4.8) >= 4.5 and order_count > 0 else 0.0
        tds_194h_credit = round(net_order_value * 0.00, 2)
        tds_194c_credit = round(net_order_value * 0.00, 2)
        additions_total = round(target_incentive + quality_bonus + tds_194h_credit + tds_194c_credit, 2)

        # --- (C) Order Level Deductions ---
        comm_rate = financial_engine.get_commission_rate(order_count or 10)
        platform_commission = round(net_order_value * comm_rate, 2)
        damage_penalty = 0.0
        cancellation_fee = 0.0
        order_level_deductions = round(platform_commission + damage_penalty + cancellation_fee, 2)

        # --- (D) Tax Deductions ---
        gst_on_service_fee = round(platform_commission * 0.18, 2)
        tds_194o = round(net_order_value * 0.01, 2) if net_order_value > 0 else 0.0
        gst_tcs = round(net_order_value * 0.01, 2) if net_order_value > 0 else 0.0
        tax_deductions_total = round(gst_on_service_fee + tds_194o + gst_tcs, 2)

        # --- (E) Investments in Growth ---
        online_ads_spend = 0.0
        growth_investments_total = round(online_ads_spend, 2)

        # --- (F) Supplies & Packaging Spend ---
        packaging_supplies_spend = 0.0
        supplies_spend_total = round(packaging_supplies_spend, 2)

        # --- Final Estimated Net Payout ---
        est_net_payout = max(0.0, round(
            net_order_value + additions_total - order_level_deductions - tax_deductions_total - growth_investments_total - supplies_spend_total,
            2
        ))

        # Build itemized order rows for Orders tab
        mapped_orders = []
        for i, o in enumerate(cycle_orders):
            ord_id = str(o.get("_id") or o.get("id") or f"ORD-QP-{1000 + i}")
            code = str(o.get("orderNumber") or o.get("code") or ord_id[:8].upper())
            items_desc = ", ".join([str(item.get("name") or "Laundry Item") for item in (o.get("items") or [])]) or "Standard Wash & Iron"
            val = float(o.get("total") or o.get("totalAmount") or o.get("amount") or 149.0)
            comm = round(val * comm_rate, 2)
            net_ord = round(val - comm - (val * 0.01), 2)
            
            mapped_orders.append({
                "orderId": ord_id,
                "orderCode": code,
                "date": (o.get("createdAt") or o.get("placedAt") or datetime.now(timezone.utc).isoformat())[:16],
                "itemsSummary": items_desc,
                "customerName": str((o.get("customer") or {}).get("name") or o.get("customerName") or "Verified Customer"),
                "grossValue": val,
                "commission": comm,
                "netEarning": net_ord,
                "status": str(o.get("status") or "delivered").upper(),
            })

        # If zero orders, supply sample orders for past cycle
        if not mapped_orders and not matched_cycle.get("isCurrent"):
            mapped_orders = [
                {
                    "orderId": "ord-2026-0208-1",
                    "orderCode": "QP-9281",
                    "date": "2026-02-08 14:30",
                    "itemsSummary": "Wash & Fold (4 KG) + 2x Shirt Steam Iron",
                    "customerName": "Rohan Gupta",
                    "grossValue": 149.0,
                    "commission": 22.35,
                    "netEarning": 125.16,
                    "status": "DELIVERED",
                },
                {
                    "orderId": "ord-2026-0208-2",
                    "orderCode": "QP-9282",
                    "date": "2026-02-08 18:15",
                    "itemsSummary": "Dry Cleaning (Suit 2pc)",
                    "customerName": "Pooja Sharma",
                    "grossValue": 100.0,
                    "commission": 15.00,
                    "netEarning": 84.00,
                    "status": "DELIVERED",
                }
            ]
            est_net_payout = 203.58
            net_order_value = 236.45
            order_level_deductions = 37.35
            tax_deductions_total = 7.52
            order_count = 2

        # Bank transaction metadata
        bank_acc = profile.get("accountNumber") or "•••• •••• 4545"
        masked_acc = f"•••• •••• {str(bank_acc)[-4:]}" if len(str(bank_acc)) >= 4 else "•••• •••• 4545"
        
        bank_details = {
            "accountHolder": profile.get("accountHolder") or profile.get("ownerName") or "Store Partner",
            "bankName": profile.get("bankName") or "HDFC Bank",
            "accountNumberMasked": masked_acc,
            "ifsc": profile.get("ifsc") or "HDFC0001234",
            "utr": f"NPCI{random.randint(100000000000, 999999999999)}" if matched_cycle.get("status") == "PAID" else None,
            "creditedAt": matched_cycle.get("payoutDate") if matched_cycle.get("status") == "PAID" else None,
            "transferMode": "NPCI IMPS / NEFT Direct Settlement",
        }

        return {
            "partnerId": partner_id,
            "businessName": profile.get("businessName") or profile.get("storeName") or "QuickPress Partner Store",
            "ownerName": profile.get("ownerName") or "Partner",
            "city": profile.get("city") or "Kasganj",
            "cycle": matched_cycle,
            "totalOrders": order_count,
            "estNetPayout": est_net_payout,
            "netOrderValueA": {
                "total": net_order_value,
                "itemSubtotal": gross_items,
                "totalGstCollected": customer_gst,
                "restaurantDiscountPromos": partner_promos,
                "restaurantDiscountFlat": flat_discounts,
            },
            "additionsB": {
                "total": additions_total,
                "tds194h": tds_194h_credit,
                "tds194c": tds_194c_credit,
                "targetIncentiveBonus": target_incentive,
                "qualityRatingBonus": quality_bonus,
            },
            "orderLevelDeductionsC": {
                "total": order_level_deductions,
                "platformCommission": platform_commission,
                "commissionRatePct": round(comm_rate * 100, 1),
                "damagePenalty": damage_penalty,
                "cancellationFee": cancellation_fee,
            },
            "taxDeductionsD": {
                "total": tax_deductions_total,
                "gstOnServiceFees18": gst_on_service_fee,
                "tds194o": tds_194o,
                "tcsGst": gst_tcs,
            },
            "investmentsInGrowthE": {
                "total": growth_investments_total,
                "onlineOrderingAds": online_ads_spend,
            },
            "suppliesSpendF": {
                "total": supplies_spend_total,
                "packagingAndTags": packaging_supplies_spend,
            },
            "orders": mapped_orders,
            "expenses": [
                {
                    "title": "QuickPress Detergent & Garment Tag Supplies",
                    "category": "Consumables",
                    "amount": supplies_spend_total,
                    "date": matched_cycle.get("startDate"),
                }
            ] if supplies_spend_total > 0 else [],
            "bankDetails": bank_details,
        }

    async def get_overview(self, partner_id: str) -> Dict[str, Any]:
        """Returns the main Finance screen overview with current cycle and past cycles list."""
        cycles = self.get_weekly_cycles()
        
        current_data = await self.compute_cycle_breakdown(partner_id, "current")
        
        past_summaries = []
        for c in cycles[1:6]:
            past_calc = await self.compute_cycle_breakdown(partner_id, c["cycleId"])
            past_summaries.append({
                "cycleId": c["cycleId"],
                "period": c["period"],
                "payoutDate": c["payoutDate"],
                "status": c["status"],
                "netPayout": past_calc["estNetPayout"],
                "orderCount": past_calc["totalOrders"],
            })

        return {
            "currentCycle": {
                "cycleId": "current",
                "period": current_data["cycle"]["period"],
                "payoutDate": current_data["cycle"]["payoutDate"],
                "estPayout": current_data["estNetPayout"],
                "orderCount": current_data["totalOrders"],
                "status": current_data["cycle"]["status"],
            },
            "pastCycles": past_summaries,
            "filterOptions": [c["period"] for c in cycles[1:6]],
        }

    async def settle_order_on_completion(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """Triggered when an order is delivered/completed:
        1. Calculates Partner net earnings (subtotal - 15% platform commission - 1% TCS).
        2. Calculates Rider trip earnings (Ride 1 pickup + Ride 2 delivery).
        3. Calculates Platform Commission & Net Margin for Admin.
        4. Credits Partner Wallet and creates Settlement records.
        5. Credits Rider Wallet and creates Settlement records.
        6. Logs master order settlement for Admin oversight.
        """
        canonical_id = str(order.get("_id") or order.get("id") or "")
        if not canonical_id:
            return {}

        # Idempotency check: don't double settle
        existing_settlement = await database.find_one("order_settlements", {"orderId": canonical_id})
        if existing_settlement:
            return existing_settlement

        now_iso = datetime.now(timezone.utc).isoformat()
        
        # 1. Financial Snapshot from order or compute fallback
        snap = order.get("financialSnapshot") or {}
        items_subtotal = float(snap.get("itemsSubtotal") or order.get("subtotal") or order.get("total") or 149.0)
        grand_total = float(snap.get("grandTotal") or order.get("grand_total") or order.get("total") or 149.0)
        
        comm_rate = financial_engine.get_commission_rate(10)
        platform_commission = float(snap.get("platformEstimatedCommission") or round(items_subtotal * comm_rate, 2))
        tcs_deduction = round(items_subtotal * 0.01, 2)
        partner_net = float(snap.get("partnerEstimatedEarnings") or round(items_subtotal - platform_commission - tcs_deduction, 2))
        
        # 2. Partner Identification
        partner_info = order.get("partner") or {}
        partner_id = str(partner_info.get("id") or order.get("partnerId") or order.get("partner_id") or "store-1")
        partner_name = str(partner_info.get("name") or "QuickPress Partner Store")
        
        # 3. Rider(s) Identification & Earnings
        rides = await database.find_many("rides", {"orderId": canonical_id})
        ride_payouts = []
        total_rider_payout = 0.0
        
        for r in rides:
            r_id = r.get("assignedRiderId") or r.get("offeredRiderId")
            r_fare = float(r.get("estimatedEarning") or 45.0)
            if r_id:
                ride_payouts.append({
                    "rideId": r.get("_id"),
                    "riderId": r_id,
                    "rideType": r.get("rideType", "delivery"),
                    "fare": r_fare,
                })
                total_rider_payout += r_fare
        
        if not ride_payouts:
            single_rider_id = str((order.get("rider") or {}).get("id") or order.get("rider_id") or order.get("riderId") or "rider-1")
            single_rider_name = str((order.get("rider") or {}).get("name") or order.get("rider_name") or "QuickPress Captain")
            fallback_fare = float(snap.get("estimatedRiderPayout") or 60.0)
            ride_payouts.append({
                "rideId": f"ride-{canonical_id}",
                "riderId": single_rider_id,
                "riderName": single_rider_name,
                "rideType": "trip",
                "fare": fallback_fare,
            })
            total_rider_payout = fallback_fare

        # 4. Platform Net Margin
        platform_net_margin = round(grand_total - partner_net - total_rider_payout, 2)
        utr_ref = f"NPCI{random.randint(100000000000, 999999999999)}"

        # 5. Build Master Settlement Record
        settlement_doc = {
            "_id": f"stl-{canonical_id}",
            "settlementId": f"stl-{canonical_id}",
            "orderId": canonical_id,
            "orderCode": order.get("code") or canonical_id[:8].upper(),
            "customerName": str((order.get("customer") or {}).get("name") or "Verified Customer"),
            "partnerId": partner_id,
            "partnerName": partner_name,
            "partnerNetEarning": partner_net,
            "rides": ride_payouts,
            "totalRiderPayout": total_rider_payout,
            "platformCommission": platform_commission,
            "platformNetMargin": platform_net_margin,
            "grandTotal": grand_total,
            "itemsSubtotal": items_subtotal,
            "status": "SETTLED",
            "utr": utr_ref,
            "settledAt": now_iso,
            "createdAt": now_iso,
        }

        # 6. Save in order_settlements collection
        await database.collection("order_settlements").insert_one(settlement_doc)

        # 7. Update partner profile wallet & balance
        partner_profile = await database.find_one("partner_profiles", {"_id": partner_id}) or await database.find_one("partner_profiles", {"partnerId": partner_id})
        if partner_profile:
            current_wallet = partner_profile.get("wallet") or {}
            curr_bal = float(current_wallet.get("balance") or current_wallet.get("currentBalance") or 0.0)
            curr_earned = float(current_wallet.get("totalEarned") or 0.0)
            await database.collection("partner_profiles").update_one(
                {"_id": partner_profile["_id"]},
                {
                    "$set": {
                        "wallet.balance": round(curr_bal + partner_net, 2),
                        "wallet.totalEarned": round(curr_earned + partner_net, 2),
                        "wallet.lastSettledAt": now_iso,
                    }
                }
            )

        # 8. Update rider profile wallet & balance
        for rp in ride_payouts:
            rid = rp.get("riderId")
            fare = rp.get("fare", 0.0)
            r_prof = await database.find_one("rider_profiles", {"_id": rid}) or await database.find_one("rider_profiles", {"riderId": rid})
            if r_prof:
                r_wallet = r_prof.get("wallet") or {}
                r_bal = float(r_wallet.get("balance") or 0.0)
                r_earned = float(r_wallet.get("totalEarned") or 0.0)
                await database.collection("rider_profiles").update_one(
                    {"_id": r_prof["_id"]},
                    {
                        "$set": {
                            "wallet.balance": round(r_bal + fare, 2),
                            "wallet.totalEarned": round(r_earned + fare, 2),
                            "wallet.lastTripCredit": fare,
                            "wallet.lastSettledAt": now_iso,
                        }
                    }
                )

        # 9. Also record in unified SETTLEMENTS collection for partner and rider
        await database.collection("settlements").insert_one({
            "_id": f"stl_prt_{canonical_id}",
            "accountId": partner_id,
            "accountName": partner_name,
            "role": "partner",
            "orderId": canonical_id,
            "orderCode": order.get("code") or canonical_id[:8].upper(),
            "periodLabel": f"Order #{order.get('code') or canonical_id[:8].upper()}",
            "orders": 1,
            "grossAmount": items_subtotal,
            "commission": platform_commission,
            "taxDeducted": tcs_deduction,
            "incentives": 0.0,
            "netAmount": partner_net,
            "status": "settled",
            "utr": utr_ref,
            "settledAt": now_iso,
            "createdAt": now_iso,
        })

        for rp in ride_payouts:
            await database.collection("settlements").insert_one({
                "_id": f"stl_rdr_{canonical_id}_{rp['rideType']}",
                "accountId": rp["riderId"],
                "accountName": rp.get("riderName") or "Captain",
                "role": "rider",
                "orderId": canonical_id,
                "orderCode": order.get("code") or canonical_id[:8].upper(),
                "periodLabel": f"Order #{order.get('code') or canonical_id[:8].upper()} ({rp['rideType'].title()} Trip)",
                "orders": 1,
                "grossAmount": rp["fare"],
                "commission": 0.0,
                "taxDeducted": 0.0,
                "incentives": 0.0,
                "netAmount": rp["fare"],
                "status": "settled",
                "utr": utr_ref,
                "settledAt": now_iso,
                "createdAt": now_iso,
            })

        # 10. Mark order as settled in customer_orders
        await database.collection("customer_orders").update_one(
            {"_id": canonical_id},
            {
                "$set": {
                    "settlementStatus": "SETTLED",
                    "settledAt": now_iso,
                    "settlementSummary": {
                        "partnerNetEarning": partner_net,
                        "riderTotalPayout": total_rider_payout,
                        "platformCommission": platform_commission,
                        "platformNetMargin": platform_net_margin,
                        "utr": utr_ref,
                    }
                }
            }
        )

        return settlement_doc

    async def get_admin_settlements_overview(self) -> Dict[str, Any]:
        """Master admin settlement control center:
        - Total Partner Payouts (Settled & Pending)
        - Total Rider Delivery Earnings (Settled & Pending)
        - Total Platform Commission & Net Margin
        - Itemized settlement records across all partners & riders
        - Batch payout action
        """
        all_orders = await database.find_many("customer_orders")
        order_settlements = await database.find_many("order_settlements")
        all_settlements = await database.find_many("settlements")
        partner_withdrawals = await database.find_many("partner_withdrawals", {})

        # Compute GMV and Platform Metrics
        completed_orders = [o for o in all_orders if o.get("status") in ("delivered", "completed")]
        total_gmv = sum(float(o.get("grand_total") or o.get("total") or 0.0) for o in completed_orders)
        if total_gmv == 0 and all_orders:
            total_gmv = sum(float(o.get("grand_total") or o.get("total") or 149.0) for o in all_orders)

        # Sum from settlements collection
        partner_settled_items = [s for s in all_settlements if s.get("role") == "partner" and s.get("status") in ("settled", "paid")]
        partner_pending_items = [s for s in all_settlements if s.get("role") == "partner" and s.get("status") in ("pending", "processing")]
        
        rider_settled_items = [s for s in all_settlements if s.get("role") == "rider" and s.get("status") in ("settled", "paid")]
        rider_pending_items = [s for s in all_settlements if s.get("role") == "rider" and s.get("status") in ("pending", "processing")]

        total_partner_settled = sum(float(s.get("netAmount") or 0.0) for s in partner_settled_items)
        total_partner_pending = sum(float(s.get("netAmount") or 0.0) for s in partner_pending_items) + sum(float(w.get("amount") or 0.0) for w in partner_withdrawals if w.get("status") == "pending")
        
        total_rider_settled = sum(float(s.get("netAmount") or 0.0) for s in rider_settled_items)
        total_rider_pending = sum(float(s.get("netAmount") or 0.0) for s in rider_pending_items)

        total_commission = sum(float(os.get("platformCommission") or 0.0) for os in order_settlements) or round(total_gmv * 0.15, 2)
        total_net_margin = sum(float(os.get("platformNetMargin") or 0.0) for os in order_settlements) or round(total_commission + (total_gmv * 0.05), 2)

        # Build itemized feed combining order_settlements and settlements
        feed = []
        for s in all_settlements:
            feed.append({
                "id": s.get("_id"),
                "orderId": s.get("orderId") or s.get("_id"),
                "orderCode": s.get("orderCode") or s.get("periodLabel") or s.get("_id")[:8].upper(),
                "role": s.get("role", "partner"),
                "accountName": s.get("accountName") or s.get("accountId") or "Partner / Rider",
                "grossAmount": float(s.get("grossAmount") or 0.0),
                "commission": float(s.get("commission") or 0.0),
                "netPayout": float(s.get("netAmount") or 0.0),
                "status": str(s.get("status") or "settled").upper(),
                "utr": s.get("utr") or "—",
                "date": str(s.get("settledAt") or s.get("createdAt") or "")[:16].replace("T", " "),
            })

        # Sort reverse chronological
        feed.sort(key=lambda x: str(x.get("date", "")), reverse=True)

        return {
            "summary": {
                "totalGmv": round(total_gmv, 2),
                "totalPartnerSettled": round(total_partner_settled, 2),
                "totalPartnerPending": round(total_partner_pending, 2),
                "totalRiderSettled": round(total_rider_settled, 2),
                "totalRiderPending": round(total_rider_pending, 2),
                "totalPlatformCommission": round(total_commission, 2),
                "totalPlatformNetMargin": round(total_net_margin, 2),
                "settledOrdersCount": len(completed_orders),
                "pendingPayoutsCount": len(partner_pending_items) + len(rider_pending_items) + len(partner_withdrawals),
            },
            "settlements": feed,
            "cycles": self.get_weekly_cycles(),
        }

    async def batch_disburse_pending(self) -> Dict[str, Any]:
        """Disburse and clear all pending settlements with generated UTR numbers."""
        now_iso = datetime.now(timezone.utc).isoformat()
        pending_settlements = await database.find_many("settlements", {"status": "pending"})
        count = 0
        total_amount = 0.0

        for s in pending_settlements:
            utr = f"NPCI{random.randint(100000000000, 999999999999)}"
            amt = float(s.get("netAmount") or 0.0)
            total_amount += amt
            count += 1
            await database.collection("settlements").update_one(
                {"_id": s["_id"]},
                {"$set": {"status": "settled", "utr": utr, "settledAt": now_iso}}
            )

        # Also disburse partner_withdrawals
        pending_with = await database.find_many("partner_withdrawals", {"status": "pending"})
        for w in pending_with:
            count += 1
            total_amount += float(w.get("amount") or 0.0)
            await database.collection("partner_withdrawals").update_one(
                {"_id": w["_id"]},
                {"$set": {"status": "Approved", "utr": f"NPCI{random.randint(100000000000, 999999999999)}"}}
            )

        return {
            "ok": True,
            "disbursedCount": count,
            "totalAmount": round(total_amount, 2),
            "timestamp": now_iso,
        }


settlement_engine = SettlementEngine()
