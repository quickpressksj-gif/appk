"""Customer invoice API — Sprint 2.11.

    GET  /api/invoices                      invoice history (searchable)
    GET  /api/invoices/{invoice_id}         one invoice
    GET  /api/orders/{order_id}/invoice     the invoice of an order
    POST /api/invoices/{invoice_id}/share   share over whatsapp / email / link
    POST /api/invoices/{invoice_id}/download  mark + resolve a PDF download

Every route requires a bearer token and is scoped to `current_user`.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import current_user
from app.db.invoice_repositories import InvoiceError, invoice_repository
from app.models.invoice import (
    Invoice,
    InvoiceDownloadResponse,
    InvoiceListResponse,
    InvoiceSharePayload,
    InvoiceShareResponse,
)
from app.models.user import User

router = APIRouter(tags=["invoices"])


def _raise(error: InvoiceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invoices", response_model=InvoiceListResponse)
async def list_invoices(
    limit: int = Query(default=50, ge=1, le=200),
    q: str | None = None,
    user: User = Depends(current_user),
) -> InvoiceListResponse:
    return await invoice_repository.list(user, limit=limit, q=q)


@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, user: User = Depends(current_user)) -> Invoice:
    try:
        return await invoice_repository.get(user, invoice_id)
    except InvoiceError as error:
        _raise(error)
        raise


@router.get("/orders/{order_id}/invoice", response_model=Invoice)
async def invoice_for_order(order_id: str, user: User = Depends(current_user)) -> Invoice:
    try:
        return await invoice_repository.for_order(user, order_id)
    except InvoiceError as error:
        _raise(error)
        raise


@router.post("/invoices/{invoice_id}/share", response_model=InvoiceShareResponse)
async def share_invoice(
    invoice_id: str,
    payload: InvoiceSharePayload | None = None,
    user: User = Depends(current_user),
) -> InvoiceShareResponse:
    body = payload or InvoiceSharePayload()
    try:
        return await invoice_repository.share(user, invoice_id, body.channel, body.target)
    except InvoiceError as error:
        _raise(error)
        raise


@router.post("/invoices/{invoice_id}/download", response_model=InvoiceDownloadResponse)
async def download_invoice(
    invoice_id: str, user: User = Depends(current_user)
) -> InvoiceDownloadResponse:
    try:
        return await invoice_repository.download(user, invoice_id)
    except InvoiceError as error:
        _raise(error)
        raise
