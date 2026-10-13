import sys
import os
import pytest
from fastapi.testclient import TestClient
import importlib.util

def load_app(adapter_path):
    spec = importlib.util.spec_from_file_location("main", adapter_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.app

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

resume_app = load_app(os.path.join(root_dir, "services", "resume-service", "adapter", "main.py"))
project_app = load_app(os.path.join(root_dir, "services", "project-service", "adapter", "main.py"))
coding_app = load_app(os.path.join(root_dir, "services", "coding-service", "adapter", "main.py"))
video_app = load_app(os.path.join(root_dir, "services", "video-service", "adapter", "main.py"))

def test_resume_adapter():
    client = TestClient(resume_app)
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["service"] == "resume-service"

    s_res = client.post("/screen", json={"candidate_id": "INT-001", "job_title": "Backend Dev"})
    assert s_res.status_code == 200
    data = s_res.json()
    assert data["candidate_id"] == "INT-001"
    assert data["status"] == "COMPLETED"
    assert "score" in data

def test_project_adapter():
    client = TestClient(project_app)
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["service"] == "project-service"

    a_res = client.post("/analyze", json={"candidate_id": "INT-002", "project_id": "p-10"})
    assert a_res.status_code == 200
    data = a_res.json()
    assert data["candidate_id"] == "INT-002"
    assert data["status"] == "COMPLETED"

def test_coding_adapter():
    client = TestClient(coding_app)
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["service"] == "coding-service"

    e_res = client.post("/evaluate", json={"candidate_id": "INT-003", "exam_id": "e-10"})
    assert e_res.status_code == 200
    data = e_res.json()
    assert data["candidate_id"] == "INT-003"
    assert data["status"] == "COMPLETED"

def test_video_adapter():
    client = TestClient(video_app)
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["service"] == "video-service"

    v_res = client.post("/evaluate", json={"candidate_id": "INT-004", "interview_id": "v-10"})
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["candidate_id"] == "INT-004"
    assert data["status"] == "COMPLETED"
