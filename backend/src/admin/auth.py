"""Authentication provider for Starlette Admin panel with Role-Based Access Control (RBAC)."""

from starlette.requests import Request
from starlette.responses import Response
from starlette_admin.auth import AdminUser, AuthProvider
from starlette_admin.exceptions import LoginFailed
from src.auth.crypto import verify_password
from src.config import settings
from src.database.models import UserRecord
from src.database.session import get_async_session_maker
from src.database.storage import storage
from sqlmodel import select


class AdminAuthProvider(AuthProvider):
    """Provides secure session-based authentication for Starlette Admin with strict RBAC."""

    async def login(
        self,
        username: str,
        password: str,
        remember_me: bool,
        request: Request,
    ) -> Response | None:
        clean_user = username.strip()

        # 1. Direct match with configured master superadmin credentials from .env
        is_direct_user_match = clean_user in (settings.admin_username, settings.admin_email)
        is_direct_pass_match = password == settings.admin_password

        if is_direct_user_match and is_direct_pass_match:
            request.session["admin_user"] = settings.admin_username
            request.session["admin_role"] = "superadmin"
            return None

        # 2. Database validation against user record with RBAC enforcement
        user_record = await storage.get_user_by_email(clean_user)
        if not user_record:
            session_factory = get_async_session_maker()
            async with session_factory() as session:
                res = await session.exec(
                    select(UserRecord).where(UserRecord.username == clean_user)
                )
                user_record = res.first()

        if user_record and user_record.password_hash:
            if verify_password(password, user_record.password_hash):
                # Strict RBAC Check: User must have admin privileges
                if not (user_record.is_admin or user_record.role in ("admin", "superadmin")):
                    raise LoginFailed(
                        "Access denied: You do not have administrator privileges to access this panel."
                    )

                request.session["admin_user"] = user_record.username
                request.session["admin_role"] = user_record.role
                return None

        raise LoginFailed("Invalid administrator credentials")

    async def logout(self, request: Request) -> Response | None:
        request.session.clear()
        return None

    async def authenticate(self, request: Request) -> AdminUser | None:
        admin_user = request.session.get("admin_user")
        if not admin_user:
            return None

        # Superadmin from config always maintains access
        if admin_user == settings.admin_username:
            return AdminUser(username=admin_user)

        # Verify DB user still maintains active admin privileges
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            res = await session.exec(
                select(UserRecord).where(UserRecord.username == admin_user)
            )
            user = res.first()
            if user and (user.is_admin or user.role in ("admin", "superadmin")):
                return AdminUser(username=user.username)

        # Privilege revoked or user deleted
        request.session.clear()
        return None
