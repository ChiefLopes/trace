from typing import Annotated, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from src.auth.blacklist import TokenBlacklistService, get_blacklist_service
from src.auth.jwt import decode_access_token
from src.database.storage import UserRecord, storage

# FastAPI HTTPBearer security scheme auto-extracts the token and renders the Swagger UI padlock interface
bearer_scheme = HTTPBearer(
    auto_error=False,
    description="JWT Bearer token. Enter your JWT token without the 'Bearer ' prefix.",
)


class AuthenticatedContext:
    """Holds authenticated user record and the current token's claims."""

    def __init__(self, user: UserRecord, token_claims: dict[str, Any], raw_token: str):
        self.user = user
        self.token_claims = token_claims
        self.raw_token = raw_token

    @property
    def jti(self) -> str:
        return self.token_claims["jti"]

    @property
    def exp(self) -> int:
        return int(self.token_claims["exp"])


async def get_auth_context_optional(
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    blacklist_service: Annotated[TokenBlacklistService, Depends(get_blacklist_service)],
) -> AuthenticatedContext | None:
    """
    Auto-extracts Bearer JWT via FastAPI HTTPBearer DPI scheme,
    validates signature and TTL, and checks Redis blacklist.
    """
    if not auth or not auth.credentials:
        return None

    token = auth.credentials.strip()
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload or "jti" not in payload:
        return None

    # Check Redis blacklist via injected service
    if await blacklist_service.is_token_blacklisted(payload["jti"]):
        return None

    user = await storage.get_user_by_id(payload["sub"])
    if not user:
        return None

    return AuthenticatedContext(user=user, token_claims=payload, raw_token=token)


async def get_current_user_optional(
    context: Annotated[AuthenticatedContext | None, Depends(get_auth_context_optional)],
) -> UserRecord | None:
    """Extract authenticated user if available."""
    return context.user if context else None


async def get_auth_context(
    context: Annotated[AuthenticatedContext | None, Depends(get_auth_context_optional)],
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthenticatedContext:
    """
    Require valid authenticated context.
    Triggers Swagger UI padlock security requirement on the route.
    """
    if not auth or not auth.credentials or not context:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required or token revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return context


async def get_current_user(
    context: Annotated[AuthenticatedContext, Depends(get_auth_context)],
) -> UserRecord:
    """Require authenticated user."""
    return context.user
