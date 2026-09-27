import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  BookOpen,
  LogOut,
  User,
  HelpCircle,
  Video,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const CandidateLayout = ({ children }) => {
  const { toasts, dismissToast, showToast, candidates, interviews } = useApp();
  const { user, logout } = useAuth();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const accountMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close account popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine active candidate information with URL query priority
  const searchParams = new URLSearchParams(location.search);
  const qCandId = searchParams.get('candidateId');
  const qIntId = searchParams.get('interviewId');

  const storedCandId = typeof window !== 'undefined' ? sessionStorage.getItem('interviewx_active_candidate_id') : null;

  let activeCandidate = null;
  if (qCandId) {
    activeCandidate = (candidates || []).find((c) => c.id === qCandId);
  }
  if (!activeCandidate && qIntId) {
    const matchInt = (interviews || []).find((i) => i.id === qIntId);
    activeCandidate = (candidates || []).find(
      (c) =>
        c.interviewId === qIntId ||
        c.interview_id === qIntId ||
        c.id === matchInt?.candidate_id ||
        c.id === matchInt?.candidateId ||
        c.id === matchInt?.candidate?.id
    );
  }
  if (!activeCandidate && storedCandId) {
    activeCandidate = (candidates || []).find((c) => c.id === storedCandId);
  }
  if (!activeCandidate && candidates?.length > 0) {
    activeCandidate = candidates[0];
  }

  const candidateName = activeCandidate?.name || user?.name || 'Candidate';
  const candidateEmail = activeCandidate?.email || user?.email || 'candidate@interviewx.local';
  const candidateRole = activeCandidate?.role || 'Software Engineering Assessment';

  const candidateInitials = candidateName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CA';

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setLogoutModalOpen(false);
      setAccountMenuOpen(false);
      sessionStorage.removeItem('interviewx_active_candidate_id');
      showToast('Exited candidate session.', 'primary');
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.message || 'Unable to sign out.', 'danger');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased text-left selection:bg-blue-600/15 selection:text-blue-900">
      
      {/* Calm, Focused Candidate Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30 shadow-xs px-4 sm:px-8 flex items-center justify-between">
        
        {/* Brand & Context */}
        <div className="flex items-center space-x-6">
          <Link to="/candidate" className="flex items-center space-x-2.5 group">
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              IX
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-slate-900">InterviewX</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-500">Candidate Hub</span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/candidate"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              My Assessments
            </NavLink>
            <NavLink
              to="/candidate/practice"
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Practice Sandbox
            </NavLink>
          </nav>
        </div>

        {/* Right Utility & Profile */}
        <div className="flex items-center space-x-3">
          
          {/* Integrity Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-[11px] text-slate-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fairness & Integrity Verified</span>
          </div>

          <button
            onClick={() => setGuideModalOpen(true)}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
            title="Assessment Guidelines"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Guidelines</span>
          </button>

          {/* Candidate Profile Dropdown */}
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              className="flex items-center space-x-2 p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                {candidateInitials}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate hidden sm:inline">
                {candidateName}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-dropdown z-50 p-2 text-xs text-left animate-fade-in">
                <div className="p-2 border-b border-slate-100 mb-1">
                  <span className="font-semibold text-slate-900 block truncate">{candidateName}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{candidateEmail}</span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-1.5 inline-block font-medium">
                    {candidateRole}
                  </span>
                </div>

                <Link
                  to="/candidate"
                  onClick={() => setAccountMenuOpen(false)}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Assigned Assessments</span>
                </Link>

                <Link
                  to="/candidate/practice"
                  onClick={() => setAccountMenuOpen(false)}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Practice Sandbox (Unscored)</span>
                </Link>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Leave Assessment Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* Main Candidate Canvas */}
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Assessment Guidelines Modal */}
      <Modal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        title="Candidate Assessment Protocol"
        size="md"
      >
        <div className="space-y-4 text-xs text-slate-600 text-left">
          <p className="leading-relaxed">
            InterviewX provides a standardized, fair assessment environment designed to evaluate technical competencies objectively.
          </p>

          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 block">Substantive Technical Scoring</span>
                <span className="text-[11px] text-slate-500">Evaluations focus strictly on technical reasoning, trade-off understanding, and correctness.</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 block">Multilingual Accessibility</span>
                <span className="text-[11px] text-slate-500">Responses in English, Tamil, or Tamil+English code-mixing are evaluated on technical substance with zero language penalty.</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 block">Environment Recommendations</span>
                <span className="text-[11px] text-slate-500">Use a quiet environment with a functional microphone, webcam, and stable internet connection.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={() => setGuideModalOpen(false)} variant="primary" size="sm">
              Understood
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => !isLoggingOut && setLogoutModalOpen(false)}
        title="Exit Candidate Session?"
        size="sm"
      >
        <div className="space-y-4 text-xs text-slate-600 text-left">
          <p className="leading-relaxed">
            Are you sure you want to exit your candidate session? In-progress assessment rooms can be resumed from your assigned link.
          </p>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              onClick={() => setLogoutModalOpen(false)}
              variant="secondary"
              size="sm"
              disabled={isLoggingOut}
            >
              Stay in Session
            </Button>
            <Button
              onClick={handleConfirmLogout}
              variant="danger"
              size="sm"
              loading={isLoggingOut}
            >
              Exit Session
            </Button>
          </div>
        </div>
      </Modal>

      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {(toasts || []).map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg border text-xs font-medium shadow-dropdown flex items-center justify-between space-x-3 transition-all ${
              t.type === 'danger'
                ? 'bg-red-50 text-red-900 border-red-200'
                : t.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <span>{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-current opacity-60 hover:opacity-100 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CandidateLayout;
