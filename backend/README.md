# TRACE — Backend

FastAPI service for TRACE, an onchain detective game built on Solana activity.

## Features

- **FastAPI 0.143+**: Modern lifespan handler, `Annotated` dependency injection, Pydantic v2 schemas.
- **Pure JWT Tokens with TTL**: No cookie-based sessions. All authenticated endpoints require `Authorization: Bearer <token>` with strict TTL expiration (`exp`) and unique JWT ID (`jti`).
- **Redis Token Blacklisting with DPI**: Uses FastAPI's Dependency Injection pattern (`get_blacklist_service`). On logout or revocation, the token's `jti` is stored in Redis with an auto-expiring TTL matching the token's remaining lifetime.
- **Sign-in with Solana (SIWS)**: Cryptographic challenge/nonce generation and off-chain Ed25519 signature verification against 32-byte Base58 Solana public keys.
- **Case Engine & Forensics**: Case dossiers, investigation workspace state, wallet & transaction analytics, notebook evidence pinning, deduction theory submission, and scoring engine.

## Getting Started

### 1. Requirements

- Python 3.11+
- Redis (running locally on port 6379, or configured via `REDIS_URL`)

### 2. Setup & Virtual Environment

```bash
cd backend
uv venv .venv
source .venv/bin/activate
uv pip install -e ".[dev]"
```

### 3. Run Development Server

```bash
uvicorn src.app:app --host 0.0.0.0 --port 8080 --reload
```

### 4. Run Test Suite

```bash
pytest -v
```

## API Highlights

- `POST /api/auth/signup` / `POST /api/auth/login`: Issue Bearer JWT with TTL.
- `POST /api/auth/wallet/challenge`: Generates a challenge message with nonce for a Solana wallet address.
- `POST /api/auth/wallet/verify`: Verifies Ed25519 signature from Solana wallet and issues Bearer JWT.
- `POST /api/auth/logout`: Revokes current JWT by adding `jti` to Redis blacklist with TTL via DPI.
- `GET /api/auth/session`: Validates current Bearer token against expiration and Redis blacklist.
- `GET /api/cases`: List available detective cases.
- `GET /api/cases/{caseId}/workspace`: Interactive investigation workspace state.
- `POST /api/cases/{caseId}/evidence`: Pin transactions/wallets to evidence board.
- `POST /api/cases/{caseId}/submit`: Submit final deduction theory and receive forensic score (0-100).
