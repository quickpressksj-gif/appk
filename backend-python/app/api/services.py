"""Service Details API — Sprint 2.3.

    GET /api/services/{id}           full service detail (hero, care, FAQs,
                                     related services, partners, reviews)
    GET /api/services/{id}/partners  partners offering this service
    GET /api/services/{id}/related   related services

Reads are public — service details render for guests as well as signed-in
customers. Data comes from the MongoDB collections `services`, `categories`,
`catalog_partners`, `partner_reviews` and `service_content`.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, status

from app.db.service_repositories import services_repository
from app.models.cart import (
    RelatedServiceResponse,
    ServiceDetailResponse,
    ServicePartnerResponse,
)

router = APIRouter(tags=["services"])


async def _document_or_404(service_id: str) -> dict:
    document = await services_repository.resolve(service_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return document


@router.get("/services/{service_id}", response_model=ServiceDetailResponse)
async def get_service(
    service_id: str,
    city: Optional[str] = None,
) -> ServiceDetailResponse:
    detail = await services_repository.service_detail(service_id, city=city)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return detail


@router.get("/services/{service_id}/partners", response_model=list[ServicePartnerResponse])
async def get_service_partners(
    service_id: str,
    city: Optional[str] = None,
) -> list[ServicePartnerResponse]:
    document = await _document_or_404(service_id)
    return await services_repository.service_partners(document, city=city)


@router.get("/services/{service_id}/related", response_model=list[RelatedServiceResponse])
async def get_related_services(service_id: str) -> list[RelatedServiceResponse]:
    document = await _document_or_404(service_id)
    return await services_repository.related_services(document)
