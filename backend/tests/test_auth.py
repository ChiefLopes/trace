import base58
from cryptography.hazmat.primitives.asymmetric import ed25519
from httpx import Client


def test_signup_and_login_flow(client: Client):
    # 1. Signup returns Bearer JWT with TTL
    signup_payload = {
        "username": "AgentDiva",
        "email": "diva@trace.game",
        "password": "Password123!",
    }
    resp = client.post("/api/auth/signup", json=signup_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "diva@trace.game"
    assert data["user"]["username"] == "AgentDiva"
    assert data["tokenType"] == "Bearer"
    assert data["expiresIn"] == 60 * 24 * 60  # 24 hours TTL in seconds
    token = data["token"]
    assert len(token) > 20

    # 2. Duplicate signup rejected
    dup_resp = client.post("/api/auth/signup", json=signup_payload)
    assert dup_resp.status_code == 409

    # 3. Session returns authenticated user when Bearer token header is sent
    session_resp = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert session_resp.status_code == 200
    assert session_resp.json()["authenticated"] is True
    assert session_resp.json()["user"]["email"] == "diva@trace.game"

    # 4. Session without Authorization header returns unauthenticated
    session_noauth = client.get("/api/auth/session")
    assert session_noauth.status_code == 200
    assert session_noauth.json()["authenticated"] is False

    # 5. Logout blacklists the token in Redis
    logout_resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 204

    # 6. Session with the blacklisted token is now rejected / revoked
    session_revoked = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert session_revoked.status_code == 200
    assert session_revoked.json()["authenticated"] is False

    # 7. Accessing a protected endpoint with the blacklisted token returns 401
    protected_resp = client.put(
        "/api/user/investigator",
        headers={"Authorization": f"Bearer {token}"},
        json={"investigatorId": "officer-2"},
    )
    assert protected_resp.status_code == 401
    assert "revoked" in protected_resp.json()["detail"].lower()

    # 8. Login generates a fresh valid token
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "diva@trace.game", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    new_token = login_resp.json()["token"]
    assert new_token != token

    # 9. New token works
    session_new = client.get("/api/auth/session", headers={"Authorization": f"Bearer {new_token}"})
    assert session_new.status_code == 200
    assert session_new.json()["authenticated"] is True


def test_solana_wallet_connect_auth_flow(client: Client):
    """Test full Sign-In with Solana (SIWS) challenge and signature verification with JWT."""
    # Generate real Ed25519 Solana keypair
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    pub_bytes = public_key.public_bytes_raw()
    wallet_address = base58.b58encode(pub_bytes).decode("ascii")

    # 1. Request challenge for this wallet
    chal_resp = client.post(
        "/api/auth/wallet/challenge",
        json={"wallet": wallet_address},
    )
    assert chal_resp.status_code == 200
    chal_data = chal_resp.json()
    assert chal_data["wallet"] == wallet_address
    assert "nonce" in chal_data
    assert "TRACE Security Authentication" in chal_data["message"]
    challenge_message = chal_data["message"]

    # 2. Sign challenge message with wallet's private key
    sig_bytes = private_key.sign(challenge_message.encode("utf-8"))
    signature_b58 = base58.b58encode(sig_bytes).decode("ascii")

    # 3. Verify signature
    verify_resp = client.post(
        "/api/auth/wallet/verify",
        json={
            "wallet": wallet_address,
            "signature": signature_b58,
            "message": challenge_message,
        },
    )
    assert verify_resp.status_code == 200
    auth_data = verify_resp.json()
    assert auth_data["user"]["walletAddress"] == wallet_address
    assert auth_data["tokenType"] == "Bearer"
    token = auth_data["token"]

    # 4. Check session with Bearer header
    session_resp = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert session_resp.status_code == 200
    assert session_resp.json()["authenticated"] is True
    assert session_resp.json()["user"]["walletAddress"] == wallet_address

    # 5. Blacklist token on logout
    logout_resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 204

    # 6. Blacklisted token no longer authenticated
    session_revoked = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert session_revoked.status_code == 200
    assert session_revoked.json()["authenticated"] is False


def test_solana_wallet_invalid_signature_rejected(client: Client):
    """Test that a forged signature from another keypair fails verification."""
    private_key1 = ed25519.Ed25519PrivateKey.generate()
    wallet_address = base58.b58encode(private_key1.public_key().public_bytes_raw()).decode("ascii")
    private_key2 = ed25519.Ed25519PrivateKey.generate()

    chal_resp = client.post(
        "/api/auth/wallet/challenge",
        json={"wallet": wallet_address},
    )
    challenge_message = chal_resp.json()["message"]

    fraudulent_sig = base58.b58encode(private_key2.sign(challenge_message.encode("utf-8"))).decode("ascii")

    verify_resp = client.post(
        "/api/auth/wallet/verify",
        json={
            "wallet": wallet_address,
            "signature": fraudulent_sig,
            "message": challenge_message,
        },
    )
    assert verify_resp.status_code == 401
    assert "verification failed" in verify_resp.json()["detail"].lower()
