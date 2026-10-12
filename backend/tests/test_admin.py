"""Tests for Starlette Admin panel authentication, RBAC, and case management."""

import json
import re
from httpx import Client
import pytest
from src.admin.seeder import seed_admin_user
from src.auth.crypto import hash_password
from src.config import settings
from src.database.models import CaseRecord
from src.database.storage import storage


@pytest.mark.asyncio
async def test_admin_seeding():
    """Verify that seed_admin_user creates the admin user with superadmin RBAC."""
    admin = await seed_admin_user()
    assert admin is not None
    assert admin.username == settings.admin_username
    assert admin.email == settings.admin_email
    assert admin.role == "superadmin"
    assert admin.is_admin is True
    assert admin.password_hash is not None

    # Idempotent re-seed
    admin_again = await seed_admin_user()
    assert admin_again.id == admin.id


@pytest.mark.asyncio
async def test_rbac_non_admin_user_rejected(client: Client):
    """Verify that regular player accounts without admin privileges cannot access Starlette Admin."""
    # Create regular player
    player = await storage.create_user(
        email="player@tracegame.io",
        username="casual_player",
        password_hash=hash_password("playerpass123"),
        role="player",
        is_admin=False,
    )
    assert player.is_admin is False

    # Get CSRF token
    login_page = client.get("/admin/login")
    csrf_match = re.search(r'name="csrftoken"\s+value="([^"]+)"', login_page.text)
    csrf_token = csrf_match.group(1)

    # Attempt login to Starlette Admin with player credentials
    resp = client.post(
        "/admin/login",
        data={
            "username": "casual_player",
            "password": "playerpass123",
            "csrftoken": csrf_token,
        },
        follow_redirects=False,
    )
    # Must be rejected (400 Bad Request with LoginFailed)
    assert resp.status_code == 400
    assert "access denied" in resp.text.lower() or "privileges" in resp.text.lower()


@pytest.mark.asyncio
async def test_rbac_promoted_admin_user_accepted(client: Client):
    """Verify that a promoted admin user (is_admin=True) can authenticate into Starlette Admin."""
    # Create an investigator who is given admin rights
    officer = await storage.create_user(
        email="officer_admin@tracegame.io",
        username="officer_admin",
        password_hash=hash_password("officerpass123"),
        role="admin",
        is_admin=True,
    )
    assert officer.is_admin is True

    # Get CSRF token
    login_page = client.get("/admin/login")
    csrf_match = re.search(r'name="csrftoken"\s+value="([^"]+)"', login_page.text)
    csrf_token = csrf_match.group(1)

    # Login to Starlette Admin
    resp = client.post(
        "/admin/login",
        data={
            "username": "officer_admin",
            "password": "officerpass123",
            "csrftoken": csrf_token,
        },
        follow_redirects=False,
    )
    assert resp.status_code == 303
    assert "/admin" in resp.headers.get("location", "")


def test_admin_panel_access_and_auth_flow(client: Client):
    """Verify Starlette Admin unauthenticated redirect, login, and dashboard access."""
    # 1. Unauthenticated request to /admin/ redirects to login
    resp = client.get("/admin/", follow_redirects=False)
    assert resp.status_code in (301, 302, 303, 307, 308)
    assert "/admin/login" in resp.headers.get("location", "")

    # 2. GET /admin/login serves the login page and provides CSRF token in the form
    login_page = client.get("/admin/login")
    assert login_page.status_code == 200
    csrf_match = re.search(r'name="csrftoken"\s+value="([^"]+)"', login_page.text)
    assert csrf_match is not None
    csrf_token = csrf_match.group(1)

    # 3. Invalid credentials rejected
    bad_login = client.post(
        "/admin/login",
        data={
            "username": "admin",
            "password": "wrong-password",
            "csrftoken": csrf_token,
        },
        follow_redirects=False,
    )
    assert bad_login.status_code in (400, 422)

    # 4. Valid login with configured credentials succeeds and redirects to dashboard
    good_login = client.post(
        "/admin/login",
        data={
            "username": settings.admin_username,
            "password": settings.admin_password,
            "csrftoken": csrf_token,
        },
        follow_redirects=False,
    )
    assert good_login.status_code == 303
    assert "/admin" in good_login.headers.get("location", "")

    # 5. Accessing admin dashboard with authenticated session succeeds
    dashboard = client.get("/admin/")
    assert dashboard.status_code == 200
    assert f"{settings.app_name} Admin Panel" in dashboard.text


@pytest.mark.asyncio
async def test_dynamic_case_addition_via_database(client: Client):
    """Verify that adding a new case to the database table immediately exposes it to players without code updates."""
    # Add a brand new Case 002 directly to the database (as an admin would in Starlette Admin)
    case_002 = CaseRecord(
        id="case-002",
        number="Case 002",
        title="The PumpFun Rugpull Heist",
        codename="Operation Ghost Liquidity",
        difficulty="Advanced",
        status="open",
        is_published=True,
        brief_json=json.dumps(
            [
                "A memecoin dev dumped 500 SOL of liquidity into a fresh burner wallet.",
                "Follow the trail through the mixer to find where the SOL was extracted.",
            ]
        ),
        objectives_json=json.dumps(
            [
                "Find the dump transaction on Raydium/PumpFun",
                "Trace the split transfers across burner accounts",
                "Identify the final destination",
            ]
        ),
        known_info_json=json.dumps(
            {
                "initialWallet": "PumpDev...1111",
                "missingAmount": "500 SOL",
                "approximateTime": "14:22 UTC",
            }
        ),
        workspace_json=json.dumps(
            {
                "hint": "Check Raydium pool interactions around 14:22 UTC.",
                "investigating": {
                    "id": "dev-wallet",
                    "label": "Dev Wallet",
                    "address": "PumpDev...1111",
                    "balanceLamports": 0,
                    "transactionCount": 12,
                    "tokenCount": 1,
                },
                "timeline": [],
                "trail": [{"id": "dev-wallet", "label": "Dev Wallet", "address": "PumpDev...1111"}],
                "otherWallets": [],
            }
        ),
        wallets_json=json.dumps(
            {
                "dev-wallet": {
                    "id": "dev-wallet",
                    "label": "Dev Wallet",
                    "address": "PumpDev...1111",
                    "description": "Origin of the rugpull.",
                    "balanceLamports": 0,
                    "transactionCount": 12,
                    "tokenCount": 1,
                    "firstActivity": "2026-10-09",
                    "lastActivity": "2026-10-10",
                    "activity": [],
                }
            }
        ),
        transactions_json=json.dumps({}),
        prompt_json=json.dumps(
            {
                "destinationWalletIds": ["burner-wallet", "exchange-kraken"],
                "scenarios": [
                    {"id": "mixer", "label": "Laundered through privacy pool"},
                    {"id": "direct", "label": "Direct deposit to exchange"},
                ],
                "theoryPlaceholder": "Explain the dev's exit path...",
            }
        ),
        secret_destination="exchange-kraken",
        secret_scenario="mixer",
        key_terms_json=json.dumps(["raydium", "liquidity", "dump", "mixer"]),
    )

    await storage.create_or_update_case(case_002)

    # Player calls GET /api/cases - Case 002 immediately appears!
    cases_resp = client.get("/api/cases")
    assert cases_resp.status_code == 200
    cases_list = cases_resp.json()
    case_ids = [c["id"] for c in cases_list]
    assert "case-001" in case_ids
    assert "case-002" in case_ids

    # Player retrieves dossier for Case 002
    file_resp = client.get("/api/cases/case-002/file")
    assert file_resp.status_code == 200
    file_data = file_resp.json()
    assert file_data["codename"] == "Operation Ghost Liquidity"
    assert file_data["difficulty"] == "Advanced"

    # Player retrieves workspace for Case 002
    ws_resp = client.get("/api/cases/case-002/workspace")
    assert ws_resp.status_code == 200
    assert ws_resp.json()["codename"] == "Operation Ghost Liquidity"
