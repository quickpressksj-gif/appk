"""P0 regression — every /api/admin/* endpoint is admin-only.

Before this guard existed the admin router only depended on `current_user`
(authentication), so any signed-in customer could read the whole admin panel:
orders, customers, partners, riders, wallet ledgers and settings.
"""

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
            email=None,
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


@pytest.fixture()
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


def _admin_get_paths(client: TestClient) -> list[str]:
    spec = client.get("/openapi.json").json()
    return [
        path
        for path, operations in sorted(spec["paths"].items())
        if path.startswith("/api/admin") and "{" not in path and "get" in operations
    ]


def test_every_admin_get_route_rejects_non_admin_roles(client):
    import anyio

    paths = _admin_get_paths(client)
    assert paths, "no admin routes discovered — the admin router is not mounted"

    for role in (Role.customer, Role.partner, Role.rider):
        user = anyio.run(_make_user, role)
        headers = {"Authorization": f"Bearer {_token(user)}"}
        for path in paths:
            response = client.get(path, headers=headers)
            assert response.status_code == 403, f"{role.value} reached {path}"


def test_every_admin_get_route_rejects_anonymous(client):
    for path in _admin_get_paths(client):
        assert client.get(path).status_code == 401, path


def test_admin_role_still_has_access(client):
    import anyio

    admin = anyio.run(_make_user, Role.admin)
    headers = {"Authorization": f"Bearer {_token(admin)}"}
    for path in _admin_get_paths(client):
        assert client.get(path, headers=headers).status_code == 200, path


def test_admin_mutations_reject_non_admin(client):
    import anyio

    customer = anyio.run(_make_user, Role.customer)
    headers = {"Authorization": f"Bearer {_token(customer)}"}

    assert (
        client.post(
            "/api/admin/orders/ord-1/assign-rider", headers=headers, json={"riderId": "rdr-1"}
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/admin/orders/ord-1/cancel", headers=headers, json={"reason": "x"}
        ).status_code
        == 403
    )
