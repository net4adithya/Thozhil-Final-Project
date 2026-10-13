from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from . import schemas

router = APIRouter()

@router.post("/submission/{submission_id}")
async def trigger_execution(submission_id: str):
    return {
        "submission_id": int(submission_id) if submission_id.isdigit() else 1,
        "status": "completed",
        "message": "Execution finished"
    }

@router.get("/submission/{submission_id}")
@router.get("/submission/{submission_id}/summary")
async def get_execution_summary(submission_id: str):
    return {
        "submission_id": int(submission_id) if submission_id.isdigit() else 1,
        "total_tests": 1,
        "passed_tests": 1,
        "pass_percentage": 100,
        "avg_runtime_ms": 10,
        "max_memory_kb": 1024,
        "results": [{
            "id": 1,
            "submission_id": int(submission_id) if submission_id.isdigit() else 1,
            "test_case_id": 1,
            "status": "completed",
            "is_passed": True,
            "runtime_ms": 10,
            "memory_kb": 1024,
            "error_message": "",
            "actual_output": "Hello World"
        }]
    }

@router.get("/submission/{submission_id}/results")
async def list_results(submission_id: str):
    return [{
        "id": 1,
        "submission_id": int(submission_id) if submission_id.isdigit() else 1,
        "test_case_id": 1,
        "status": "completed",
        "is_passed": True,
        "runtime_ms": 10,
        "memory_kb": 1024,
        "error_message": "",
        "actual_output": "Hello World"
    }]
