"""Email & Security OTP Dispatch Service (Gmail SMTP & Resend API)."""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _send_smtp_sync(
    host: str,
    port: int,
    user: str,
    password: str,
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    from_name: str = "QuickPress Security",
) -> Dict[str, Any]:
    """Synchronous SMTP email sender designed to run inside asyncio thread pool."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{user}>"
    msg["To"] = to

    if text:
        msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        if int(port) == 465:
            with smtplib.SMTP_SSL(host, int(port), timeout=10.0) as server:
                server.login(user, password)
                server.sendmail(user, [to], msg.as_string())
        else:
            with smtplib.SMTP(host, int(port), timeout=10.0) as server:
                server.starttls()
                server.login(user, password)
                server.sendmail(user, [to], msg.as_string())

        logger.info("SMTP Email successfully sent via %s to %s", user, to)
        return {"ok": True, "method": "smtp", "from": user}
    except Exception as exc:
        logger.warning("SMTP dispatch error (%s) for %s: %s", user, to, exc)
        return {"ok": False, "method": "smtp", "error": str(exc)}


async def send_smtp_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
) -> Dict[str, Any]:
    """Asynchronous SMTP email dispatch wrapper."""
    settings = get_settings()
    host = settings.smtp_host or "smtp.gmail.com"
    port = int(settings.smtp_port or 465)
    user = settings.smtp_user or "offical.quickpress@gmail.com"
    password = settings.smtp_password or ""
    from_name = settings.smtp_from_name or "QuickPress Security"

    if not user or not password:
        return {"ok": False, "error": "SMTP credentials not provided"}

    return await asyncio.to_thread(
        _send_smtp_sync,
        host=host,
        port=port,
        user=user,
        password=password,
        to=to.strip().lower(),
        subject=subject,
        html=html,
        text=text,
        from_name=from_name,
    )


async def send_resend_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    from_email: Optional[str] = None,
) -> Dict[str, Any]:
    """Send an email via Resend API."""
    settings = get_settings()
    api_key = settings.resend_api_key
    sender = from_email or settings.resend_from_email or "QuickPress Security <onboarding@resend.dev>"

    if not api_key:
        logger.warning("Resend API key is not configured. Email to %s skipped.", to)
        return {"ok": False, "error": "RESEND_API_KEY not configured"}

    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
    }

    payload = {
        "from": sender,
        "to": [to.strip().lower()],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(RESEND_API_URL, json=payload, headers=headers)
            if response.status_code in (200, 201):
                data = response.json()
                logger.info("Resend Email successfully dispatched to %s. Message ID: %s", to, data.get("id"))
                return {"ok": True, "method": "resend", "id": data.get("id")}
            else:
                err_text = response.text
                logger.warning("Resend Email failed (Status %s) for %s: %s", response.status_code, to, err_text)
                return {"ok": False, "method": "resend", "status": response.status_code, "error": err_text}
    except Exception as exc:
        logger.error("Exception sending email via Resend to %s: %s", to, exc)
        return {"ok": False, "method": "resend", "error": str(exc)}


def render_otp_email_template(otp_code: str, purpose: str = "2FA Login Verification", recipient_name: str = "QuickPress Administrator") -> str:
    """Generate high-end, responsive HTML email template for Security OTP."""
    formatted_otp = " ".join(list(otp_code))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuickPress Security Verification</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #0f172a;
    }}
    .container {{
      max-width: 540px;
      margin: 36px auto;
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }}
    .header {{
      background: #0f172a;
      padding: 28px 32px;
      text-align: center;
    }}
    .logo-badge {{
      display: inline-block;
      background: #059669;
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 6px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
    }}
    .header h1 {{
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 14px 0 0 0;
      letter-spacing: -0.5px;
    }}
    .content {{
      padding: 32px;
    }}
    .greeting {{
      font-size: 15px;
      color: #334155;
      margin-bottom: 16px;
    }}
    .intro {{
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 24px;
    }}
    .otp-card {{
      background: #f0fdf4;
      border: 2px dashed #059669;
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }}
    .otp-label {{
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #047857;
      margin-bottom: 8px;
    }}
    .otp-code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 6px;
      color: #065f46;
      margin: 0;
    }}
    .expiry-badge {{
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      color: #047857;
      background: #dcfce7;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-top: 10px;
    }}
    .warning-box {{
      background: #f8fafc;
      border-left: 4px solid #94a3b8;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      margin-top: 24px;
    }}
    .footer {{
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 32px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">QuickPress Security</div>
      <h1>Two-Factor Authentication Code</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello, <strong>{recipient_name}</strong></div>
      <div class="intro">
        A sign-in attempt was initiated for your QuickPress Staff/Admin account. Please use the following 6-digit verification code to complete your authentication:
      </div>

      <div class="otp-card">
        <div class="otp-label">{purpose}</div>
        <div class="otp-code">{formatted_otp}</div>
        <div class="expiry-badge">Valid for 5 minutes</div>
      </div>

      <div class="warning-box">
        <strong>Security Notice:</strong> Never share this code with anyone. QuickPress team members will never ask for your 2FA OTP. If you did not initiate this login, please contact your Super Admin immediately.
      </div>
    </div>
    <div class="footer">
      QuickPress Logistics & Laundry Services Private Limited<br>
      Automated Security Verification Gateway
    </div>
  </div>
</body>
</html>"""


async def send_otp_email(
    to_email: str,
    otp: str,
    purpose: str = "2FA Login Verification",
    recipient_name: str = "QuickPress Administrator",
) -> Dict[str, Any]:
    """
    High-level unified helper to dispatch branded 2FA Security OTP email.
    Tries Gmail SMTP (offical.quickpress@gmail.com) first if password is set; otherwise falls back to Resend API.
    """
    subject = f"Your QuickPress Security Code: {otp}"
    html = render_otp_email_template(otp_code=otp, purpose=purpose, recipient_name=recipient_name)
    plain_text = f"Your QuickPress {purpose} code is: {otp}. This code is valid for 5 minutes. Do not share it with anyone."

    settings = get_settings()
    # 1. Try Gmail SMTP if configured
    if settings.smtp_user and settings.smtp_password:
        smtp_res = await send_smtp_email(to=to_email, subject=subject, html=html, text=plain_text)
        if smtp_res.get("ok"):
            return smtp_res

    # 2. Resend API
    return await send_resend_email(to=to_email, subject=subject, html=html, text=plain_text)
