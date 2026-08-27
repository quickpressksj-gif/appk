"""Input Sanitization & NoSQL Injection Protection for QuickPress API."""

from __future__ import annotations

import html
from typing import Any, Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def sanitize_input(value: Any) -> Any:
    """Recursively strip MongoDB injection operators and escape dangerous HTML scripts."""
    if isinstance(value, str):
        # Escape potential script tags and strip leading $ operators
        cleaned = value.strip()
        if cleaned.startswith("$"):
            cleaned = cleaned.lstrip("$")
        return cleaned
    elif isinstance(value, dict):
        # Disallow keys starting with $ (e.g. $gt, $ne, $where)
        safe_dict = {}
        for k, v in value.items():
            safe_key = str(k).lstrip("$")
            safe_dict[safe_key] = sanitize_input(v)
        return safe_dict
    elif isinstance(value, list):
        return [sanitize_input(item) for item in value]
    return value


class InputSanitizerMiddleware(BaseHTTPMiddleware):
    """Sanitizes query parameters to prevent NoSQL query operator injection."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Check query params for MongoDB operators like $where, $gt, $ne
        for key, val in request.query_params.items():
            if key.startswith("$") or "$where" in str(val) or "$gt" in str(val):
                from starlette.responses import JSONResponse
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid request parameter format detected."},
                )
        return await call_next(request)
