"""Tests for QuickPress Public Information Website APIs and Admin CMS."""

from __future__ import annotations

import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.db.repositories import users as user_repository
from app.main import create_app
from app.models.user import Role, User, UserStatus


async def _make_user(role: Role) -> User:
    return await user_repository.create(
        User(
            id=str(uuid.uuid4()),
            firebase_uid=f"uid-{uuid.uuid4().hex[:8]}",
            role=role,
            phone=f"+9190{uuid.uuid4().int % 100_000_000:08d}",
            email="admin@quickpress.test",
            display_name=f"Test {role.value}",
            photo_url=None,
            status=UserStatus.active,
            is_verified=True,
            is_onboarded=True,
        )
    )


def _token(user: User) -> str:
    token, _ = create_access_token(user.id, user.role.value)
    return token


def test_public_legal_doc_privacy_policy():
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/api/public/legal/privacy-policy")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug"] == "privacy-policy"
        assert "Privacy Policy" in data["title"]
        assert "currentVersion" in data
        assert "content" in data


def test_public_services_list_and_detail():
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/api/public/services")
        assert resp.status_code == 200
        services = resp.json()
        assert len(services) > 0
        slug = services[0]["slug"]

        detail_resp = client.get(f"/api/public/services/{slug}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["slug"] == slug
        assert "careInstructions" in detail
        assert "workflow" in detail


def test_public_cities_and_faqs():
    app = create_app()
    with TestClient(app) as client:
        # Cities
        resp = client.get("/api/public/cities")
        assert resp.status_code == 200
        cities = resp.json()
        assert len(cities) > 0

        # FAQs
        faq_resp = client.get("/api/public/faqs")
        assert faq_resp.status_code == 200
        faqs = faq_resp.json()
        assert len(faqs) > 0


def test_public_contact_submission():
    app = create_app()
    with TestClient(app) as client:
        payload = {
            "name": "Test User",
            "email": "testuser@example.com",
            "phone": "9876543210",
            "subject": "Laundry Inquiries",
            "message": "Hello, I want to know about your pickup services in Kasganj."
        }
        resp = client.post("/api/public/contact", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "id" in data


@pytest.mark.anyio
async def test_admin_cms_workflow():
    app = create_app()
    admin_user = await _make_user(Role.admin)
    admin_token = _token(admin_user)
    headers = {"Authorization": f"Bearer {admin_token}"}

    with TestClient(app) as client:
        # 1. CMS Dashboard
        dash_resp = client.get("/api/admin/website/dashboard", headers=headers)
        assert dash_resp.status_code == 200
        dash = dash_resp.json()
        assert dash["legalDocsCount"] >= 3

        # 2. Legal Save Draft
        draft_payload = {
            "title": "Privacy Policy Update",
            "summary": "Updated summary for QuickPress data policies.",
            "content": "# Updated QuickPress Privacy Policy\n\nNew terms and standards."
        }
        draft_resp = client.post("/api/admin/website/legal/privacy-policy/draft", json=draft_payload, headers=headers)
        assert draft_resp.status_code == 200
        assert draft_resp.json()["status"] == "draft"

        # 3. Legal Publish
        pub_resp = client.post(
            "/api/admin/website/legal/privacy-policy/publish",
            json={"changeLog": "Testing production publish flow"},
            headers=headers
        )
        assert pub_resp.status_code == 200
        assert pub_resp.json()["status"] == "published"

        # 4. Verify published document is immediately live on public endpoint
        public_resp = client.get("/api/public/legal/privacy-policy")
        assert public_resp.status_code == 200
        assert "New terms and standards" in public_resp.json()["content"]

        # 5. FAQ Management
        faq_payload = {
            "category": "Customer",
            "question": "Can I cancel anytime before pickup?",
            "answer": "Yes, cancellations before pickup are 100% free.",
            "sortOrder": 99,
            "isPublished": True
        }
        faq_resp = client.post("/api/admin/website/faqs", json=faq_payload, headers=headers)
        assert faq_resp.status_code == 200
        faq_id = faq_resp.json()["id"]

        # Delete test FAQ
        del_resp = client.delete(f"/api/admin/website/faqs/{faq_id}", headers=headers)
        assert del_resp.status_code == 200
