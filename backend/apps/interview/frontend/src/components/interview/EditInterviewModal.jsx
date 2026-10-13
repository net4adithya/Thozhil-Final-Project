import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  AlertTriangle, 
  Lock, 
  Plus, 
  Trash2, 
  Clock, 
  Layers, 
  HelpCircle,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { interviewService } from '../../services/interviewService';

export const EditInterviewModal = ({
  isOpen,
  onClose,
  interview,
  onUpdated,
  showToast
}) => {
  if (!isOpen || !interview) return null;

  const status = (interview.status || 'Draft').toLowerCase();
  const isCompleted = status === 'completed' || status === 'evaluated';
  const isInProgress = status === 'in progress' || status === 'in_progress' || status === 'active_session';
  const isLocked = isCompleted || isInProgress;

  // Form state
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'questions' | 'proctoring'
  const [title, setTitle] = useState(interview.title || '');
  const [jobRole, setJobRole] = useState(interview.jobRole || interview.title || '');
  const [department, setDepartment] = useState(interview.department || 'Engineering');
  const [description, setDescription] = useState(interview.description || interview.settings?.description || '');
  const [duration, setDuration] = useState(interview.duration || 30);
  const [interviewType, setInterviewType] = useState(interview.type || interview.interviewType || 'async');
  const [statusVal, setStatusVal] = useState(interview.status || 'Active');

  // Language state
  const currentLang = interview.language || interview.settings?.language;
  const currentCode = typeof currentLang === 'object' ? currentLang?.code : currentLang;
  const currentMode = typeof currentLang === 'object' ? currentLang?.mode : (typeof currentLang === 'string' && currentLang.includes('codemix') ? 'codemix' : 'native');

  const initialLangValue = currentCode === 'ta-IN' 
    ? (currentMode === 'codemix' ? 'ta-IN-codemix' : 'ta-IN-native') 
    : 'en-IN';

  const [languageKey, setLanguageKey] = useState(initialLangValue);

  // Questions state
  const [questions, setQuestions] = useState(
    (interview.questions || []).map((q, idx) => ({
      id: q.id || `q-${idx}-${Date.now()}`,
      text: q.text || '',
      category: q.category || 'General',
      duration: q.duration || q.timeLimit || 180,
      difficulty: q.difficulty || 'Medium'
    }))
  );

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('React');
  const [newQuestionDuration, setNewQuestionDuration] = useState(180);

  // Proctoring settings
  const [proctorTabSwitch, setProctorTabSwitch] = useState(interview.settings?.proctorTabSwitch ?? true);
  const [proctorBlockCopyPaste, setProctorBlockCopyPaste] = useState(interview.settings?.proctorBlockCopyPaste ?? true);
  const [proctorScreenShare, setProctorScreenShare] = useState(interview.settings?.proctorScreenShare ?? true);
  const [instructions, setInstructions] = useState(interview.settings?.instructions || '');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setQuestions((prev) => [
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
    if (isLocked) return;
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Assessment Title is required');
      return;
    }

    try {
      setSaving(true);

      const langMap = {
        'en-IN': { code: 'en-IN', name: 'English', mode: 'native' },
        'ta-IN-native': { code: 'ta-IN', name: 'Tamil', mode: 'native' },
        'ta-IN-codemix': { code: 'ta-IN', name: 'Tamil + English', mode: 'codemix' }
      };

      const selectedLanguage = langMap[languageKey] || langMap['en-IN'];

      const payload = {
        title: title.trim(),
        jobRole: jobRole.trim() || title.trim(),
        department,
        description: description.trim(),
        status: statusVal,
        company: interview.company || '',
        language: selectedLanguage,
        settings: {
          ...(interview.settings || {}),
          language: selectedLanguage,
          description: description.trim(),
          instructions: instructions.trim(),
          proctorTabSwitch,
          proctorBlockCopyPaste,
          proctorScreenShare
        }
      };

      // Only include duration and type if not locked
      if (!isCompleted) {
        payload.duration = parseInt(duration, 10) || 30;
        payload.type = interviewType;
        payload.interviewType = interviewType;
      }

      // Only include questions if not locked
      if (!isLocked) {
        payload.questions = questions.map((q, idx) => ({
          text: q.text,
          category: q.category || 'General',
          duration: q.duration || 180,
          timeLimit: q.duration || 180,
          difficulty: q.difficulty || 'Medium',
          questionOrder: idx
        }));
      }

      const updated = await interviewService.updateInterview(interview.id, payload);
      
      if (typeof showToast === 'function') {
        showToast('Interview updated successfully.', 'success');
      }

      if (typeof onUpdated === 'function') {
        onUpdated(updated);
      }

      onClose();
    } catch (err) {
      console.error('[EditInterviewModal] Save error:', err);
      setErrorMessage(err.message || 'Failed to update interview');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans text-slate-900">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">Edit Assessment</h2>
              <Badge variant={isCompleted ? 'success' : (isInProgress ? 'warning' : 'primary')} size="xs">
                {interview.status || 'Active'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Modify configuration, criteria, and settings for {interview.title || 'Assessment'}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lifecycle Warning Banner if In Progress or Completed */}
        {isCompleted && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center space-x-2 text-xs text-amber-800 font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This assessment has been completed. Historical questions and scoring duration are locked to preserve candidate evidence.</span>
          </div>
        )}

        {isInProgress && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 flex items-center space-x-2 text-xs text-blue-800 font-medium">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>This assessment is currently in progress. Questions and time limits are locked while active.</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex space-x-4 text-xs font-semibold select-none">
          {[
            { id: 'details', label: 'Position & Details' },
            { id: 'questions', label: `Questions (${questions.length})` },
            { id: 'proctoring', label: 'Language & Integrity' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Assessment Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 font-medium"
                    placeholder="e.g. Senior Frontend Engineer (React)"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target Role Title</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 font-medium"
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                    placeholder="Engineering"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Assessment Format</label>
                  <select
                    value={interviewType}
                    disabled={isCompleted}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500 font-medium"
                  >
                    <option value="async">Recorded Asynchronous Assessment</option>
                    <option value="live">Live Interactive AI Voice Interview</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={duration}
                    disabled={isCompleted}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description / Candidate Overview</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-600 leading-relaxed"
                  placeholder="Outline the core goals and expectations for candidates taking this evaluation."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="Draft">Draft (Hidden from candidates)</option>
                  <option value="Active">Active (Ready to take)</option>
                  <option value="Completed">Completed (Archived)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {isLocked && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Question editing is locked because this assessment has already been started or completed.</span>
                </div>
              )}

              {/* Existing questions list */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Question Syllabus ({questions.length})</h3>
                {questions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No questions configured yet.</p>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-500">#{idx + 1}</span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                            {q.category || 'General'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500">{q.duration || 180}s time limit</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">{q.text}</p>
                      </div>

                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Remove question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add question form if not locked */}
              {!isLocked && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Add New Question</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3 space-y-1">
                      <input
                        type="text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Enter question prompt..."
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={newQuestionCategory}
                        onChange={(e) => setNewQuestionCategory(e.target.value)}
                        placeholder="Category (e.g. React)"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                  >
                    Add Question to Syllabus
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LANGUAGE & INTEGRITY */}
          {activeTab === 'proctoring' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Interview Language & Voice</label>
                <select
                  value={languageKey}
                  onChange={(e) => setLanguageKey(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="en-IN">English (India) — Standard Technical English</option>
                  <option value="ta-IN-native">Tamil (தமிழ்) — Pure Tamil AI Interviewer</option>
                  <option value="ta-IN-codemix">Tamil + English Code-Mixed (Tanglish) — Conversational Tamil with English Tech Terms</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Sarvam AI multilingual models adapt pronunciation and transcription to candidate speech.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">Integrity & Proctoring Controls</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proctorTabSwitch}
                      onChange={(e) => setProctorTabSwitch(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Monitor tab switching and window blur</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proctorBlockCopyPaste}
                      onChange={(e) => setProctorBlockCopyPaste(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Detect external copy and paste attempts</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proctorScreenShare}
                      onChange={(e) => setProctorScreenShare(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require continuous session video recording</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700">Special Instructions for Candidate</label>
                <textarea
                  rows="2"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-600"
                  placeholder="e.g. Ensure you are in a quiet room with good lighting."
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditInterviewModal;
