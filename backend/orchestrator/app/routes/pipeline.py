from fastapi import APIRouter, HTTPException
from ..models import PipelineStartRequest, PipelineResumeRequest, FinalEvaluationReport
from ..pipeline import PipelineEngine

router = APIRouter(prefix="/candidates", tags=["pipeline"])
engine = PipelineEngine()

@router.post("/{candidate_id}/pipeline/start", response_model=FinalEvaluationReport)
async def start_pipeline(candidate_id: str, payload: PipelineStartRequest):
    return await engine.run_pipeline(candidate_id, payload)

@router.post("/{candidate_id}/pipeline/resume", response_model=FinalEvaluationReport)
async def resume_pipeline(candidate_id: str, payload: PipelineResumeRequest):
    try:
        return await engine.resume_pipeline(candidate_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
