from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from src.auth.blacklist import TokenBlacklistService, get_blacklist_service
from src.auth.crypto import (
    generate_nonce,
    hash_password,
    is_valid_solana_address,
    verify_password,
    verify_solana_signature,
)
from src.auth.dependencies import (
    AuthenticatedContext,
    get_auth_context,
    get_auth_context_optional,
)
from src.auth.google import (
    exchange_google_code,
    get_google_auth_url,
    verify_google_id_token,
)
from src.auth.jwt import create_access_token
from src.auth.models import (
    ActiveCaseSummary,
    AuthResponse,
    AvatarObject,
    CurrentUserResponse,
    DashboardProgress,
    DashboardSummaryResponse,
    GoogleAuthRequest,
    GoogleAuthUrlResponse,
    LoginRequest,
    SessionResponse,
    SignupRequest,
    UserResponse,
    WalletChallengeRequest,
    WalletChallengeResponse,
    WalletVerifyRequest,
    XAuthRequest,
    XAuthUrlResponse,
)
from src.auth.x import (
    exchange_x_code,
    get_x_auth_url,
    get_x_user_profile,
    save_state_to_redis,
)
from src.database.storage import storage

router = APIRouter(prefix="/auth", tags=["auth"])
me_router = APIRouter(tags=["profile"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """Register a new user with email and password, returning a JWT with TTL."""
    existing = await storage.get_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = await storage.create_user(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
    )
    token, _, ttl = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        user=UserResponse(**user.to_dict()),
        token=token,
        tokenType="Bearer",
        expiresIn=ttl,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate with email and password, returning a JWT with TTL."""
    user = await storage.get_user_by_email(req.email)
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token, _, ttl = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        user=UserResponse(**user.to_dict()),
        token=token,
        tokenType="Bearer",
        expiresIn=ttl,
    )


@router.post("/wallet/challenge", response_model=WalletChallengeResponse)
async def wallet_challenge(req: WalletChallengeRequest):
    """
    Generate a cryptographic challenge message for a Solana wallet.
    The wallet signs this message off-chain to prove ownership of the private key.
    """
    if not is_valid_solana_address(req.wallet):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Solana public key",
        )

    nonce = generate_nonce()
    message = (
        f"TRACE Security Authentication\n\n"
        f"Sign this message to authenticate your Solana wallet with TRACE.\n\n"
        f"Wallet: {req.wallet}\n"
        f"Nonce: {nonce}\n"
    )
    await storage.set_wallet_challenge(req.wallet, {"message": message, "nonce": nonce})
    return WalletChallengeResponse(wallet=req.wallet, message=message, nonce=nonce)


@router.post("/wallet/verify", response_model=AuthResponse)
async def wallet_verify(req: WalletVerifyRequest):
    """
    Verify the Solana Ed25519 signature and authenticate/register the wallet owner,
    returning a Bearer JWT with TTL.
    """
    if not is_valid_solana_address(req.wallet):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Solana public key",
        )

    challenge = await storage.get_wallet_challenge(req.wallet)
    if not challenge or challenge["message"] != req.message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired wallet challenge message",
        )

    # Cryptographically verify the Ed25519 signature
    is_valid = verify_solana_signature(
        wallet_address=req.wallet,
        signature_b58=req.signature,
        message=req.message,
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Solana signature verification failed",
        )

    # Consume the challenge to prevent replay attacks
    await storage.remove_wallet_challenge(req.wallet)

    # Find or create user
    user = await storage.get_user_by_wallet(req.wallet)
    if not user:
        user = await storage.create_user(wallet_address=req.wallet)

    token, _, ttl = create_access_token({"sub": user.id, "wallet": user.wallet_address})
    return AuthResponse(
        user=UserResponse(**user.to_dict()),
        token=token,
        tokenType="Bearer",
        expiresIn=ttl,
    )


@router.get("/session", response_model=SessionResponse)
async def session(
    context: Annotated[AuthenticatedContext | None, Depends(get_auth_context_optional)],
):
    """Return the current session status and user data from Bearer JWT."""
    if not context:
        return SessionResponse(authenticated=False, user=None)
    return SessionResponse(authenticated=True, user=UserResponse(**context.user.to_dict()))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    context: Annotated[AuthenticatedContext, Depends(get_auth_context)],
    blacklist_service: Annotated[TokenBlacklistService, Depends(get_blacklist_service)],
):
    """
    Revoke the current Bearer JWT by adding its jti to the Redis blacklist with TTL.
    """
    await blacklist_service.blacklist_token(jti=context.jti, exp_timestamp=context.exp)
    return None


async def _authenticate_google_user(user_info: dict[str, Any]) -> AuthResponse:
    """Helper to find or create a user by Google email and issue JWT session."""
    email = user_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not return an email address",
        )

    # Check for existing user or create a new user
    user = await storage.get_user_by_email(email)
    if not user:
        name = user_info.get("name")
        sub = user_info.get("sub", "")
        username = name or (f"Agent_{sub[:6]}" if sub else email.split("@")[0])
        user = await storage.create_user(
            email=email,
            username=username,
        )

    token, _, ttl = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        user=UserResponse(**user.to_dict()),
        token=token,
        tokenType="Bearer",
        expiresIn=ttl,
    )


@router.get("/google/url", response_model=GoogleAuthUrlResponse)
@router.get("/google/signin/url", response_model=GoogleAuthUrlResponse)
@router.get("/signin/google/url", response_model=GoogleAuthUrlResponse)
async def google_auth_url():
    """Get the Google OAuth2 consent screen URL for redirect flow."""
    return GoogleAuthUrlResponse(url=get_google_auth_url())


@router.post("/google", response_model=AuthResponse)
@router.post("/google/signin", response_model=AuthResponse)
@router.post("/google/login", response_model=AuthResponse)
@router.post("/signin/google", response_model=AuthResponse)
@router.post("/login/google", response_model=AuthResponse)
async def google_auth(req: GoogleAuthRequest):
    """
    Authenticate or register a user with Google Sign-In (ID Token, One Tap Credential, or Auth Code).
    Returns a Bearer JWT with TTL.
    """
    token_str = req.credential or req.idToken
    user_info = None

    if token_str:
        user_info = await verify_google_id_token(token_str)
    elif req.code:
        user_info = await exchange_google_code(req.code)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google credential, idToken, or authorization code is required",
        )

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed or token is invalid",
        )

    return await _authenticate_google_user(user_info)


@router.get("/google/callback", response_model=AuthResponse)
async def google_callback(
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
):
    """
    Handle Google OAuth2 redirect callback with authorization code.
    Exchanges code for user credentials and returns a Bearer JWT.
    """
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {error}",
        )

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authorization code is required",
        )

    user_info = await exchange_google_code(code)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed or code is invalid",
        )

    return await _authenticate_google_user(user_info)


@router.post("/google/callback", response_model=AuthResponse)
async def google_callback_post(req: GoogleAuthRequest):
    """Handle Google OAuth2 POST callback (e.g. form_post or JSON payload)."""
    return await google_auth(req)


async def _authenticate_x_user(user_info: dict[str, Any]) -> AuthResponse:
    """Helper to find or create a user by X (Twitter) account and issue JWT session."""
    x_id = user_info.get("id") or user_info.get("sub")
    if not x_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X account did not return a user ID",
        )

    x_id_str = str(x_id)
    x_username = user_info.get("username")
    name = user_info.get("name")
    email = user_info.get("email")

    user = await storage.get_user_by_x_id(x_id_str)
    if not user and email:
        user = await storage.get_user_by_email(email)
        if user:
            await storage.link_x_account(user.id, x_id_str, x_username)
            user.x_id = x_id_str
            if x_username:
                user.x_username = x_username

    if not user:
        display_name = name or x_username or f"Agent_{x_id_str[:6]}"
        user = await storage.create_user(
            email=email,
            username=display_name,
            x_id=x_id_str,
            x_username=x_username,
        )
    elif x_username and user.x_username != x_username:
        await storage.link_x_account(user.id, x_id_str, x_username)
        user.x_username = x_username

    token, _, ttl = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "username": user.username,
            "x_id": user.x_id,
        }
    )
    return AuthResponse(
        user=UserResponse(**user.to_dict()),
        token=token,
        tokenType="Bearer",
        expiresIn=ttl,
    )


@router.get("/x/url", response_model=XAuthUrlResponse)
@router.get("/x/signin/url", response_model=XAuthUrlResponse)
@router.get("/signin/x/url", response_model=XAuthUrlResponse)
@router.get("/twitter/url", response_model=XAuthUrlResponse)
async def x_auth_url(
    redirect_uri: str | None = None,
    state: str | None = None,
    code_verifier: str | None = None,
):
    """Get the X (Twitter) OAuth 2.0 PKCE consent screen URL."""
    auth_data = get_x_auth_url(
        redirect_uri=redirect_uri,
        state=state,
        code_verifier=code_verifier,
    )
    await save_state_to_redis(auth_data["state"], auth_data["code_verifier"])
    return XAuthUrlResponse(
        url=auth_data["url"],
        state=auth_data["state"],
        codeVerifier=auth_data["code_verifier"],
    )


@router.post("/x", response_model=AuthResponse)
@router.post("/x/signin", response_model=AuthResponse)
@router.post("/x/login", response_model=AuthResponse)
@router.post("/signin/x", response_model=AuthResponse)
@router.post("/login/x", response_model=AuthResponse)
@router.post("/twitter", response_model=AuthResponse)
async def x_auth(req: XAuthRequest):
    """
    Authenticate or register a user with X (Twitter) OAuth 2.0 (Auth code or Access Token).
    Returns a Bearer JWT with TTL.
    """
    user_info = None

    if req.access_token:
        user_info = await get_x_user_profile(req.access_token)
    elif req.code:
        user_info = await exchange_x_code(
            code=req.code,
            code_verifier=req.code_verifier,
            state=req.state,
            redirect_uri=req.redirect_uri,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X authorization code or access token is required",
        )

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X authentication failed or credentials are invalid",
        )

    return await _authenticate_x_user(user_info)


@router.get("/x/callback", response_model=AuthResponse)
@router.get("/callback/x", response_model=AuthResponse)
@router.get("/twitter/callback", response_model=AuthResponse)
async def x_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
):
    """
    Handle X (Twitter) OAuth2 redirect callback with authorization code.
    Exchanges code with PKCE for user credentials and returns a Bearer JWT.
    """
    if error:
        detail_msg = f"X OAuth error: {error}"
        if error_description:
            detail_msg += f" ({error_description})"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail_msg,
        )

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X authorization code is required",
        )

    user_info = await exchange_x_code(code=code, state=state)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X authentication failed or code is invalid",
        )

    return await _authenticate_x_user(user_info)


@router.post("/x/callback", response_model=AuthResponse)
@router.post("/callback/x", response_model=AuthResponse)
@router.post("/twitter/callback", response_model=AuthResponse)
async def x_callback_post(req: XAuthRequest):
    """Handle X (Twitter) OAuth2 POST callback (e.g. JSON payload forwarded from frontend)."""
    return await x_auth(req)


@me_router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_profile(
    context: Annotated[AuthenticatedContext | None, Depends(get_auth_context_optional)],
):
    """Retrieve profile for the currently logged-in player, or default guest identity."""
    if context and context.user:
        return CurrentUserResponse(
            id=context.user.id,
            displayName=context.user.username or "Investigator",
            avatar=AvatarObject(src="/avatars/diva-montess.jpg"),
        )
    return CurrentUserResponse(
        id="mock-user",
        displayName="Diva Montess",
        avatar=AvatarObject(src="/avatars/diva-montess.jpg"),
    )


@me_router.get("/me/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    context: Annotated[AuthenticatedContext | None, Depends(get_auth_context_optional)],
):
    """Retrieve active case, progress, and objectives summary for dashboard view."""
    evidence_count = 0
    if context and context.user:
        ev_items = await storage.get_evidence_list(context.user.id, "case-001")
        evidence_count = len(ev_items)

    return DashboardSummaryResponse(
        activeCase=ActiveCaseSummary(id="case-001", label="Case 001"),
        objectives=DashboardProgress(completed=min(1 + evidence_count, 5), total=5),
        evidenceCount=evidence_count,
        academy=DashboardProgress(completed=0, total=8),
    )

