"""Address book API — Sprint 2.4.

    GET    /api/addresses          the signed-in customer's saved addresses
    POST   /api/addresses          add Home / Work / Other (manual entry)
    PUT    /api/addresses/{id}     edit, or mark as the default address
    PUT    /api/addresses/{id}/default   make this the only default address
    DELETE /api/addresses/{id}     remove an address
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import current_user
from app.db.address_repositories import address_repository
from app.models.address import AddressPayload, AddressResponse
from app.models.user import User

router = APIRouter(tags=["addresses"])


@router.get("/addresses", response_model=List[AddressResponse])
async def list_addresses(user: User = Depends(current_user)) -> List[AddressResponse]:
    return await address_repository.list(user.id)


@router.post("/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    payload: AddressPayload, user: User = Depends(current_user)
) -> AddressResponse:
    try:
        return await address_repository.create(user.id, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))


# PATCH is accepted too: the mock router uses PATCH for "make this the default".
@router.put("/addresses/{address_id}", response_model=AddressResponse)
@router.patch("/addresses/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: str, payload: AddressPayload, user: User = Depends(current_user)
) -> AddressResponse:
    try:
        updated = await address_repository.update(user.id, address_id, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return updated


@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, user: User = Depends(current_user)) -> dict:
    if not await address_repository.delete(user.id, address_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return {"ok": True, "id": address_id}


@router.put("/addresses/{address_id}/default", response_model=AddressResponse)
@router.patch("/addresses/{address_id}/default", response_model=AddressResponse)
async def set_default_address(
    address_id: str, user: User = Depends(current_user)
) -> AddressResponse:
    updated = await address_repository.set_default(user.id, address_id)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return updated
