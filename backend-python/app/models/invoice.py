"""Invoice models — Sprint 2.11.

Every field is camelCase because these payloads are consumed directly by the
customer frontend (`@/lib/invoice-api`) without a mapping layer.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

InvoiceStatus = Literal["paid", "unpaid", "refunded", "cancelled"]
InvoicePaymentStatus = Literal["paid", "pending", "failed", "refunded", "cod-pending"]


class InvoiceParty(BaseModel):
    """Customer or partner block printed on the invoice."""

    name: str = ""
    phone: str = ""
    email: str = ""
    addressLine: str = ""
    city: str = ""


class InvoiceGst(BaseModel):
    """GST identity of the billing entity plus the applied rate breakdown."""

    gstin: str = ""
    placeOfSupply: str = ""
    hsnCode: str = "9997"
    taxRate: float = 18.0
    cgst: float = 0
    sgst: float = 0
    igst: float = 0
    totalTax: float = 0


class InvoiceItem(BaseModel):
    id: str
    name: str
    description: str = ""
    quantity: int = 1
    unitPrice: float = 0
    total: float = 0


class InvoiceTotals(BaseModel):
    itemsTotal: float = 0
    discount: float = 0
    deliveryCharge: float = 0
    pickupCharge: float = 0
    handlingFee: float = 0
    taxableValue: float = 0
    taxes: float = 0
    grandTotal: float = 0
    currency: str = "INR"


class InvoicePayment(BaseModel):
    method: str = "cod"
    methodLabel: str = "Cash on Delivery"
    status: InvoicePaymentStatus = "cod-pending"
    paidAt: Optional[str] = None
    transactionId: Optional[str] = None


class Invoice(BaseModel):
    id: str
    invoiceNumber: str
    orderId: str
    orderNumber: str
    status: InvoiceStatus = "unpaid"
    invoiceDate: str
    dueDate: Optional[str] = None
    serviceLabel: str = "Laundry"
    customer: InvoiceParty = Field(default_factory=InvoiceParty)
    partner: InvoiceParty = Field(default_factory=InvoiceParty)
    gst: InvoiceGst = Field(default_factory=InvoiceGst)
    items: List[InvoiceItem] = Field(default_factory=list)
    totals: InvoiceTotals = Field(default_factory=InvoiceTotals)
    payment: InvoicePayment = Field(default_factory=InvoicePayment)
    notes: str = ""
    downloadCount: int = 0
    shareCount: int = 0
    createdAt: str
    updatedAt: Optional[str] = None


class InvoiceListResponse(BaseModel):
    items: List[Invoice] = Field(default_factory=list)
    total: int = 0
    totalAmount: float = 0


class InvoiceSharePayload(BaseModel):
    channel: Literal["whatsapp", "email", "sms", "link", "copy"] = "link"
    target: Optional[str] = Field(default=None, max_length=160)


class InvoiceShareResponse(BaseModel):
    ok: bool = True
    message: str = ""
    shareUrl: str = ""
    channel: str = "link"
    invoice: Invoice


class InvoiceDownloadResponse(BaseModel):
    ok: bool = True
    message: str = ""
    #: URL the client opens / saves. Rendering the binary PDF is a Sprint 3
    #: concern; the document payload below is everything a renderer needs.
    downloadUrl: str = ""
    fileName: str = ""
    format: str = "pdf"
    invoice: Invoice
