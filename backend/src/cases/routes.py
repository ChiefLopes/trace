from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from src.auth.dependencies import get_current_user, get_current_user_optional
from src.cases.models import (
    CaseBrief,
    CaseFile,
    CaseOutcome,
    EvidenceItemRequest,
    EvidencePrompt,
    EvidenceSubmissionRequest,
    TransactionDetail,
    WalletDetail,
    Workspace,
)
from src.cases.service import CaseService
from src.database.storage import UserRecord, storage

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("")
async def list_cases():
    """List available detective cases."""
    return await CaseService.list_cases()


@router.get("/{case_id}", response_model=CaseBrief)
async def get_case_brief(case_id: str):
    """Get the brief for a case."""
    brief = await CaseService.get_case_brief(case_id)
    if not brief:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return brief


@router.get("/{case_id}/file", response_model=CaseFile)
async def get_case_file(case_id: str):
    """Get the full dossier for a case."""
    case_file = await CaseService.get_case_file(case_id)
    if not case_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case_file


@router.get("/{case_id}/workspace", response_model=Workspace)
async def get_workspace(
    case_id: str,
    user: Annotated[UserRecord | None, Depends(get_current_user_optional)],
):
    """Get the dynamic investigation workspace state."""
    workspace = await CaseService.get_workspace(case_id, user.id if user else None)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case workspace not found")
    return workspace


@router.get("/{case_id}/wallets/{wallet_id}", response_model=WalletDetail)
async def get_wallet(case_id: str, wallet_id: str):
    """Get wallet details, transactions, and forensics for a case."""
    wallet = await CaseService.get_wallet_detail(case_id, wallet_id)
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found in this case")
    return wallet


@router.get("/{case_id}/transactions/{tx_id}", response_model=TransactionDetail)
async def get_transaction(case_id: str, tx_id: str):
    """Get forensic transaction details."""
    tx = await CaseService.get_transaction_detail(case_id, tx_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found in this case")
    return tx


# Evidence Notebook
@router.get("/{case_id}/evidence")
async def list_evidence(
    case_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
):
    """List the player's saved evidence for this case."""
    items = await storage.get_evidence_list(user.id, case_id)
    return [item.to_dict() for item in items]


@router.post("/{case_id}/evidence", status_code=status.HTTP_201_CREATED)
async def add_evidence(
    case_id: str,
    req: EvidenceItemRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
):
    """Pin a wallet or transaction to the player's evidence notebook."""
    item = await storage.add_evidence(
        user_id=user.id,
        case_id=case_id,
        kind=req.kind,
        target_id=req.targetId,
        label=req.label,
        notes=req.notes,
    )
    return item.to_dict()


@router.delete("/{case_id}/evidence/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_evidence(
    case_id: str,
    evidence_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
):
    """Unpin an evidence item."""
    removed = await storage.remove_evidence(user.id, case_id, evidence_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence item not found")
    return None


# Deduction Submission & Scoring
@router.get("/{case_id}/evidence-prompt", response_model=EvidencePrompt)
async def get_evidence_prompt(case_id: str):
    """Get the choices for the final deduction theory."""
    prompt = await CaseService.get_evidence_prompt(case_id)
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence prompt not found")
    return prompt


@router.post("/{case_id}/submit", response_model=CaseOutcome)
async def submit_case_theory(
    case_id: str,
    submission: EvidenceSubmissionRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
):
    """Submit the final deduction and calculate the investigation score."""
    outcome = await CaseService.evaluate_submission(case_id, user.id, submission)
    return outcome


@router.get("/{case_id}/outcome", response_model=CaseOutcome)
async def get_case_outcome(
    case_id: str,
    user: Annotated[UserRecord | None, Depends(get_current_user_optional)],
):
    """Get the saved outcome and score for a solved case."""
    if user:
        outcome = await CaseService.get_outcome(case_id, user.id)
        if outcome:
            return outcome
    outcome = await CaseService.get_default_outcome(case_id)
    if not outcome:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No outcome found for this case yet")
    return outcome

