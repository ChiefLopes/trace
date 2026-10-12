"""Google Sign-In authentication verification and token exchange service."""

import logging
from typing import Any
from google.auth.transport import requests
from google.oauth2 import id_token
import httpx
from src.config import settings

logger = logging.getLogger("trace.auth.google")


async def verify_google_id_token(token: str) -> dict[str, Any] | None:
    """Verify a Google ID Token (from Google Identity Services / One Tap).

    Validates signature, issuer (accounts.google.com), and audience (if configured).
    Returns user payload containing email, name, sub, picture or None if invalid.
    """
    if not token or not token.strip():
        return None

    clean_token = token.strip()

    # 1. Primary verification using Google Auth Python library
    try:
        req = requests.Request()
        audience = settings.google_client_id if settings.google_client_id else None
        id_info = id_token.verify_oauth2_token(clean_token, req, audience=audience)
        if id_info.get("iss") in ["accounts.google.com", "https://accounts.google.com"]:
            return id_info
    except Exception as e:
        logger.debug(f"google-auth local verification failed ({e}), checking tokeninfo endpoint...")

    # 2. Async fallback to Google OAuth2 tokeninfo endpoint
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": clean_token},
            )
            if resp.status_code == 200:
                payload = resp.json()
                if payload.get("iss") in ["accounts.google.com", "https://accounts.google.com"]:
                    if settings.google_client_id and payload.get("aud") != settings.google_client_id:
                        logger.warning("Google token audience mismatch")
                        return None
                    return payload
    except Exception as e:
        logger.warning(f"Google tokeninfo HTTP verification error: {e}")

    return None


async def exchange_google_code(code: str) -> dict[str, Any] | None:
    """Exchange an OAuth2 authorization code for Google user info."""
    if not settings.google_client_id or not settings.google_client_secret:
        logger.warning("Google Client ID or Client Secret not configured for code exchange")
        return None

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if token_resp.status_code != 200:
                logger.warning(f"Google code exchange failed: {token_resp.text}")
                return None

            token_data = token_resp.json()
            id_tok = token_data.get("id_token")
            if id_tok:
                return await verify_google_id_token(id_tok)

            # Fallback to userinfo endpoint using access token
            access_token = token_data.get("access_token")
            if access_token:
                userinfo_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if userinfo_resp.status_code == 200:
                    return userinfo_resp.json()
    except Exception as e:
        logger.error(f"Error during Google authorization code exchange: {e}")

    return None


def get_google_auth_url() -> str:
    """Generate the Google OAuth2 consent screen authorization URL."""
    client_id = settings.google_client_id or "GOOGLE_CLIENT_ID_NOT_CONFIGURED"
    redirect_uri = settings.google_redirect_uri
    scope = "openid email profile"
    return (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"access_type=offline&"
        f"prompt=consent"
    )
