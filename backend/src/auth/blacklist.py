import logging
from datetime import datetime, timezone
from typing import Annotated
from fastapi import Depends
import redis.asyncio as aioredis
from src.config import settings

logger = logging.getLogger("trace.blacklist")

# Global async redis connection pool
_redis_client: aioredis.Redis | None = None
_in_memory_blacklist: dict[str, int] = {}


async def get_redis_client() -> aioredis.Redis | None:
    """FastAPI Dependency for Redis client with graceful fallback."""
    global _redis_client
    if _redis_client is None and settings.redis_url:
        try:
            client = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2.0,
            )
            # Verify connectivity
            await client.ping()
            _redis_client = client
        except Exception as e:
            logger.warning(f"Redis connection failed ({e}). Falling back to in-memory blacklist.")
            return None
    return _redis_client


async def close_redis_client() -> None:
    """Close the Redis client pool on application shutdown."""
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
        except Exception:
            pass
        _redis_client = None


class TokenBlacklistService:
    """Service to handle JWT revocation and blacklisting in Redis with in-memory fallback."""

    def __init__(self, redis_client: aioredis.Redis | None = None):
        self.redis = redis_client

    @staticmethod
    def _key(jti: str) -> str:
        return f"trace:blacklist:{jti}"

    async def blacklist_token(self, jti: str, exp_timestamp: int) -> None:
        """
        Blacklist a token by its jti.
        Sets TTL to remaining lifetime of the token so Redis auto-prunes it.
        """
        now_ts = int(datetime.now(timezone.utc).timestamp())
        remaining_ttl = max(1, exp_timestamp - now_ts)

        if self.redis is not None:
            try:
                await self.redis.set(self._key(jti), "revoked", ex=remaining_ttl)
                return
            except Exception as e:
                logger.warning(f"Failed to blacklist token in Redis: {e}. Storing in memory.")

        _in_memory_blacklist[jti] = exp_timestamp

    async def is_token_blacklisted(self, jti: str) -> bool:
        """Check if a token's jti is in the Redis blacklist (or in-memory fallback)."""
        if self.redis is not None:
            try:
                val = await self.redis.get(self._key(jti))
                return val is not None
            except Exception as e:
                logger.warning(f"Failed to query Redis blacklist: {e}. Falling back to memory.")

        exp_ts = _in_memory_blacklist.get(jti)
        if exp_ts is not None:
            now_ts = int(datetime.now(timezone.utc).timestamp())
            if now_ts < exp_ts:
                return True
            else:
                _in_memory_blacklist.pop(jti, None)
        return False


async def get_blacklist_service(
    redis_client: Annotated[aioredis.Redis | None, Depends(get_redis_client)],
) -> TokenBlacklistService:
    """FastAPI Dependency Injection (DPI) provider for TokenBlacklistService."""
    return TokenBlacklistService(redis_client=redis_client)
