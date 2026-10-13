"""Tests for X (Twitter) Sign-In, PKCE, and OAuth endpoints."""

from unittest.mock import AsyncMock, patch
from httpx import Client
from src.auth.x import (
    create_code_challenge,
    create_state_token,
    generate_code_verifier,
    get_x_auth_url,
    verify_state_token,
)
from src.config import settings


def test_pkce_helpers():
    """Verify PKCE verifier, challenge, and state roundtrip."""
    verifier = generate_code_verifier(48)
    assert len(verifier) >= 43

    # RFC 7636 Appendix B test vector
    rfc_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    assert create_code_challenge(rfc_verifier) == "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

    challenge = create_code_challenge(verifier)
    assert challenge and "=" not in challenge

    state = create_state_token(verifier, additional_state="test-param")
    decoded = verify_state_token(state)
    assert decoded is not None
    assert decoded["cv"] == verifier
    assert decoded["sub_state"] == "test-param"

    # Corrupted state
    assert verify_state_token("corrupted.state.jwt") is None


def test_x_auth_url(client: Client):
    """Verify that /api/auth/x/url returns a valid X OAuth 2.0 PKCE consent URL with configured credentials."""
    resp = client.get("/api/auth/x/url")
    assert resp.status_code == 200
    data = resp.json()

    assert "url" in data
    assert "state" in data
    assert "codeVerifier" in data

    url = data["url"]
    assert "https://twitter.com/i/oauth2/authorize" in url
    assert "response_type=code" in url
    assert "code_challenge_method=S256" in url
    assert f"client_id={settings.x_client_id}" in url
    assert "trace-brown-ten.vercel.app%2Fapi%2Fauth%2Fcallback%2Fx" in url
    assert "scope=tweet.read+users.read+offline.access" in url or "scope=tweet.read%20users.read" in url

    # State can be decoded to match codeVerifier
    decoded = verify_state_token(data["state"])
    assert decoded["cv"] == data["codeVerifier"]


def test_x_auth_url_custom_params(client: Client):
    """Verify custom redirect_uri and custom state in authorization URL."""
    custom_cb = "https://custom.example.com/callback"
    resp = client.get(f"/api/auth/x/url?redirect_uri={custom_cb}&state=my-state")
    assert resp.status_code == 200
    data = resp.json()
    assert "custom.example.com" in data["url"]
    assert "state=my-state" in data["url"]


def test_x_auth_missing_credentials(client: Client):
    """Verify 400 Bad Request when no code or access token is provided."""
    resp = client.post("/api/auth/x", json={})
    assert resp.status_code == 400
    assert "required" in resp.json()["detail"].lower()


def test_x_auth_invalid_credentials(client: Client):
    """Verify 401 Unauthorized when exchange fails or returns None."""
    resp = client.post(
        "/api/auth/x",
        json={"code": "invalid-code", "codeVerifier": "fake-verifier"},
    )
    assert resp.status_code == 401
    assert "failed" in resp.json()["detail"].lower()


@patch("src.auth.routes.exchange_x_code", new_callable=AsyncMock)
def test_x_auth_success_and_session(mock_exchange: AsyncMock, client: Client):
    """Verify successful X Sign-In with new user creation and subsequent login session."""
    mock_exchange.return_value = {
        "id": "1849123456789",
        "username": "cryptodetective",
        "name": "Crypto Detective",
        "picture": "https://pbs.twimg.com/avatar.jpg",
    }

    # 1. Sign-in registers new user and issues Bearer JWT
    resp = client.post(
        "/api/auth/x",
        json={"code": "valid-x-auth-code", "codeVerifier": "valid-pkce-verifier"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["tokenType"] == "Bearer"
    assert data["expiresIn"] == 60 * 24 * 60
    assert data["user"]["xId"] == "1849123456789"
    assert data["user"]["xUsername"] == "cryptodetective"
    assert data["user"]["username"] == "Crypto Detective"
    token = data["token"]
    user_id = data["user"]["id"]

    # 2. Session check confirms authenticated state
    session_resp = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert session_resp.status_code == 200
    assert session_resp.json()["authenticated"] is True
    assert session_resp.json()["user"]["id"] == user_id
    assert session_resp.json()["user"]["xId"] == "1849123456789"

    # 3. Subsequent sign-in with same X user logs into the existing user
    resp_again = client.post(
        "/api/auth/x",
        json={"code": "another-code", "codeVerifier": "verifier"},
    )
    assert resp_again.status_code == 200
    assert resp_again.json()["user"]["id"] == user_id


@patch("src.auth.routes.get_x_user_profile", new_callable=AsyncMock)
def test_x_auth_with_access_token(mock_profile: AsyncMock, client: Client):
    """Verify sign-in with direct access token."""
    mock_profile.return_value = {
        "id": "9988776655",
        "username": "token_holder",
        "name": "Token Holder",
    }

    resp = client.post("/api/auth/x", json={"accessToken": "x-bearer-access-token"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["xId"] == "9988776655"
    assert data["user"]["xUsername"] == "token_holder"


@patch("src.auth.routes.exchange_x_code", new_callable=AsyncMock)
def test_x_auth_signin_aliases(mock_exchange: AsyncMock, client: Client):
    """Verify alias routes /x/signin, /signin/x, /login/x, and /twitter work identically."""
    mock_exchange.return_value = {
        "id": "alias-user-555",
        "username": "alias_detective",
        "name": "Alias Detective",
    }

    # URL alias
    url_resp = client.get("/api/auth/x/signin/url")
    assert url_resp.status_code == 200
    assert "https://twitter.com" in url_resp.json()["url"]

    url_resp2 = client.get("/api/auth/signin/x/url")
    assert url_resp2.status_code == 200
    assert "https://twitter.com" in url_resp2.json()["url"]

    url_resp3 = client.get("/api/auth/twitter/url")
    assert url_resp3.status_code == 200
    assert "https://twitter.com" in url_resp3.json()["url"]

    # /x/signin alias
    resp1 = client.post("/api/auth/x/signin", json={"code": "code1", "codeVerifier": "v1"})
    assert resp1.status_code == 200
    assert resp1.json()["user"]["xId"] == "alias-user-555"

    # /signin/x alias
    resp2 = client.post("/api/auth/signin/x", json={"code": "code2", "codeVerifier": "v2"})
    assert resp2.status_code == 200
    assert resp2.json()["user"]["xId"] == "alias-user-555"

    # /login/x alias
    resp3 = client.post("/api/auth/login/x", json={"code": "code3", "codeVerifier": "v3"})
    assert resp3.status_code == 200
    assert resp3.json()["user"]["xId"] == "alias-user-555"

    # /twitter alias
    resp4 = client.post("/api/auth/twitter", json={"code": "code4", "codeVerifier": "v4"})
    assert resp4.status_code == 200
    assert resp4.json()["user"]["xId"] == "alias-user-555"


@patch("src.auth.routes.exchange_x_code", new_callable=AsyncMock)
def test_x_callback_flow(mock_exchange: AsyncMock, client: Client):
    """Verify GET and POST /api/auth/callback/x and /api/auth/x/callback handling."""
    mock_exchange.return_value = {
        "id": "callback-x-user",
        "username": "callback_agent",
        "name": "Callback Agent",
    }

    # 1. Successful GET callback with code and state to /api/auth/callback/x
    resp = client.get("/api/auth/callback/x?code=mock-x-code-123&state=mock-state-abc")
    assert resp.status_code == 200
    data = resp.json()
    assert data["tokenType"] == "Bearer"
    assert data["user"]["xId"] == "callback-x-user"
    assert data["user"]["xUsername"] == "callback_agent"

    # 2. Successful GET callback to /api/auth/x/callback alias
    resp_alias = client.get("/api/auth/x/callback?code=mock-x-code-456&state=mock-state-xyz")
    assert resp_alias.status_code == 200
    assert resp_alias.json()["user"]["xId"] == "callback-x-user"

    # 3. Missing code returns 400
    missing_resp = client.get("/api/auth/callback/x")
    assert missing_resp.status_code == 400
    assert "code is required" in missing_resp.json()["detail"].lower()

    # 4. OAuth error returns 400
    error_resp = client.get("/api/auth/callback/x?error=access_denied&error_description=User%20denied")
    assert error_resp.status_code == 400
    assert "access_denied" in error_resp.json()["detail"].lower()

    # 5. Invalid code returns 401
    mock_exchange.return_value = None
    invalid_resp = client.get("/api/auth/callback/x?code=bad-code")
    assert invalid_resp.status_code == 401
    assert "failed" in invalid_resp.json()["detail"].lower()

    # 6. Successful POST callback to /api/auth/callback/x
    mock_exchange.return_value = {
        "id": "post-callback-x-user",
        "username": "post_cb_agent",
        "name": "Post Callback Agent",
    }
    post_cb_resp = client.post(
        "/api/auth/callback/x",
        json={"code": "mock-post-code", "codeVerifier": "mock-verifier"},
    )
    assert post_cb_resp.status_code == 200
    assert post_cb_resp.json()["user"]["xId"] == "post-callback-x-user"

    # 7. Successful POST callback to /api/auth/x/callback
    post_cb_resp2 = client.post(
        "/api/auth/x/callback",
        json={"code": "mock-post-code", "codeVerifier": "mock-verifier"},
    )
    assert post_cb_resp2.status_code == 200
    assert post_cb_resp2.json()["user"]["xId"] == "post-callback-x-user"
