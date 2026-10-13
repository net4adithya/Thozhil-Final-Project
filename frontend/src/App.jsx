import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThozhilAuthProvider } from './context/ThozhilAuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layout wraps (LogLense Shared Orchestration Shell)
import { LandingLayout } from './components/layout/LandingLayout';
import { DashboardLayout } from './intern/components/DashboardLayout';
import { CandidateLayout } from './components/layout/CandidateLayout';

// Public pages
import { Landing } from './pages/Landing';
import { LandingPage } from './intern/pages/LandingPage';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

// Intern Workspace & Project Governance Modules
import { AppProvider as InternProvider } from './intern/context/InternContext';
import { InternDashboard } from './intern/pages/InternDashboard';
import { AuthorityDashboard } from './intern/pages/AuthorityDashboard';
import { HistoryPage } from './intern/pages/HistoryPage';
import { InternsListPage } from './intern/pages/InternsListPage';
import { InternDetailPage } from './intern/pages/InternDetailPage';

// Recruiter pages & Modules
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { InterviewList } from './pages/InterviewList';
import { CreateInterview } from './pages/CreateInterview';
import { InterviewDetails } from './pages/InterviewDetails';
import { CandidateList } from './pages/CandidateList';
import { Report } from './pages/Report';
import { InterviewTemplates } from './pages/InterviewTemplates';
import { QuestionBank } from './pages/QuestionBank';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { ResumeScreenerPage } from './pages/ResumeScreenerPage';
import { InternLogsPage } from './pages/InternLogsPage';
import { CodingAssessmentsPage } from './pages/CodingAssessmentsPage';

// Candidate pages
import { CandidateDashboard } from './pages/CandidateDashboard';
import { CandidatePracticeSandbox } from './pages/CandidatePracticeSandbox';
import { CandidatePracticeRoom } from './pages/CandidatePracticeRoom';
import { CandidateInterviewDetails } from './pages/CandidateInterviewDetails';
import { CandidateDeviceCheck } from './pages/CandidateDeviceCheck';
import { InterviewRoom } from './pages/InterviewRoom';
import { LiveInterview } from './pages/LiveInterview';
import { CandidateCompleted } from './pages/CandidateCompleted';

function App() {
  return (
    <AuthProvider>
      <ThozhilAuthProvider>
        <AppProvider>
          <InternProvider>
            <BrowserRouter>
            <Routes>
              
              {/* Primary Entry Point Route (Unified Platform Landing Page) */}
              <Route
                path="/"
                element={<LandingPage />}
              />
              <Route path="/classic-landing" element={<LandingLayout><Landing /></LandingLayout>} />
              <Route path="/login" element={<Login />} />

            {/* Recruiter / Employer Portal */}
            <Route
              path="/recruiter"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RecruiterDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/employer" element={<Navigate to="/recruiter" replace />} />
            <Route path="/employer/interviewx" element={<Navigate to="/recruiter" replace />} />
            <Route path="/employer/resume-screener" element={<Navigate to="/recruiter/resume-screener" replace />} />
            <Route path="/employer/coding-assessments" element={<Navigate to="/recruiter/coding-assessments" replace />} />
            <Route path="/employer/loglense" element={<Navigate to="/recruiter/intern-logs" replace />} />

            <Route
              path="/recruiter/interviews"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InterviewList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/interviews/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CreateInterview />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/interviews/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CreateInterview />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/interviews/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InterviewDetails />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/candidates"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CandidateList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/candidates/:id/report"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Report />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/interviews/:id/report"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Report />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/interviews/:id/review"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Report />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Report />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/templates"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InterviewTemplates />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/questions"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <QuestionBank />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/analytics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Analytics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/resume-screener"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResumeScreenerPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/intern-logs"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InternLogsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/coding-assessments"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CodingAssessmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Candidate Workspace Routes (LogLense Orchestration Shell) */}
            <Route
              path="/candidate"
              element={
                <DashboardLayout>
                  <CandidateDashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/candidate/dashboard"
              element={
                <DashboardLayout>
                  <CandidateDashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/candidate/device-check"
              element={
                <DashboardLayout>
                  <CandidateDeviceCheck />
                </DashboardLayout>
              }
            />
            <Route
              path="/candidate/device-check/:id"
              element={
                <DashboardLayout>
                  <CandidateDeviceCheck />
                </DashboardLayout>
              }
            />
            <Route
              path="/candidate/interviews/:id/device-check"
              element={
                <DashboardLayout>
                  <CandidateDeviceCheck />
                </DashboardLayout>
              }
            />
            <Route
              path="/candidate/practice"
              element={
                <DashboardLayout>
                  <CandidatePracticeSandbox />
                </DashboardLayout>
              }
            />
            <Route path="/candidate/practice/room" element={<CandidatePracticeRoom />} />
            <Route
              path="/candidate/interviews/:id"
              element={
                <DashboardLayout>
                  <CandidateInterviewDetails />
                </DashboardLayout>
              }
            />
            <Route path="/candidate/interviews/:id/async" element={<InterviewRoom />} />
            <Route path="/candidate/interviews/:id/room" element={<InterviewRoom />} />
            <Route path="/candidate/room/:id" element={<InterviewRoom />} />
            <Route path="/interviews/:id/room" element={<InterviewRoom />} />
            <Route path="/candidate/interviews/:id/live" element={<LiveInterview />} />
            <Route path="/interviews/:id/live" element={<LiveInterview />} />
            <Route
              path="/candidate/interviews/:id/completed"
              element={
                <DashboardLayout>
                  <CandidateCompleted />
                </DashboardLayout>
              }
            />
            <Route
              path="/candidate/completed/:id"
              element={
                <DashboardLayout>
                  <CandidateCompleted />
                </DashboardLayout>
              }
            />

            {/* Candidate access to other modules via LogLense */}
            <Route
              path="/candidate/coding-workspace"
              element={
                <DashboardLayout>
                  <CodingAssessmentsPage isCandidate={true} />
                </DashboardLayout>
              }
            />
            <Route
              path="/candidate/loglense"
              element={<Navigate to="/intern" replace />}
            />
            <Route
              path="/candidate/resume-check"
              element={
                <DashboardLayout>
                  <ResumeScreenerPage isCandidate={true} />
                </DashboardLayout>
              }
            />

            {/* Intern & Project Governance Space Routes */}
            <Route path="/intern" element={<InternDashboard />} />
            <Route path="/authority" element={<AuthorityDashboard />} />
            <Route path="/project-analysis" element={<AuthorityDashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/interns" element={<InternsListPage />} />
            <Route path="/interns/:id" element={<InternDetailPage />} />

            {/* 404 Fallback page */}
            <Route
              path="*"
              element={
                <LandingLayout>
                  <NotFound />
                </LandingLayout>
              }
            />

          </Routes>
        </BrowserRouter>
        </InternProvider>
      </AppProvider>
      </ThozhilAuthProvider>
    </AuthProvider>
  );
}

export default App;
