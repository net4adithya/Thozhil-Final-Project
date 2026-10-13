import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Download,
  Plus,
  RefreshCw,
  Award,
  ChevronRight,
  X,
  Briefcase,
  Layers,
  FileCheck,
  TrendingUp,
  Sliders,
  Check,
  Building,
  UserCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';

export const ResumeScreenerPage = () => {
  const { showToast } = useApp();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningProgress, setScreeningProgress] = useState(0);
  const [screeningStage, setScreeningStage] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState('ALL');
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    dept: 'Engineering',
    loc: 'Chennai, IN',
    type: 'Full-time',
    exp: '2–4 years',
    reqSkills: '',
    prefSkills: '',
    desc: ''
  });

  const fileInputRef = useRef(null);

  // Fetch Jobs on Mount
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/screener/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (data.length > 0 && !selectedJob) {
          setSelectedJob(data[0].title);
        }
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      showToast('Could not fetch job profiles from Resume Screener service', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetch Candidates for Selected Job
  const fetchCandidates = async (jobTitle) => {
    if (!jobTitle) return;
    try {
      const res = await fetch(`/api/screener/jobs/${encodeURIComponent(jobTitle)}/candidates`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  useEffect(() => {
    if (selectedJob) {
      fetchCandidates(selectedJob);
    }
  }, [selectedJob]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(f => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return ext === '.pdf' || ext === '.docx';
    });

    if (validFiles.length < files.length) {
      showToast('Only PDF and DOCX files are allowed', 'warning');
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  // Upload and Screen Files
  const handleUploadAndScreen = async () => {
    if (!selectedJob) {
      showToast('Please select a target job first', 'warning');
      return;
    }
    if (uploadedFiles.length === 0) {
      showToast('Please attach at least one resume file', 'warning');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const uploadRes = await fetch(`/api/screener/jobs/${encodeURIComponent(selectedJob)}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      showToast(`Uploaded ${uploadedFiles.length} resume(s). Commencing AI screening...`, 'success');
      setUploadedFiles([]);

      // Start Background Screening
      setIsScreening(true);
      setScreeningProgress(15);
      setScreeningStage('Extracting document text & structures...');

      const screenRes = await fetch(`/api/screener/jobs/${encodeURIComponent(selectedJob)}/screen`, {
        method: 'POST'
      });

      if (!screenRes.ok) {
        throw new Error('Screening trigger failed');
      }

      // Progress animation & Polling
      const stages = [
        { pct: 35, text: 'Parsing technical skills & project history...' },
        { pct: 65, text: 'Evaluating alignment with job specifications...' },
        { pct: 85, text: 'Generating AI fit analysis and recommendations...' },
        { pct: 100, text: 'Screening evaluation complete!' }
      ];

      let currentStageIdx = 0;
      const progressTimer = setInterval(() => {
        if (currentStageIdx < stages.length) {
          setScreeningProgress(stages[currentStageIdx].pct);
          setScreeningStage(stages[currentStageIdx].text);
          currentStageIdx++;
        }
      }, 700);

      // Poll until candidates are processed
      setTimeout(async () => {
        clearInterval(progressTimer);
        setIsScreening(false);
        setScreeningProgress(0);
        await fetchCandidates(selectedJob);
        showToast('Resumes successfully analyzed and ranked!', 'success');
      }, 3500);

    } catch (err) {
      console.error('Screening process error:', err);
      showToast(err.message || 'Error occurred during screening', 'danger');
      setIsScreening(false);
    } finally {
      setUploading(false);
    }
  };

  // Create Job Handler
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim()) return;

    try {
      const payload = {
        title: newJob.title.trim(),
        dept: newJob.dept.trim(),
        loc: newJob.loc.trim(),
        type: newJob.type,
        exp: newJob.exp.trim(),
        reqSkills: newJob.reqSkills.split(',').map(s => s.trim()).filter(Boolean),
        prefSkills: newJob.prefSkills.split(',').map(s => s.trim()).filter(Boolean),
        desc: newJob.desc.trim() || 'Role requirements matching Thozhil engineering standards.'
      };

      const res = await fetch('/api/screener/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create job');
      }

      showToast(`Job '${newJob.title}' created successfully!`, 'success');
      setIsCreateJobOpen(false);
      await fetchJobs();
      setSelectedJob(newJob.title);
      setNewJob({
        title: '',
        dept: 'Engineering',
        loc: 'Chennai, IN',
        type: 'Full-time',
        exp: '2–4 years',
        reqSkills: '',
        prefSkills: '',
        desc: ''
      });
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const activeJobData = jobs.find(j => j.title === selectedJob);

  const filteredCandidates = candidates.filter(cand => {
    const matchesSearch =
      cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.roleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cand.matched_skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRec =
      filterRecommendation === 'ALL' || cand.recommend === filterRecommendation;

    return matchesSearch && matchesRec;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-800 p-6 md:p-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Thozhil Product Module 3</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            AI Resume Screener & Candidate Ranker
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated multi-factor resume parsing, semantic qualification matching, and automated candidate ranking.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCandidates(selectedJob)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateJobOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Job Spec
          </Button>
        </div>
      </div>

      {/* Control Strip & Job Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Left: Role Specification Selector Card */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Role</span>
              <span className="text-xs text-blue-600 font-semibold">{jobs.length} Active Profiles</span>
            </div>

            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              {jobs.map(job => (
                <option key={job.title} value={job.title}>
                  {job.title} ({job.dept} • {job.loc})
                </option>
              ))}
            </select>

            {activeJobData && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-700">{activeJobData.dept}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Experience Req:</span>
                  <span className="font-semibold text-slate-700">{activeJobData.exp}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block mb-1">Required Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {activeJobData.reqSkills?.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] border border-blue-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Upload & Screening Dropzone Card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Batch Document Ingestion (PDF / DOCX)
              </span>
              <span className="text-xs text-slate-400">Max 5MB / file</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
              <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                Click or drag resumes here to upload
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically parsed against {selectedJob || 'the target job criteria'}
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs bg-blue-50/80 border border-blue-100 rounded-lg p-2.5 px-3">
                <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  {uploadedFiles.length} file(s) ready: {uploadedFiles.map(f => f.name).join(', ')}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedFiles([]); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {candidates.length} candidates currently evaluated in this pool
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUploadAndScreen}
              disabled={uploading || isScreening || uploadedFiles.length === 0}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {uploading || isScreening ? 'Processing Resumes...' : 'Upload & Run AI Screening'}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar Active Indicator */}
      {isScreening && (
        <div className="mb-6 p-4 rounded-xl bg-blue-600 text-white shadow-md animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              {screeningStage}
            </span>
            <span>{screeningProgress}%</span>
          </div>
          <div className="w-full bg-blue-800/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${screeningProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter & Candidate Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col flex-1">
        {/* Table Filter Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, role or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium">Verdict:</span>
            {['ALL', 'SHORTLIST', 'REVIEW', 'REJECT'].map(badge => (
              <button
                key={badge}
                onClick={() => setFilterRecommendation(badge)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  filterRecommendation === badge
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Ranking Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">AI Verdict</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Matched Skills</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No candidates found for {selectedJob}. Upload resumes above to begin screening.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(cand => (
                  <tr
                    key={cand.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCandidate(cand)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {cand.avatar || cand.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {cand.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{cand.currentRole || cand.roleText}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-bold text-slate-900">{cand.match}%</div>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              cand.match >= 85 ? 'bg-emerald-500' : cand.match >= 70 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${cand.match}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          cand.recommend === 'SHORTLIST'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cand.recommend === 'REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {cand.recommend}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {cand.expText || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(cand.matched_skills || []).slice(0, 3).map((skill, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                            {skill}
                          </span>
                        ))}
                        {(cand.matched_skills || []).length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{cand.matched_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(cand);
                        }}
                      >
                        Inspect
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Inspection Drawer / Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {selectedCandidate.avatar || selectedCandidate.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedCandidate.name}</h3>
                  <p className="text-xs text-slate-500">{selectedCandidate.currentRole || selectedCandidate.roleText}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Match Score Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Overall AI Match</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{selectedCandidate.match}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Recommendation</div>
                  <Badge variant={selectedCandidate.recommend === 'SHORTLIST' ? 'success' : 'warning'} className="mt-1">
                    {selectedCandidate.recommend}
                  </Badge>
                </div>
              </div>

              {/* AI Qualitative Explanation */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Screener Evaluation Summary
                </h4>
                <p className="text-slate-600 leading-relaxed bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
                  {selectedCandidate.explanation}
                </p>
              </div>

              {/* Matched vs Missing Skills */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="font-bold text-emerald-800 flex items-center gap-1 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Matched Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(selectedCandidate.matched_skills || []).map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="font-bold text-amber-800 flex items-center gap-1 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Missing / Preferred
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(selectedCandidate.missing_skills || []).map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps */}
              {selectedCandidate.strengths?.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 mb-2">Key Strengths Identified</h5>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {selectedCandidate.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCandidate.gaps?.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 mb-2">Candidate Gaps</h5>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {selectedCandidate.gaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">ID: {selectedCandidate.id}</span>
              <a
                href={`/api/screener/candidates/${selectedCandidate.id}/report`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download PDF Report
              </a>
            </div>
          </div>
        </div>
      )}

      {/* New Job Modal */}
      {isCreateJobOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Define New Job Specification</h3>
              <button onClick={() => setIsCreateJobOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newJob.dept}
                    onChange={(e) => setNewJob({ ...newJob, dept: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newJob.loc}
                    onChange={(e) => setNewJob({ ...newJob, loc: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Skills (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="Python, FastAPI, PostgreSQL, Docker"
                  value={newJob.reqSkills}
                  onChange={(e) => setNewJob({ ...newJob, reqSkills: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Skills (Optional)</label>
                <input
                  type="text"
                  placeholder="Kubernetes, Redis, AWS"
                  value={newJob.prefSkills}
                  onChange={(e) => setNewJob({ ...newJob, prefSkills: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables and role expectations..."
                  value={newJob.desc}
                  onChange={(e) => setNewJob({ ...newJob, desc: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateJobOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Specification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
