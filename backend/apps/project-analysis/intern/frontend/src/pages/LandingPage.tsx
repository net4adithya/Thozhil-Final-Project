import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, Users, CheckCircle2, Briefcase, GraduationCap, Code2, Video, LineChart, Cpu, FileCheck, KeyRound, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import heroImage from '../../assets/image.png';

const AUTHORIZED_INTERN_EMAILS = [
  'intern@platform.com',
  'ananya.iyer@example.com',
  'arjun.patel@example.com',
  'rohan.das@example.com',
  'sanjay@stripe.com',
  'rohit@stripe.com',
  'aditi@linear.app',
  'int-901',
  'int-902',
  'int-903',
  'intern'
];

export const LandingPage: React.FC = () => {
  const { setRole, addToast } = useApp();
  const navigate = useNavigate();

  const [showInternAuthModal, setShowInternAuthModal] = useState(false);
  const [showTakeTestMenu, setShowTakeTestMenu] = useState(false);
  const [internEmailInput, setInternEmailInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleSelectRole = (selectedRole: 'authority' | 'intern') => {
    if (selectedRole === 'authority') {
      setRole('authority');
      navigate('/authority');
    } else {
      setShowInternAuthModal(true);
    }
  };

  const handleTakeTestCoding = () => {
    setShowTakeTestMenu(false);
    navigate('/coding-candidate-module');
  };

  const handleTakeTestVideo = () => {
    setShowTakeTestMenu(false);
    navigate('/interview-candidate-module');
  };

  const handleInternAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanInput = internEmailInput.trim().toLowerCase();
    if (!cleanInput) {
      setAuthError('Please enter your assigned Intern Email or ID.');
      return;
    }

    const isAuthorized = AUTHORIZED_INTERN_EMAILS.some(e => cleanInput.includes(e) || e.includes(cleanInput));

    if (isAuthorized) {
      localStorage.setItem('thozhil_intern_identity', cleanInput);
      setRole('intern');
      setShowInternAuthModal(false);
      navigate('/intern');
    } else {
      setAuthError('Access Denied: Intern record not found in system database.');
      addToast('Unauthorized Intern Access Attempt', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white text-textPrimary-light flex flex-col font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="w-full bg-white z-30 py-4 border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 font-bold text-xl text-[#0B1C30]">
              <Sparkles className="w-7 h-7 text-[#1D78F8]" />
              <span>Thozhil</span>
            </div>
            <span className="text-xs font-semibold text-[#1D78F8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Project Analysis Module
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-textSecondary-light relative">
            <a href="/" className="text-[#1D78F8] font-semibold transition-colors">Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleSelectRole('intern'); }} className="hover:text-[#1D78F8] transition-colors">Intern Workspace</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleSelectRole('authority'); }} className="hover:text-[#1D78F8] transition-colors">Manager / Authority Panel</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSelectRole('authority')}
              className="text-sm font-semibold bg-[#1D78F8] text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero with Blue Blob ── */}
      <section className="relative pt-12 pb-24 overflow-hidden min-h-[500px] flex items-center">
        {/* Abstract Blob Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-[120%] -translate-x-[10%] h-auto opacity-90 text-[#1D78F8]">
            <path fill="currentColor" d="M0,0 L0,400 C150,450 300,550 500,450 C700,350 850,150 1100,200 C1300,240 1400,100 1440,50 L1440,0 Z" />
            <path fill="#0D3E8E" opacity="0.3" d="M0,0 L0,420 C180,480 320,580 520,480 C720,380 870,180 1120,230 C1320,270 1420,130 1440,80 L1440,0 Z" />
          </svg>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative z-10 w-full">
          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 pt-10"
          >
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif', letterSpacing: '-0.02em' }}
            >
              "Fueling Your Journey:<br/>
              Internships Ignite, Jobs<br/>
              Propel-Your Trailblazing<br/>
              Odyssey Begins Here!"
            </h1>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => handleSelectRole('intern')}
                className="bg-[#0B1C30] text-white font-semibold text-sm px-8 py-3 rounded-full hover:bg-black transition-colors shadow-lg"
              >
                Intern Access
              </button>
              <button
                onClick={() => handleSelectRole('authority')}
                className="bg-white text-[#1D78F8] font-semibold text-sm px-8 py-3 rounded-full hover:bg-gray-50 transition-colors shadow-lg"
              >
                Manager Access
              </button>
            </div>
          </motion.div>

          {/* Hero Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hidden md:flex justify-end relative z-10"
          >
            <img 
              src={heroImage} 
              alt="Hero Illustration" 
              className="w-[400px] h-auto object-contain drop-shadow-2xl z-10 relative right-10" 
            />
          </motion.div>
        </div>
      </section>

      {/* ── Reality Section ── */}
      <section className="flex-1 max-w-[1200px] mx-auto px-6 py-20 w-full text-center">
        <h2
          className="text-3xl font-bold text-textPrimary-light mb-4"
          style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
        >
          The reality of <span className="text-[#1D78F8]">Starting Your Career</span>
        </h2>
        <div className="w-16 h-1 bg-[#1D78F8] rounded-full mx-auto mb-6" />
        <p className="text-sm text-textSecondary-light max-w-2xl mx-auto leading-relaxed mb-16">
          "Embarking on your career journey? Thozhil unveils the realities with you. Trust our commitment for a seamless start, turning your career dreams into a tangible reality. With Thozhil, step into a future filled with purpose and confidence!"
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Efficiency Enhancing', desc: 'Save Time with Thozhil! Streamline your journey to success. Let Thozhil handle the details, so you can focus on what truly matters - building your future!', icon: <LineChart className="text-[#1D78F8]" size={32}/> },
            { title: 'Complete Flexibility', desc: 'Tailor your career path on your terms. Empower yourself with choices, ensuring your journey to success is uniquely yours.', icon: <CheckCircle2 className="text-[#1D78F8]" size={32}/> },
            { title: 'Placement Assistance', desc: 'Placement assistance Excellence! Secure your future with Thozhil. Our commitment ensures your success - a promise fulfilled in every career step.', icon: <GraduationCap className="text-[#1D78F8]" size={32}/> },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-[0_4px_24px_rgba(29,120,248,0.08)] border border-gray-100 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-[#0B1C30] mb-3">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer with Blob ── */}
      <footer className="relative bg-white pt-32 pb-8 overflow-hidden mt-10">
        <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0">
          <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[120%] -translate-x-[10%] h-auto text-[#1D78F8]">
            <path fill="currentColor" d="M0,200 C300,100 500,300 800,200 C1100,100 1300,250 1440,150 L1440,320 L0,320 Z" />
            <path fill="#0D3E8E" opacity="0.4" d="M0,250 C250,150 450,350 750,250 C1050,150 1250,280 1440,180 L1440,320 L0,320 Z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center text-white pb-10">
        </div>
      </footer>

      {/* ── Intern Authorization Modal ── */}
      {showInternAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 text-slate-800 relative"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Intern Sign In</h3>
                <p className="text-xs text-slate-500">Sign in with your registered email & password to access Project Dashboard</p>
              </div>
            </div>

            <form onSubmit={handleInternAuthorize} className="space-y-4">
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-500" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sanjay@stripe.com"
                  value={internEmailInput}
                  onChange={(e) => setInternEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  defaultValue="password123"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Valid test emails: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">sanjay@stripe.com</code>, <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">aditi@linear.app</code>, <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">ananya.iyer@example.com</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInternAuthModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full text-xs font-semibold bg-[#1D78F8] text-white hover:bg-blue-600 transition-colors shadow-md"
                >
                  Sign In & Enter Dashboard
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
