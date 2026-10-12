from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from src.admin import seed_all, setup_admin
from src.auth.blacklist import close_redis_client, get_redis_client
from src.auth.routes import me_router, router as auth_router
from src.cases.routes import router as cases_router
from src.config import settings
from src.database.session import close_db, init_db
from src.investigators.routes import router as investigators_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: manages Database schema, Admin seeding, and Redis connection pool."""
    # Ensure database tables exist and seed admin
    await init_db()
    try:
        await seed_all()
    except Exception:
        pass

    # Verify Redis (with fallback)
    try:
        redis_client = await get_redis_client()
        await redis_client.ping()
    except Exception:
        pass
    yield
    await close_redis_client()
    await close_db()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="TRACE — Solana Onchain Detective Game Backend",
    lifespan=lifespan,
)

# Exception handler returning both 'detail' and 'message' to satisfy frontend errors.ts
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "message": exc.detail},
        headers=exc.headers,
    )

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount primary /api routers (visible in OpenAPI/docs)
app.include_router(auth_router, prefix="/api")
app.include_router(investigators_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(me_router, prefix="/api")

# Mount direct routers (without /api prefix) for Next.js rewrite BFF proxy and serverApi
app.include_router(auth_router, prefix="", include_in_schema=False)
app.include_router(investigators_router, prefix="", include_in_schema=False)
app.include_router(cases_router, prefix="", include_in_schema=False)
app.include_router(me_router, prefix="", include_in_schema=False)

# Mount Starlette Admin panel at /admin
setup_admin(app)


@app.get("/api/health")
@app.get("/health", include_in_schema=False)
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.app_name, "version": "0.1.0"}
