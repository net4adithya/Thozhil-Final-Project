from typing import Dict, Any, Optional
from .base import BaseServiceClient
from ..config import settings

class CodingServiceClient(BaseServiceClient):
    def __init__(self, base_url: str = settings.CODING_SERVICE_URL):
        super().__init__(base_url=base_url)

    async def evaluate_coding(self, candidate_id: str, exam_id: Optional[str] = "exam-1") -> Dict[str, Any]:
        payload = {
            "candidate_id": candidate_id,
            "exam_id": exam_id
        }
        return await self._post_with_retry("/evaluate", payload)
