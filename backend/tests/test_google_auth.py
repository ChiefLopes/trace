"""Tests for Google Sign-In and OAuth endpoints."""

from unittest.mock import AsyncMock, patch
from httpx import Client


def test_google_auth_url(client: Client):
    """Verify that /api/auth/google/url returns a valid Google OAuth consent URL."""
    resp = client.get("/api/auth/google/url")
    assert resp.status_code == 200
    data = resp.json()
    assert "url" in data
    assert "https://accounts.google.com/o/oauth2/v2/auth" in data["url"]
    assert "response_type=code" in data["url"]


def test_google_auth_missing_credentials(client: Client):
    """Verify 400 Bad Request when no token, credential, or code is provided."""
    resp = client.post("/api/auth/google", json={})
    assert resp.status_code == 400
    assert "required" in resp.json()["detail"].lower()


def test_google_auth_invalid_token(client: Client):
    """Verify 401 Unauthorized when an invalid token is provided."""
    resp = client.post("/api/auth/google", json={"idToken": "invalid.jwt.token"})
    assert resp.status_code == 401
    assert "failed" in resp.json()["detail"].lower()


@patch("src.auth.routes.verify_google_id_token", new_callable=AsyncMock)
def test_google_auth_success_and_session(mock_verify: AsyncMock, client: Client):
    """Verify successful Google Sign-In with new user creation and subsequent login."""
    mock_verify.return_value = {
        "email": "agent.smith@gmail.com",
        "name": "Agent Smith",
        "sub": "google-sub-987654",
        "picture": "https://lh3.googleusercontent.com/avatar",
    }

    # 1. Sign-in registers new user and issues Bearer JWT
    resp = client.post("/api/auth/google", json={"credential": "mock-google-credential-token"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["tokenType"] == "Bearer"
    assert data["expiresIn"] == 60 * 24 * 60
    assert data["user"]["email"] == "agent.smith@gmail.com"
    assert data["user"]["username"] == "Agent Smith"
    token = data["token"]
    user_id = data["user"]["id"]

    # 2. Session check confirms authenticated state
    session_resp = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert session_resp.status_code == 200
    assert session_resp.json()["authenticated"] is True
    assert session_resp.json()["user"]["id"] == user_id

    # 3. Second sign-in with same Google email signs into the existing user
    resp_again = client.post("/api/auth/google", json={"idToken": "mock-google-id-token"})
    assert resp_again.status_code == 200
    assert resp_again.json()["user"]["id"] == user_id


@patch("src.auth.routes.verify_google_id_token", new_callable=AsyncMock)
def test_google_auth_signin_aliases(mock_verify: AsyncMock, client: Client):
    """Verify alias routes /google/signin, /signin/google, and /login/google work identically."""
    mock_verify.return_value = {
        "email": "alias.agent@gmail.com",
        "name": "Alias Agent",
        "sub": "google-sub-alias",
    }

    # URL alias
    url_resp = client.get("/api/auth/google/signin/url")
    assert url_resp.status_code == 200
    assert "https://accounts.google.com" in url_resp.json()["url"]

    # /google/signin alias
    resp1 = client.post("/api/auth/google/signin", json={"idToken": "valid-token"})
    assert resp1.status_code == 200
    assert resp1.json()["user"]["email"] == "alias.agent@gmail.com"

    # /signin/google alias
    resp2 = client.post("/api/auth/signin/google", json={"idToken": "valid-token"})
    assert resp2.status_code == 200
    assert resp2.json()["user"]["email"] == "alias.agent@gmail.com"

    # /login/google alias
    resp3 = client.post("/api/auth/login/google", json={"idToken": "valid-token"})
    assert resp3.status_code == 200
    assert resp3.json()["user"]["email"] == "alias.agent@gmail.com"


@patch("src.auth.routes.exchange_google_code", new_callable=AsyncMock)
def test_google_callback_flow(mock_exchange: AsyncMock, client: Client):
    """Verify GET and POST /api/auth/google/callback redirect and code handling."""
    mock_exchange.return_value = {
        "email": "callback.agent@gmail.com",
        "name": "Callback Agent",
        "sub": "google-sub-callback",
    }

    # 1. Successful GET callback with code
    resp = client.get("/api/auth/google/callback?code=mock-auth-code-123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["tokenType"] == "Bearer"
    assert data["user"]["email"] == "callback.agent@gmail.com"

    # 2. Missing code returns 400
    missing_resp = client.get("/api/auth/google/callback")
    assert missing_resp.status_code == 400
    assert "code is required" in missing_resp.json()["detail"].lower()

    # 3. OAuth error returns 400
    error_resp = client.get("/api/auth/google/callback?error=access_denied")
    assert error_resp.status_code == 400
    assert "access_denied" in error_resp.json()["detail"].lower()

    # 4. Invalid code returns 401
    mock_exchange.return_value = None
    invalid_resp = client.get("/api/auth/google/callback?code=bad-code")
    assert invalid_resp.status_code == 401
    assert "failed" in invalid_resp.json()["detail"].lower()

    # 5. Successful POST callback with code
    mock_exchange.return_value = {
        "email": "post.callback@gmail.com",
        "name": "Post Callback",
        "sub": "google-sub-post-cb",
    }
    post_cb_resp = client.post("/api/auth/google/callback", json={"code": "mock-post-code"})
    assert post_cb_resp.status_code == 200
    assert post_cb_resp.json()["user"]["email"] == "post.callback@gmail.com"

