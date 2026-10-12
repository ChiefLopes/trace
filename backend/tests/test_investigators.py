from httpx import Client


def test_investigators_list_and_update(client: Client):
    # 1. List investigators (public)
    resp = client.get("/api/investigators")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["investigators"]) == 4
    assert data["featured"]["id"] == "tracy"

    # 2. Update without auth fails with 401
    unauth_resp = client.put(
        "/api/user/investigator",
        json={"investigatorId": "officer-2"},
    )
    assert unauth_resp.status_code == 401

    # 3. Signup and obtain JWT
    signup_resp = client.post(
        "/api/auth/signup",
        json={"username": "DetectiveTest", "email": "detective@trace.game", "password": "Password123!"},
    )
    assert signup_resp.status_code == 201
    token = signup_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Update investigator to Agent Diva ("officer-2") with Bearer JWT
    update_resp = client.put(
        "/api/user/investigator",
        headers=headers,
        json={"investigatorId": "officer-2"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["selectedInvestigatorId"] == "officer-2"

    # 5. Check session reflects updated investigator
    session_resp = client.get("/api/auth/session", headers=headers)
    assert session_resp.status_code == 200
    assert session_resp.json()["user"]["selectedInvestigatorId"] == "officer-2"
