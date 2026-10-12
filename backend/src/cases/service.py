"""Service providing dynamic case data, workspace forensics, and evaluation from database."""

import json
from typing import Any
from src.cases.models import (
    ActivityItem,
    CaseBrief,
    CaseFile,
    CaseOutcome,
    ClueScore,
    EvidencePrompt,
    EvidenceSubmissionRequest,
    InvestigatingWallet,
    InvestigatorStatus,
    KnownInformation,
    Lead,
    Objective,
    ScenarioOption,
    Target,
    TimelineEntry,
    TraceScore,
    TransactionDetail,
    TransactionProgress,
    WalletDetail,
    WalletSummary,
    Workspace,
)
from src.database.models import CaseRecord
from src.database.storage import storage

SOL = 1_000_000_000

# Canonical default seed data for Case 001
CASE_001_DEFAULT_WALLETS: dict[str, dict[str, Any]] = {
    "treasury": {
        "id": "treasury",
        "label": "Treasury Wallet",
        "address": "7xH3k9...92KD",
        "description": "The project launch treasury. Held 50 SOL until 20 SOL was drained at 02:43 UTC.",
        "balanceLamports": 30 * SOL,
        "transactionCount": 342,
        "tokenCount": 18,
        "firstActivity": "2026-08-14",
        "lastActivity": "2026-10-01",
        "receivedFromWalletId": None,
        "sentToWalletId": "wallet-b",
        "activity": [
            {
                "id": "tx-1",
                "time": "02:39:07",
                "direction": "in",
                "amountLamports": int(1.5 * SOL),
                "counterparty": "Contributor A",
                "key": False,
                "flagged": False,
                "link": {"kind": "transaction", "id": "tx-1"},
            },
            {
                "id": "tx-drain",
                "time": "02:43:18",
                "direction": "out",
                "amountLamports": 20 * SOL,
                "counterparty": "Wallet B",
                "key": True,
                "flagged": True,
                "link": {"kind": "wallet", "id": "wallet-b"},
            },
            {
                "id": "tx-3",
                "time": "02:45:00",
                "direction": "in",
                "amountLamports": int(0.2 * SOL),
                "counterparty": "Staking Reward",
                "key": False,
                "flagged": False,
                "link": None,
            },
        ],
    },
    "wallet-b": {
        "id": "wallet-b",
        "label": "Receiving Wallet B",
        "address": "9mK2p1...84FX",
        "description": "First recipient of the drained treasury funds. Created minutes before the transfer.",
        "balanceLamports": 0,
        "transactionCount": 2,
        "tokenCount": 0,
        "firstActivity": "2026-10-01",
        "lastActivity": "2026-10-01",
        "receivedFromWalletId": "treasury",
        "sentToWalletId": "wallet-c",
        "activity": [
            {
                "id": "tx-drain-in",
                "time": "02:43:18",
                "direction": "in",
                "amountLamports": 20 * SOL,
                "counterparty": "Treasury",
                "key": True,
                "flagged": True,
                "link": {"kind": "wallet", "id": "treasury"},
            },
            {
                "id": "tx-hop-1",
                "time": "02:47:04",
                "direction": "out",
                "amountLamports": 20 * SOL,
                "counterparty": "Wallet C",
                "key": True,
                "flagged": True,
                "link": {"kind": "wallet", "id": "wallet-c"},
            },
        ],
    },
    "wallet-c": {
        "id": "wallet-c",
        "label": "Intermediary Wallet C",
        "address": "3vN8q4...11PL",
        "description": "Second relay wallet. Split funds before moving to final destination.",
        "balanceLamports": 0,
        "transactionCount": 2,
        "tokenCount": 0,
        "firstActivity": "2026-10-01",
        "lastActivity": "2026-10-01",
        "receivedFromWalletId": "wallet-b",
        "sentToWalletId": "wallet-d",
        "activity": [
            {
                "id": "tx-hop-1-in",
                "time": "02:47:04",
                "direction": "in",
                "amountLamports": 20 * SOL,
                "counterparty": "Wallet B",
                "key": True,
                "flagged": False,
                "link": {"kind": "wallet", "id": "wallet-b"},
            },
            {
                "id": "tx-hop-2",
                "time": "02:51:22",
                "direction": "out",
                "amountLamports": 20 * SOL,
                "counterparty": "Wallet D",
                "key": True,
                "flagged": True,
                "link": {"kind": "wallet", "id": "wallet-d"},
            },
        ],
    },
    "wallet-d": {
        "id": "wallet-d",
        "label": "Staging Wallet D",
        "address": "4kR7m5...39ZY",
        "description": "Final staging wallet before the exchange deposit.",
        "balanceLamports": 0,
        "transactionCount": 2,
        "tokenCount": 0,
        "firstActivity": "2026-10-01",
        "lastActivity": "2026-10-01",
        "receivedFromWalletId": "wallet-c",
        "sentToWalletId": "exchange",
        "activity": [
            {
                "id": "tx-hop-2-in",
                "time": "02:51:22",
                "direction": "in",
                "amountLamports": 20 * SOL,
                "counterparty": "Wallet C",
                "key": True,
                "flagged": False,
                "link": {"kind": "wallet", "id": "wallet-c"},
            },
            {
                "id": "tx-deposit",
                "time": "02:56:45",
                "direction": "out",
                "amountLamports": int(19.99 * SOL),
                "counterparty": "Exchange Deposit Hot Wallet",
                "key": True,
                "flagged": True,
                "link": {"kind": "wallet", "id": "exchange"},
            },
        ],
    },
    "exchange": {
        "id": "exchange",
        "label": "Exchange Deposit Hot Wallet",
        "address": "BinanceDeposit...88AA",
        "description": "Known centralized exchange deposit address. Final destination where funds were cashed out.",
        "balanceLamports": 12_450 * SOL,
        "transactionCount": 89_412,
        "tokenCount": 140,
        "firstActivity": "2024-01-01",
        "lastActivity": "2026-10-01",
        "receivedFromWalletId": "wallet-d",
        "sentToWalletId": None,
        "activity": [
            {
                "id": "tx-deposit-in",
                "time": "02:56:45",
                "direction": "in",
                "amountLamports": int(19.99 * SOL),
                "counterparty": "Wallet D",
                "key": True,
                "flagged": True,
                "link": {"kind": "wallet", "id": "wallet-d"},
            }
        ],
    },
}

CASE_001_DEFAULT_TRANSACTIONS: dict[str, dict[str, Any]] = {
    "tx-drain": {
        "id": "tx-drain",
        "time": "02:43:18",
        "direction": "out",
        "amountLamports": 20 * SOL,
        "fromWallet": "treasury",
        "toWallet": "wallet-b",
        "counterparty": "Wallet B (9mK2p1...84FX)",
        "key": True,
        "flagged": True,
        "link": {"kind": "wallet", "id": "wallet-b"},
    },
    "tx-hop-1": {
        "id": "tx-hop-1",
        "time": "02:47:04",
        "direction": "out",
        "amountLamports": 20 * SOL,
        "fromWallet": "wallet-b",
        "toWallet": "wallet-c",
        "counterparty": "Wallet C (3vN8q4...11PL)",
        "key": True,
        "flagged": True,
        "link": {"kind": "wallet", "id": "wallet-c"},
    },
    "tx-hop-2": {
        "id": "tx-hop-2",
        "time": "02:51:22",
        "direction": "out",
        "amountLamports": 20 * SOL,
        "fromWallet": "wallet-c",
        "toWallet": "wallet-d",
        "counterparty": "Wallet D (4kR7m5...39ZY)",
        "key": True,
        "flagged": True,
        "link": {"kind": "wallet", "id": "wallet-d"},
    },
    "tx-deposit": {
        "id": "tx-deposit",
        "time": "02:56:45",
        "direction": "out",
        "amountLamports": int(19.99 * SOL),
        "fromWallet": "wallet-d",
        "toWallet": "exchange",
        "counterparty": "Exchange Hot Wallet",
        "key": True,
        "flagged": True,
        "link": {"kind": "wallet", "id": "exchange"},
    },
}


def build_default_case_001() -> CaseRecord:
    """Build canonical seed CaseRecord for Case 001."""
    return CaseRecord(
        id="case-001",
        number="Case 001",
        title="Trace the missing 20 SOL",
        codename="The Missing Treasury",
        difficulty="Rookie",
        status="open",
        is_published=True,
        brief_json=json.dumps(
            [
                "{{20\u00a0SOL}} disappeared. Find out where it went.",
                "At {{02:43\u00a0UTC}}, a project's treasury wallet sent {{20\u00a0SOL}} to an unknown wallet.",
                "No one authorized the transfer.",
                "The treasury wallet had been holding funds for an upcoming project launch. Minutes after the transfer, the receiving wallet moved the funds again.",
                "Someone is moving the money. Your job is to {{find out where it went.}}",
            ]
        ),
        objectives_json=json.dumps(
            [
                "Identify the transaction where the 20 SOL left the treasury.",
                "Investigate the wallet that received the funds.",
                "Find out where the 20 SOL went after arriving.",
                "Save the transactions and wallets that help explain the trail.",
                "Use your investigation board to reconstruct the movement of the funds.",
                "Explain where the money went and what happened to it.",
            ]
        ),
        known_info_json=json.dumps(
            {
                "initialWallet": "7XH3\u00a0.\u00a0.\u00a0.\u00a092KD",
                "missingAmount": "20 SOL",
                "approximateTime": "02 : 3 MIN",
            }
        ),
        workspace_json=json.dumps(
            {
                "hint": "Start with the treasury's outgoing transfers around 02:43 UTC. Which one doesn't fit the pattern?",
                "investigating": {
                    "id": "treasury",
                    "label": "Treasury Wallet",
                    "address": "7xH3k9...92KD",
                    "balanceLamports": 30 * SOL,
                    "transactionCount": 342,
                    "tokenCount": 18,
                },
                "timeline": [
                    {
                        "id": "tx-1",
                        "time": "02:39:07",
                        "direction": "in",
                        "amountLamports": int(1.5 * SOL),
                        "counterparty": "Contributor A",
                        "flagged": False,
                    },
                    {
                        "id": "tx-drain",
                        "time": "02:43:18",
                        "direction": "out",
                        "amountLamports": 20 * SOL,
                        "counterparty": "Wallet B",
                        "flagged": True,
                    },
                    {
                        "id": "tx-3",
                        "time": "02:45:00",
                        "direction": "in",
                        "amountLamports": int(0.2 * SOL),
                        "counterparty": "Staking Reward",
                        "flagged": False,
                    },
                ],
                "trail": [
                    {"id": "treasury", "label": "Treasury", "address": "7xH3...92KD"},
                    {"id": "wallet-b", "label": "Wallet B", "address": "9mK2...84FX"},
                    {"id": "wallet-c", "label": "Wallet C", "address": "3vN8...11PL"},
                    {"id": "wallet-d", "label": "Wallet D", "address": "4kR7...39ZY"},
                    {"id": "exchange", "label": "Exchange Deposit Hot Wallet", "address": "BinanceDeposit...88AA"},
                ],
                "otherWallets": [
                    {"id": "burner-1", "label": "Unrelated Wallet 1", "address": "5tP9...12AA"},
                    {"id": "burner-2", "label": "Unrelated Wallet 2", "address": "8qL4...99ZZ"},
                ],
                "lead": {
                    "id": "lead-drain",
                    "badge": "ALERT",
                    "trigger": "arrival",
                    "title": "Unauthorized Outgoing Transfer",
                    "message": "At 02:43 UTC, 20 SOL was sent to an unknown wallet without authorization.",
                    "actionLabel": "Analyze Transaction",
                    "target": {"kind": "transaction", "id": "tx-drain"},
                },
            }
        ),
        wallets_json=json.dumps(CASE_001_DEFAULT_WALLETS),
        transactions_json=json.dumps(CASE_001_DEFAULT_TRANSACTIONS),
        prompt_json=json.dumps(
            {
                "destinationWalletIds": ["wallet-b", "wallet-c", "wallet-d", "exchange"],
                "scenarios": [
                    {"id": "direct", "label": "A single direct transfer"},
                    {"id": "layered", "label": "Layered through multiple wallets then cashed out"},
                    {"id": "swapped", "label": "Swapped into a token then back"},
                    {"id": "burned", "label": "Burned to a null address"},
                ],
                "theoryPlaceholder": "Explain the trail in your own words... e.g. 'The 20 SOL left the treasury at 02:43, hopped through three fresh wallets, and ended at an exchange deposit address.'",
            }
        ),
        secret_destination="exchange",
        secret_scenario="layered",
        key_terms_json=json.dumps(["treasury", "wallet", "hop", "exchange", "20", "cashed", "layer"]),
    )


class CaseService:
    @staticmethod
    async def ensure_initial_seed() -> None:
        """Seed Case 001 if no cases exist in the database."""
        existing = await storage.get_case_by_id("case-001")
        if not existing:
            await storage.create_or_update_case(build_default_case_001())

    @staticmethod
    async def list_cases() -> list[dict[str, Any]]:
        """List published detective cases dynamically from database."""
        await CaseService.ensure_initial_seed()
        cases = await storage.get_all_cases(published_only=True)
        return [
            {
                "id": c.id,
                "number": c.number,
                "title": c.title,
                "codename": c.codename,
                "difficulty": c.difficulty,
                "status": c.status,
            }
            for c in cases
        ]

    @staticmethod
    async def get_case_brief(case_id: str) -> CaseBrief | None:
        """Retrieve dynamic brief for a case from database."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            return None
        return CaseBrief(
            id=c.id,
            number=c.number,
            title=c.title,
            brief=json.loads(c.brief_json),
            objectives=json.loads(c.objectives_json),
        )

    @staticmethod
    async def get_case_file(case_id: str) -> CaseFile | None:
        """Retrieve full dynamic dossier for a case from database."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            return None
        return CaseFile(
            id=c.id,
            number=c.number,
            codename=c.codename,
            difficulty=c.difficulty,
            status=c.status,
            briefing=json.loads(c.brief_json),
            knownInformation=KnownInformation(**json.loads(c.known_info_json)),
            objectives=json.loads(c.objectives_json),
        )

    @staticmethod
    async def get_workspace(case_id: str, user_id: str | None = None) -> Workspace | None:
        """Retrieve dynamic investigation workspace with real-time objective scoring."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            return None

        evidence_count = 0
        if user_id:
            evidence_count = len(await storage.get_evidence_list(user_id, case_id))

        ws_data = json.loads(c.workspace_json)
        raw_objectives = json.loads(c.objectives_json)

        # Build dynamic objectives based on evidence count
        objectives = [
            Objective(text=raw_objectives[0] if len(raw_objectives) > 0 else "Initial investigation", done=evidence_count > 0),
            Objective(text=raw_objectives[1] if len(raw_objectives) > 1 else "Identify receiving wallet", done=evidence_count > 1),
            Objective(text=raw_objectives[2] if len(raw_objectives) > 2 else "Trace movement of funds", done=evidence_count > 2),
            Objective(text=raw_objectives[3] if len(raw_objectives) > 3 else "Collect important evidence", done=evidence_count >= 2),
            Objective(text=raw_objectives[4] if len(raw_objectives) > 4 else "Build your theory", done=False),
        ]

        lead = Lead(**ws_data["lead"]) if ws_data.get("lead") else None

        return Workspace(
            caseId=c.id,
            caseNumber=c.number,
            codename=c.codename,
            objectives=objectives,
            investigator=InvestigatorStatus(rank="Rookie Investigator", state="Investigating"),
            hint=ws_data.get("hint", ""),
            investigating=InvestigatingWallet(**ws_data["investigating"]),
            timeline=[TimelineEntry(**t) for t in ws_data.get("timeline", [])],
            trail=[WalletSummary(**w) for w in ws_data.get("trail", [])],
            otherWallets=[WalletSummary(**w) for w in ws_data.get("otherWallets", [])],
            evidenceCount=evidence_count,
            lead=lead,
        )

    @staticmethod
    async def get_wallet_detail(case_id: str, wallet_id: str) -> WalletDetail | None:
        """Retrieve forensic wallet detail dynamically from case database."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            return None
        wallets = json.loads(c.wallets_json)
        wallet_data = wallets.get(wallet_id)
        if not wallet_data:
            return None
        return WalletDetail(**wallet_data)

    @staticmethod
    async def get_transaction_detail(case_id: str, tx_id: str) -> TransactionDetail | None:
        """Retrieve forensic transaction detail dynamically from case database."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            return None

        tx_data: dict[str, Any] | None = None
        # Check transactions map first
        txs = json.loads(c.transactions_json)
        if tx_id in txs:
            tx_data = dict(txs[tx_id])
        else:
            # Fallback to searching all wallet activities
            wallets = json.loads(c.wallets_json)
            for w in wallets.values():
                for act in w.get("activity", []):
                    if act.get("id") == tx_id:
                        tx_data = dict(act)
                        break
                if tx_data:
                    break

        if not tx_data:
            return None

        from_w = tx_data.get("fromWalletId") or tx_data.get("fromWallet") or "treasury"
        to_w = tx_data.get("toWalletId") or tx_data.get("toWallet") or "wallet-b"
        prog = tx_data.get("progress")
        if isinstance(prog, dict):
            progress_obj = TransactionProgress(**prog)
        else:
            progress_obj = TransactionProgress(completed=1, total=5)

        lead_val = tx_data.get("lead")
        lead_obj = Lead(**lead_val) if isinstance(lead_val, dict) else None

        link_val = tx_data.get("link")
        link_obj = Target(**link_val) if isinstance(link_val, dict) else None

        return TransactionDetail(
            id=tx_data["id"],
            signature=tx_data.get("signature", "5fJ8...2K9L"),
            status=tx_data.get("status", "confirmed"),
            time=tx_data.get("time", "02:43:18 UTC"),
            amountLamports=tx_data.get("amountLamports", 0),
            fromWalletId=from_w,
            toWalletId=to_w,
            fromWallet=from_w,
            toWallet=to_w,
            progress=progress_obj,
            lead=lead_obj,
            counterparty=tx_data.get("counterparty"),
            direction=tx_data.get("direction", "out"),
            key=tx_data.get("key", False),
            flagged=tx_data.get("flagged", False),
            link=link_obj,
        )

    @staticmethod
    async def get_evidence_prompt(case_id: str) -> EvidencePrompt | None:
        """Retrieve deduction choices prompt dynamically from case database."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            return None
        p_data = json.loads(c.prompt_json)
        return EvidencePrompt(
            caseId=c.id,
            destinationWalletIds=p_data.get("destinationWalletIds", []),
            scenarios=[ScenarioOption(**s) for s in p_data.get("scenarios", [])],
            theoryPlaceholder=p_data.get("theoryPlaceholder", "Explain the trail..."),
        )

    @staticmethod
    async def evaluate_submission(
        case_id: str, user_id: str, req: EvidenceSubmissionRequest
    ) -> CaseOutcome:
        """Evaluate deduction against dynamic secret truth configured for this case."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            c = build_default_case_001()

        score = 0
        correct_traces = 0

        # Destination check
        if req.destination == c.secret_destination:
            score += 40
            correct_traces += 3
        elif req.destination != "treasury":
            score += 20
            correct_traces += 1

        # Scenario check
        if req.scenario == c.secret_scenario:
            score += 40
            correct_traces += 2
        elif req.scenario in ["direct", "swapped"]:
            score += 15

        # Theory text analysis using dynamic key terms
        theory_lower = req.theory.lower()
        key_terms = json.loads(c.key_terms_json)
        matched_terms = [t for t in key_terms if t in theory_lower]
        theory_points = min(20, len(matched_terms) * 5)
        score += theory_points

        evidence_list = await storage.get_evidence_list(user_id, case_id)

        outcome = CaseOutcome(
            caseId=case_id,
            title=c.title,
            summary=(
                "You followed the trail to the end. The vault mysteries have been decoded."
                if score >= 80
                else "Case closed, but some gaps remain in the forensic reconstruction."
            ),
            score=min(100, score),
            maxScore=100,
            clues=ClueScore(found=min(5, len(evidence_list) + 3), total=5),
            evidenceCollected=len(evidence_list),
            traces=TraceScore(correct=min(5, correct_traces), total=5),
            hintsUsed=0,
        )

        await storage.save_outcome(user_id, case_id, outcome.model_dump())
        return outcome

    @staticmethod
    async def get_outcome(case_id: str, user_id: str) -> CaseOutcome | None:
        """Retrieve player's saved case outcome."""
        data = await storage.get_outcome(user_id, case_id)
        if data:
            return CaseOutcome(**data)
        return None

    @staticmethod
    async def get_default_outcome(case_id: str) -> CaseOutcome | None:
        """Retrieve a default solved preview outcome for a case."""
        await CaseService.ensure_initial_seed()
        c = await storage.get_case_by_id(case_id)
        if not c:
            return None
        return CaseOutcome(
            caseId=case_id,
            title=c.title,
            summary="You followed the trail to the end. The vault mysteries have been decoded.",
            score=100,
            maxScore=100,
            clues=ClueScore(found=5, total=5),
            evidenceCollected=2,
            traces=TraceScore(correct=5, total=5),
            hintsUsed=0,
        )

