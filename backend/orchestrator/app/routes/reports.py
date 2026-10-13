from fastapi import APIRouter, HTTPException
from ..models import FinalEvaluationReport
from ..state import CandidateStateRepository

router = APIRouter(prefix="/candidates", tags=["reports"])
repo = CandidateStateRepository()

@router.get("/{candidate_id}/report", response_model=FinalEvaluationReport)
async def get_candidate_report(candidate_id: str):
    try:
        return repo.get_final_report(candidate_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
