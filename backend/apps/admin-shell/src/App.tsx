import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ResumeModulePage } from './pages/ResumeModulePage';
import { InterviewModulePage } from './pages/InterviewModulePage';
import { ProjectAnalysisModulePage } from './pages/ProjectAnalysisModulePage';
import { CodingModulePage } from './pages/CodingModulePage';
import { InternsListPage } from './pages/InternsListPage';
import { InternDetailPage } from './pages/InternDetailPage';

const LayoutContent: React.FC = () => {
  const location = useLocation();

  const getModuleName = (path: string) => {
    switch (path) {
      case '/dashboard':
        return 'System Dashboard';
      case '/resume':
        return 'AI Resume Screener (Project B)';
      case '/interview':
        return 'AI Video Interviewer (Project A)';
      case '/project-analysis':
        return 'AI Project Analyser (Project C)';
      case '/coding':
        return 'AI Coding Interviewer (Project D)';
      case '/interns':
        return 'Intern Directory';
      default:
        if (path.startsWith('/interns/')) return 'Intern Detail View';
        return 'Thozhil Admin Shell';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header currentModule={getModuleName(location.pathname)} />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resume" element={<ResumeModulePage />} />
            <Route path="/interview" element={<InterviewModulePage />} />
            <Route path="/project-analysis" element={<ProjectAnalysisModulePage />} />
            <Route path="/coding" element={<CodingModulePage />} />
            <Route path="/interns" element={<InternsListPage />} />
            <Route path="/interns/:id" element={<InternDetailPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LayoutContent />
    </BrowserRouter>
  );
};

export default App;
