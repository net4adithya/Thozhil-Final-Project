from typing import Dict, Any, Optional
from .base import BaseServiceClient
from ..config import settings

class ResumeServiceClient(BaseServiceClient):
    def __init__(self, base_url: str = settings.RESUME_SERVICE_URL):
        super().__init__(base_url=base_url)

    async def screen_candidate(self, candidate_id: str, resume_text: Optional[str] = None, job_title: Optional[str] = "Software Engineer") -> Dict[str, Any]:
        payload = {
            "candidate_id": candidate_id,
            "resume_text": resume_text,
            "job_title": job_title
        }
        return await self._post_with_retry("/screen", payload)
