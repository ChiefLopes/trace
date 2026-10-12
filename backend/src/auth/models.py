from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class WalletChallengeRequest(BaseModel):
    wallet: str = Field(description="Base58 encoded Solana public key")


class WalletChallengeResponse(BaseModel):
    wallet: str
    message: str
    nonce: str


class WalletVerifyRequest(BaseModel):
    wallet: str = Field(description="Base58 encoded Solana public key")
    signature: str = Field(description="Base58 encoded Ed25519 signature")
    message: str = Field(description="The challenge message signed by the wallet")


class UserResponse(BaseModel):
    id: str
    email: str | None = None
    username: str
    walletAddress: str | None = None
    selectedInvestigatorId: str = "tracy"
    createdAt: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    tokenType: str = "Bearer"
    expiresIn: int  # TTL in seconds


class SessionResponse(BaseModel):
    user: UserResponse | None = None
    authenticated: bool = False


class GoogleAuthRequest(BaseModel):
    idToken: str | None = None
    credential: str | None = None
    code: str | None = None


class GoogleAuthUrlResponse(BaseModel):
    url: str


class AvatarObject(BaseModel):
    src: str


class CurrentUserResponse(BaseModel):
    id: str
    displayName: str
    avatar: AvatarObject = Field(default_factory=lambda: AvatarObject(src="/avatars/diva-montess.jpg"))


class ActiveCaseSummary(BaseModel):
    id: str
    label: str


class DashboardProgress(BaseModel):
    completed: int
    total: int


class DashboardSummaryResponse(BaseModel):
    activeCase: ActiveCaseSummary | None = None
    objectives: DashboardProgress = Field(default_factory=lambda: DashboardProgress(completed=1, total=5))
    evidenceCount: int = 0
    academy: DashboardProgress = Field(default_factory=lambda: DashboardProgress(completed=0, total=8))

