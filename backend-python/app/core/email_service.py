"""Email & Invoice Automation Dispatch Service (Gmail SMTP & Resend API).

Features:
1. Branded 2FA Security OTP Dispatch
2. Order Delivered / Completed Email Automation with Itemized Bill & Tax Invoice PDF Attachment
3. Async non-blocking dispatch with fallback support
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional
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
    from_name: str = "QuickPress",
    attachment_bytes: Optional[bytes] = None,
    attachment_name: Optional[str] = None,
    attachment_type: str = "application/pdf",
) -> Dict[str, Any]:
    """Synchronous SMTP email sender with optional file attachments."""
    if attachment_bytes:
        msg = MIMEMultipart("mixed")
        msg_body = MIMEMultipart("alternative")
        if text:
            msg_body.attach(MIMEText(text, "plain", "utf-8"))
        msg_body.attach(MIMEText(html, "html", "utf-8"))
        msg.attach(msg_body)

        part = MIMEApplication(attachment_bytes, _subtype="pdf")
        filename = attachment_name or "QuickPress-Tax-Invoice.pdf"
        part.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(part)
    else:
        msg = MIMEMultipart("alternative")
        if text:
            msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))

    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{user}>"
    msg["To"] = to

    try:
        if int(port) == 465:
            with smtplib.SMTP_SSL(host, int(port), timeout=12.0) as server:
                server.login(user, password)
                server.sendmail(user, [to], msg.as_string())
        else:
            with smtplib.SMTP(host, int(port), timeout=12.0) as server:
                server.starttls()
                server.login(user, password)
                server.sendmail(user, [to], msg.as_string())

        logger.info("📧 SMTP Email successfully sent via %s to %s (Subject: %s)", user, to, subject)
        return {"ok": True, "method": "smtp", "from": user, "recipient": to}
    except Exception as exc:
        logger.warning("SMTP dispatch error (%s) for %s: %s", user, to, exc)
        return {"ok": False, "method": "smtp", "error": str(exc)}


async def send_smtp_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    from_name: Optional[str] = None,
    attachment_bytes: Optional[bytes] = None,
    attachment_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Asynchronous SMTP email dispatch wrapper."""
    settings = get_settings()
    host = settings.smtp_host or "smtp.gmail.com"
    port = int(settings.smtp_port or 465)
    user = settings.smtp_user or "official.quickpress@gmail.com"
    password = settings.smtp_password or "lleomkgsxtjxngbb"
    sender_name = from_name or settings.smtp_from_name or "QuickPress"

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
        from_name=sender_name,
        attachment_bytes=attachment_bytes,
        attachment_name=attachment_name,
    )


async def send_resend_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    from_email: Optional[str] = None,
    attachment_bytes: Optional[bytes] = None,
    attachment_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Send an email via Resend API with optional attachment."""
    import base64

    settings = get_settings()
    api_key = settings.resend_api_key
    sender = from_email or settings.resend_from_email or "QuickPress <onboarding@resend.dev>"

    if not api_key:
        logger.warning("Resend API key is not configured. Email to %s skipped.", to)
        return {"ok": False, "error": "RESEND_API_KEY not configured"}

    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
    }

    payload: Dict[str, Any] = {
        "from": sender,
        "to": [to.strip().lower()],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text

    if attachment_bytes:
        payload["attachments"] = [
            {
                "filename": attachment_name or "QuickPress-Tax-Invoice.pdf",
                "content": base64.b64encode(attachment_bytes).decode("utf-8"),
            }
        ]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
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


def render_order_delivered_email_template(
    order_code: str,
    customer_name: str,
    delivery_address: str,
    partner_name: str,
    captain_name: str,
    items: List[Dict[str, Any]],
    subtotal: float,
    discount: float,
    delivery_fee: float,
    taxes: float,
    grand_total: float,
    payment_mode: str,
    order_date: str,
) -> str:
    """Generate high-end, responsive HTML invoice summary email when order is delivered."""
    items_rows_html = ""
    for item in items:
        name = item.get("name") or "Laundry Item"
        qty = item.get("qty") or item.get("quantity") or 1
        unit_price = float(item.get("unitPrice") or item.get("price") or 0.0)
        item_total = float(item.get("total") or (qty * unit_price))
        items_rows_html += f"""
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #1e293b;">
            {name}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: center; color: #64748b; font-family: monospace;">
            x{qty}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; font-weight: 700; color: #0f172a;">
            ₹{item_total:.2f}
          </td>
        </tr>
        """

    pay_badge_bg = "#ecfdf5" if payment_mode.lower() != "cod" else "#fffbeb"
    pay_badge_color = "#047857" if payment_mode.lower() != "cod" else "#b45309"
    pay_badge_text = "PAID (ONLINE/WALLET)" if payment_mode.lower() != "cod" else "CASH ON DELIVERY"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your QuickPress Order #{order_code} is Delivered!</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #0f172a;
    }}
    .container {{
      max-width: 600px;
      margin: 24px auto;
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.07);
      overflow: hidden;
    }}
    .header {{
      background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%);
      padding: 36px 32px 30px 32px;
      text-align: center;
      color: #ffffff;
    }}
    .logo-badge {{
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      color: #ffffff;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 2px;
      padding: 6px 16px;
      border-radius: 9999px;
      text-transform: uppercase;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }}
    .header h1 {{
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }}
    .header p {{
      font-size: 14px;
      color: #a7f3d0;
      margin: 8px 0 0 0;
      font-weight: 500;
    }}
    .content {{
      padding: 32px;
    }}
    .order-meta-card {{
      background: #f8fafc;
      border-radius: 16px;
      padding: 16px 20px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }}
    .meta-row {{
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px 0;
    }}
    .meta-label {{
      color: #64748b;
      font-weight: 600;
    }}
    .meta-val {{
      color: #0f172a;
      font-weight: 700;
    }}
    .invoice-attached-banner {{
      background: #ecfdf5;
      border: 1.5px solid #a7f3d0;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      margin-bottom: 28px;
    }}
    .invoice-title {{
      font-size: 13px;
      font-weight: 800;
      color: #065f46;
      margin: 0;
    }}
    .invoice-sub {{
      font-size: 12px;
      color: #047857;
      margin: 2px 0 0 0;
    }}
    .items-table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
    }}
    .items-table th {{
      background: #f8fafc;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
      border-bottom: 1.5px solid #e2e8f0;
    }}
    .bill-summary {{
      background: #f8fafc;
      border-radius: 16px;
      padding: 18px 20px;
      border: 1px solid #e2e8f0;
      margin-bottom: 28px;
    }}
    .bill-row {{
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #475569;
      padding: 5px 0;
    }}
    .grand-total-row {{
      display: flex;
      justify-content: space-between;
      font-size: 17px;
      font-weight: 900;
      color: #064e3b;
      padding-top: 12px;
      margin-top: 8px;
      border-top: 2px dashed #cbd5e1;
    }}
    .footer {{
      background: #0f172a;
      padding: 28px 32px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
    }}
    .footer a {{
      color: #10b981;
      text-decoration: none;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">QuickPress Laundry</div>
      <h1>Order Delivered Fresh! ✨🧺</h1>
      <p>Your laundry has been cleaned, crisp-pressed &amp; safely delivered.</p>
    </div>

    <div class="content">
      <p style="font-size: 15px; color: #1e293b; margin-top: 0;">
        Hello <strong>{customer_name}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
        Thank you for choosing QuickPress! We hope your freshly laundered garments meet our 7-step quality standards. Your official GST Tax Invoice has been attached to this email.
      </p>

      <!-- Attached Invoice Notice Banner -->
      <div class="invoice-attached-banner">
        <div>
          <p class="invoice-title">📄 Official Tax Invoice Attached (PDF)</p>
          <p class="invoice-sub">Tax invoice with SAC Code 999799 and GST summary is attached for your records.</p>
        </div>
      </div>

      <!-- Order Details Meta Card -->
      <div class="order-meta-card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; font-size: 12px; font-weight: 700; padding: 4px 0;">ORDER ID</td>
            <td style="text-align: right; color: #0f172a; font-size: 13px; font-weight: 800; font-family: monospace;">#{order_code}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 12px; font-weight: 700; padding: 4px 0;">DELIVERY DATE</td>
            <td style="text-align: right; color: #0f172a; font-size: 13px; font-weight: 600;">{order_date}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 12px; font-weight: 700; padding: 4px 0;">LAUNDROMAT PARTNER</td>
            <td style="text-align: right; color: #0f172a; font-size: 13px; font-weight: 700;">{partner_name}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 12px; font-weight: 700; padding: 4px 0;">DELIVERY CAPTAIN</td>
            <td style="text-align: right; color: #0f172a; font-size: 13px; font-weight: 700;">{captain_name}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 12px; font-weight: 700; padding: 4px 0;">DELIVERY ADDRESS</td>
            <td style="text-align: right; color: #0f172a; font-size: 12px; font-weight: 600; max-width: 260px;">{delivery_address}</td>
          </tr>
        </table>
      </div>

      <!-- Itemized Table -->
      <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 10px;">
        Order Items Summary ({len(items)})
      </h3>
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left;">Service / Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items_rows_html}
        </tbody>
      </table>

      <!-- Bill Summary Card -->
      <div class="bill-summary">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 4px 0;">Items Subtotal</td>
            <td style="text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">₹{subtotal:.2f}</td>
          </tr>
          {f'<tr><td style="color: #059669; font-size: 13px; padding: 4px 0;">Coupon Discount</td><td style="text-align: right; color: #059669; font-size: 13px; font-weight: 700;">-₹{discount:.2f}</td></tr>' if discount > 0 else ''}
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 4px 0;">Doorstep Delivery Fee</td>
            <td style="text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">₹{delivery_fee:.2f}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 4px 0;">Taxes &amp; GST (18%)</td>
            <td style="text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">₹{taxes:.2f}</td>
          </tr>
          <tr>
            <td style="padding-top: 10px; border-top: 1.5px dashed #cbd5e1; font-size: 16px; font-weight: 900; color: #064e3b;">Grand Total</td>
            <td style="padding-top: 10px; border-top: 1.5px dashed #cbd5e1; text-align: right; font-size: 18px; font-weight: 900; color: #064e3b;">₹{grand_total:.2f}</td>
          </tr>
        </table>

        <div style="margin-top: 14px; text-align: right;">
          <span style="display: inline-block; background: {pay_badge_bg}; color: {pay_badge_color}; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px;">
            ✓ {pay_badge_text}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong style="color: #ffffff;">QuickPress Laundry &amp; Dry Cleaning Services</strong><br>
      Questions about your order? Email us at <a href="mailto:official.quickpress@gmail.com">official.quickpress@gmail.com</a><br>
      <span style="font-size: 11px; color: #64748b; display: inline-block; margin-top: 8px;">
        100% Satisfaction Guarantee · Cleaned with Eco-Friendly Detergents
      </span>
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
    Tries Gmail SMTP (official.quickpress@gmail.com) first if password is set; otherwise falls back to Resend API.
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

    # 2. Resend API fallback
    return await send_resend_email(to=to_email, subject=subject, html=html, text=plain_text)


async def send_order_completion_email(order_or_id: str | Dict[str, Any]) -> Dict[str, Any]:
    """
    Automated Order Completion & Tax Invoice Email Dispatcher.
    Generates the official Tax Invoice PDF, attaches it, and emails the customer.
    """
    from app.db.client import database
    from app.db.invoice_repositories import invoice_repository
    from app.services import order_lifecycle as lifecycle

    order: Optional[Dict[str, Any]] = None
    if isinstance(order_or_id, dict):
        order = order_or_id
    else:
        order = await database.find_one(lifecycle.ORDERS, {"_id": order_or_id})
        if not order:
            order = await database.find_one(lifecycle.ORDERS, {"code": order_or_id})
        if not order:
            order = await database.find_one("customer_orders", {"_id": order_or_id})
        if not order:
            order = await database.find_one("customer_orders", {"code": order_or_id})

    if not order:
        logger.warning("Order not found for email dispatch: %s", order_or_id)
        return {"ok": False, "error": f"Order {order_or_id} not found"}

    order_id = lifecycle.order_id_of(order)
    order_code = order.get("code") or f"QP-{order_id[-6:]}"

    # 1. Resolve Customer Email
    customer = order.get("customer") or {}
    customer_name = order.get("customerName") or customer.get("name") or "QuickPress Customer"
    recipient_email = order.get("customerEmail") or customer.get("email") or ""

    user_id = str(order.get("userId") or order.get("customerId") or customer.get("id") or "")
    if not recipient_email and user_id:
        from app.db.repositories import users
        user_doc = await users.by_id(user_id)
        if user_doc and user_doc.email:
            recipient_email = user_doc.email

    if not recipient_email:
        logger.info("No customer email found for Order #%s. Skipping email invoice dispatch.", order_code)
        return {"ok": False, "skipped": True, "reason": "No customer email"}

    # 2. Extract Delivery Address, Store, Captain & Items
    address = order.get("address") or customer.get("address") or {}
    delivery_addr_str = address.get("formatted") or address.get("street") or address.get("line") or "Customer Address"
    partner = order.get("partner") or {}
    partner_name = partner.get("name") or "QuickPress Partner Hub"
    rider = order.get("rider") or {}
    captain_name = rider.get("name") or "QuickPress Delivery Captain"

    items = order.get("items") or []
    totals = order.get("totals") or order.get("pricing") or {}
    subtotal = float(totals.get("subtotal") or totals.get("itemsTotal") or 0.0)
    discount = float(totals.get("discount") or totals.get("couponDiscount") or 0.0)
    delivery_fee = float(totals.get("delivery") or totals.get("deliveryFee") or 0.0)
    taxes = float(totals.get("gst") or totals.get("tax") or 0.0)
    grand_total = float(totals.get("grandTotal") or totals.get("total") or 0.0)
    if subtotal <= 0 and grand_total > 0:
        subtotal = grand_total

    payment = order.get("payment") or {}
    payment_mode = str(payment.get("mode") or payment.get("method") or "online")
    order_date = (order.get("createdAt") or lifecycle.now_iso())[:10]

    # 3. Generate Tax Invoice PDF Attachment
    pdf_bytes: Optional[bytes] = None
    pdf_filename = f"QuickPress-Tax-Invoice-{order_code}.pdf"
    try:
        from app.services.invoice_pdf_generator import build_invoice_pdf_payload, generate_invoice_pdf
        invoice_doc = await database.find_one("invoices", {"order_id": order_id})
        if not invoice_doc:
            invoice_doc = await database.find_one("invoices", {"order_number": order_code})

        if invoice_doc:
            try:
                inv_model = invoice_repository._to_model(invoice_doc)
                payload = build_invoice_pdf_payload(inv_model, order)
            except Exception:
                payload = build_invoice_pdf_payload(invoice_doc, order)
        else:
            # Construct standalone invoice payload directly from order
            inv_dict = {
                "orderNumber": order_code,
                "invoiceNumber": f"QP/2026/{order_code.replace('QP-', '')}",
                "invoiceDate": order.get("createdAt") or lifecycle.now_iso(),
                "serviceLabel": order.get("serviceLabel") or "Premium Laundry & Dry Cleaning",
                "customer": {
                    "name": customer_name,
                    "phone": order.get("customerPhone") or customer.get("phone") or "",
                    "addressLine": delivery_addr_str,
                    "city": address.get("city") or "Kasganj",
                },
                "partner": {
                    "name": partner_name,
                    "addressLine": partner.get("address") or "QuickPress Partner Laundromat",
                    "city": partner.get("city") or "Kasganj",
                },
                "totals": {
                    "itemsTotal": subtotal,
                    "discount": discount,
                    "delivery": delivery_fee,
                    "gst": taxes,
                    "grandTotal": grand_total,
                },
                "payment": {
                    "mode": payment_mode,
                    "methodLabel": payment.get("method") or "UPI / Online Payment",
                    "paid": True,
                },
                "gst": {
                    "gstin": "09AAHCR1710J1ZE",
                    "placeOfSupply": "Uttar Pradesh",
                },
            }
            payload = build_invoice_pdf_payload(inv_dict, order)

        pdf_bytes = generate_invoice_pdf(payload)
        logger.info("Generated %d bytes Tax Invoice PDF for Order #%s", len(pdf_bytes), order_code)
    except Exception as exc:
        logger.warning("Could not generate PDF attachment for Order #%s: %s", order_code, exc, exc_info=True)

    # 4. Render HTML Template
    html_content = render_order_delivered_email_template(
        order_code=order_code,
        customer_name=customer_name,
        delivery_address=delivery_addr_str,
        partner_name=partner_name,
        captain_name=captain_name,
        items=items,
        subtotal=subtotal,
        discount=discount,
        delivery_fee=delivery_fee,
        taxes=taxes,
        grand_total=grand_total,
        payment_mode=payment_mode,
        order_date=order_date,
    )

    subject = f"Order #{order_code} Delivered — Your QuickPress Tax Invoice & Summary"
    plain_text = f"Hello {customer_name},\n\nYour QuickPress laundry Order #{order_code} has been delivered! Total amount: ₹{grand_total:.2f}. Your Tax Invoice PDF is attached.\n\nThank you for choosing QuickPress!"

    # 5. Dispatch Email with Attachment via Gmail SMTP
    settings = get_settings()
    logger.info("🚀 Dispatching order delivery email for Order #%s to %s...", order_code, recipient_email)
    res = await send_smtp_email(
        to=recipient_email,
        subject=subject,
        html=html_content,
        text=plain_text,
        attachment_bytes=pdf_bytes,
        attachment_name=pdf_filename,
    )

    if not res.get("ok"):
        # Fallback to Resend API
        res = await send_resend_email(
            to=recipient_email,
            subject=subject,
            html=html_content,
            text=plain_text,
            attachment_bytes=pdf_bytes,
            attachment_name=pdf_filename,
        )

    logger.info("Order delivered email result for #%s: %s", order_code, res)
    return res
