"""Admin database seeder for startup execution."""

import logging
from src.auth.crypto import hash_password, verify_password
from src.cases.service import CaseService
from src.config import settings
from src.database.models import UserRecord
from src.database.session import get_async_session_maker
from src.database.storage import storage

logger = logging.getLogger("trace.admin.seeder")


async def seed_admin_user() -> UserRecord:
    """Ensure the administrator account from environment variables is seeded in the database with superadmin RBAC."""
    admin_email = settings.admin_email.strip().lower()
    admin_user = await storage.get_user_by_email(admin_email)

    if not admin_user:
        logger.info(f"Seeding new admin user: {settings.admin_username} ({admin_email})")
        admin_user = await storage.create_user(
            email=admin_email,
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            selected_investigator_id="bruce",
            role="superadmin",
            is_admin=True,
        )
    else:
        # Ensure admin user has role=superadmin, is_admin=True, and current password
        session_factory = get_async_session_maker()
        async with session_factory() as session:
            admin_user.role = "superadmin"
            admin_user.is_admin = True
            if not admin_user.password_hash or not verify_password(
                settings.admin_password, admin_user.password_hash
            ):
                logger.info(f"Updating admin password credentials for: {admin_email}")
                admin_user.password_hash = hash_password(settings.admin_password)
            session.add(admin_user)
            await session.commit()
            await session.refresh(admin_user)

    return admin_user


async def seed_initial_cases() -> None:
    """Ensure default gameplay cases exist in database."""
    await CaseService.ensure_initial_seed()


async def seed_all() -> None:
    """Run full startup database seeders."""
    await seed_initial_cases()
    await seed_admin_user()
