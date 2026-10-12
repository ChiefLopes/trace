"""SQLModel table definitions for persistent storage."""

from datetime import datetime, timezone
from typing import Any
import uuid
from sqlmodel import Field, SQLModel


class UserRecord(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    email: str | None = Field(
        default=None,
        unique=True,
        index=True,
        nullable=True,
    )
    username: str = Field(index=True)
    wallet_address: str | None = Field(
        default=None,
        unique=True,
        index=True,
        nullable=True,
    )
    password_hash: str | None = Field(
        default=None,
        nullable=True,
    )
    selected_investigator_id: str = Field(
        default="tracy",
    )
    role: str = Field(
        default="player",
        index=True,
        description="User role: player, investigator, admin, superadmin",
    )
    is_admin: bool = Field(
        default=False,
        index=True,
        description="Whether this account has admin panel access",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "walletAddress": self.wallet_address,
            "selectedInvestigatorId": self.selected_investigator_id,
            "role": self.role,
            "isAdmin": self.is_admin,
            "createdAt": self.created_at.isoformat(),
        }


class CaseRecord(SQLModel, table=True):
    __tablename__ = "cases"

    id: str = Field(
        primary_key=True,
        index=True,
        description="Unique case identifier e.g. case-001",
    )
    number: str = Field(
        index=True,
        default="Case 001",
        description="Display number e.g. Case 001",
    )
    title: str = Field(
        index=True,
        description="Headline title of the case",
    )
    codename: str = Field(
        default="",
        description="Codename for workspace banner",
    )
    difficulty: str = Field(
        default="Intermediate",
        description="Beginner, Intermediate, Advanced",
    )
    status: str = Field(
        default="open",
        description="open, solved, or closed",
    )
    is_published: bool = Field(
        default=True,
        index=True,
        description="Whether this case is visible to players",
    )
    brief_json: str = Field(
        default="[]",
        description="JSON array of story briefing paragraphs",
    )
    objectives_json: str = Field(
        default="[]",
        description="JSON array of investigation objectives",
    )
    known_info_json: str = Field(
        default='{"initialWallet":"","missingAmount":"","approximateTime":""}',
        description="JSON object of known case details",
    )
    workspace_json: str = Field(
        default="{}",
        description="JSON object with hint, investigating wallet, timeline, trail, otherWallets, lead",
    )
    wallets_json: str = Field(
        default="{}",
        description="JSON dictionary of wallet forensic details keyed by wallet id",
    )
    transactions_json: str = Field(
        default="{}",
        description="JSON dictionary of transaction forensic details keyed by tx id",
    )
    prompt_json: str = Field(
        default="{}",
        description="JSON object for deduction prompt (scenarios, destinations)",
    )
    secret_destination: str = Field(
        default="exchange",
        description="Correct wallet destination for evaluation scoring",
    )
    secret_scenario: str = Field(
        default="layered",
        description="Correct fund flow scenario (layered, direct, etc.)",
    )
    key_terms_json: str = Field(
        default='["treasury","wallet","hop","exchange","20","cashed","layer"]',
        description="JSON array of terms checked in player theory",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class WalletChallengeRecord(SQLModel, table=True):
    __tablename__ = "wallet_challenges"

    wallet_address: str = Field(
        primary_key=True,
        index=True,
    )
    message: str
    nonce: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class EvidenceRecord(SQLModel, table=True):
    __tablename__ = "evidence"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    user_id: str = Field(index=True)
    case_id: str = Field(index=True)
    kind: str  # "wallet" or "transaction"
    target_id: str = Field(index=True)
    label: str
    notes: str | None = Field(default=None, nullable=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "caseId": self.case_id,
            "kind": self.kind,
            "targetId": self.target_id,
            "label": self.label,
            "notes": self.notes,
            "createdAt": self.created_at.isoformat(),
        }


class CaseOutcomeRecord(SQLModel, table=True):
    __tablename__ = "case_outcomes"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    user_id: str = Field(index=True)
    case_id: str = Field(index=True)
    outcome_json: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
