import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layout wraps
import { LandingLayout } from './components/layout/LandingLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CandidateLayout } from './components/layout/CandidateLayout';

// Public pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

// Recruiter pages
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
      <AppProvider>
        <BrowserRouter>
          <Routes>
            
            {/* Public Landing & Authentication Routes */}
            <Route
              path="/"
              element={
                <LandingLayout>
                  <Landing />
                </LandingLayout>
              }
            />
            <Route path="/login" element={<Login />} />

            {/* Protected Recruiter Workspace Routes */}
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

            {/* Candidate Workspace Routes */}
            <Route
              path="/candidate"
              element={
                <CandidateLayout>
                  <CandidateDashboard />
                </CandidateLayout>
              }
            />
            <Route
              path="/candidate/practice"
              element={
                <CandidateLayout>
                  <CandidatePracticeSandbox />
                </CandidateLayout>
              }
            />
            <Route path="/candidate/practice/room" element={<CandidatePracticeRoom />} />
            <Route
              path="/candidate/interviews/:id"
              element={
                <CandidateLayout>
                  <CandidateInterviewDetails />
                </CandidateLayout>
              }
            />
            <Route
              path="/candidate/interviews/:id/device-check"
              element={
                <CandidateLayout>
                  <CandidateDeviceCheck />
                </CandidateLayout>
              }
            />
            <Route
              path="/candidate/device-check/:id"
              element={
                <CandidateLayout>
                  <CandidateDeviceCheck />
                </CandidateLayout>
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
                <CandidateLayout>
                  <CandidateCompleted />
                </CandidateLayout>
              }
            />
            <Route
              path="/candidate/completed/:id"
              element={
                <CandidateLayout>
                  <CandidateCompleted />
                </CandidateLayout>
              }
            />

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
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
