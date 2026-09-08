"""Automated Integration Test for 360-Degree Mutual Review & Rating Engine.
Validates:
1. Customer rates Partner Store (5 stars) & Captain (5 stars).
2. Partner Store rates Captain (5 stars) & Customer (5 stars).
3. Captain rates Customer (5 stars) & Partner Store (5 stars).
4. Real-time aggregate recalculation across partner_profiles, rider_profiles, and users.
5. 360-degree review status retrieval (reviews-360).
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.client import database
from app.models.user import User, Role
from app.db.review_repositories import (
    SubmitReviewPayload,
    SubmitPartnerReviewPayload,
    SubmitRiderReviewPayload,
    review_repository,
)


async def run_tests():
    print("🚀 Running 360-Degree Mutual Review & Rating Engine Tests...")

    order_id = "test-ord-360-rev-001"
    user_id = "test-cust-360-01"
    partner_id = "test-part-360-01"
    rider_id = "test-rdr-360-01"

    # 0. Setup profiles & order in database
    await database.collection("users").update_one(
        {"_id": user_id},
        {"$set": {"_id": user_id, "id": user_id, "display_name": "Rohan Sharma", "phone": "+919111111111", "role": "customer"}},
        upsert=True,
    )

    await database.collection("partner_profiles").update_one(
        {"_id": partner_id},
        {"$set": {"_id": partner_id, "partnerId": partner_id, "storeName": "Super Clean Express", "rating": 5.0, "reviewsCount": 0}},
        upsert=True,
    )

    await database.collection("rider_profiles").update_one(
        {"_id": rider_id},
        {"$set": {"_id": rider_id, "riderId": rider_id, "fullName": "Captain Imran", "rating": 5.0, "ratingCount": 0}},
        upsert=True,
    )

    await database.collection("customer_orders").update_one(
        {"_id": order_id},
        {
            "$set": {
                "_id": order_id,
                "id": order_id,
                "code": "QP-360-001",
                "userId": user_id,
                "partnerId": partner_id,
                "assignedRiderId": rider_id,
                "status": "delivered",
                "isReviewed": False,
            }
        },
        upsert=True,
    )

    customer_user = User(id=user_id, role=Role.customer, phone="+919111111111", display_name="Rohan Sharma")

    # 1. Customer reviews Partner Store & Captain
    print("\n--- STEP 1: Customer Rates Partner Store & Delivery Captain ---")
    cust_payload = SubmitReviewPayload(
        storeRating=5,
        storeFeedback="Excellent steam iron and great fragrance!",
        storeTags=["Super Clean Wash", "Crisp Steam Iron"],
        riderRating=5,
        riderFeedback="Polite and super fast delivery!",
        riderTags=["On Time", "Polite Rider"],
        tipAmount=20,
    )
    cust_review = await review_repository.submit_review(order_id, customer_user, cust_payload)
    assert cust_review["storeRating"] == 5
    assert cust_review["riderRating"] == 5
    print("✓ Customer review saved successfully!")

    # Verify order flags
    order_doc = await database.find_one("customer_orders", {"_id": order_id})
    assert order_doc.get("customerReviewed") is True
    assert order_doc.get("storeRating") == 5
    assert order_doc.get("riderRating") == 5
    print("✓ Order document updated with customer review flags.")

    # 2. Partner Store reviews Captain & Customer
    print("\n--- STEP 2: Partner Store Rates Captain & Customer ---")
    part_payload = SubmitPartnerReviewPayload(
        riderRating=5,
        riderFeedback="Captain arrived on time and verified clothes properly.",
        riderTags=["Punctual Pickup", "Careful Handling"],
        customerRating=5,
        customerFeedback="Garments were well sorted and bag was ready.",
        customerTags=["Accurate Clothes Count", "Polite Customer"],
    )
    part_review = await review_repository.submit_partner_review(order_id, partner_id, part_payload)
    assert part_review["riderRating"] == 5
    assert part_review["customerRating"] == 5
    print("✓ Partner review saved successfully!")

    order_doc = await database.find_one("customer_orders", {"_id": order_id})
    assert order_doc.get("partnerReviewed") is True
    assert order_doc.get("partnerRiderRating") == 5
    assert order_doc.get("partnerCustomerRating") == 5
    print("✓ Order document updated with partner review flags.")

    # 3. Captain reviews Customer & Partner Store
    print("\n--- STEP 3: Captain Rates Customer & Partner Store ---")
    rdr_payload = SubmitRiderReviewPayload(
        customerRating=5,
        customerFeedback="Customer immediately shared delivery OTP, very smooth.",
        customerTags=["Quick OTP Share", "Polite Demeanor"],
        storeRating=5,
        storeFeedback="Clothes were nicely packed and handed over within 30 seconds.",
        storeTags=["Fast Handover", "Ready on Time"],
    )
    rdr_review = await review_repository.submit_rider_review(order_id, rider_id, rdr_payload)
    assert rdr_review["customerRating"] == 5
    assert rdr_review["storeRating"] == 5
    print("✓ Captain review saved successfully!")

    order_doc = await database.find_one("customer_orders", {"_id": order_id})
    assert order_doc.get("riderReviewed") is True
    assert order_doc.get("riderCustomerRating") == 5
    assert order_doc.get("riderStoreRating") == 5
    print("✓ Order document updated with rider review flags.")

    # 4. Verify 360-Degree Review Inquiry
    print("\n--- STEP 4: Verify 360-Degree Mutual Review Inquiry ---")
    reviews_360 = await review_repository.get_360_reviews_by_order(order_id)
    assert reviews_360["hasCustomerReview"] is True
    assert reviews_360["hasPartnerReview"] is True
    assert reviews_360["hasRiderReview"] is True
    assert reviews_360["mutualRatings"]["customerGaveStore"] == 5
    assert reviews_360["mutualRatings"]["customerGaveRider"] == 5
    assert reviews_360["mutualRatings"]["partnerGaveRider"] == 5
    assert reviews_360["mutualRatings"]["partnerGaveCustomer"] == 5
    assert reviews_360["mutualRatings"]["riderGaveCustomer"] == 5
    assert reviews_360["mutualRatings"]["riderGaveStore"] == 5
    print("✓ 360-Degree inquiry verified: All 3 parties exchanged 5-star ratings!")

    # 5. Verify Aggregate Recalculations
    print("\n--- STEP 5: Verify Real-Time Aggregate Recalculations ---")
    part_prof = await database.find_one("partner_profiles", {"_id": partner_id})
    assert part_prof.get("rating") == 5.0
    assert part_prof.get("customerRating") == 5.0
    assert part_prof.get("riderRating") == 5.0

    rdr_prof = await database.find_one("rider_profiles", {"_id": rider_id})
    assert rdr_prof.get("rating") == 5.0
    assert rdr_prof.get("customerRating") == 5.0
    assert rdr_prof.get("partnerRating") == 5.0

    user_prof = await database.find_one("users", {"_id": user_id})
    assert user_prof.get("rating") == 5.0
    assert user_prof.get("reviewsCount") >= 1
    print("✓ Real-time aggregates recalculated across Partner, Rider, and Customer profiles!")

    print("\n🎉 ALL 360-DEGREE REVIEW & RATING TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_tests())
