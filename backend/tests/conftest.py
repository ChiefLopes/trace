import asyncio
import fakeredis.aioredis
from fastapi.testclient import TestClient
import pytest
from src.admin import seed_all
from src.app import app
from src.auth.blacklist import get_redis_client
from src.database.session import init_db
from src.database.storage import storage


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Reset database tables and wire isolated fake Redis for each test."""
    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())
    loop.run_until_complete(storage.clear_all())
    loop.run_until_complete(seed_all())

    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    app.dependency_overrides[get_redis_client] = lambda: fake_redis

    yield

    loop.run_until_complete(storage.clear_all())
    loop.close()
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """TestClient for synchronous testing of FastAPI application."""
    with TestClient(app, base_url="http://test") as c:
        yield c
