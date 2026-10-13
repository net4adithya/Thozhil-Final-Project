import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Search, 
  Filter, 
  Award, 
  ChevronRight, 
  Briefcase, 
  Building, 
  UserCheck,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Card, Button } from '../components/ui/PremiumComponents';
import { useApp } from '../context/AppContext';

interface CandidateResume {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  matchScore: number;
  skills: string[];
  experience: string;
  status: 'APPROVE' | 'SHORTLIST' | 'REVIEW';
  summary: string;
}

const CANDIDATES: CandidateResume[] = [
  {
    id: 'res-101',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    targetRole: 'Full Stack Engineer Intern',
    matchScore: 94,
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL'],
    experience: '2 years academic projects & open-source contributions',
    status: 'APPROVE',
    summary: 'Strong alignment with our modern TypeScript and React stack. Completed robust full-stack applications with production-grade test coverage.'
  },
  {
    id: 'res-102',
    name: 'Rohan Das',
    email: 'rohan.das@example.com',
    targetRole: 'AI / ML Engineer Intern',
    matchScore: 96,
    skills: ['Python', 'PyTorch', 'FastAPI', 'LangChain', 'Vector DBs', 'Kubernetes'],
    experience: 'Published 1 paper on LLM latency optimization, Kaggle Expert',
    status: 'APPROVE',
    summary: 'Exceptional machine learning pedigree with hands-on fine-tuning and retrieval-augmented generation pipelines.'
  },
  {
    id: 'res-103',
    name: 'Arjun Patel',
    email: 'arjun.patel@example.com',
    targetRole: 'Backend Systems Intern',
    matchScore: 89,
    skills: ['Go', 'Rust', 'Redis', 'Kafka', 'PostgreSQL', 'Linux'],
    experience: '1 internship at fintech startup building low-latency order matching engines',
    status: 'SHORTLIST',
    summary: 'Good systems background with strong concurrency understanding. Recommended for technical sandbox assessment.'
  }
];

export const ResumeModulePage: React.FC = () => {
  const { addToast } = useApp();
  const [candidates, setCandidates] = useState<CandidateResume[]>(CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResume>(CANDIDATES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        const newCandidate: CandidateResume = {
          id: `res-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          email: `${file.name.toLowerCase().replace(/[^a-z]/g, '')}@applicant.com`,
          targetRole: selectedRole === 'All Roles' ? 'Full Stack Engineer Intern' : selectedRole,
          matchScore: Math.floor(Math.random() * 10 + 88),
          skills: ['Python', 'React', 'Docker', 'SQL', 'Git'],
          experience: 'Fresh graduate with internship experience',
          status: 'APPROVE',
          summary: 'Newly parsed resume via NLP entity extraction. High keyword correlation with job specification.'
        };
        setCandidates([newCandidate, ...candidates]);
        setSelectedCandidate(newCandidate);
        addToast(`Uploaded and parsed ${file.name} successfully! Match Score: ${newCandidate.matchScore}%`, 'success');
      }, 1500);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRole === 'All Roles' || c.targetRole.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Module Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">AI Resume Screener & ATS Matcher</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  NLP Parser Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated PDF/Word resume parsing, skill ontology matching, and semantic ATS qualification scoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors">
              {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{isUploading ? 'Extracting Resume...' : 'Upload & Screen Resume'}</span>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleSimulateUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Filter & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="All Roles">All Roles</option>
              <option value="Full Stack">Full Stack Engineer</option>
              <option value="AI / ML">AI / ML Engineer</option>
              <option value="Backend">Backend Systems</option>
            </select>
            <span className="text-xs text-slate-500 font-mono">
              {filteredCandidates.length} Candidates
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Candidates Ranked List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredCandidates.map((c) => {
              const isSelected = selectedCandidate.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{c.name}</h3>
                        <p className="text-[11px] text-slate-500">{c.targetRole}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {c.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {skill}
                      </span>
                    ))}
                    {c.skills.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-medium self-center">
                        +{c.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Candidate Detailed Inspection */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                    {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedCandidate.name}</h2>
                    <p className="text-xs text-slate-500">{selectedCandidate.email} • {selectedCandidate.targetRole}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  selectedCandidate.status === 'APPROVE' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {selectedCandidate.status}
                </span>
              </div>

              {/* Match Score Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semantic Match Index</span>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{selectedCandidate.matchScore}%</div>
                  <p className="text-[11px] text-slate-500 mt-1">Calculated via job ontology embeddings & verified experience.</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-emerald-600 font-mono text-sm bg-white">
                  {selectedCandidate.matchScore}%
                </div>
              </div>

              {/* Extracted Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verified Skills Matrix</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map((skill, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-lg font-medium">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience & Background */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Experience Summary</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedCandidate.experience}
                </p>
              </div>

              {/* AI Screener Justification */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI ATS Evaluation Rationale</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100 font-sans">
                  {selectedCandidate.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
