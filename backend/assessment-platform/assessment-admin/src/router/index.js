import { createRouter, createWebHistory } from 'vue-router';
import { authState } from '../api/client';

import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import ResumeScreenerModule from '../views/ResumeScreenerModule.vue';
import VideoInterviewModule from '../views/VideoInterviewModule.vue';
import ProjectAnalysisModule from '../views/ProjectAnalysisModule.vue';
import CodingInterviewerModule from '../views/CodingInterviewerModule.vue';

import InternsManagement from '../views/InternsManagement.vue';
import InternHistory from '../views/InternHistory.vue';
import UnifiedReport from '../views/UnifiedReport.vue';

import QuestionBank from '../views/QuestionBank.vue';
import QuestionEditor from '../views/QuestionEditor.vue';
import BulkImport from '../views/BulkImport.vue';
import ExamEditor from '../views/ExamEditor.vue';
import ExamCandidates from '../views/ExamCandidates.vue';

const routes = [
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/', name: 'dashboard', component: CodingInterviewerModule },
  { path: '/dashboard', redirect: '/' },

  // Four Main Modules
  { path: '/resume', name: 'module-resume', component: ResumeScreenerModule },
  { path: '/interview', name: 'module-interview', component: VideoInterviewModule },
  { path: '/project-analysis', name: 'module-project-analysis', component: ProjectAnalysisModule },
  { path: '/coding', name: 'module-coding', component: CodingInterviewerModule },

  // Intern Details & History
  { path: '/interns', name: 'interns-management', component: InternsManagement },
  { path: '/interns/:id', name: 'intern-detail', component: InternHistory, props: true },
  { path: '/interns/:id/history', name: 'intern-history', component: InternHistory, props: true },

  // Multi-Stage Report
  { path: '/reports/:id', name: 'unified-report', component: UnifiedReport, props: true },

  // Question Bank & Coding Exam Editors (Preserved functionality)
  { path: '/questions', name: 'questions', component: QuestionBank },
  { path: '/questions/new', name: 'question-new', component: QuestionEditor },
  { path: '/questions/:id', name: 'question-edit', component: QuestionEditor, props: true },
  { path: '/questions/import', name: 'bulk-import', component: BulkImport },
  { path: '/exams/new', name: 'exam-new', component: ExamEditor },
  { path: '/exams/:id', name: 'exam-edit', component: ExamEditor, props: true },
  { path: '/exams/:id/candidates', name: 'exam-candidates', component: ExamCandidates, props: true },
];

const base = typeof window !== 'undefined' && window.location.pathname.startsWith('/coding') ? '/coding/' : '/';
const router = createRouter({ history: createWebHistory(base), routes });

router.beforeEach((to) => {
  if (!to.meta.public && !authState.token) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'login' && authState.token) {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
