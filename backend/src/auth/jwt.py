from datetime import datetime, timedelta, timezone
from typing import Any
import uuid
import jwt
from src.config import settings


def create_access_token(
    payload: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> tuple[str, str, int]:
    """
    Create a signed JWT token with jti and ttl.
    Returns: (token_str, jti, ttl_seconds)
    """
    to_encode = payload.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
        ttl_seconds = int(expires_delta.total_seconds())
    else:
        ttl_seconds = settings.jwt_expiration_minutes * 60
        expire = now + timedelta(seconds=ttl_seconds)

    token_jti = uuid.uuid4().hex
    to_encode.update({
        "iat": now,
        "exp": expire,
        "jti": token_jti,
    })
    token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token, token_jti, ttl_seconds


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a signed JWT token, enforcing expiration."""
    try:
        decoded = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "iat", "jti", "sub"]},
        )
        return decoded
    except (jwt.PyJWTError, Exception):
        return None
