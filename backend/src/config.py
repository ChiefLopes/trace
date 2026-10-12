from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TRACE API"
    environment: str = "development"
    host: str = "0.0.0.0"
    port: int = 8080
    secret_key: str = "trace-secret-dev-key-change-in-prod-32-bytes"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24  # 24 hours TTL
    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "sqlite:///./trace.db"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    admin_username: str = "admin"
    admin_email: str = "admin@tracegame.io"
    admin_password: str = "TraceAdminSecret2026!"
    admin_secret_key: str = "trace-admin-secret-session-key-32-bytes"

    # Google OAuth / Sign-In
    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str = "http://localhost:3000/api/auth/callback/google"

    @property
    def async_database_url(self) -> str:
        from src.database.drivers import resolve_async_database_url

        return resolve_async_database_url(self.database_url)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
