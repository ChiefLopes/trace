"""Persistent database storage service implementing repository operations with SQLModel."""

from datetime import datetime, timezone
import json
from typing import Any
import uuid
from sqlmodel import delete, select
from src.database.models import (
    CaseOutcomeRecord,
    CaseRecord,
    EvidenceRecord,
    UserRecord,
    WalletChallengeRecord,
)
from src.database.session import get_async_session_maker


class DatabaseStorage:
    """Async database repository backed by SQLModel and AsyncEngine."""

    async def create_user(
        self,
        email: str | None = None,
        username: str | None = None,
        wallet_address: str | None = None,
        password_hash: str | None = None,
        selected_investigator_id: str = "tracy",
        role: str = "player",
        is_admin: bool = False,
    ) -> UserRecord:
        if not username:
            if wallet_address:
                username = f"Agent_{wallet_address[:4]}..{wallet_address[-4:]}"
            else:
                username = "Agent"

        user = UserRecord(
            id=str(uuid.uuid4()),
            email=email.lower() if email else None,
            username=username,
            wallet_address=wallet_address,
            password_hash=password_hash,
            selected_investigator_id=selected_investigator_id,
            role=role,
            is_admin=is_admin,
        )
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return user

    async def get_user_by_id(self, user_id: str) -> UserRecord | None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(select(UserRecord).where(UserRecord.id == user_id))
            return result.first()

    async def get_user_by_email(self, email: str) -> UserRecord | None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(select(UserRecord).where(UserRecord.email == email.lower()))
            return result.first()

    async def get_user_by_wallet(self, wallet_address: str) -> UserRecord | None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(UserRecord).where(UserRecord.wallet_address == wallet_address)
            )
            return result.first()

    async def update_user_investigator(
        self, user_id: str, investigator_id: str
    ) -> UserRecord | None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(select(UserRecord).where(UserRecord.id == user_id))
            user = result.first()
            if user:
                user.selected_investigator_id = investigator_id
                session.add(user)
                await session.commit()
                await session.refresh(user)
            return user

    async def set_wallet_challenge(
        self, wallet_address: str, challenge: dict[str, Any]
    ) -> None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(WalletChallengeRecord).where(
                    WalletChallengeRecord.wallet_address == wallet_address
                )
            )
            existing = result.first()
            if existing:
                existing.message = challenge["message"]
                existing.nonce = challenge["nonce"]
                session.add(existing)
            else:
                challenge_rec = WalletChallengeRecord(
                    wallet_address=wallet_address,
                    message=challenge["message"],
                    nonce=challenge["nonce"],
                )
                session.add(challenge_rec)
            await session.commit()

    async def get_wallet_challenge(self, wallet_address: str) -> dict[str, Any] | None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(WalletChallengeRecord).where(
                    WalletChallengeRecord.wallet_address == wallet_address
                )
            )
            rec = result.first()
            if rec:
                return {"message": rec.message, "nonce": rec.nonce}
            return None

    async def remove_wallet_challenge(self, wallet_address: str) -> None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            await session.exec(
                delete(WalletChallengeRecord).where(
                    WalletChallengeRecord.wallet_address == wallet_address
                )
            )
            await session.commit()

    async def add_evidence(
        self,
        user_id: str,
        case_id: str,
        kind: str,
        target_id: str,
        label: str,
        notes: str | None = None,
    ) -> EvidenceRecord:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(EvidenceRecord).where(
                    EvidenceRecord.user_id == user_id,
                    EvidenceRecord.case_id == case_id,
                    EvidenceRecord.kind == kind,
                    EvidenceRecord.target_id == target_id,
                )
            )
            existing = result.first()
            if existing:
                if notes:
                    existing.notes = notes
                    session.add(existing)
                    await session.commit()
                    await session.refresh(existing)
                return existing

            evidence_item = EvidenceRecord(
                id=str(uuid.uuid4()),
                user_id=user_id,
                case_id=case_id,
                kind=kind,
                target_id=target_id,
                label=label,
                notes=notes,
            )
            session.add(evidence_item)
            await session.commit()
            await session.refresh(evidence_item)
            return evidence_item

    async def get_evidence_list(self, user_id: str, case_id: str) -> list[EvidenceRecord]:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(EvidenceRecord).where(
                    EvidenceRecord.user_id == user_id,
                    EvidenceRecord.case_id == case_id,
                )
            )
            return list(result.all())

    async def remove_evidence(self, user_id: str, case_id: str, evidence_id: str) -> bool:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(EvidenceRecord).where(
                    EvidenceRecord.user_id == user_id,
                    EvidenceRecord.case_id == case_id,
                    EvidenceRecord.id == evidence_id,
                )
            )
            item = result.first()
            if item:
                await session.delete(item)
                await session.commit()
                return True
            return False

    async def save_outcome(
        self, user_id: str, case_id: str, outcome_data: dict[str, Any]
    ) -> None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(CaseOutcomeRecord).where(
                    CaseOutcomeRecord.user_id == user_id,
                    CaseOutcomeRecord.case_id == case_id,
                )
            )
            rec = result.first()
            json_str = json.dumps(outcome_data)
            if rec:
                rec.outcome_json = json_str
                session.add(rec)
            else:
                rec = CaseOutcomeRecord(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    case_id=case_id,
                    outcome_json=json_str,
                )
                session.add(rec)
            await session.commit()

    async def get_outcome(self, user_id: str, case_id: str) -> dict[str, Any] | None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(
                select(CaseOutcomeRecord).where(
                    CaseOutcomeRecord.user_id == user_id,
                    CaseOutcomeRecord.case_id == case_id,
                )
            )
            rec = result.first()
            if rec:
                return json.loads(rec.outcome_json)
            return None

    # Case Management Repository
    async def get_all_cases(self, published_only: bool = True) -> list[CaseRecord]:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            stmt = select(CaseRecord)
            if published_only:
                stmt = stmt.where(CaseRecord.is_published == True)
            stmt = stmt.order_by(CaseRecord.id)
            result = await session.exec(stmt)
            return list(result.all())

    async def get_case_by_id(self, case_id: str) -> CaseRecord | None:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(select(CaseRecord).where(CaseRecord.id == case_id))
            return result.first()

    async def create_or_update_case(self, case_record: CaseRecord) -> CaseRecord:
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            result = await session.exec(select(CaseRecord).where(CaseRecord.id == case_record.id))
            existing = result.first()
            if existing:
                data = case_record.model_dump(exclude={"id"})
                for k, v in data.items():
                    setattr(existing, k, v)
                existing.updated_at = datetime.now(timezone.utc)
                session.add(existing)
                await session.commit()
                await session.refresh(existing)
                return existing
            else:
                session.add(case_record)
                await session.commit()
                await session.refresh(case_record)
                return case_record

    async def clear_all(self, keep_cases: bool = False) -> None:
        """Utility for test suite to truncate tables."""
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            await session.exec(delete(EvidenceRecord))
            await session.exec(delete(CaseOutcomeRecord))
            await session.exec(delete(WalletChallengeRecord))
            await session.exec(delete(UserRecord))
            if not keep_cases:
                await session.exec(delete(CaseRecord))
            await session.commit()


storage = DatabaseStorage()


def get_storage() -> DatabaseStorage:
    """FastAPI Dependency for obtaining the database storage service."""
    return storage
