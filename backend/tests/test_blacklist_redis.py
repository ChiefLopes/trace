from datetime import datetime, timezone
import pytest
from src.auth.blacklist import TokenBlacklistService, get_blacklist_service, get_redis_client


@pytest.mark.asyncio
async def test_token_blacklist_service_direct():
    """Directly test TokenBlacklistService methods and TTL behavior."""
    redis = await get_redis_client()
    service = TokenBlacklistService(redis_client=redis)

    jti = "test-jti-abc-123"
    # Token expiring in 10 seconds
    now_ts = int(datetime.now(timezone.utc).timestamp())
    exp_ts = now_ts + 10

    # 1. Initially not blacklisted
    assert await service.is_token_blacklisted(jti) is False

    # 2. Blacklist token
    await service.blacklist_token(jti, exp_ts)
    assert await service.is_token_blacklisted(jti) is True

    # 3. Verify Redis key and TTL exist
    key = service._key(jti)
    val = await redis.get(key)
    assert val == "revoked"
    ttl = await redis.ttl(key)
    assert 0 < ttl <= 10


@pytest.mark.asyncio
async def test_dpi_provider():
    """Verify FastAPI Dependency Injection provider creates service with redis client."""
    redis = await get_redis_client()
    service = await get_blacklist_service(redis_client=redis)
    assert isinstance(service, TokenBlacklistService)
    assert service.redis is redis
