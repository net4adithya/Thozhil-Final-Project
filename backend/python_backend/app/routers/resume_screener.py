import os
import sys
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Ensure root python_backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from ai_screener.ai_screener_engine import screen_resume_pipeline

router = APIRouter()

class ScreenResumeRequest(BaseModel):
    resume_text: str
    filename: str
    job_title: Optional[str] = "Software Engineer"
    job_dept: Optional[str] = "Engineering"
    job_loc: Optional[str] = "Chennai"
    req_skills: Optional[List[str]] = ["Python", "REST APIs", "SQL"]
    pref_skills: Optional[List[str]] = ["Docker", "AWS", "FastAPI"]
    job_desc: Optional[str] = ""

@router.post("/screen")
async def screen_resume(req: ScreenResumeRequest):
    job_dict = {
        "title": req.job_title,
        "dept": req.job_dept,
        "loc": req.job_loc,
        "req_skills": req.req_skills or [],
        "pref_skills": req.pref_skills or [],
        "desc": req.job_desc or "",
        "exp": "2-4 years"
    }

    try:
        res = screen_resume_pipeline(req.resume_text, req.filename, job_dict)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screening failed: {str(e)}")
