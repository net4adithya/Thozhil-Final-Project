import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { InternDashboard } from './pages/InternDashboard';
import { HistoryPage } from './pages/HistoryPage';
import { InternsListPage } from './pages/InternsListPage';
import { InternDetailPage } from './pages/InternDetailPage';
import { MainLayout } from './components/MainLayout';
import { ToastContainer } from './components/ui/PremiumComponents';
import { CodingCandidateFlow } from './components/CodingCandidateFlow';
import { VideoCandidateFlow } from './components/VideoCandidateFlow';
import { CodingModulePage } from './pages/CodingModulePage';
import { InterviewModulePage } from './pages/InterviewModulePage';
import { ResumeModulePage } from './pages/ResumeModulePage';

// Route guard ensuring smooth role navigation
const RequireRole = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'authority' | 'intern' | 'any' }) => {
  const { role, setRole } = useApp();

  React.useEffect(() => {
    if (role === 'none') {
      setRole('authority');
    } else if (allowedRole !== 'any' && role !== allowedRole) {
      setRole(allowedRole);
    }
  }, [role, allowedRole, setRole]);

  return <MainLayout>{children}</MainLayout>;
};

const RequireCandidate = ({ children }: { children: React.ReactNode }) => {
  const { role, setRole } = useApp();

  React.useEffect(() => {
    if (role === 'none') {
      setRole('intern');
    }
  }, [role, setRole]);

  return <div className="w-screen h-screen bg-slate-50 font-sans overflow-hidden">{children}</div>;
};

function AppContent() {
  const { role } = useApp();

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage />} 
        />

        <Route
          path="/project-analysis"
          element={
            <RequireRole allowedRole="any">
              {role === 'intern' ? <InternDashboard /> : <AuthorityDashboard />}
            </RequireRole>
          }
        />

        <Route
          path="/authority"
          element={
            <RequireRole allowedRole="authority">
              <AuthorityDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/intern"
          element={
            <RequireRole allowedRole="intern">
              <InternDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/interns"
          element={
            <RequireRole allowedRole="any">
              <InternsListPage />
            </RequireRole>
          }
        />

        <Route
          path="/interns/:id"
          element={
            <RequireRole allowedRole="any">
              <InternDetailPage />
            </RequireRole>
          }
        />

        {/* Integrated Platform Modules */}
        <Route
          path="/resume-module"
          element={
            <RequireRole allowedRole="authority">
              <ResumeModulePage />
            </RequireRole>
          }
        />
        <Route
          path="/coding-module"
          element={
            <RequireRole allowedRole="authority">
              <CodingModulePage />
            </RequireRole>
          }
        />
        <Route
          path="/interview-module"
          element={
            <RequireRole allowedRole="authority">
              <InterviewModulePage />
            </RequireRole>
          }
        />
        <Route
          path="/coding-candidate-module"
          element={
            <RequireCandidate>
              <CodingCandidateFlow />
            </RequireCandidate>
          }
        />
        <Route
          path="/interview-candidate-module"
          element={
            <RequireCandidate>
              <VideoCandidateFlow />
            </RequireCandidate>
          }
        />

        <Route
          path="/history"
          element={
            <RequireRole allowedRole="any">
              <HistoryPage />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
