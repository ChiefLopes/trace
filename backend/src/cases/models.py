from typing import Literal
from pydantic import BaseModel, Field


# Case Brief & File Models
class CaseBrief(BaseModel):
    id: str
    number: str
    title: str
    brief: list[str]
    objectives: list[str]


class KnownInformation(BaseModel):
    initialWallet: str
    missingAmount: str
    approximateTime: str


class CaseFile(BaseModel):
    id: str
    number: str
    codename: str
    difficulty: str
    status: Literal["open", "solved", "closed"]
    briefing: list[str]
    knownInformation: KnownInformation
    objectives: list[str]


# Workspace & Investigation Models
class WalletSummary(BaseModel):
    id: str
    label: str
    address: str


class InvestigatingWallet(WalletSummary):
    balanceLamports: int
    transactionCount: int
    tokenCount: int


class TimelineEntry(BaseModel):
    id: str
    time: str
    direction: Literal["in", "out"]
    amountLamports: int
    counterparty: str | None = None
    flagged: bool = False


class Target(BaseModel):
    kind: Literal["transaction", "wallet"]
    id: str


class Lead(BaseModel):
    id: str
    badge: str
    trigger: Literal["arrival", "idle"]
    title: str
    message: str
    actionLabel: str
    target: Target


class Objective(BaseModel):
    text: str
    done: bool = False


class InvestigatorStatus(BaseModel):
    rank: str
    state: str


class Workspace(BaseModel):
    caseId: str
    caseNumber: str
    codename: str
    objectives: list[Objective]
    investigator: InvestigatorStatus
    hint: str
    investigating: InvestigatingWallet
    timeline: list[TimelineEntry]
    trail: list[WalletSummary]
    otherWallets: list[WalletSummary]
    evidenceCount: int = 0
    lead: Lead | None = None


# Wallet Detail Models
class ActivityItem(BaseModel):
    id: str
    time: str
    direction: Literal["in", "out"]
    amountLamports: int
    counterparty: str | None = None
    fromWallet: str | None = None
    toWallet: str | None = None
    key: bool = False
    flagged: bool = False
    link: Target | None = None


class TransactionProgress(BaseModel):
    completed: int = 1
    total: int = 5


class TransactionDetail(BaseModel):
    id: str
    signature: str = "5fJ8...2K9L"
    status: Literal["confirmed", "finalized", "failed"] = "confirmed"
    time: str
    amountLamports: int
    fromWalletId: str
    toWalletId: str
    fromWallet: str | None = None
    toWallet: str | None = None
    progress: TransactionProgress = Field(default_factory=TransactionProgress)
    lead: Lead | None = None
    counterparty: str | None = None
    direction: Literal["in", "out"] = "out"
    key: bool = False
    flagged: bool = False
    link: Target | None = None


class WalletDetail(BaseModel):
    id: str
    label: str
    address: str
    description: str
    balanceLamports: int
    transactionCount: int
    tokenCount: int
    firstActivity: str
    lastActivity: str
    receivedFromWalletId: str | None = None
    sentToWalletId: str | None = None
    activity: list[ActivityItem]


# Evidence & Deduction Models
class ScenarioOption(BaseModel):
    id: str
    label: str


class EvidencePrompt(BaseModel):
    caseId: str
    destinationWalletIds: list[str]
    scenarios: list[ScenarioOption]
    theoryPlaceholder: str


class EvidenceItemRequest(BaseModel):
    kind: Literal["wallet", "transaction"]
    targetId: str
    label: str
    notes: str | None = None


class EvidenceSubmissionRequest(BaseModel):
    destination: str
    scenario: str
    theory: str = Field(min_length=20, max_length=2000)


class ClueScore(BaseModel):
    found: int
    total: int


class TraceScore(BaseModel):
    correct: int
    total: int


class CaseOutcome(BaseModel):
    caseId: str
    title: str
    summary: str
    score: int
    maxScore: int
    clues: ClueScore
    evidenceCollected: int
    traces: TraceScore
    hintsUsed: int
