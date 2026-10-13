from httpx import Client


def test_full_evidence_pinning_and_scoring_flow(client: Client):
    # 1. Login user to get JWT
    signup_resp = client.post(
        "/api/auth/signup",
        json={"username": "ForensicLead", "email": "lead@trace.game", "password": "Password123!"},
    )
    assert signup_resp.status_code == 201
    token = signup_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Workspace initially has 0 evidence
    ws_resp = client.get("/api/cases/case-001/workspace", headers=headers)
    assert ws_resp.status_code == 200
    assert ws_resp.json()["evidenceCount"] == 0

    # 3. Pin evidence items (wallet and transaction)
    pin1_resp = client.post(
        "/api/cases/case-001/evidence",
        headers=headers,
        json={
            "kind": "transaction",
            "targetId": "tx-drain",
            "label": "20 SOL Drain from Treasury",
            "notes": "Unauthorized outflow at 02:43 UTC",
        },
    )
    assert pin1_resp.status_code == 201

    pin2_resp = client.post(
        "/api/cases/case-001/evidence",
        headers=headers,
        json={
            "kind": "wallet",
            "targetId": "wallet-b",
            "label": "First Receiver Wallet B",
            "notes": "Fresh wallet receiving the 20 SOL",
        },
    )
    assert pin2_resp.status_code == 201

    # 4. List evidence
    ev_list_resp = client.get("/api/cases/case-001/evidence", headers=headers)
    assert ev_list_resp.status_code == 200
    evidence_items = ev_list_resp.json()
    assert len(evidence_items) == 2

    # 5. Check workspace updates evidenceCount and objectives
    ws_resp2 = client.get("/api/cases/case-001/workspace", headers=headers)
    assert ws_resp2.status_code == 200
    assert ws_resp2.json()["evidenceCount"] == 2
    assert ws_resp2.json()["objectives"][0]["done"] is True
    assert ws_resp2.json()["objectives"][1]["done"] is True

    # 6. Fetch deduction prompt
    prompt_resp = client.get("/api/cases/case-001/evidence-prompt")
    assert prompt_resp.status_code == 200
    prompt = prompt_resp.json()
    assert "exchange" in prompt["destinationWalletIds"]

    # 7. Submit final theory
    submit_resp = client.post(
        "/api/cases/case-001/submit",
        headers=headers,
        json={
            "destination": "exchange",
            "scenario": "layered",
            "theory": (
                "The 20 SOL left the treasury at 02:43 UTC, hopped through fresh wallets "
                "Wallet B and Wallet C, then Wallet D, and ended up cashed out at the exchange wallet."
            ),
        },
    )
    assert submit_resp.status_code == 200
    outcome = submit_resp.json()
    assert outcome["score"] == 100
    assert outcome["traces"]["correct"] == 5
    assert outcome["clues"]["found"] == 5
    assert outcome["evidenceCollected"] == 2

    # 8. Retrieve saved outcome
    get_outcome_resp = client.get("/api/cases/case-001/outcome", headers=headers)
    assert get_outcome_resp.status_code == 200
    assert get_outcome_resp.json()["score"] == 100


def test_evidence_list_api_and_deletion_by_id(client: Client):
    # 1. Sign up user
    signup = client.post(
        "/api/auth/signup",
        json={"username": "EvidenceInspector", "email": "inspector@trace.game", "password": "Password123!"},
    )
    assert signup.status_code == 201
    headers = {"Authorization": f"Bearer {signup.json()['token']}"}

    # 2. GET initially returns empty list, not a string
    initial_resp = client.get("/api/cases/case-001/evidence", headers=headers)
    assert initial_resp.status_code == 200
    initial_items = initial_resp.json()
    assert isinstance(initial_items, list)
    assert not isinstance(initial_items, str)
    assert len(initial_items) == 0

    # 3. Add an evidence item
    add_resp = client.post(
        "/api/cases/case-001/evidence",
        headers=headers,
        json={
            "id": "evidence-123",
            "kind": "wallet",
            "targetId": "wallet-b",
            "label": "Wallet B",
        },
    )
    assert add_resp.status_code == 201
    added_item = add_resp.json()
    assert added_item["id"] == "evidence-123"
    assert added_item["kind"] == "wallet"
    assert added_item["targetId"] == "wallet-b"
    assert added_item["label"] == "Wallet B"

    # 4. GET evidence returns JSON list with matching id, kind, targetId, label
    list_resp = client.get("/api/cases/case-001/evidence", headers=headers)
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert isinstance(items, list)
    assert not isinstance(items, str)
    assert len(items) == 1
    assert items[0] == {
        "id": "evidence-123",
        "kind": "wallet",
        "targetId": "wallet-b",
        "label": "Wallet B",
    }

    # 5. DELETE evidence accepts that same id
    evidence_id = items[0]["id"]
    delete_resp = client.delete(f"/api/cases/case-001/evidence/{evidence_id}", headers=headers)
    assert delete_resp.status_code == 204

    # 6. Verify item is removed
    after_delete_resp = client.get("/api/cases/case-001/evidence", headers=headers)
    assert after_delete_resp.status_code == 200
    assert after_delete_resp.json() == []

    # 7. DELETE with non-existent id returns 404
    not_found_resp = client.delete(f"/api/cases/case-001/evidence/{evidence_id}", headers=headers)
    assert not_found_resp.status_code == 404


def test_unauthenticated_evidence_access(client: Client):
    # Unauthenticated GET returns a JSON list, not a string
    res = client.get("/api/cases/case-001/evidence")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert not isinstance(data, str)

    # Pin an item as unauthenticated guest
    post_res = client.post(
        "/api/cases/case-001/evidence",
        json={
            "kind": "transaction",
            "targetId": "tx-guest",
            "label": "Guest TX Evidence",
        },
    )
    assert post_res.status_code == 201
    item = post_res.json()
    assert item["id"].startswith("evidence-")
    assert item["kind"] == "transaction"
    assert item["targetId"] == "tx-guest"
    assert item["label"] == "Guest TX Evidence"

    # Delete with that id
    del_res = client.delete(f"/api/cases/case-001/evidence/{item['id']}")
    assert del_res.status_code == 204


