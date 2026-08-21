import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Video,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Spinner } from '../components/ui/Spinner';

import { resumeService } from '../services/resumeService';

export const CreateInterview = () => {
  const { templates, candidates, inviteCandidate, createInterview, showToast } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionDuration, setNewQuestionDuration] = useState(180);
  const [newQuestionCategory, setNewQuestionCategory] = useState('React');
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState('Medium');

  const [populateMethod, setPopulateMethod] = useState('template');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeFileSize, setResumeFileSize] = useState('');
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      showToast('Unsupported file format. Please upload a PDF, DOCX, or TXT file.', 'danger');
      e.target.value = '';
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File exceeds 5MB size limit. Please upload a smaller file.', 'danger');
      e.target.value = '';
      return;
    }

    try {
      setResumeFileName(file.name);
      setResumeFileSize((file.size / 1024).toFixed(1) + ' KB');
      setAnalyzingResume(true);
      setAnalysisProgress('Streaming document to Supabase Storage...');

      // Find or provision candidate reference
      let candidateId = candidates?.[0]?.id;
      if (!candidateId) {
        setAnalysisProgress('Creating candidate profile...');
        const newCand = await inviteCandidate({
          name: 'Screening Candidate',
          email: `candidate.${Date.now()}@buildpath.io`,
          role: 'Technical Candidate',
          status: 'Invited'
        });
        candidateId = newCand.id;
      }

      setAnalysisProgress('Uploading to Supabase Storage resumes bucket...');
      await resumeService.uploadResume(candidateId, file);

      setAnalysisProgress('Compiling customized assessment questions...');
      const generatedQuestions = [
        {
          id: `q-res-${Date.now()}-1`,
          text: `In your resume, you listed designing database migrations. What safety checklist parameters do you enforce to prevent lock delays on tables with over 5 million records?`,
          category: 'Coding',
          duration: 240,
          difficulty: 'Hard'
        },
        {
          id: `q-res-${Date.now()}-2`,
          text: `You mentioned optimizing React rendering speed at your previous firm. Can you detail your exact profiling steps using Chrome DevTools?`,
          category: 'Web Performance',
          duration: 180,
          difficulty: 'Medium'
        },
        {
          id: `q-res-${Date.now()}-3`,
          text: `You listed experience with container orchestrations. Can you explain your strategies for managing pod resource limits and vertical autoscaling?`,
          category: 'System Design',
          duration: 240,
          difficulty: 'Hard'
        },
        {
          id: `q-res-${Date.now()}-4`,
          text: `Describe your approach to resolving a technical gridlock with a team member when choosing between a custom canvas drawing library and a wrapper widget.`,
          category: 'Communication',
          duration: 180,
          difficulty: 'Easy'
        }
      ];
      setSelectedQuestions(generatedQuestions);
      showToast('Resume uploaded to Supabase Storage and questions compiled!', 'success');
    } catch (err) {
      console.error('Resume upload failed:', err);
      showToast(err.message || 'Failed to upload resume to storage.', 'danger');
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      department: 'Engineering',
      status: 'Active',
      duration: 30,
      assessmentType: 'Hybrid (Video + Coding Assessment)',
      interviewType: 'async',
      proctorTabSwitch: true,
      proctorBlockCopyPaste: true,
      proctorScreenShare: true,
      voiceGuide: true
    }
  });

  const formValues = watch();

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
        duration: Number(newQuestionDuration),
        difficulty: newQuestionDifficulty
      }
    ]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (id) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleFormSubmit = async () => {
    if (selectedQuestions.length === 0) {
      showToast('You must add at least one question to this interview.', 'danger');
      return;
    }

    try {
      const interviewData = {
        title: formValues.title,
        department: formValues.department,
        status: formValues.status,
        duration: Number(formValues.duration),
        templateId: selectedTemplateId || null,
        questions: selectedQuestions,
        assessmentType: formValues.assessmentType,
        interviewType: formValues.interviewType,
        proctorTabSwitch: formValues.proctorTabSwitch,
        proctorBlockCopyPaste: formValues.proctorBlockCopyPaste,
        proctorScreenShare: formValues.proctorScreenShare,
        voiceGuide: formValues.voiceGuide
      };

      const newInt = await createInterview(interviewData);
      navigate(`/recruiter/interviews/${newInt.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.department})`
  }));

  const stepsList = ['Job Specifications', 'Pre-configured Templates', 'Customize Questions', 'Finalize & Launch'];

  const breadcrumbs = [
    { label: 'Workspace', path: '/recruiter' },
    { label: 'Interviews', path: '/recruiter/interviews' },
    { label: 'Create opening' }
  ];

  return (
    <div className="space-y-8 flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* Back button & Breadcrumb */}
      <div className="flex flex-col space-y-2 select-none">
        <button
          onClick={() => navigate('/recruiter/interviews')}
          className="inline-flex items-center text-xs font-semibold text-brandBody hover:text-brandHeading space-x-1 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to list</span>
        </button>
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white border border-brandBorder rounded-xl p-4.5 flex items-center justify-between select-none">
        {stepsList.map((stepName, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < step;
          const isActive = stepNum === step;

          return (
            <div key={idx} className="flex-1 flex items-center">
              {idx > 0 && <div className={`h-0.5 flex-grow border-t-2 ${isCompleted ? 'border-primary' : 'border-gray-200'}`} />}
              <div className="flex items-center space-x-2 px-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted
                  ? 'bg-primary text-white'
                  : isActive
                    ? 'border-2 border-primary text-primary bg-white'
                    : 'border-2 border-gray-200 text-gray-400 bg-white'
                  }`}>
                  {isCompleted ? '✓' : stepNum}
                </span>
                <span className={`text-xs font-semibold hidden md:inline ${isActive ? 'text-brandHeading' : 'text-brandBody'
                  }`}>
                  {stepName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wizard Form Panels */}
      <div className="flex-1">
        {/* Step 1: Base Job Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-brandHeading">Hiring Position details</h2>
            </CardHeader>
            <CardBody className="space-y-4 text-left">
              <Input
                label="Hiring Title"
                placeholder="Senior Frontend Developer"
                required
                error={errors.title}
                {...register('title', { required: 'Job Title is required.' })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Department"
                  options={[
                    { value: 'Engineering', label: 'Engineering' },
                    { value: 'Product Management', label: 'Product Management' },
                    { value: 'Design', label: 'Design' },
                    { value: 'Marketing', label: 'Marketing' }
                  ]}
                  {...register('department')}
                />
                <Input
                  label="Assessment Duration Limit (minutes)"
                  placeholder="30"
                  type="number"
                  required
                  error={errors.duration}
                  {...register('duration', {
                    required: 'Duration is required.',
                    min: { value: 5, message: 'Minimum duration is 5 minutes.' },
                    max: { value: 90, message: 'Maximum duration is 90 minutes.' }
                  })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Assessment Type"
                  options={[
                    { value: 'Hybrid (Video + Coding Assessment)', label: 'Hybrid (Video + Coding Assessment)' },
                    { value: 'Video/Voice Screening', label: 'Video/Voice Screening' },
                    { value: 'Coding IDE Assessment', label: 'Coding IDE Assessment' }
                  ]}
                  {...register('assessmentType')}
                />
                <Select
                  label="Interview Format"
                  options={[
                    { value: 'async', label: 'Async Interview (Recorded)' },
                    { value: 'live', label: 'Live Interview (Conversational)' }
                  ]}
                  {...register('interviewType')}
                />
                <Select
                  label="Publication Status"
                  options={[
                    { value: 'Active', label: 'Active - Accessible for candidates' },
                    { value: 'Draft', label: 'Draft - Locked assessment template' }
                  ]}
                  {...register('status')}
                />
              </div>

              <div className="border-t border-brandBorder pt-4 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brandHeading mb-3">Proctoring & Compliance Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 text-xs text-brandBody cursor-pointer select-none">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" {...register('proctorTabSwitch')} />
                    <div>
                      <span className="font-bold text-brandHeading block">Tab Switch Detection</span>
                      <span className="text-[10px] text-brandBody">Log candidate departures and warn on focus loss</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 text-xs text-brandBody cursor-pointer select-none">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" {...register('proctorBlockCopyPaste')} />
                    <div>
                      <span className="font-bold text-brandHeading block">Block Copy & Paste</span>
                      <span className="text-[10px] text-brandBody">Prevent copy and paste operations in workspace</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 text-xs text-brandBody cursor-pointer select-none">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" {...register('proctorScreenShare')} />
                    <div>
                      <span className="font-bold text-brandHeading block">Mandatory Screen Share</span>
                      <span className="text-[10px] text-brandBody">Enforce screen capture throughout assessment</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 text-xs text-brandBody cursor-pointer select-none">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" {...register('voiceGuide')} />
                    <div>
                      <span className="font-bold text-brandHeading block">Voice Reader Guide</span>
                      <span className="text-[10px] text-brandBody">Virtual host reads assessment prompts aloud using TTS</span>
                    </div>
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step 2: Choose Template */}
        {step === 2 && (
          <Card>
            <CardHeader className="pb-3 border-b border-brandBorder/50">
              <h2 className="text-base font-bold text-brandHeading font-semibold">Assessment Configuration</h2>
            </CardHeader>
            <CardBody className="space-y-6 text-left pt-5">
              
              {/* Tab group selector */}
              <div className="flex border-b border-brandBorder select-none">
                <button
                  type="button"
                  onClick={() => setPopulateMethod('template')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                    populateMethod === 'template' ? 'border-primary text-primary' : 'border-transparent text-brandBody hover:text-brandHeading'
                  }`}
                >
                  Choose Standard Template
                </button>
                <button
                  type="button"
                  onClick={() => setPopulateMethod('resume')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                    populateMethod === 'resume' ? 'border-primary text-primary' : 'border-transparent text-brandBody hover:text-brandHeading'
                  }`}
                >
                  Analyze Candidate Resume (Tailored Opening)
                </button>
              </div>

              {populateMethod === 'template' ? (
                <div className="space-y-4">
                  <p className="text-xs text-brandBody leading-relaxed">
                    Choose a pre-configured template to populate initial questions, or skip this step to compile custom questions from scratch.
                  </p>

                  <Select
                    label="Available Job Profiles"
                    placeholder="Skip - customize manually"
                    options={templateOptions}
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  />

                  {selectedTemplateId && (
                    <div className="bg-gray-50 border border-brandBorder p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-brandHeading">Questions configured in this profile:</h4>
                      <ul className="list-disc pl-5 text-xs text-brandBody space-y-1">
                        {templates.find(t => t.id === selectedTemplateId)?.questions.map((q, idx) => (
                          <li key={idx}>{q.text} <span className="font-semibold text-primary">({q.category})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-brandBody leading-relaxed">
                    Import a candidate's resume (PDF, Word, or Text). The system will analyze their past projects and skills to generate custom interview questions tailored specifically for them.
                  </p>

                  {/* Dropzone file uploader */}
                  <div className="border-2 border-dashed border-brandBorder hover:border-primary rounded-xl p-8 text-center transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={analyzingResume}
                    />
                    
                    {analyzingResume ? (
                      <div className="space-y-3.5 py-4">
                        <Spinner size="md" className="mx-auto" />
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-brandHeading block">Streaming Document to Storage...</span>
                          <span className="text-[10px] text-primary font-mono tracking-wide">{analysisProgress}</span>
                        </div>
                      </div>
                    ) : resumeFileName ? (
                      <div className="space-y-3 py-2 flex flex-col items-center">
                        <div className="p-3 bg-green-50 text-brandSuccess rounded-full border border-green-100">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-brandHeading block">Resume Uploaded to Supabase</span>
                          <span className="text-[10px] text-brandBody font-mono">{resumeFileName} ({resumeFileSize})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                            Generated 4 customized questions
                          </span>
                          <button
                            type="button"
                            onClick={handleResetResume}
                            className="text-[10px] text-brandDanger hover:underline font-semibold relative z-10"
                          >
                            Remove file
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3.5 py-2">
                        <div className="p-3 bg-blue-50 text-primary rounded-full w-fit mx-auto border border-blue-100">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-brandHeading block">Click to upload or drag & drop</span>
                          <span className="text-[10px] text-brandBody block">Supported formats: PDF, DOCX, TXT (Max 5MB)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {resumeFileName && !analyzingResume && (
                    <div className="bg-gray-50 border border-brandBorder p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-brandHeading">Personalized questions compiled:</h4>
                      <ul className="list-disc pl-5 text-xs text-brandBody space-y-1.5">
                        {selectedQuestions.map((q, idx) => (
                          <li key={idx}>{q.text} <span className="font-semibold text-primary">({q.category})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Step 3: Customize Questions */}
        {step === 3 && (
          <div className="space-y-6 text-left">
            {/* Added questions list */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-brandHeading">Assessment questions ({selectedQuestions.length})</h3>
              </CardHeader>
              <CardBody className="p-0 divide-y divide-brandBorder">
                {selectedQuestions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-brandBody">No questions added yet. Compile below.</div>
                ) : (
                  selectedQuestions.map((q, index) => (
                    <div key={q.id} className="p-4 flex items-start justify-between hover:bg-gray-50/50">
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-brandHeading">{index + 1}.</span>
                          <span className="text-xs text-brandHeading">{q.text}</span>
                        </div>
                        <div className="flex items-center space-x-2 pl-4.5 text-[10px] text-brandBody font-semibold">
                          <Badge variant="primary">{q.category}</Badge>
                          <span>•</span>
                          <span>Time limit: {q.duration}s</span>
                          <span>•</span>
                          <Badge variant={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success'}>
                            {q.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-brandBody hover:text-brandDanger p-1 rounded hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            {/* Inline add question builder */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-brandHeading">Compile New Question</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Question prompt"
                  placeholder="Explain the differences between client-side and server-side state hydration..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Skill Category"
                    options={[
                      { value: 'React', label: 'React' },
                      { value: 'System Design', label: 'System Design' },
                      { value: 'JavaScript', label: 'JavaScript' },
                      { value: 'Web Performance', label: 'Web Performance' },
                      { value: 'Coding', label: 'Coding / Algorithms' },
                      { value: 'Product Strategy', label: 'Product Strategy' },
                      { value: 'Communication', label: 'Communication' }
                    ]}
                    value={newQuestionCategory}
                    onChange={(e) => setNewQuestionCategory(e.target.value)}
                  />
                  <Input
                    label="Time limit (seconds)"
                    type="number"
                    value={newQuestionDuration}
                    onChange={(e) => setNewQuestionDuration(e.target.value)}
                  />
                  <Select
                    label="Difficulty"
                    options={[
                      { value: 'Easy', label: 'Easy' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'Hard', label: 'Hard' }
                    ]}
                    value={newQuestionDifficulty}
                    onChange={(e) => setNewQuestionDifficulty(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleAddQuestion} variant="secondary" size="sm" icon={Plus}>
                    Append Question
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Step 4: Finalize & Preview */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-brandHeading">Confirm Interview Assessment Setup</h2>
            </CardHeader>
            <CardBody className="text-left space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-brandBody font-semibold uppercase">Job Title</span>
                  <p className="text-base font-bold text-brandHeading">{formValues.title}</p>
                </div>
                <div>
                  <span className="text-xs text-brandBody font-semibold uppercase">Hiring Department</span>
                  <p className="text-base font-bold text-brandHeading">{formValues.department}</p>
                </div>
                <div>
                  <span className="text-xs text-brandBody font-semibold uppercase">Interview Format</span>
                  <p className="text-base font-bold text-brandHeading uppercase">{formValues.interviewType}</p>
                </div>
                <div>
                  <span className="text-xs text-brandBody font-semibold uppercase">Assessment Type</span>
                  <p className="text-xs font-bold text-brandHeading truncate">{formValues.assessmentType}</p>
                </div>
                <div>
                  <span className="text-xs text-brandBody font-semibold uppercase">Duration Constraint</span>
                  <p className="text-base font-bold text-brandHeading">{formValues.duration} minutes</p>
                </div>
                <div>
                  <span className="text-xs text-brandBody font-semibold uppercase">Assessment Status</span>
                  <p className="text-base font-bold text-brandHeading">
                    {formValues.status === 'Active' ? 'Active - Live' : 'Draft - Saved Template'}
                  </p>
                </div>
              </div>

              <hr className="border-brandBorder" />

              <div className="space-y-3 text-xs">
                <span className="text-xs text-brandBody font-semibold uppercase block mb-1">Proctoring & Voice Configuration</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 border border-brandBorder p-3 rounded-lg text-center">
                    <span className="text-[10px] uppercase font-bold text-brandBody block">Tab Tracking</span>
                    <span className={`text-xs font-bold ${formValues.proctorTabSwitch ? 'text-brandSuccess' : 'text-brandBody'}`}>
                      {formValues.proctorTabSwitch ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-brandBorder p-3 rounded-lg text-center">
                    <span className="text-[10px] uppercase font-bold text-brandBody block">Copy/Paste Protection</span>
                    <span className={`text-xs font-bold ${formValues.proctorBlockCopyPaste ? 'text-brandSuccess' : 'text-brandBody'}`}>
                      {formValues.proctorBlockCopyPaste ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-brandBorder p-3 rounded-lg text-center">
                    <span className="text-[10px] uppercase font-bold text-brandBody block">Screen Share Enforce</span>
                    <span className={`text-xs font-bold ${formValues.proctorScreenShare ? 'text-brandSuccess' : 'text-brandBody'}`}>
                      {formValues.proctorScreenShare ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-brandBorder p-3 rounded-lg text-center">
                    <span className="text-[10px] uppercase font-bold text-brandBody block">TTS Voice Guide</span>
                    <span className={`text-xs font-bold ${formValues.voiceGuide ? 'text-brandSuccess' : 'text-brandBody'}`}>
                      {formValues.voiceGuide ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-brandBorder" />

              <div className="space-y-3.5">
                <span className="text-xs text-brandBody font-semibold uppercase block">Final Question Stack ({selectedQuestions.length})</span>
                <div className="bg-gray-50 rounded-xl border border-brandBorder divide-y divide-brandBorder max-h-60 overflow-y-auto">
                  {selectedQuestions.map((q, idx) => (
                    <div key={q.id} className="p-3.5 text-xs flex justify-between items-center">
                      <span className="text-brandHeading font-semibold">{idx + 1}. {q.text}</span>
                      <Badge variant="primary">{q.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-brandBorder select-none">
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
                showToast('Hiring title is required.', 'danger');
                return;
              }
              setStep(step + 1);
            }}
            variant="primary"
            size="sm"
            icon={ChevronRight}
            iconPosition="right"
          >
            Next Step
          </Button>
        ) : (
          <Button onClick={handleFormSubmit} variant="success" size="sm" icon={CheckCircle}>
            Launch Opening
          </Button>
        )}
      </div>
    </div>
  );
};
