"""Tests for database dynamic driver resolution and SQLModel persistence."""

import pytest
from src.database.drivers import resolve_async_database_url
from src.database.models import UserRecord
from src.database.storage import DatabaseStorage


def test_resolve_async_database_url():
    """Verify dynamic driver resolution for various database URL schemes."""
    # SQLite normalization
    assert resolve_async_database_url("sqlite:///./trace.db") == "sqlite+aiosqlite:///./trace.db"
    assert resolve_async_database_url("sqlite:///:memory:") == "sqlite+aiosqlite:///:memory:"
    assert (
        resolve_async_database_url("sqlite+aiosqlite:///./trace.db")
        == "sqlite+aiosqlite:///./trace.db"
    )

    # PostgreSQL normalization
    assert (
        resolve_async_database_url("postgres://user:secret@db.example.com:5432/trace")
        == "postgresql+asyncpg://user:secret@db.example.com:5432/trace"
    )
    assert (
        resolve_async_database_url("postgresql://user:secret@db.example.com:5432/trace")
        == "postgresql+asyncpg://user:secret@db.example.com:5432/trace"
    )
    assert (
        resolve_async_database_url("postgresql+asyncpg://user:secret@db.example.com:5432/trace")
        == "postgresql+asyncpg://user:secret@db.example.com:5432/trace"
    )

    # Empty / None fallback
    assert resolve_async_database_url("") == "sqlite+aiosqlite:///./trace.db"
    assert resolve_async_database_url(None) == "sqlite+aiosqlite:///./trace.db"


@pytest.mark.asyncio
async def test_persistent_database_storage_operations():
    """Verify SQLModel persistent database storage operations end-to-end."""
    db_storage = DatabaseStorage()

    # Create user
    user = await db_storage.create_user(
        email="detective@trace.game",
        username="DetectiveHolmes",
        password_hash="hashed_pw_test",
    )
    assert user.id is not None
    assert user.email == "detective@trace.game"
    assert user.username == "DetectiveHolmes"

    # Query by ID, email
    by_id = await db_storage.get_user_by_id(user.id)
    assert by_id is not None
    assert by_id.username == "DetectiveHolmes"

    by_email = await db_storage.get_user_by_email("detective@trace.game")
    assert by_email is not None
    assert by_email.id == user.id

    # Update investigator
    updated = await db_storage.update_user_investigator(user.id, "bruce")
    assert updated is not None
    assert updated.selected_investigator_id == "bruce"

    # Wallet challenge
    wallet = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    await db_storage.set_wallet_challenge(wallet, {"message": "sign this", "nonce": "abc123nonce"})
    challenge = await db_storage.get_wallet_challenge(wallet)
    assert challenge is not None
    assert challenge["nonce"] == "abc123nonce"

    await db_storage.remove_wallet_challenge(wallet)
    assert await db_storage.get_wallet_challenge(wallet) is None

    # Evidence notebook persistence
    ev = await db_storage.add_evidence(
        user_id=user.id,
        case_id="case-001",
        kind="wallet",
        target_id="exchange-wallet",
        label="Deposit Hot Wallet",
        notes="High volume receiver",
    )
    assert ev.id is not None

    evidence_list = await db_storage.get_evidence_list(user.id, "case-001")
    assert len(evidence_list) == 1
    assert evidence_list[0].target_id == "exchange-wallet"

    # Outcome persistence
    await db_storage.save_outcome(user.id, "case-001", {"score": 95, "status": "solved"})
    outcome = await db_storage.get_outcome(user.id, "case-001")
    assert outcome is not None
    assert outcome["score"] == 95

    # Delete evidence
    removed = await db_storage.remove_evidence(user.id, "case-001", ev.id)
    assert removed is True
    evidence_after = await db_storage.get_evidence_list(user.id, "case-001")
    assert len(evidence_after) == 0
