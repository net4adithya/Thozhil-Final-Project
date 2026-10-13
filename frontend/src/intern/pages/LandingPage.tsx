import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  Briefcase, 
  GraduationCap, 
  Code2, 
  Video, 
  LineChart, 
  FileCheck2, 
  FileText, 
  Sparkles, 
  ShieldCheck,
  UserCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/InternContext';
import heroImage from '../../assets/image.png';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useApp();
  const [isProductsOpen, setIsProductsOpen] = React.useState(false);
  const productsRef = React.useRef<HTMLDivElement>(null);

  // Close products dropdown if clicked outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productsRef.current && !productsRef.current.contains(event.target as Node)) {
        setIsProductsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoCandidate = () => {
    navigate('/login', { state: { from: { pathname: '/intern' }, defaultTab: 'candidate' } });
  };

  const handleGoEmployer = () => {
    navigate('/login', { state: { from: { pathname: '/authority' }, defaultTab: 'admin' } });
  };

  const handleProductTouch = (destPath: string, roleTab: 'admin' | 'candidate') => {
    setIsProductsOpen(false);
    navigate('/login', { state: { from: { pathname: destPath }, defaultTab: roleTab } });
  };

  const handleCandidateLogin = () => {
    navigate('/login', { state: { from: { pathname: '/intern' }, defaultTab: 'candidate' } });
  };

  const handleEmployerLogin = () => {
    navigate('/login', { state: { from: { pathname: '/authority' }, defaultTab: 'admin' } });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans overflow-x-hidden">

      {/* ── 1. Top Navbar ── */}
      <header className="w-full bg-white z-30 py-3.5 border-b border-slate-100 sticky top-0 shadow-xs">
        <div className="max-w-[1240px] mx-auto px-6 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center gap-2 font-black text-xl text-[#0B1C30]">
              <Sparkles className="w-6 h-6 text-[#1D78F8]" />
              <span>Thozhil</span>
            </div>
            <span className="text-[11px] font-bold text-[#1D78F8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
              Unified Platform
            </span>
          </div>

          {/* Navigation Links with Products Dropdown (Inspired by Reference UI) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button 
              onClick={() => navigate('/')} 
              className="text-[#1D78F8] hover:text-blue-700 transition-colors font-bold cursor-pointer"
            >
              Home
            </button>

            {/* Products Dropdown (AI Video Interviewer, AI Resume Screener, AI Coding Interviewer) */}
            <div 
              ref={productsRef}
              className="relative"
              onMouseEnter={() => setIsProductsOpen(true)}
              onMouseLeave={() => setIsProductsOpen(false)}
            >
              <button 
                type="button"
                onClick={() => setIsProductsOpen(!isProductsOpen)}
                className={`hover:text-[#1D78F8] transition-colors cursor-pointer flex items-center gap-1.5 py-1 ${
                  isProductsOpen ? 'text-[#1D78F8]' : ''
                }`}
              >
                <span>Products</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProductsOpen ? 'rotate-180 text-[#1D78F8]' : 'text-slate-400'}`} />
              </button>

              {/* Mega Menu Dropdown */}
              {isProductsOpen && (
                <div className="absolute top-full -left-20 pt-3 w-[720px] z-50 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-left">
                    <div className="grid grid-cols-12 gap-6">
                      
                      {/* Column 1: PRODUCT (The 3 Modules) */}
                      <div className="col-span-5 space-y-3 border-r border-slate-100 pr-4">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pb-1">
                          PRODUCT
                        </div>
                        
                        {/* 1. AI Video Interviewer */}
                        <div 
                          onClick={() => handleProductTouch('/candidate', 'candidate')}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-dashed border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#1D78F8] transition-colors">
                              AI Video Interviewer
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                              Conversational automated video assessments & speech analysis
                            </div>
                          </div>
                        </div>

                        {/* 2. AI Resume Screener */}
                        <div 
                          onClick={() => handleProductTouch('/recruiter/resume-screener', 'admin')}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-dashed border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <FileCheck2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#1D78F8] transition-colors">
                              AI Resume Screener
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                              Intelligent resume parser & JD alignment scoring
                            </div>
                          </div>
                        </div>

                        {/* 3. AI Coding Interviewer */}
                        <div 
                          onClick={() => handleProductTouch('/recruiter/coding-assessments', 'admin')}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-dashed border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Code2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#1D78F8] transition-colors">
                              AI Coding Interviewer
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                              Real-time multi-language sandboxed code execution
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: PLATFORM */}
                      <div className="col-span-4 space-y-3 border-r border-slate-100 pr-4">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pb-1">
                          PLATFORM
                        </div>

                        <div 
                          onClick={() => handleProductTouch('/authority', 'admin')}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-dashed border-blue-300 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#1D78F8] transition-colors">
                              Employer Hub
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              Recruiter authority panel
                            </div>
                          </div>
                        </div>

                        <div 
                          onClick={() => handleProductTouch('/intern', 'candidate')}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-dashed border-blue-300 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#1D78F8] transition-colors">
                              Candidate Space
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              Live assessments & tasks
                            </div>
                          </div>
                        </div>

                        <div 
                          onClick={() => handleProductTouch('/interns', 'admin')}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-dashed border-blue-300 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#1D78F8] transition-colors">
                              Skill Verification
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              Validated talent credentials
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: ASSESSMENT TOOLS */}
                      <div className="col-span-3 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                            ASSESSMENT TOOLS
                          </div>
                          <div className="space-y-2 text-xs font-medium text-slate-600">
                            <button 
                              onClick={() => handleProductTouch('/candidate/device-check', 'candidate')}
                              className="block hover:text-[#1D78F8] transition-colors text-left"
                            >
                              Device & Cam Check
                            </button>
                            <button 
                              onClick={() => handleProductTouch('/candidate/practice', 'candidate')}
                              className="block hover:text-[#1D78F8] transition-colors text-left"
                            >
                              Practice Sandbox
                            </button>
                            <button 
                              onClick={() => handleProductTouch('/recruiter/questions', 'admin')}
                              className="block hover:text-[#1D78F8] transition-colors text-left"
                            >
                              Question Library
                            </button>
                            <button 
                              onClick={() => handleProductTouch('/recruiter/templates', 'admin')}
                              className="block hover:text-[#1D78F8] transition-colors text-left"
                            >
                              Templates
                            </button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => handleProductTouch('/authority', 'admin')}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>View all</span>
                            <span className="text-xs">↗</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleGoCandidate} 
              className="hover:text-[#1D78F8] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-blue-500" />
              <span>Candidate Portal</span>
            </button>
            <button 
              onClick={handleGoEmployer} 
              className="hover:text-[#1D78F8] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4 text-slate-700" />
              <span>Employer Portal</span>
            </button>
          </nav>

          {/* Exactly TWO Sign In Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCandidateLogin}
              className="text-xs font-bold text-[#1D78F8] bg-blue-50 border border-blue-200 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Candidate Sign In</span>
            </button>
            <button
              onClick={handleEmployerLogin}
              className="text-xs font-bold bg-[#1D78F8] text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Employer Sign In</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── 2. Hero Section (Deep Blue Solid Gradient & Full Contrast) ── */}
      <section className="relative bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#1D78F8] text-white pt-16 pb-20 px-6 sm:px-10 overflow-hidden shadow-md">
        
        {/* Subtle Decorative Ambient Lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-sky-400/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[250px] bg-blue-950/40 blur-[80px] pointer-events-none rounded-full" />

        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          
          {/* Hero Left Column: Copy & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-100 text-xs font-bold px-3.5 py-1 rounded-full backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              <span>Single Unified Hiring & Assessment Architecture</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.18] tracking-tight drop-shadow-sm"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              "Fueling Your Journey:<br />
              <span className="text-sky-300">Internships Ignite, Jobs Propel</span> —<br />
              Your Trailblazing Odyssey Begins Here!"
            </h1>

            <p className="text-sm sm:text-base text-blue-100 max-w-xl leading-relaxed font-normal">
              One unified platform bringing together Candidate Hardware Checks, AI Video Interviews, Sandboxed Coding Assessments, AI Resume Screening, and Post-Hire Intern Sprint Governance.
            </p>

            {/* Exactly TWO Main Portal Action Cards / Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-4 max-w-lg">
              
              {/* Option 1: Candidate & Intern Portal */}
              <button
                onClick={handleGoCandidate}
                className="flex-1 bg-white text-[#0B2545] hover:bg-blue-50 transition-all p-4 rounded-2xl shadow-xl flex items-center justify-between group text-left cursor-pointer border border-white/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1D78F8] flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 leading-tight">Candidate Portal</div>
                    <div className="text-[11px] text-slate-500 font-medium">Interviews, Coding & Sandbox</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#1D78F8] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 2: Employer & Recruiter Portal */}
              <button
                onClick={handleGoEmployer}
                className="flex-1 bg-[#07172B] hover:bg-black transition-all p-4 rounded-2xl shadow-xl flex items-center justify-between group text-left cursor-pointer border border-blue-400/30 text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900/60 text-sky-400 flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white leading-tight">Employer Portal</div>
                    <div className="text-[11px] text-blue-200 font-medium">Recruiter, Screener & Review</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
              </button>

            </div>

          </motion.div>

          {/* Hero Right Column: Graphic / Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative rounded-3xl p-2 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl max-w-md">
              <img 
                src={heroImage} 
                alt="Thozhil Platform" 
                className="w-full h-auto object-contain rounded-2xl shadow-inner max-h-[380px]"
              />
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 3. The Reality Section ── */}
      <section className="max-w-[1240px] mx-auto px-6 py-16 w-full text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3"
          style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
        >
          The reality of <span className="text-[#1D78F8]">Starting Your Career</span>
        </h2>
        <div className="w-16 h-1 bg-[#1D78F8] rounded-full mx-auto mb-4" />
        <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12">
          "Embarking on your career journey? Thozhil unveils the realities with you. Trust our commitment for a seamless start, turning your career dreams into a tangible reality. With Thozhil, step into a future filled with purpose and confidence!"
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { 
              title: 'Efficiency Enhancing', 
              desc: 'Save Time with Thozhil! Streamline your journey to success. Let Thozhil handle the details, so you can focus on building your technical foundation!', 
              icon: <LineChart className="text-[#1D78F8]" size={28}/> 
            },
            { 
              title: 'Complete Flexibility', 
              desc: 'Tailor your recruitment and assessment paths on your terms. Comprehensive tools designed to test real skills objectively.', 
              icon: <CheckCircle2 className="text-[#1D78F8]" size={28}/> 
            },
            { 
              title: 'Placement Assistance', 
              desc: 'Placement assistance excellence! Secure your future with Thozhil. Seamless handover from hiring assessment to real intern sprint work.', 
              icon: <GraduationCap className="text-[#1D78F8]" size={28}/> 
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white p-7 rounded-2xl shadow-[0_4px_20px_rgba(29,120,248,0.06)] border border-slate-100 flex flex-col items-center hover:border-blue-200 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Four Core Platform Modules Showcase (Clear Dual-Role Access) ── */}
      <section className="bg-slate-50 border-t border-slate-100 py-16 px-6">
        <div className="max-w-[1240px] mx-auto text-center space-y-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Two Portals • Four Integrated Microservices</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              One Unified Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2">
              Every stage of the hiring lifecycle unified in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            
            {/* Module 1: LogLense */}
            <div 
              onClick={() => handleProductTouch('/authority', 'admin')} 
              className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Module 1 • LogLense
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 mt-3 mb-1">
                  Code Review & Audits
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automated line-level code reviews against sprint deliverables with AI evaluation and voice feedback.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Sign in to Open</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 2: InterviewX */}
            <div 
              onClick={() => handleProductTouch('/candidate', 'candidate')} 
              className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Module 2 • InterviewX
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 mt-3 mb-1">
                  AI Video & Voice Interviews
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Conversational adaptive speech interviews with camera diagnostics and real-time proctoring telemetry.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Sign in to Open</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 3: AI Resume Screener */}
            <div 
              onClick={() => handleProductTouch('/recruiter/resume-screener', 'admin')} 
              className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Module 3 • Screener
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 mt-3 mb-1">
                  AI Resume Screener
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Semantic resume parsing, qualification match scoring, gap analysis, and candidate pipeline ranking.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Sign in to Open</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 4: Coding Assessments */}
            <div 
              onClick={() => handleProductTouch('/recruiter/coding-assessments', 'admin')} 
              className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Module 4 • Sandbox
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 mt-3 mb-1">
                  Coding Assessments
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Monaco IDE coding challenges with live execution against unit test suites and complexity scoring.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                <span>Sign in to Open</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Simple Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-[#1D78F8]" />
            <span>THOZHIL Unified Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <button onClick={handleGoCandidate} className="hover:text-blue-600 cursor-pointer">Candidate Portal</button>
            <button onClick={handleGoEmployer} className="hover:text-blue-600 cursor-pointer">Employer Portal</button>
            <button onClick={handleEmployerLogin} className="hover:text-blue-600 cursor-pointer">Sign In</button>
          </div>
          <div>© {new Date().getFullYear()} Thozhil. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
};
