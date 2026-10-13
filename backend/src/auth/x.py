"""X (Twitter) OAuth 2.0 PKCE authentication and profile service."""

import base64
import hashlib
import logging
import secrets
import time
from typing import Any
import urllib.parse
import httpx
import jwt
from src.auth.blacklist import get_redis_client
from src.config import settings

logger = logging.getLogger("trace.auth.x")

STATE_TTL_SECONDS = 600  # 10 minutes


def generate_code_verifier(length: int = 48) -> str:
    """Generate an RFC 7636 compliant PKCE code verifier."""
    return secrets.token_urlsafe(length)[:length]


def create_code_challenge(code_verifier: str) -> str:
    """Generate S256 code challenge from code verifier (RFC 7636 Appendix B compliant)."""
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def create_state_token(code_verifier: str, additional_state: str | None = None) -> str:
    """Create a signed, tamper-proof state token containing the PKCE code_verifier."""
    payload = {
        "cv": code_verifier,
        "sub_state": additional_state,
        "typ": "x_oauth_state",
        "exp": int(time.time()) + STATE_TTL_SECONDS,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def verify_state_token(state: str) -> dict[str, Any] | None:
    """Verify and decode a signed state token to extract the code_verifier."""
    if not state:
        return None
    try:
        payload = jwt.decode(
            state,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("typ") != "x_oauth_state":
            return None
        return payload
    except Exception as e:
        logger.debug(f"State token decode/verification failed: {e}")
        return None


def get_x_auth_url(
    redirect_uri: str | None = None,
    state: str | None = None,
    code_verifier: str | None = None,
) -> dict[str, str]:
    """Generate the X (Twitter) OAuth 2.0 PKCE authorization consent URL."""
    client_id = settings.x_client_id or "X_CLIENT_ID_NOT_CONFIGURED"
    actual_redirect_uri = redirect_uri or settings.x_redirect_uri
    actual_verifier = code_verifier or generate_code_verifier()
    code_challenge = create_code_challenge(actual_verifier)

    actual_state = state or create_state_token(actual_verifier)

    scope = "tweet.read users.read offline.access"
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": actual_redirect_uri,
        "scope": scope,
        "state": actual_state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    url = f"https://twitter.com/i/oauth2/authorize?{urllib.parse.urlencode(params)}"
    return {
        "url": url,
        "state": actual_state,
        "code_verifier": actual_verifier,
    }


async def save_state_to_redis(state: str, code_verifier: str) -> None:
    """Optionally cache state and verifier in Redis if available."""
    try:
        redis_client = await get_redis_client()
        await redis_client.set(f"x_state:{state}", code_verifier, ex=STATE_TTL_SECONDS)
    except Exception as e:
        logger.debug(f"Could not persist x_state to Redis (fallback to JWT state): {e}")


async def get_verifier_for_state(state: str | None) -> str | None:
    """Resolve code_verifier from signed state token or Redis cache."""
    if not state:
        return None

    # 1. Stateless signature verification
    token_payload = verify_state_token(state)
    if token_payload and token_payload.get("cv"):
        return token_payload["cv"]

    # 2. Redis fallback
    try:
        redis_client = await get_redis_client()
        val = await redis_client.get(f"x_state:{state}")
        if val:
            return val.decode("utf-8") if isinstance(val, bytes) else str(val)
    except Exception:
        pass

    return None


async def get_x_user_profile(access_token: str) -> dict[str, Any] | None:
    """Fetch user profile from X API v2 /2/users/me endpoint using Bearer access token."""
    if not access_token:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.twitter.com/2/users/me",
                params={"user.fields": "id,name,username,profile_image_url"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                logger.warning(f"X /2/users/me request failed ({resp.status_code}): {resp.text}")
                return None

            body = resp.json()
            data = body.get("data")
            if not data or not data.get("id"):
                logger.warning(f"X /2/users/me response missing valid user data: {body}")
                return None

            return {
                "id": str(data["id"]),
                "username": data.get("username"),
                "name": data.get("name"),
                "picture": data.get("profile_image_url"),
            }
    except Exception as e:
        logger.error(f"Error requesting X user profile: {e}")
        return None


async def exchange_x_code(
    code: str,
    code_verifier: str | None = None,
    state: str | None = None,
    redirect_uri: str | None = None,
) -> dict[str, Any] | None:
    """Exchange OAuth 2.0 authorization code with PKCE for an X user profile."""
    if not settings.x_client_id or not settings.x_client_secret:
        logger.warning("X Client ID or Client Secret not configured for code exchange")
        return None

    actual_verifier = code_verifier
    if not actual_verifier and state:
        actual_verifier = await get_verifier_for_state(state)

    if not actual_verifier:
        logger.warning("X code exchange failed: no code_verifier provided or recovered from state")
        return None

    actual_redirect_uri = redirect_uri or settings.x_redirect_uri

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(
                "https://api.twitter.com/2/oauth2/token",
                auth=(settings.x_client_id, settings.x_client_secret),
                data={
                    "code": code,
                    "grant_type": "authorization_code",
                    "client_id": settings.x_client_id,
                    "redirect_uri": actual_redirect_uri,
                    "code_verifier": actual_verifier,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
            if token_resp.status_code != 200:
                logger.warning(f"X token exchange failed ({token_resp.status_code}): {token_resp.text}")
                return None

            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                logger.warning("X token response missing access_token")
                return None

            return await get_x_user_profile(access_token)
    except Exception as e:
        logger.error(f"Error during X authorization code exchange: {e}")
        return None
