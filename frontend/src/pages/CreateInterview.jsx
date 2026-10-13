import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  FileText,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { candidateService } from '../services/candidateService';
import { resumeService } from '../services/resumeService';

export const CreateInterview = () => {
  const { templates, candidates, inviteCandidate, createInterview, showToast } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [creationMode, setCreationMode] = useState('standard'); // 'standard' | 'custom'
  const [targetSeniority, setTargetSeniority] = useState('Senior');
  const [customFocusTopics, setCustomFocusTopics] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionDuration, setNewQuestionDuration] = useState(180);
  const [newQuestionCategory, setNewQuestionCategory] = useState('React');

  const [populateMethod, setPopulateMethod] = useState('template'); // 'template' | 'resume' | 'manual'
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeFileSize, setResumeFileSize] = useState('');
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [uploadedCandidateId, setUploadedCandidateId] = useState(null);

  const { register, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      department: 'Engineering',
      status: 'Active',
      duration: 30,
      assessmentType: 'Hybrid (Video + Coding Assessment)',
      interviewType: 'async',
      interviewLanguage: 'en-IN',
      proctorTabSwitch: true,
      proctorBlockCopyPaste: true,
      proctorScreenShare: true,
      voiceGuide: true
    }
  });

  const formValues = watch();

  // Handle Resume Upload & Question Generation
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      showToast('Please upload a PDF, DOCX, or TXT file.', 'danger');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB.', 'danger');
      e.target.value = '';
      return;
    }

    try {
      setResumeFileName(file.name);
      setResumeFileSize((file.size / 1024).toFixed(1) + ' KB');
      setAnalyzingResume(true);
      setAnalysisProgress('Uploading candidate resume...');

      let candidateId = uploadedCandidateId;
      if (!candidateId) {
        setAnalysisProgress('Setting up candidate profile...');
        const newCand = await candidateService.inviteCandidate({
          name: 'Screening Candidate',
          email: `candidate.${Date.now()}@example.com`,
          role: formValues.title || 'Technical Candidate',
          status: 'Invited'
        });
        candidateId = newCand?.id;
        setUploadedCandidateId(candidateId);
      }

      setAnalysisProgress('Uploading resume...');
      const uploadRes = await resumeService.uploadResume(candidateId, file);

      setAnalysisProgress('Creating interview questions from resume...');
      const targetRole = formValues.title || 'Software Engineer';
      const generatedResult = await resumeService.generateQuestionsFromResume(
        uploadRes.id,
        { roleTitle: targetRole }
      );

      if (generatedResult && Array.isArray(generatedResult.questions) && generatedResult.questions.length > 0) {
        setSelectedQuestions(generatedResult.questions);
        showToast(`Resume uploaded! Added ${generatedResult.questions.length} questions based on their experience.`, 'success');
      } else {
        throw new Error('Could not generate questions from resume. Please try another file.');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to read resume.', 'danger');
      setResumeFileName('');
      setResumeFileSize('');
    } finally {
      setAnalyzingResume(false);
      setAnalysisProgress('');
    }
  };

  const handleResetResume = (e) => {
    e?.stopPropagation();
    setResumeFileName('');
    setResumeFileSize('');
    setSelectedQuestions([]);
  };

  // Load template questions when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const match = templates.find((t) => t.id === selectedTemplateId);
      if (match) {
        setSelectedQuestions(match.questions.map((q, idx) => ({
          id: `q-init-${idx}-${Date.now()}`,
          text: q.text,
          category: q.category,
          duration: q.duration || 180,
          difficulty: q.difficulty || 'Medium'
        })));
      }
    }
  }, [selectedTemplateId, templates]);

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;

    setSelectedQuestions((prev) => [
      ...prev,
      {
        id: `q-custom-${Date.now()}`,
        text: newQuestionText.trim(),
        category: newQuestionCategory,
        duration: parseInt(newQuestionDuration, 10) || 180,
        difficulty: 'Medium'
      }
    ]);

    setNewQuestionText('');
  };

  const handleRemoveQuestion = (qId) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleFormSubmit = async () => {
    if (!formValues.title || !formValues.title.trim()) {
      showToast('Position Title is required.', 'danger');
      setStep(1);
      return;
    }

    try {
      const langMap = {
        'en-IN': { code: 'en-IN', name: 'English', mode: 'native' },
        'ta-IN-native': { code: 'ta-IN', name: 'Tamil', mode: 'native' },
        'ta-IN-codemix': { code: 'ta-IN', name: 'Tamil + English', mode: 'codemix' }
      };
      const selectedLanguage = langMap[formValues.interviewLanguage] || langMap['en-IN'];

      const interviewData = {
        title: formValues.title,
        jobRole: formValues.title,
        department: formValues.department,
        status: formValues.status,
        duration: parseInt(formValues.duration, 10) || 30,
        interviewType: formValues.interviewType,
        type: formValues.interviewType,
        language: selectedLanguage,
        settings: {
          language: selectedLanguage
        },
        questions: selectedQuestions,
        proctorTabSwitch: formValues.proctorTabSwitch,
        proctorBlockCopyPaste: formValues.proctorBlockCopyPaste,
        proctorScreenShare: formValues.proctorScreenShare,
        voiceGuide: formValues.voiceGuide
      };

      const newInt = await createInterview(interviewData);

      if (uploadedCandidateId && newInt?.id) {
        try {
          await candidateService.updateCandidate(uploadedCandidateId, {
            interviewId: newInt.id,
            interview_id: newInt.id,
            role: formValues.title || 'Technical Candidate'
          });
        } catch (candLinkErr) {
          console.warn('Candidate link notice:', candLinkErr.message);
        }
      }

      navigate(`/recruiter/interviews/${newInt.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const stepsList = ['Job Details', 'Questions', 'Interview Rules', 'Review & Publish'];

  return (
    <div className="space-y-6 flex-1 flex flex-col max-w-4xl mx-auto w-full font-sans text-slate-900 text-left">
      {/* Back button */}
      <div className="flex items-center justify-between select-none">
        <button
          onClick={() => navigate('/recruiter/interviews')}
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 space-x-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Interviews</span>
        </button>
        <span className="text-xs text-slate-500 font-medium">Step {step} of 4</span>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between select-none shadow-xs">
        {stepsList.map((stepName, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < step;
          const isActive = stepNum === step;

          return (
            <div key={idx} className="flex-1 flex items-center">
              {idx > 0 && (
                <div className={`h-0.5 flex-grow border-t mx-2 ${isCompleted ? 'border-blue-600' : 'border-slate-200'}`} />
              )}
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-600'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {isCompleted ? '✓' : stepNum}
                </span>
                <span className={`text-xs hidden sm:inline ${
                  isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
                }`}>
                  {stepName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Panels */}
      <div className="flex-1">
        {/* Step 1: Role Specifications */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Interview Setup</h2>
              <p className="text-xs text-slate-500 mt-0.5">Choose how you want to set up questions for this role.</p>
            </div>

            {/* Assessment Strategy Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 select-none">
              <div
                onClick={() => {
                  setCreationMode('standard');
                  setPopulateMethod('template');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  creationMode === 'standard'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${creationMode === 'standard' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-900">Use Pre-made Template</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Use ready-made questions chosen for standard engineering roles.
                </p>
              </div>

              <div
                onClick={() => {
                  setCreationMode('custom');
                  setPopulateMethod('manual');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  creationMode === 'custom'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className={`w-3.5 h-3.5 ${creationMode === 'custom' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900">Custom Questions</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Upload a candidate resume or pick specific skills and difficulty levels.
                </p>
              </div>
            </div>

            {/* Custom Mode Progressive Disclosure */}
            {creationMode === 'custom' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Role & Skill Options</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Experience Level</label>
                    <select
                      value={targetSeniority}
                      onChange={(e) => setTargetSeniority(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                    >
                      <option value="Junior">Junior (1-2 years) — Core fundamentals</option>
                      <option value="Mid-Level">Mid-Level (3-5 years) — Practical coding & design</option>
                      <option value="Senior">Senior (5-8 years) — System architecture & leadership</option>
                      <option value="Staff / Lead">Lead / Architect (8+ years) — Large-scale systems</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Skills & Topics to Test</label>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {['React & Web UI', 'Node.js & APIs', 'System Design', 'PostgreSQL & Databases', 'Microservices & Caching', 'Cloud & DevOps'].map((topic) => {
                        const isSelected = customFocusTopics.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setCustomFocusTopics((prev) => prev.filter((t) => t !== topic));
                              } else {
                                setCustomFocusTopics((prev) => [...prev, topic]);
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-1 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Position Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  {...register('title', { required: 'Position Title is required.' })}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
                {errors.title && <span className="text-[11px] text-red-600 font-medium">{errors.title.message}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Department</label>
                  <select
                    {...register('department')}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product Management</option>
                    <option value="Design">Design</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Assessment Duration (Minutes) *</label>
                  <input
                    type="number"
                    placeholder="30"
                    {...register('duration', {
                      required: 'Duration is required.',
                      min: { value: 5, message: 'Minimum duration is 5 minutes.' },
                      max: { value: 90, message: 'Maximum duration is 90 minutes.' }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  {errors.duration && <span className="text-[11px] text-red-600 font-medium">{errors.duration.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Interview Format</label>
                  <select
                    {...register('interviewType')}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="async">Recorded Assessment (Asynchronous)</option>
                    <option value="live">Live Interview (Real-Time Conversational)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Interview Language</label>
                  <select
                    {...register('interviewLanguage')}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="en-IN">English</option>
                    <option value="ta-IN-native">தமிழ் (Tamil)</option>
                    <option value="ta-IN-codemix">Tamil + English</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Publication Status</label>
                  <select
                    {...register('status')}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Question Configuration */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Method Chooser */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'template', label: 'Use Template', desc: 'Select from pre-built question sets' },
                { id: 'resume', label: 'Import from Resume', desc: 'Tailor questions to candidate background' },
                { id: 'manual', label: 'Add Custom', desc: 'Compose custom questions manually' }
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => setPopulateMethod(method.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    populateMethod === method.id
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-900 block">{method.label}</span>
                  <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">{method.desc}</span>
                </div>
              ))}
            </div>

            {/* Template selector */}
            {populateMethod === 'template' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <label className="text-xs font-semibold text-slate-900 block">Select a Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Select a template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department}) — {t.questions?.length || 0} questions
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Resume Upload */}
            {populateMethod === 'resume' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">Upload Resume</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Upload a resume (PDF, DOCX, or TXT) to automatically create questions based on candidate skills.</p>
                </div>

                {!resumeFileName ? (
                  <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors relative cursor-pointer bg-slate-50/50">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeUpload}
                      disabled={analyzingResume}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-800">Upload resume file</span>
                      <span className="text-[11px] text-slate-400">PDF, DOCX, or TXT up to 5MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-xs font-medium text-slate-900">{resumeFileName}</span>
                        <span className="text-[10px] text-slate-400 block">{resumeFileSize}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleResetResume}
                      className="text-xs text-slate-500 hover:text-red-600 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {analyzingResume && (
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-center space-x-2.5 text-xs text-blue-800">
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>{analysisProgress || 'Analyzing resume...'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Add Question */}
            {populateMethod === 'manual' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-semibold text-slate-900">Add Custom Question</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter question prompt..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <div className="grid grid-cols-3 gap-2.5">
                    <select
                      value={newQuestionCategory}
                      onChange={(e) => setNewQuestionCategory(e.target.value)}
                      className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="React">React</option>
                      <option value="System Design">System Design</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Web Performance">Web Performance</option>
                      <option value="Architecture">Architecture</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Time (sec)"
                      value={newQuestionDuration}
                      onChange={(e) => setNewQuestionDuration(e.target.value)}
                      className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <Button onClick={handleAddQuestion} size="xs" variant="secondary" icon={Plus}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Question List Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Questions Selected ({selectedQuestions.length})
                </span>
                {selectedQuestions.length > 0 && (
                  <button
                    onClick={() => setSelectedQuestions([])}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedQuestions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-white">
                  <p className="text-xs text-slate-500">No questions added yet. Pick a template, upload a resume, or add custom questions above.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {selectedQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-start justify-between space-x-3 shadow-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-blue-600">Q{idx + 1}</span>
                          <Badge variant="secondary" size="xs">{q.category}</Badge>
                          <span className="text-[10px] text-slate-400">{q.duration || 180}s</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium">{q.text}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Interview Rules & Proctoring */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Interview Rules</h2>
              <p className="text-xs text-slate-500 mt-0.5">Choose which rules to turn on for the candidate during the interview.</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  {...register('proctorTabSwitch')}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Track tab switching</span>
                  <span className="text-[11px] text-slate-500">Alert if the candidate switches to another browser tab or window.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  {...register('proctorBlockCopyPaste')}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Block copy and paste</span>
                  <span className="text-[11px] text-slate-500">Prevent pasting code or text from outside sources into answers.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  {...register('proctorScreenShare')}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Require full-screen mode</span>
                  <span className="text-[11px] text-slate-500">Ask candidates to stay in full screen during the interview.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  {...register('voiceGuide')}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Voice narration</span>
                  <span className="text-[11px] text-slate-500">Read out interview questions aloud using a natural AI voice.</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Finalize & Review */}
        {step === 4 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Review & Publish Interview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Check your interview settings before publishing.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Position Title</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{formValues.title}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Department</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{formValues.department}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Format</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {formValues.interviewType === 'live' ? 'Live Interview' : 'Recorded Assessment'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Language</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {formValues.interviewLanguage === 'ta-IN-codemix'
                    ? 'Tamil + English'
                    : formValues.interviewLanguage === 'ta-IN-native'
                    ? 'தமிழ் (Tamil)'
                    : 'English'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Duration</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{formValues.duration} mins</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Configured Questions ({selectedQuestions.length})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-56 overflow-y-auto bg-white">
                {selectedQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <span className="text-slate-900 font-medium">{idx + 1}. {q.text}</span>
                    <Badge variant="secondary" size="xs">{q.category}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 select-none">
        <Button
          onClick={() => step > 1 && setStep(step - 1)}
          variant="secondary"
          size="sm"
          disabled={step === 1}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => {
              if (step === 1 && !watch('title').trim()) {
                showToast('Position Title is required.', 'danger');
                return;
              }
              setStep(step + 1);
            }}
            size="sm"
            variant="primary"
            icon={ChevronRight}
            iconPosition="right"
          >
            Continue
          </Button>
        ) : (
          <Button 
            onClick={handleFormSubmit} 
            size="sm" 
            variant="primary"
            icon={CheckCircle}
          >
            Publish Interview
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateInterview;
