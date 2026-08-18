"""Address models — Sprint 2.4 (Checkout & Order Creation).

Mirrors `SavedAddress` / `AddressDraft` in
`backend/src/customer/addresses-api.ts`, so the checkout address book renders
identically from the mock router and from FastAPI.

    GET    /api/addresses
    POST   /api/addresses
    PUT    /api/addresses/{id}
    DELETE /api/addresses/{id}
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

AddressType = Literal["home", "office", "other"]


class AddressPayload(BaseModel):
    """POST /api/addresses and PUT /api/addresses/{id} body."""

    type: AddressType = "home"
    label: str = "Home"
    houseNumber: str = ""
    building: str = ""
    street: str = ""
    area: str = ""
    landmark: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""
    contactName: str = ""
    phone: str = ""
    isDefault: Optional[bool] = None


class AddressResponse(BaseModel):
    id: str
    type: AddressType = "home"
    label: str = "Home"
    houseNumber: str = ""
    building: str = ""
    street: str = ""
    area: str = ""
    landmark: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""
    contactName: str = ""
    phone: str = ""
    isDefault: bool = False
    line: str = Field(default="", description="Formatted single line, ready to render")
    cityLine: str = Field(default="", description="Area, city and pincode")
