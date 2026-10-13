from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class PipelineState(str, Enum):
    CREATED = "CREATED"
    RESUME_SUBMITTED = "RESUME_SUBMITTED"
    RESUME_REJECTED = "RESUME_REJECTED"
    RESUME_PASSED = "RESUME_PASSED"
    PROJECT_ANALYZED = "PROJECT_ANALYZED"
    PROJECT_REJECTED = "PROJECT_REJECTED"
    PROJECT_PASSED = "PROJECT_PASSED"
    CODING_COMPLETED = "CODING_COMPLETED"
    CODING_REJECTED = "CODING_REJECTED"
    CODING_PASSED = "CODING_PASSED"
    VIDEO_COMPLETED = "VIDEO_COMPLETED"
    VIDEO_REJECTED = "VIDEO_REJECTED"
    VIDEO_PASSED = "VIDEO_PASSED"
    EVALUATION_REPORT = "EVALUATION_REPORT"
    FAILED = "FAILED"
    PAUSED = "PAUSED"

class CreateCandidateRequest(BaseModel):
    candidate_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CandidateRecord(BaseModel):
    candidate_id: str
    state: PipelineState
    name: Optional[str] = None
    email: Optional[str] = None
    created_at: str
    updated_at: str

class StageResult(BaseModel):
    candidate_id: str
    stage: str
    status: str
    score: Optional[float] = None
    evaluation: Optional[Dict[str, Any]] = None
    errors: Optional[List[Dict[str, Any]]] = None

class PipelineStartRequest(BaseModel):
    resume_text: Optional[str] = None
    job_title: Optional[str] = "Software Engineer"
    project_id: Optional[str] = "proj-1"
    work_description: Optional[str] = None
    exam_id: Optional[str] = "exam-1"
    interview_id: Optional[str] = "int-1"

class PipelineResumeRequest(BaseModel):
    target_stage: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None

class StageReportItem(BaseModel):
    status: str
    score: Optional[float] = None
    details: Optional[Dict[str, Any]] = None

class FinalEvaluationReport(BaseModel):
    candidate_id: str
    overall_status: str
    pipeline_state: PipelineState
    resume: Optional[StageReportItem] = None
    project: Optional[StageReportItem] = None
    coding: Optional[StageReportItem] = None
    video: Optional[StageReportItem] = None
    final_evaluation: Dict[str, Any] = Field(default_factory=lambda: {"completed": True})
