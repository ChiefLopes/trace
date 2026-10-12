"""Starlette Admin panel setup and registration."""

from fastapi import FastAPI
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware
from starlette_admin.contrib.sqla import Admin, ModelView
from src.admin.auth import AdminAuthProvider
from src.config import settings
from src.database.models import (
    CaseOutcomeRecord,
    CaseRecord,
    EvidenceRecord,
    UserRecord,
    WalletChallengeRecord,
)
from src.database.session import get_async_engine


class UserAdminView(ModelView):
    fields = [
        "id",
        "username",
        "email",
        "role",
        "is_admin",
        "wallet_address",
        "selected_investigator_id",
        "created_at",
    ]
    searchable_fields = ["username", "email", "wallet_address", "role"]
    sortable_fields = ["created_at", "username", "role", "is_admin"]
    exclude_fields_from_create = ["id", "created_at"]


class CaseAdminView(ModelView):
    fields = [
        "id",
        "number",
        "title",
        "codename",
        "difficulty",
        "status",
        "is_published",
        "secret_destination",
        "secret_scenario",
        "brief_json",
        "objectives_json",
        "known_info_json",
        "workspace_json",
        "wallets_json",
        "transactions_json",
        "prompt_json",
        "key_terms_json",
        "created_at",
        "updated_at",
    ]
    exclude_fields_from_list = [
        "brief_json",
        "objectives_json",
        "known_info_json",
        "workspace_json",
        "wallets_json",
        "transactions_json",
        "prompt_json",
        "key_terms_json",
    ]
    searchable_fields = ["id", "number", "title", "codename", "difficulty", "status"]
    sortable_fields = ["id", "number", "created_at", "difficulty"]
    exclude_fields_from_create = ["created_at", "updated_at"]


class EvidenceAdminView(ModelView):
    fields = [
        "id",
        "user_id",
        "case_id",
        "kind",
        "target_id",
        "label",
        "notes",
        "created_at",
    ]
    searchable_fields = ["label", "target_id", "case_id", "user_id"]
    sortable_fields = ["created_at", "case_id"]
    exclude_fields_from_create = ["id", "created_at"]


class WalletChallengeAdminView(ModelView):
    fields = ["wallet_address", "message", "nonce", "created_at"]
    searchable_fields = ["wallet_address", "nonce"]
    sortable_fields = ["created_at"]


class CaseOutcomeAdminView(ModelView):
    fields = ["id", "user_id", "case_id", "outcome_json", "created_at"]
    searchable_fields = ["case_id", "user_id"]
    sortable_fields = ["created_at"]
    exclude_fields_from_create = ["id", "created_at"]


def setup_admin(app: FastAPI) -> Admin:
    """Initialize and mount Starlette Admin to the FastAPI app at /admin."""
    admin = Admin(
        session_provider=get_async_engine(),
        title=f"{settings.app_name} Admin Panel",
        base_url="/admin",
        route_name="admin",
        auth_provider=AdminAuthProvider(),
        secret_key=settings.admin_secret_key,
        middlewares=[
            Middleware(
                SessionMiddleware,
                secret_key=settings.admin_secret_key,
                max_age=14 * 24 * 3600,  # 14 days
            )
        ],
    )

    # Register admin views
    admin.add_view(
        CaseAdminView(
            CaseRecord,
            icon="fa fa-briefcase",
            display_name="Cases",
            menu_label="Cases & Missions",
        )
    )
    admin.add_view(
        UserAdminView(
            UserRecord,
            icon="fa fa-users",
            display_name="Users",
            menu_label="Users & RBAC",
        )
    )
    admin.add_view(
        EvidenceAdminView(
            EvidenceRecord,
            icon="fa fa-folder-open",
            display_name="Evidence",
            menu_label="Evidence Notebooks",
        )
    )
    admin.add_view(
        WalletChallengeAdminView(
            WalletChallengeRecord,
            icon="fa fa-key",
            display_name="Solana Challenges",
            menu_label="SIWS Challenges",
        )
    )
    admin.add_view(
        CaseOutcomeAdminView(
            CaseOutcomeRecord,
            icon="fa fa-trophy",
            display_name="Case Outcomes",
            menu_label="Deduction Scores",
        )
    )

    admin.mount_to(app)
    return admin
