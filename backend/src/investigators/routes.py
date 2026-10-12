from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from src.auth.dependencies import get_current_user
from src.database.storage import UserRecord, storage
from src.investigators.data import FEATURED_INVESTIGATOR, INVESTIGATORS

router = APIRouter(tags=["investigators"])


class UpdateInvestigatorRequest(BaseModel):
    investigatorId: str


@router.get("/investigators")
async def list_investigators():
    """List selectable investigator characters."""
    return {
        "investigators": INVESTIGATORS,
        "featured": FEATURED_INVESTIGATOR,
    }


@router.put("/user/investigator")
async def update_investigator(
    req: UpdateInvestigatorRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
):
    """Update the authenticated player's selected investigator avatar."""
    valid_ids = [inv["id"] for inv in INVESTIGATORS] + [FEATURED_INVESTIGATOR["id"]]
    if req.investigatorId not in valid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid investigator ID. Must be one of: {valid_ids}",
        )

    updated_user = await storage.update_user_investigator(user.id, req.investigatorId)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return updated_user.to_dict()
