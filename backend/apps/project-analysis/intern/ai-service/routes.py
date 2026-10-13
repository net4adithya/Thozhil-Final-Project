"""
routes.py – Route definitions for Module 3: AI Reviewer Engine.

Sole responsibility: orchestrate the review pipeline and translate domain
exceptions into the appropriate HTTP responses.

This file:
  1. Declares the POST /review endpoint.
  2. Validates the incoming request (delegated to Pydantic via FastAPI).
  3. Calls prompt_builder → ai_provider → parser in order.
  4. Enforces a request timeout so hung AI calls never exhaust the worker pool.
  5. Converts domain exceptions (AIProviderError, ParseError) into HTTP responses.
  6. Returns the structured ReviewResponse.

No business logic, AI calls, prompt text, or parsing code belongs here.
HTTP is the only concern of this file.
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request

from config import settings
from models import ReviewRequest, ReviewResponse
from prompt_builder import build_review_prompt, PROMPT_VERSION
from ai_provider import call_ai, AIProviderError, AIProviderUnavailableError
from parser import parse_ai_response, ParseError
from rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/review",
    response_model=ReviewResponse,
    summary="Review an intern's project submission",
    description=(
        "Accepts a work description and the intern's submitted program files (1–10 files). "
        "Returns a structured AI-generated review for the intern and a concise summary for the manager."
    ),
    responses={
        400: {"description": "Bad request – missing or blank fields."},
        413: {"description": "Request body too large."},
        422: {"description": "Validation error – request schema mismatch."},
        429: {"description": "Rate limit exceeded – too many requests."},
        500: {"description": "Unable to parse AI response."},
        503: {"description": "AI provider is currently unavailable."},
        504: {"description": "AI provider did not respond within the timeout window."},
    },
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def review_project(request: Request, body: ReviewRequest) -> ReviewResponse:
    """Evaluate an intern's submission against the assigned work description.

    Pipeline:
        ReviewRequest → build_review_prompt → call_ai → parse_ai_response → ReviewResponse

    `request: Request` is required by slowapi's rate limiter (it reads the
    client IP from it). The Pydantic body is accepted as `body: ReviewRequest`
    to avoid shadowing FastAPI's built-in Request type.

    Exceptions are caught here and converted to the appropriate HTTP status:
        AIProviderUnavailableError → 503
        AIProviderError            → 503
        asyncio.TimeoutError       → 504
        ParseError                 → 500
    """
    logger.info(
        "Review request received | prompt_version=%s | files=%d (%s)",
        PROMPT_VERSION,
        len(body.program_files),
        ", ".join(f.filename for f in body.program_files),
    )

    # Step 1 – Build the prompt from validated request fields.
    prompt = build_review_prompt(
        work_description=body.work_description,
        program_files=body.program_files,
    )

    # Step 2 – Send the prompt to the AI provider with a timeout guard.
    # asyncio.wait_for raises TimeoutError if the provider does not respond
    # within AI_REQUEST_TIMEOUT_SECONDS, preventing indefinite worker stalls.
    try:
        raw_response = await asyncio.wait_for(
            call_ai(prompt),
            timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.error(
            "AI provider timed out after %ds.", settings.AI_REQUEST_TIMEOUT_SECONDS
        )
        raise HTTPException(
            status_code=504,
            detail=(
                f"AI provider did not respond within "
                f"{settings.AI_REQUEST_TIMEOUT_SECONDS} seconds."
            ),
        )
    except AIProviderUnavailableError as exc:
        logger.error("AI provider unavailable: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="AI provider is currently unavailable.",
        ) from exc
    except AIProviderError as exc:
        logger.error("AI provider error: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="AI provider is currently unavailable.",
        ) from exc

    # Step 3 – Parse and validate the raw AI response into the contract model.
    try:
        review: ReviewResponse = parse_ai_response(raw_response)
    except ParseError as exc:
        logger.error("Failed to parse AI response: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to parse AI response.",
        ) from exc

    logger.info(
        "Review completed | score=%d | risk=%s | bugs=%d",
        review.intern_review.score,
        review.manager_summary.risk_level,
        len(review.intern_review.bugs),
    )
    return review
