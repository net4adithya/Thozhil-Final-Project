from fastapi import APIRouter, HTTPException
from ..models import CreateCandidateRequest, CandidateRecord
from ..state import CandidateStateRepository

router = APIRouter(prefix="/candidates", tags=["candidates"])
repo = CandidateStateRepository()

@router.post("", response_model=CandidateRecord)
async def create_candidate(payload: CreateCandidateRequest):
    cand = repo.create_candidate(payload.candidate_id, payload.name, payload.email)
    return cand

@router.get("/{candidate_id}", response_model=CandidateRecord)
async def get_candidate(candidate_id: str):
    cand = repo.get_candidate(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand

@router.get("/{candidate_id}/state")
async def get_candidate_state(candidate_id: str):
    cand = repo.get_candidate(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"candidate_id": candidate_id, "state": cand.state}
