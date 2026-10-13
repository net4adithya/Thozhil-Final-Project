import sqlite3
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from .models import PipelineState, CandidateRecord, StageResult, FinalEvaluationReport, StageReportItem
from .config import settings

class CandidateStateRepository:
    def __init__(self, db_path: str = settings.DATABASE_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS candidates (
                    candidate_id TEXT PRIMARY KEY,
                    state TEXT NOT NULL,
                    name TEXT,
                    email TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS stage_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    status TEXT NOT NULL,
                    score REAL,
                    evaluation TEXT,
                    errors TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(candidate_id) REFERENCES candidates(candidate_id)
                );
            """)
            conn.commit()

    def create_candidate(self, candidate_id: str, name: Optional[str] = None, email: Optional[str] = None) -> CandidateRecord:
        now = datetime.utcnow().isoformat()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO candidates (candidate_id, state, name, email, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(candidate_id) DO UPDATE SET
                    name=excluded.name,
                    email=excluded.email,
                    updated_at=excluded.updated_at
            """, (candidate_id, PipelineState.CREATED.value, name, email, now, now))
            conn.commit()
        return self.get_candidate(candidate_id)

    def get_candidate(self, candidate_id: str) -> Optional[CandidateRecord]:
        with self._get_conn() as conn:
            cursor = conn.execute("SELECT candidate_id, state, name, email, created_at, updated_at FROM candidates WHERE candidate_id = ?", (candidate_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return CandidateRecord(
                candidate_id=row[0],
                state=PipelineState(row[1]),
                name=row[2],
                email=row[3],
                created_at=row[4],
                updated_at=row[5]
            )

    def update_state(self, candidate_id: str, new_state: PipelineState) -> CandidateRecord:
        now = datetime.utcnow().isoformat()
        with self._get_conn() as conn:
            conn.execute("UPDATE candidates SET state = ?, updated_at = ? WHERE candidate_id = ?", (new_state.value, now, candidate_id))
            conn.commit()
        return self.get_candidate(candidate_id)

    def save_stage_result(self, candidate_id: str, stage: str, status: str, score: Optional[float] = None, evaluation: Optional[Dict[str, Any]] = None, errors: Optional[List[Dict[str, Any]]] = None):
        now = datetime.utcnow().isoformat()
        eval_str = json.dumps(evaluation) if evaluation is not None else None
        err_str = json.dumps(errors) if errors is not None else None
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO stage_results (candidate_id, stage, status, score, evaluation, errors, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (candidate_id, stage, status, score, eval_str, err_str, now))
            conn.commit()

    def get_stage_result(self, candidate_id: str, stage: str) -> Optional[StageResult]:
        with self._get_conn() as conn:
            cursor = conn.execute("""
                SELECT candidate_id, stage, status, score, evaluation, errors 
                FROM stage_results 
                WHERE candidate_id = ? AND stage = ? 
                ORDER BY id DESC LIMIT 1
            """, (candidate_id, stage))
            row = cursor.fetchone()
            if not row:
                return None
            eval_dict = json.loads(row[4]) if row[4] else None
            err_list = json.loads(row[5]) if row[5] else None
            return StageResult(
                candidate_id=row[0],
                stage=row[1],
                status=row[2],
                score=row[3],
                evaluation=eval_dict,
                errors=err_list
            )

    def get_final_report(self, candidate_id: str) -> FinalEvaluationReport:
        cand = self.get_candidate(candidate_id)
        if not cand:
            raise ValueError(f"Candidate {candidate_id} not found.")

        resume_res = self.get_stage_result(candidate_id, "resume")
        project_res = self.get_stage_result(candidate_id, "project")
        coding_res = self.get_stage_result(candidate_id, "coding")
        video_res = self.get_stage_result(candidate_id, "video")

        def _to_item(res: Optional[StageResult]) -> Optional[StageReportItem]:
            if not res:
                return None
            return StageReportItem(status=res.status, score=res.score, details=res.evaluation)

        overall_status = "COMPLETED" if cand.state in [PipelineState.EVALUATION_REPORT, PipelineState.VIDEO_PASSED] else "IN_PROGRESS"
        if cand.state in [PipelineState.RESUME_REJECTED, PipelineState.PROJECT_REJECTED, PipelineState.CODING_REJECTED, PipelineState.VIDEO_REJECTED, PipelineState.FAILED]:
            overall_status = "REJECTED" if "REJECTED" in cand.state.value else "FAILED"

        return FinalEvaluationReport(
            candidate_id=candidate_id,
            overall_status=overall_status,
            pipeline_state=cand.state,
            resume=_to_item(resume_res),
            project=_to_item(project_res),
            coding=_to_item(coding_res),
            video=_to_item(video_res),
            final_evaluation={"completed": overall_status in ["COMPLETED", "REJECTED"]}
        )
