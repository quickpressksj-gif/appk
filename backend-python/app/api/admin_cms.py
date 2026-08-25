"""Admin CMS endpoints for managing Public Website content, Legal versioning, FAQs, and inquiries."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.deps import require_roles
from app.db.cms_repositories import cms_repo
from app.models.user import Role, User

router = APIRouter(prefix="/admin/website", tags=["admin-website-cms"])


class LegalDraftPayload(BaseModel):
    title: str = Field(..., min_length=2)
    summary: str = Field(..., min_length=5)
    content: str = Field(..., min_length=20)


class LegalPublishPayload(BaseModel):
    changeLog: Optional[str] = "Published update via Admin CMS"


class FAQPayload(BaseModel):
    id: Optional[str] = None
    category: str = Field(..., min_length=2)
    question: str = Field(..., min_length=5)
    answer: str = Field(..., min_length=5)
    sortOrder: int = 1
    isPublished: bool = True


class MessageStatusPayload(BaseModel):
    status: str = Field(..., pattern="^(new|in-progress|resolved|archived)$")


# =========================================================================
#  1. CMS Overview Dashboard
# =========================================================================

@router.get("/dashboard")
async def get_cms_dashboard(user: User = Depends(require_roles(Role.admin))) -> Dict[str, Any]:
    legal_docs = await cms_repo.list_legal_docs_admin()
    faqs = await cms_repo.get_all_faqs_admin()
    messages = await cms_repo.list_contact_messages_admin()
    new_messages = [m for m in messages if m.get("status") == "new"]

    return {
        "legalDocsCount": len(legal_docs),
        "faqsCount": len(faqs),
        "totalInquiries": len(messages),
        "newInquiries": len(new_messages),
        "legalDocs": [
            {
                "slug": d.get("slug"),
                "title": d.get("title"),
                "currentVersion": d.get("currentVersion", "1.0"),
                "effectiveDate": d.get("effectiveDate"),
                "hasDraft": d.get("hasDraft", False),
                "publishedAt": d.get("publishedAt"),
            }
            for d in legal_docs
        ]
    }


# =========================================================================
#  2. Legal Document Management (Version Controlled)
# =========================================================================

@router.get("/legal")
async def list_legal_docs(user: User = Depends(require_roles(Role.admin))) -> List[Dict[str, Any]]:
    return await cms_repo.list_legal_docs_admin()


@router.get("/legal/{doc_slug}")
async def get_legal_doc_detail(doc_slug: str, user: User = Depends(require_roles(Role.admin))) -> Dict[str, Any]:
    doc = await cms_repo.get_legal_doc_admin(doc_slug)
    if not doc:
        raise HTTPException(status_code=404, detail="Legal document not found.")
    return doc


@router.post("/legal/{doc_slug}/draft")
async def save_legal_doc_draft(
    doc_slug: str,
    payload: LegalDraftPayload,
    user: User = Depends(require_roles(Role.admin))
) -> Dict[str, Any]:
    user_name = getattr(user, "display_name", None) or getattr(user, "name", None) or user.email or "Admin"
    return await cms_repo.save_legal_draft(
        doc_slug=doc_slug,
        title=payload.title,
        content=payload.content,
        summary=payload.summary,
        user_name=user_name
    )


@router.post("/legal/{doc_slug}/publish")
async def publish_legal_doc(
    doc_slug: str,
    payload: LegalPublishPayload,
    user: User = Depends(require_roles(Role.admin))
) -> Dict[str, Any]:
    user_name = getattr(user, "display_name", None) or getattr(user, "name", None) or user.email or "Admin"
    res = await cms_repo.publish_legal_doc(
        doc_slug=doc_slug,
        user_name=user_name,
        change_log=payload.changeLog or ""
    )
    if not res.get("ok"):
        raise HTTPException(status_code=400, detail=res.get("message", "Failed to publish document"))
    return res


# =========================================================================
#  3. FAQ Management
# =========================================================================

@router.get("/faqs")
async def list_faqs(user: User = Depends(require_roles(Role.admin))) -> List[Dict[str, Any]]:
    return await cms_repo.get_all_faqs_admin()


@router.post("/faqs")
async def create_faq(payload: FAQPayload, user: User = Depends(require_roles(Role.admin))) -> Dict[str, Any]:
    import uuid
    faq_id = payload.id or f"faq_{uuid.uuid4().hex[:8]}"
    data = payload.model_dump()
    data["_id"] = faq_id
    return await cms_repo.upsert_faq_admin(faq_id, data)


@router.put("/faqs/{faq_id}")
async def update_faq(faq_id: str, payload: FAQPayload, user: User = Depends(require_roles(Role.admin))) -> Dict[str, Any]:
    data = payload.model_dump(exclude_unset=True)
    data["_id"] = faq_id
    return await cms_repo.upsert_faq_admin(faq_id, data)


@router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, user: User = Depends(require_roles(Role.admin))) -> Dict[str, Any]:
    return await cms_repo.delete_faq_admin(faq_id)


# =========================================================================
#  4. Contact Messages Inbox
# =========================================================================

@router.get("/contact-messages")
async def list_contact_messages(
    status: Optional[str] = None,
    user: User = Depends(require_roles(Role.admin))
) -> List[Dict[str, Any]]:
    return await cms_repo.list_contact_messages_admin(status)


@router.put("/contact-messages/{msg_id}/status")
async def update_message_status(
    msg_id: str,
    payload: MessageStatusPayload,
    user: User = Depends(require_roles(Role.admin))
) -> Dict[str, Any]:
    return await cms_repo.update_contact_message_status_admin(msg_id, payload.status)


# =========================================================================
#  5. Website Settings & SEO
# =========================================================================

@router.get("/settings")
async def get_settings(user: User = Depends(require_roles(Role.admin))) -> Dict[str, Any]:
    return await cms_repo.get_website_settings()


@router.put("/settings")
async def update_settings(payload: Dict[str, Any], user: User = Depends(require_roles(Role.admin))) -> Dict[str, Any]:
    return await cms_repo.update_website_settings_admin(payload)
