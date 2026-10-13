# python_backend/app/editor/service.py
"""Service layer for editor module logic."""

from typing import Optional, List
from . import schemas
from datetime import datetime

TEMPLATES = {
    "python": "def solution():\n    # Write your code here\n    pass\n",
    "javascript": "function solution() {\n  // Write your code here\n}\n",
    "java": "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n",
    "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n"
}

async def get_template(language: str) -> Optional[str]:
    return TEMPLATES.get(language.lower(), "// Starter template not found")

async def get_latest_draft(submission_id: int, user_id: int) -> Optional[schemas.DraftResponse]:
    return schemas.DraftResponse(
        id=1,
        submission_id=submission_id,
        content=TEMPLATES.get("python", ""),
        version=1,
        created_at=datetime.utcnow().isoformat()
    )

async def save_draft(payload: schemas.DraftCreate, user_id: int) -> schemas.DraftResponse:
    return schemas.DraftResponse(
        id=1,
        submission_id=payload.submission_id,
        content=payload.content,
        version=(payload.version or 1) + 1,
        created_at=datetime.utcnow().isoformat()
    )

async def get_draft_history(submission_id: int, user_id: int) -> List[schemas.DraftVersionResponse]:
    return [
        schemas.DraftVersionResponse(
            version=1,
            content=TEMPLATES.get("python", ""),
            saved_at=datetime.utcnow().isoformat()
        )
    ]

async def submit_code(payload: schemas.SubmissionCreate, user_id: int) -> schemas.SubmissionResponse:
    return schemas.SubmissionResponse(
        id=1,
        assignment_id=payload.assignment_id,
        language=payload.language,
        code=payload.code,
        version=payload.version or 1,
        status="SUBMITTED",
        created_at=datetime.utcnow().isoformat()
    )
