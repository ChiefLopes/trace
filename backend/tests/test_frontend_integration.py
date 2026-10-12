"""Integration tests verifying backend routes and schemas for the Next.js frontend."""

from fastapi.testclient import TestClient


def test_dual_prefix_routing(client: TestClient):
    """Verify routes are accessible both with and without the /api prefix."""
    # 1. Cases list
    resp_with = client.get("/api/cases")
    assert resp_with.status_code == 200
    resp_without = client.get("/cases")
    assert resp_without.status_code == 200
    assert resp_with.json() == resp_without.json()

    # 2. Case brief
    b_with = client.get("/api/cases/case-001")
    assert b_with.status_code == 200
    b_without = client.get("/cases/case-001")
    assert b_without.status_code == 200
    assert b_with.json() == b_without.json()

    # 3. Case workspace
    ws_with = client.get("/api/cases/case-001/workspace")
    assert ws_with.status_code == 200
    ws_without = client.get("/cases/case-001/workspace")
    assert ws_without.status_code == 200
    assert ws_with.json() == ws_without.json()

    # 4. Investigators
    inv_with = client.get("/api/investigators")
    assert inv_with.status_code == 200
    inv_without = client.get("/investigators")
    assert inv_without.status_code == 200
    assert inv_with.json() == inv_without.json()

    # 5. Health check
    h_with = client.get("/api/health")
    assert h_with.status_code == 200
    h_without = client.get("/health")
    assert h_without.status_code == 200


def test_me_and_dashboard_routes(client: TestClient):
    """Verify /me and /me/dashboard endpoints return schemas matching frontend Zod contracts."""
    # 1. /me without auth (returns guest/default profile)
    resp = client.get("/me")
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "displayName" in data
    assert "avatar" in data
    assert "src" in data["avatar"]

    # 2. /api/me
    api_resp = client.get("/api/me")
    assert api_resp.status_code == 200
    assert api_resp.json() == data

    # 3. /me/dashboard
    dash_resp = client.get("/me/dashboard")
    assert dash_resp.status_code == 200
    dash = dash_resp.json()
    assert "activeCase" in dash
    assert dash["activeCase"]["id"] == "case-001"
    assert "objectives" in dash
    assert "completed" in dash["objectives"]
    assert "total" in dash["objectives"]
    assert "evidenceCount" in dash
    assert "academy" in dash
    assert "completed" in dash["academy"]
    assert "total" in dash["academy"]


def test_transaction_detail_schema_for_frontend(client: TestClient):
    """Verify transaction detail returns all fields required by frontend transactionSchema."""
    resp = client.get("/cases/case-001/transactions/tx-drain")
    assert resp.status_code == 200
    tx = resp.json()

    # Required by frontend transactionSchema:
    assert tx["id"] == "tx-drain"
    assert "signature" in tx
    assert tx["status"] in ("confirmed", "finalized", "failed")
    assert "time" in tx
    assert isinstance(tx["amountLamports"], int)
    assert tx["fromWalletId"] == "treasury"
    assert tx["toWalletId"] == "wallet-b"
    assert "progress" in tx
    assert "completed" in tx["progress"]
    assert "total" in tx["progress"]

    # Backward compatibility for existing backend assertions:
    assert tx["fromWallet"] == "treasury"
    assert tx["toWallet"] == "wallet-b"
