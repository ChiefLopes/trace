"""Async database engine, session management, and schema initialization."""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from src.config import settings

_engine: AsyncEngine | None = None
_session_maker: async_sessionmaker[AsyncSession] | None = None


def get_async_engine(database_url: str | None = None) -> AsyncEngine:
    """Retrieve or create the singleton AsyncEngine for the application."""
    global _engine, _session_maker
    target_url = database_url or settings.async_database_url

    if _engine is None:
        connect_args = {}
        if "sqlite" in target_url:
            connect_args["check_same_thread"] = False

        _engine = create_async_engine(
            target_url,
            echo=False,
            future=True,
            connect_args=connect_args,
        )
        _session_maker = async_sessionmaker(
            bind=_engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _engine


def get_async_session_maker() -> async_sessionmaker[AsyncSession]:
    """Get the current async session maker."""
    global _session_maker
    if _session_maker is None:
        get_async_engine()
    assert _session_maker is not None
    return _session_maker


async def init_db(engine: AsyncEngine | None = None) -> None:
    """Create all SQLModel database tables if they do not exist."""
    active_engine = engine or get_async_engine()
    async with active_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Dispose of the database engine and cleanup connection pools."""
    global _engine, _session_maker
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_maker = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for obtaining an async database session."""
    session_factory = get_async_session_maker()
    async with session_factory() as session:
        yield session
