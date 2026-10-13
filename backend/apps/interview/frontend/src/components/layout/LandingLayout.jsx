import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Button } from '../ui/Button';

export const LandingLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 shadow-xs">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            IX
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base group-hover:text-blue-600 transition-colors">
                Interview<span className="text-blue-600">X</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">Technical Recruitment Platform</span>
          </div>
        </Link>

        {/* Center menu navigation links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
          <Link to="/candidate" className="hover:text-blue-600 transition-colors">
            Candidate Assessment
          </Link>
          <Link to="/recruiter" className="hover:text-blue-600 transition-colors">
            Employer Workspace
          </Link>
          <Link to="/recruiter/analytics" className="hover:text-blue-600 transition-colors">
            Analytics
          </Link>
        </nav>

        {/* Dual Direct Portal Access Controls & Sign in */}
        <div className="flex items-center space-x-2.5">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden sm:inline-block"
          >
            Sign in
          </Link>
          <Button 
            onClick={() => navigate('/candidate')} 
            variant="outline" 
            size="sm"
          >
            Candidate Portal
          </Button>
          <Button 
            onClick={() => navigate('/recruiter')} 
            variant="primary"
            size="sm"
          >
            Employer Portal
          </Button>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Modern Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 md:px-12 text-center text-xs text-slate-500 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              TH
            </div>
            <span className="font-semibold text-slate-900 text-sm">Thozhil AI</span>
            <span className="text-slate-400">| Standardized Technical Recruitment & Assessment</span>
          </div>
          <div className="flex space-x-6 text-xs font-medium">
            <Link to="/candidate" className="text-slate-600 hover:text-blue-600 transition-colors">Candidate Hub</Link>
            <Link to="/recruiter" className="text-slate-600 hover:text-blue-600 transition-colors">Employer Hub</Link>
            <Link to="/login" className="text-slate-600 hover:text-blue-600 transition-colors">Sign in</Link>
            <Link to="/recruiter/analytics" className="text-slate-600 hover:text-blue-600 transition-colors">Analytics</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout;
