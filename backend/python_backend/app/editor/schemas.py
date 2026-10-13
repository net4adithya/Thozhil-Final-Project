from pydantic import BaseModel
from typing import List, Optional

class TemplateResponse(BaseModel):
    language: str
    template: str

class DraftCreate(BaseModel):
    assignment_id: int | str
    assessment_id: Optional[str] = None
    question_id: Optional[str] = None
    language: str
    code: str

class DraftResponse(BaseModel):
    draft_id: int
    submission_id: int

class SubmissionCreate(BaseModel):
    draft_id: int

class SubmissionResponse(BaseModel):
    id: int = 123
    submission_id: int
    draft_id: Optional[int] = 1
    intern_id: Optional[int] = 1
    status: str
    submitted_at: Optional[str] = "2026-09-16T00:00:00Z"

class EditorSessionResponse(BaseModel):
    draft_id: int
    assignment_id: str
    language: str
    code: str
    version: int
    is_locked: bool
