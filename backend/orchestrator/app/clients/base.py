import asyncio
import httpx
from typing import Dict, Any, Optional

class BaseServiceClient:
    def __init__(self, base_url: str, connect_timeout: float = 5.0, read_timeout: float = 15.0, max_retries: int = 3):
        self.base_url = base_url.rstrip("/")
        self.timeout = httpx.Timeout(connect=connect_timeout, read=read_timeout, write=10.0, pool=5.0)
        self.max_retries = max_retries

    async def _post_with_retry(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        delay = 0.5
        last_exception = None

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        return response.json()
                    response.raise_for_status()
            except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError) as exc:
                last_exception = exc
                if attempt < self.max_retries:
                    await asyncio.sleep(delay)
                    delay *= 2
                else:
                    raise RuntimeError(f"Service at {url} failed after {self.max_retries} retries: {str(exc)}") from exc

        raise RuntimeError(f"Service call to {url} failed: {str(last_exception)}")
