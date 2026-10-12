"""Database driver resolution and normalization utilities."""


def resolve_async_database_url(url: str | None) -> str:
    """Dynamically append or normalize the database driver for SQLAlchemy/SQLModel async engine.

    Handles:
    - None or empty string -> "sqlite+aiosqlite:///./trace.db"
    - "sqlite:///..." -> "sqlite+aiosqlite:///..."
    - "sqlite://..." -> "sqlite+aiosqlite://..."
    - "sqlite+aiosqlite:///..." -> preserved
    - "postgres://..." -> "postgresql+asyncpg://..."
    - "postgresql://..." (without driver) -> "postgresql+asyncpg://..."
    - "postgresql+asyncpg://..." -> preserved
    - "postgresql+psycopg://..." -> preserved
    """
    if not url or not url.strip():
        return "sqlite+aiosqlite:///./trace.db"

    clean_url = url.strip()

    # Normalize legacy postgres:// protocol to postgresql+asyncpg://
    if clean_url.startswith("postgres://"):
        return "postgresql+asyncpg://" + clean_url[len("postgres://") :]

    # Standard postgresql:// without driver to postgresql+asyncpg://
    if clean_url.startswith("postgresql://") and not clean_url.startswith("postgresql+"):
        return "postgresql+asyncpg://" + clean_url[len("postgresql://") :]

    # Standard sqlite:// without driver to sqlite+aiosqlite://
    if clean_url.startswith("sqlite://") and not clean_url.startswith("sqlite+"):
        return "sqlite+aiosqlite://" + clean_url[len("sqlite://") :]

    return clean_url
