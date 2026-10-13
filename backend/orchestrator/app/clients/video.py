from typing import Dict, Any, Optional
from .base import BaseServiceClient
from ..config import settings

class VideoServiceClient(BaseServiceClient):
    def __init__(self, base_url: str = settings.VIDEO_SERVICE_URL):
        super().__init__(base_url=base_url)

    async def evaluate_video(self, candidate_id: str, interview_id: Optional[str] = "int-1") -> Dict[str, Any]:
        payload = {
            "candidate_id": candidate_id,
            "interview_id": interview_id
        }
        return await self._post_with_retry("/evaluate", payload)
