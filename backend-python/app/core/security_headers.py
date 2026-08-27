"""Security Headers Middleware for QuickPress API.

Implements Defense-in-Depth HTTP security headers:
- Anti-Clickjacking: X-Frame-Options: DENY
- Anti-MIME Sniffing: X-Content-Type-Options: nosniff
- Cross-Site Scripting Filter: X-XSS-Protection: 1; mode=block
- Strict Transport Security: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- Referrer Leak Protection: Referrer-Policy: strict-origin-when-cross-origin
- Feature Policy: Permissions-Policy: camera=(), microphone=(), geolocation=(self)
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response
