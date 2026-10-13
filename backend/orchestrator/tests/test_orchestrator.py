import os
import pytest
import asyncio
from fastapi.testclient import TestClient
from orchestrator.app.main import app
from orchestrator.app.state import CandidateStateRepository
from orchestrator.app.models import PipelineState, PipelineStartRequest
from orchestrator.app.pipeline import PipelineEngine

client = TestClient(app)

@pytest.fixture
def clean_db(tmp_path):
    db_file = str(tmp_path / "test_orchestrator.db")
    repo = CandidateStateRepository(db_path=db_file)
    return repo

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "orchestrator"
    assert data["status"] == "healthy"

def test_create_and_get_candidate(clean_db):
    res = client.post("/candidates", json={"candidate_id": "TEST-CAND-001", "name": "John Doe", "email": "john@example.com"})
    assert res.status_code == 200
    data = res.json()
    assert data["candidate_id"] == "TEST-CAND-001"
    assert data["state"] == "CREATED"

    res_get = client.get("/candidates/TEST-CAND-001")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "John Doe"

    res_state = client.get("/candidates/TEST-CAND-001/state")
    assert res_state.status_code == 200
    assert res_state.json()["state"] == "CREATED"

def test_full_pipeline_success(clean_db, monkeypatch):
    async def _run():
        engine = PipelineEngine(repo=clean_db)
        
        async def mock_resume(*args, **kwargs):
            return {"candidate_id": "TEST-CAND-FULL", "status": "COMPLETED", "score": 85.0, "evaluation": {"passed": True}}
        async def mock_project(*args, **kwargs):
            return {"candidate_id": "TEST-CAND-FULL", "status": "COMPLETED", "score": 82.0, "evaluation": {"passed": True}}
        async def mock_coding(*args, **kwargs):
            return {"candidate_id": "TEST-CAND-FULL", "status": "COMPLETED", "score": 88.0, "evaluation": {"passed": True}}
        async def mock_video(*args, **kwargs):
            return {"candidate_id": "TEST-CAND-FULL", "status": "COMPLETED", "score": 91.0, "evaluation": {"passed": True}}

        monkeypatch.setattr(engine.resume_client, "screen_candidate", mock_resume)
        monkeypatch.setattr(engine.project_client, "analyze_project", mock_project)
        monkeypatch.setattr(engine.coding_client, "evaluate_coding", mock_coding)
        monkeypatch.setattr(engine.video_client, "evaluate_video", mock_video)

        req = PipelineStartRequest(
            resume_text="Senior Python Developer with 5 years experience",
            job_title="Software Engineer",
            project_id="proj-99",
            exam_id="exam-99",
            interview_id="int-99"
        )
        report = await engine.run_pipeline("TEST-CAND-FULL", req)
        assert report.candidate_id == "TEST-CAND-FULL"
        assert report.overall_status == "COMPLETED"
        assert report.pipeline_state == PipelineState.EVALUATION_REPORT
        assert report.resume.status == "COMPLETED"
        assert report.project.status == "COMPLETED"
        assert report.coding.status == "COMPLETED"
        assert report.video.status == "COMPLETED"
    asyncio.run(_run())

def test_pipeline_gating_resume_rejection(clean_db, monkeypatch):
    async def _run():
        engine = PipelineEngine(repo=clean_db)
        async def mock_screen(*args, **kwargs):
            return {"candidate_id": "TEST-REJECT-RESUME", "status": "COMPLETED", "score": 45.0, "evaluation": {"reason": "Low match"}}
        
        monkeypatch.setattr(engine.resume_client, "screen_candidate", mock_screen)
        
        req = PipelineStartRequest(resume_text="Irrelevant text")
        report = await engine.run_pipeline("TEST-REJECT-RESUME", req)
        assert report.overall_status == "REJECTED"
        assert report.pipeline_state == PipelineState.RESUME_REJECTED
        assert report.resume.score == 45.0
        assert report.project is None
        assert report.coding is None
        assert report.video is None
    asyncio.run(_run())
