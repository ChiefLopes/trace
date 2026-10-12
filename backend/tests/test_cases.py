from httpx import Client


def test_cases_listing_and_brief(client: Client):
    # 1. List cases
    resp = client.get("/api/cases")
    assert resp.status_code == 200
    cases = resp.json()
    assert len(cases) >= 1
    assert cases[0]["id"] == "case-001"

    # 2. Get case brief
    brief_resp = client.get("/api/cases/case-001")
    assert brief_resp.status_code == 200
    brief = brief_resp.json()
    assert brief["id"] == "case-001"
    assert brief["number"] == "Case 001"
    assert len(brief["brief"]) > 0
    assert len(brief["objectives"]) > 0

    # 3. Get case file
    file_resp = client.get("/api/cases/case-001/file")
    assert file_resp.status_code == 200
    cfile = file_resp.json()
    assert cfile["codename"] == "The Missing Treasury"
    assert cfile["knownInformation"]["initialWallet"] == "7XH3\u00a0.\u00a0.\u00a0.\u00a092KD"
    assert cfile["knownInformation"]["missingAmount"] == "20 SOL"


def test_workspace_and_forensics(client: Client):
    # 1. Get workspace
    ws_resp = client.get("/api/cases/case-001/workspace")
    assert ws_resp.status_code == 200
    ws = ws_resp.json()
    assert ws["caseId"] == "case-001"
    assert ws["investigating"]["label"] == "Treasury Wallet"
    assert len(ws["trail"]) == 5
    assert ws["lead"] is not None
    assert ws["lead"]["target"]["id"] == "tx-drain"

    # 2. Get wallet details
    wallet_resp = client.get("/api/cases/case-001/wallets/treasury")
    assert wallet_resp.status_code == 200
    wallet = wallet_resp.json()
    assert wallet["label"] == "Treasury Wallet"
    assert len(wallet["activity"]) > 0

    # 3. Get transaction details
    tx_resp = client.get("/api/cases/case-001/transactions/tx-drain")
    assert tx_resp.status_code == 200
    tx = tx_resp.json()
    assert tx["fromWallet"] == "treasury"
    assert tx["toWallet"] == "wallet-b"
