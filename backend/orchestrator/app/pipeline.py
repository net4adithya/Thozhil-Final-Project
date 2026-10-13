import logging
from typing import Optional, Dict, Any
from .models import PipelineState, PipelineStartRequest, PipelineResumeRequest, FinalEvaluationReport
from .state import CandidateStateRepository
from .config import settings
from .clients import ResumeServiceClient, ProjectServiceClient, CodingServiceClient, VideoServiceClient

logger = logging.getLogger("orchestrator.pipeline")

class PipelineEngine:
    def __init__(self, repo: Optional[CandidateStateRepository] = None):
        self.repo = repo or CandidateStateRepository()
        self.resume_client = ResumeServiceClient()
        self.project_client = ProjectServiceClient()
        self.coding_client = CodingServiceClient()
        self.video_client = VideoServiceClient()

    async def run_pipeline(self, candidate_id: str, request: PipelineStartRequest) -> FinalEvaluationReport:
        cand = self.repo.get_candidate(candidate_id)
        if not cand:
            cand = self.repo.create_candidate(candidate_id)

        # Stage 1: Resume Screening
        self.repo.update_state(candidate_id, PipelineState.RESUME_SUBMITTED)
        try:
            resume_res = await self.resume_client.screen_candidate(
                candidate_id, resume_text=request.resume_text, job_title=request.job_title
            )
            score = float(resume_res.get("score", 0.0))
            status = resume_res.get("status", "COMPLETED")
            self.repo.save_stage_result(candidate_id, "resume", status, score, resume_res.get("evaluation"), resume_res.get("errors"))

            if score < settings.RESUME_MIN_SCORE:
                self.repo.update_state(candidate_id, PipelineState.RESUME_REJECTED)
                return self.repo.get_final_report(candidate_id)
            
            self.repo.update_state(candidate_id, PipelineState.RESUME_PASSED)
        except Exception as exc:
            logger.error(f"Resume stage failed for candidate {candidate_id}: {exc}")
            self.repo.save_stage_result(candidate_id, "resume", "FAILED", errors=[{"code": "SERVICE_ERROR", "message": str(exc)}])
            self.repo.update_state(candidate_id, PipelineState.FAILED)
            return self.repo.get_final_report(candidate_id)

        # Stage 2: Project Analysis
        try:
            project_res = await self.project_client.analyze_project(
                candidate_id, project_id=request.project_id, work_description=request.work_description
            )
            score = float(project_res.get("score", 0.0))
            status = project_res.get("status", "COMPLETED")
            self.repo.save_stage_result(candidate_id, "project", status, score, project_res.get("evaluation"), project_res.get("errors"))

            if score < settings.PROJECT_MIN_SCORE:
                self.repo.update_state(candidate_id, PipelineState.PROJECT_REJECTED)
                return self.repo.get_final_report(candidate_id)

            self.repo.update_state(candidate_id, PipelineState.PROJECT_PASSED)
        except Exception as exc:
            logger.error(f"Project stage failed for candidate {candidate_id}: {exc}")
            self.repo.save_stage_result(candidate_id, "project", "FAILED", errors=[{"code": "SERVICE_ERROR", "message": str(exc)}])
            self.repo.update_state(candidate_id, PipelineState.FAILED)
            return self.repo.get_final_report(candidate_id)

        # Stage 3: Coding Evaluation
        try:
            coding_res = await self.coding_client.evaluate_coding(
                candidate_id, exam_id=request.exam_id
            )
            score = float(coding_res.get("score", 0.0))
            status = coding_res.get("status", "COMPLETED")
            self.repo.save_stage_result(candidate_id, "coding", status, score, coding_res.get("evaluation"), coding_res.get("errors"))

            if score < settings.CODING_MIN_SCORE:
                self.repo.update_state(candidate_id, PipelineState.CODING_REJECTED)
                return self.repo.get_final_report(candidate_id)

            self.repo.update_state(candidate_id, PipelineState.CODING_PASSED)
        except Exception as exc:
            logger.error(f"Coding stage failed for candidate {candidate_id}: {exc}")
            self.repo.save_stage_result(candidate_id, "coding", "FAILED", errors=[{"code": "SERVICE_ERROR", "message": str(exc)}])
            self.repo.update_state(candidate_id, PipelineState.FAILED)
            return self.repo.get_final_report(candidate_id)

        # Stage 4: Video Interview
        try:
            video_res = await self.video_client.evaluate_video(
                candidate_id, interview_id=request.interview_id
            )
            score = float(video_res.get("score", 0.0))
            status = video_res.get("status", "COMPLETED")
            self.repo.save_stage_result(candidate_id, "video", status, score, video_res.get("evaluation"), video_res.get("errors"))

            if score < settings.VIDEO_MIN_SCORE:
                self.repo.update_state(candidate_id, PipelineState.VIDEO_REJECTED)
                return self.repo.get_final_report(candidate_id)

            self.repo.update_state(candidate_id, PipelineState.VIDEO_PASSED)
        except Exception as exc:
            logger.error(f"Video stage failed for candidate {candidate_id}: {exc}")
            self.repo.save_stage_result(candidate_id, "video", "FAILED", errors=[{"code": "SERVICE_ERROR", "message": str(exc)}])
            self.repo.update_state(candidate_id, PipelineState.FAILED)
            return self.repo.get_final_report(candidate_id)

        # Final state transition
        self.repo.update_state(candidate_id, PipelineState.EVALUATION_REPORT)
        return self.repo.get_final_report(candidate_id)

    async def resume_pipeline(self, candidate_id: str, request: PipelineResumeRequest) -> FinalEvaluationReport:
        # Allows resuming a paused or failed pipeline stage
        cand = self.repo.get_candidate(candidate_id)
        if not cand:
            raise ValueError(f"Candidate {candidate_id} does not exist.")
        self.repo.update_state(candidate_id, PipelineState.CREATED)
        start_req = PipelineStartRequest()
        return await self.run_pipeline(candidate_id, start_req)
