import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Layout wraps
import { LandingLayout } from './components/layout/LandingLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CandidateLayout } from './components/layout/CandidateLayout';

// Public pages
import { Landing } from './pages/Landing';
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
import { CandidateInterviewDetails } from './pages/CandidateInterviewDetails';
import { CandidateDeviceCheck } from './pages/CandidateDeviceCheck';
import { InterviewRoom } from './pages/InterviewRoom';
import { LiveInterview } from './pages/LiveInterview';
import { CandidateCompleted } from './pages/CandidateCompleted';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          
          {/* Public Landing Route */}
          <Route
            path="/"
            element={
              <LandingLayout>
                <Landing />
              </LandingLayout>
            }
          />

          {/* Recruiter Workspace Routes */}
          <Route
            path="/recruiter"
            element={
              <DashboardLayout>
                <RecruiterDashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/interviews"
            element={
              <DashboardLayout>
                <InterviewList />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/interviews/create"
            element={
              <DashboardLayout>
                <CreateInterview />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/interviews/:id"
            element={
              <DashboardLayout>
                <InterviewDetails />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/candidates"
            element={
              <DashboardLayout>
                <CandidateList />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/candidates/:id/report"
            element={
              <DashboardLayout>
                <Report />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/templates"
            element={
              <DashboardLayout>
                <InterviewTemplates />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/questions"
            element={
              <DashboardLayout>
                <QuestionBank />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/analytics"
            element={
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            }
          />
          <Route
            path="/recruiter/settings"
            element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
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
          <Route path="/candidate/interviews/:id/async" element={<InterviewRoom />} />
          <Route path="/candidate/interviews/:id/live" element={<LiveInterview />} />
          <Route
            path="/candidate/interviews/:id/completed"
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
  );
}

export default App;
