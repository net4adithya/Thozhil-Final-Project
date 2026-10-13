from typing import Dict, Any, Optional
from .base import BaseServiceClient
from ..config import settings

class ProjectServiceClient(BaseServiceClient):
    def __init__(self, base_url: str = settings.PROJECT_SERVICE_URL):
        super().__init__(base_url=base_url)

    async def analyze_project(self, candidate_id: str, project_id: Optional[str] = "proj-1", work_description: Optional[str] = None) -> Dict[str, Any]:
        payload = {
            "candidate_id": candidate_id,
            "project_id": project_id,
            "work_description": work_description
        }
        return await self._post_with_retry("/analyze", payload)
