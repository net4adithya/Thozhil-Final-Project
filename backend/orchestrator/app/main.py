from fastapi import FastAPI
from .routes import candidates_router, pipeline_router, reports_router
from .config import settings

app = FastAPI(title="Thozhil Microservice Orchestrator", version="1.0.0")

app.include_router(candidates_router)
app.include_router(pipeline_router)
app.include_router(reports_router)

@app.get("/health")
async def health():
    return {
        "service": "orchestrator",
        "status": "healthy",
        "services": {
            "resume_service": settings.RESUME_SERVICE_URL,
            "project_service": settings.PROJECT_SERVICE_URL,
            "coding_service": settings.CODING_SERVICE_URL,
            "video_service": settings.VIDEO_SERVICE_URL
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.ORCHESTRATOR_PORT, reload=True)
