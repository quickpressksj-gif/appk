"""Shared pytest configuration.

The mocked / in-memory suites (`test_order_lifecycle_e2e.py`,
`test_payment_e2e.py`, and every FakeDb test) must always run against the
in-memory store, otherwise a developer with MONGODB_URI exported in their shell
would silently point the whole suite at a real cluster.

So: MONGODB_URI is removed from the process environment here and re-exposed as
REAL_MONGODB_URI, which only the explicitly-marked real-MongoDB integration
tests read.
"""

from __future__ import annotations

import os

_real_uri = os.environ.pop("MONGODB_URI", "").strip() or os.getenv("REAL_MONGODB_URI", "")
if not _real_uri:
    # also check if .env has MONGODB_URI
    from dotenv import dotenv_values
    _env_dict = dotenv_values(".env")
    _real_uri = (_env_dict.get("MONGODB_URI") or "").strip()

os.environ["MONGODB_URI"] = ""
if _real_uri:
    os.environ["REAL_MONGODB_URI"] = _real_uri


def real_mongodb_uri() -> str:
    """URI of a real MongoDB, or "" when integration tests must be skipped."""
    return os.environ.get("REAL_MONGODB_URI", "")
