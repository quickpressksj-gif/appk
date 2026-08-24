"""Invoice repository — Sprint 2.11.

MongoDB collection
------------------
`invoices`   exactly one document per order, generated on first read.

    {
      "_id": "inv-QP-48219",
      "user_id": "<users._id>",
      "invoice_number": "QP/2026/000123",
      "order_id": "ord-QP-48219",
      "order_number": "QP-48219",
      "status": "paid" | "unpaid" | "refunded" | "cancelled",
      "invoice_date": "2026-08-05T…",
      "customer": {...}, "partner": {...}, "gst": {...},
      "items": [{ "id", "name", "quantity", "unitPrice", "total" }],
      "totals": {...}, "payment": {...},
      "download_count": 0, "share_count": 0,
      "created_at": "…", "updated_at": "…"
    }

Business rules enforced here
----------------------------
* An invoice is derived from its order exactly once, then frozen — later order
  edits never rewrite a already-issued invoice, which is what a tax document
  requires.
* Invoices are strictly scoped to `user_id`; a customer can never read another
  customer's invoice (404 rather than 403 so ids are not enumerable).
* Cancelled orders produce a `cancelled` invoice; the document still exists so
  the customer keeps a record.
* GST is split CGST/SGST for intra-state supply (the only case today) from the
  order's already-computed `gst` total, so the invoice can never disagree with
  what the customer was charged.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.db.client import database
from app.models.invoice import (
    Invoice,
    InvoiceDownloadResponse,
    InvoiceGst,
    InvoiceItem,
    InvoiceListResponse,
    InvoiceParty,
    InvoicePayment,
    InvoiceShareResponse,
    InvoiceTotals,
)
from app.models.user import User, utcnow

INVOICES = "invoices"
ORDERS = "orders"
COUNTERS = "counters"

#: Billing entity — a single QuickPress GSTIN today; multi-entity billing is a
#: Sprint 3 concern and only changes this constant plus the partner lookup.
COMPANY_GSTIN = "29AABCQ1234P1ZV"
TAX_RATE = 18.0

PAYMENT_LABELS: Dict[str, str] = {
    "cod": "Cash on Delivery",
    "wallet": "QuickPress Wallet",
    "razorpay": "Razorpay",
    "upi": "UPI",
    "credit-card": "Credit Card",
    "debit-card": "Debit Card",
    "online": "Online Payment",
}


class InvoiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _iso(value: Any) -> Optional[str]:
    if value is None:
        return None
    return value if isinstance(value, str) else value.isoformat()


def _money(value: Any) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


class InvoiceRepository:
    async def _next_number(self) -> str:
        collection = database.collection(COUNTERS)
        document = await collection.find_one({"_id": "invoice"})
        value = int((document or {}).get("value", 1000)) + 1
        await collection.update_one({"_id": "invoice"}, {"$set": {"value": value}}, upsert=True)
        year = utcnow().year
        return f"QP/{year}/{value:06d}"

    async def _order(self, user_id: str, order_id: str) -> Optional[Dict[str, Any]]:
        collection = database.collection(ORDERS)
        document = await collection.find_one({"_id": order_id})
        if document is None:
            document = await collection.find_one({"code": order_id})
        if document is None or document.get("userId") != user_id:
            return None
        return document

    async def _build(self, user: User, order: Dict[str, Any]) -> Dict[str, Any]:
        """Derive an invoice document from an order. Called once per order."""
        totals = order.get("totals") or {}
        items_total = _money(totals.get("itemsTotal"))
        discount = _money(totals.get("discount"))
        delivery = _money(totals.get("delivery"))
        pickup = _money(totals.get("pickup"))
        handling = _money(totals.get("handling"))
        taxes = _money(totals.get("gst"))
        grand_total = _money(totals.get("grandTotal"))
        taxable = round(max(items_total - discount, 0) + delivery + pickup + handling, 2)

        partner = order.get("partner") or {}
        address = order.get("address") or {}
        payment = order.get("payment") or {}
        method = str(payment.get("method") or payment.get("mode") or "cod")
        status_paid = bool(payment.get("paid"))
        order_status = str(order.get("status") or "placed")

        if order_status == "cancelled":
            invoice_status = "cancelled"
            payment_status = "refunded" if status_paid else "failed"
        elif status_paid:
            invoice_status = "paid"
            payment_status = "paid"
        else:
            invoice_status = "unpaid"
            payment_status = "cod-pending" if method in ("cod", "cash") else "pending"

        now = _iso(utcnow())
        document: Dict[str, Any] = {
            "_id": f"inv-{order.get('code') or order.get('_id')}",
            "user_id": user.id,
            "invoice_number": await self._next_number(),
            "order_id": str(order.get("_id")),
            "order_number": str(order.get("code") or order.get("_id")),
            "status": invoice_status,
            "invoice_date": _iso(order.get("createdAt")) or now,
            "service_label": order.get("serviceLabel") or "Laundry",
            "customer": {
                "name": (order.get("customer") or {}).get("name") or user.name or "Customer",
                "phone": (order.get("customer") or {}).get("phone") or user.phone or "",
                "email": getattr(user, "email", "") or "",
                "addressLine": address.get("line") or "",
                "city": address.get("city") or "",
            },
            "partner": {
                "name": partner.get("name") or "QuickPress Partner",
                "phone": partner.get("phone") or "",
                "email": "",
                "addressLine": partner.get("city") or "",
                "city": partner.get("city") or "",
            },
            "gst": {
                "gstin": COMPANY_GSTIN,
                "placeOfSupply": address.get("city") or partner.get("city") or "Karnataka",
                "hsnCode": "9997",
                "taxRate": TAX_RATE,
                "cgst": round(taxes / 2, 2),
                "sgst": round(taxes / 2, 2),
                "igst": 0.0,
                "totalTax": taxes,
            },
            "items": [
                {
                    "id": str(line.get("id") or f"line-{index + 1}"),
                    "name": line.get("name") or "Service",
                    "description": "",
                    "quantity": int(line.get("qty") or 1),
                    "unitPrice": _money(line.get("price")),
                    "total": round(_money(line.get("price")) * int(line.get("qty") or 1), 2),
                }
                for index, line in enumerate(order.get("items") or [])
            ],
            "totals": {
                "itemsTotal": items_total,
                "discount": discount,
                "deliveryCharge": delivery,
                "pickupCharge": pickup,
                "handlingFee": handling,
                "taxableValue": taxable,
                "taxes": taxes,
                "grandTotal": grand_total,
                "currency": "INR",
            },
            "payment": {
                "method": method,
                "methodLabel": payment.get("label") or PAYMENT_LABELS.get(method, "Cash on Delivery"),
                "status": payment_status,
                "paidAt": _iso(order.get("updatedAt")) if status_paid else None,
                "transactionId": payment.get("transactionId"),
            },
            "notes": "This is a computer generated invoice and does not require a signature.",
            "download_count": 0,
            "share_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        await database.collection(INVOICES).insert_one(document)
        return document

    def _to_model(self, document: Dict[str, Any]) -> Invoice:
        return Invoice(
            id=str(document["_id"]),
            invoiceNumber=document.get("invoice_number") or str(document["_id"]),
            orderId=document.get("order_id") or "",
            orderNumber=document.get("order_number") or "",
            status=document.get("status") or "unpaid",
            invoiceDate=_iso(document.get("invoice_date")) or _iso(utcnow()) or "",
            serviceLabel=document.get("service_label") or "Laundry",
            customer=InvoiceParty(**(document.get("customer") or {})),
            partner=InvoiceParty(**(document.get("partner") or {})),
            gst=InvoiceGst(**(document.get("gst") or {})),
            items=[InvoiceItem(**item) for item in (document.get("items") or [])],
            totals=InvoiceTotals(**(document.get("totals") or {})),
            payment=InvoicePayment(**(document.get("payment") or {})),
            notes=document.get("notes") or "",
            downloadCount=int(document.get("download_count") or 0),
            shareCount=int(document.get("share_count") or 0),
            createdAt=_iso(document.get("created_at")) or "",
            updatedAt=_iso(document.get("updated_at")),
        )

    async def for_order(self, user: User, order_id: str) -> Invoice:
        order = await self._order(user.id, order_id)
        if order is None:
            raise InvoiceError("Order not found", 404)
        existing = await database.collection(INVOICES).find_one(
            {"order_id": str(order.get("_id")), "user_id": user.id}
        )
        if existing is None:
            existing = await self._build(user, order)
        return self._to_model(existing)

    async def list(self, user: User, *, limit: int = 50, q: Optional[str] = None) -> InvoiceListResponse:
        """Invoice history — every past order of this customer has an invoice."""
        orders = await database.find_many(ORDERS, {"userId": user.id})
        for order in orders:
            existing = await database.collection(INVOICES).find_one(
                {"order_id": str(order.get("_id")), "user_id": user.id}
            )
            if existing is None:
                await self._build(user, order)

        documents = await database.find_many(INVOICES, {"user_id": user.id})
        documents.sort(key=lambda doc: str(doc.get("invoice_date") or ""), reverse=True)
        invoices = [self._to_model(doc) for doc in documents]
        if q:
            needle = q.strip().lower()
            invoices = [
                invoice
                for invoice in invoices
                if needle in invoice.invoiceNumber.lower()
                or needle in invoice.orderNumber.lower()
                or needle in invoice.partner.name.lower()
            ]
        total_amount = round(sum(invoice.totals.grandTotal for invoice in invoices), 2)
        return InvoiceListResponse(
            items=invoices[:limit], total=len(invoices), totalAmount=total_amount
        )

    async def get(self, user: User, invoice_id: str) -> Invoice:
        collection = database.collection(INVOICES)
        document = await collection.find_one({"_id": invoice_id})
        if document is None:
            document = await collection.find_one({"invoice_number": invoice_id})
        if document is None or document.get("user_id") != user.id:
            raise InvoiceError("Invoice not found", 404)
        return self._to_model(document)

    async def _bump(self, invoice_id: str, field: str) -> None:
        collection = database.collection(INVOICES)
        document = await collection.find_one({"_id": invoice_id})
        if document is None:
            return
        await collection.update_one(
            {"_id": invoice_id},
            {"$set": {field: int(document.get(field) or 0) + 1, "updated_at": _iso(utcnow())}},
        )

    async def share(self, user: User, invoice_id: str, channel: str, target: Optional[str]) -> InvoiceShareResponse:
        invoice = await self.get(user, invoice_id)
        await self._bump(invoice.id, "share_count")
        refreshed = await self.get(user, invoice.id)
        share_url = f"/invoices/{invoice.id}"
        suffix = f" to {target}" if target else ""
        return InvoiceShareResponse(
            ok=True,
            message=f"Invoice {invoice.invoiceNumber} shared via {channel}{suffix}.",
            shareUrl=share_url,
            channel=channel,
            invoice=refreshed,
        )

    async def download(self, user: User, invoice_id: str) -> InvoiceDownloadResponse:
        invoice = await self.get(user, invoice_id)
        await self._bump(invoice.id, "download_count")
        refreshed = await self.get(user, invoice.id)
        safe_number = invoice.invoiceNumber.replace("/", "-")
        return InvoiceDownloadResponse(
            ok=True,
            message="Invoice ready to download.",
            downloadUrl=f"/api/invoices/{invoice.id}/pdf",
            fileName=f"QuickPress-{safe_number}.pdf",
            format="pdf",
            invoice=refreshed,
        )

    async def get_pdf_bytes(self, user: Optional[User], invoice_id: str) -> tuple[bytes, str]:
        """Generate PDF bytes for an invoice and return (pdf_bytes, file_name)."""
        collection = database.collection(INVOICES)
        document = await collection.find_one({"_id": invoice_id})
        if document is None:
            document = await collection.find_one({"invoice_number": invoice_id})
        if document is None:
            raise InvoiceError("Invoice not found", 404)
        if user and document.get("user_id") != user.id:
            raise InvoiceError("Invoice not found", 404)

        order_doc = None
        if document.get("order_id"):
            order_doc = await database.collection(ORDERS).find_one({"_id": document["order_id"]})
        elif document.get("order_number"):
            order_doc = await database.collection(ORDERS).find_one({"code": document["order_number"]})

        from app.services.invoice_pdf_generator import build_invoice_pdf_payload, generate_invoice_pdf
        invoice_model = self._to_model(document)
        payload = build_invoice_pdf_payload(invoice_model, order_doc)
        pdf_bytes = generate_invoice_pdf(payload)
        safe_number = invoice_model.invoiceNumber.replace("/", "-")
        return pdf_bytes, f"QuickPress-{safe_number}.pdf"


invoice_repository = InvoiceRepository()
