"""
app.py – Application bootstrap for Module 3: AI Reviewer Engine.

Sole responsibility: create the FastAPI application instance, configure
global middleware and error handlers, and mount all routers.

No business logic, route handlers, or domain code belongs here.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from rate_limit import limiter
from routes import router
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
# Configure once at bootstrap. All other modules use getLogger(__name__).
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application Instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    # Propagate debug mode to FastAPI — enables detailed error responses in
    # development and disables them in production.
    debug=settings.DEBUG,
)

# ---------------------------------------------------------------------------
# Rate Limiter
# ---------------------------------------------------------------------------
# Attach the shared limiter to app.state so slowapi can access it.
# Route handlers are decorated in routes.py via @limiter.limit(...).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# Restrict cross-origin access to known trusted origins.
# Override ALLOWED_ORIGINS in .env for production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST"],      # Only POST /review is exposed
    allow_headers=["Content-Type"],
)

# ---------------------------------------------------------------------------
# Request Size Limit Middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def limit_request_size(request: Request, call_next: Any) -> Any:
    """Reject request bodies that exceed MAX_REQUEST_SIZE_BYTES.

    Checked via the Content-Length header before the body is read into memory.
    This prevents memory exhaustion attacks where an attacker sends a very large
    payload to a route that accepts a JSON body.

    Note: clients that omit Content-Length (e.g. chunked transfer) bypass this
    check; uvicorn's --limit-max-requests provides a secondary backstop for
    those cases.
    """
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length header."},
                )
            if size > settings.MAX_REQUEST_SIZE_BYTES:
                limit_kb = settings.MAX_REQUEST_SIZE_BYTES // 1024
                logger.warning(
                    "Request body too large: %d bytes (limit: %d bytes).",
                    size,
                    settings.MAX_REQUEST_SIZE_BYTES,
                )
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": (
                            f"Request body too large. "
                            f"Maximum allowed size is {limit_kb} KB."
                        )
                    },
                )
    return await call_next(request)

# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch any exception that escapes route handlers.

    Without this, FastAPI returns a full Python stack trace in the response,
    leaking internal file paths, library versions, and exception messages.
    This handler logs the full trace server-side and returns a sanitised 500.
    """
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal error occurred. Please try again later."},
    )

# ---------------------------------------------------------------------------
# Router Registration
# ---------------------------------------------------------------------------

app.include_router(router)

# ---------------------------------------------------------------------------
# Frontend Static Files
# ---------------------------------------------------------------------------
# Serve frontend/index.html at http://127.0.0.1:8000/
# The API routes (/review) are registered above and take priority.
# html=True means requests to "/" automatically return "index.html".
import os as _os

_frontend_dir = _os.path.join(_os.path.dirname(__file__), "frontend")
if _os.path.isdir(_frontend_dir):
    app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="frontend")

