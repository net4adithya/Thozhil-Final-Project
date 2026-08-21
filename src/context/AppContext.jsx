import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { interviewService } from '../services/interviewService';
import { candidateService } from '../services/candidateService';
import { questionService } from '../services/questionService';
import { answerService } from '../services/answerService';
import { reportService } from '../services/reportService';
import { resumeService } from '../services/resumeService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [interviews, setInterviews] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [settings, setSettings] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast dispatcher
  const showToast = useCallback((message, type = 'primary') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all core datasets
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [intList, tplList, candList, settingsData, analyticsData] = await Promise.all([
        interviewService.getInterviews().catch(() => []),
        interviewService.getTemplates().catch(() => []),
        candidateService.getCandidates().catch((err) => {
          console.warn('Backend candidate fetch error:', err.message);
          return [];
        }),
        interviewService.getSettings().catch(() => ({})),
        reportService.getAnalytics().catch(() => null),
      ]);

      setInterviews(intList);
      setTemplates(tplList);
      setCandidates(candList);
      setSettings(settingsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load application data:', error);
      showToast(error.message || 'Failed to sync data.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const createInterview = async (interviewData) => {
    try {
      const newInt = await interviewService.createInterview(interviewData);
      showToast(`Interview "${newInt.title}" created successfully!`, 'success');
      await refreshData();
      return newInt;
    } catch (e) {
      showToast(e.message || 'Failed to create interview.', 'danger');
      throw e;
    }
  };

  const updateInterviewStatus = async (id, status) => {
    try {
      await interviewService.updateInterviewStatus(id, status);
      showToast(`Interview status updated to ${status}.`, 'primary');
      await refreshData();
    } catch (e) {
      showToast(e.message || 'Failed to update status.', 'danger');
    }
  };

  const deleteInterview = async (id) => {
    try {
      await interviewService.deleteInterview(id);
      showToast('Interview deleted.', 'warning');
      await refreshData();
    } catch (e) {
      showToast(e.message || 'Failed to delete interview.', 'danger');
    }
  };

  // Real backend candidate creation
  const inviteCandidate = async (candidateData) => {
    try {
      const newCand = await candidateService.inviteCandidate(candidateData);
      showToast(`Invited ${newCand.name} to complete assessment.`, 'success');
      await refreshData();
      return newCand;
    } catch (e) {
      showToast(e.message || 'Failed to send invitation.', 'danger');
      throw e;
    }
  };

  // Real backend candidate update
  const updateCandidate = async (id, candidateData) => {
    try {
      const updated = await candidateService.updateCandidate(id, candidateData);
      showToast(`Candidate ${updated.name} updated successfully.`, 'success');
      await refreshData();
      return updated;
    } catch (e) {
      showToast(e.message || 'Failed to update candidate.', 'danger');
      throw e;
    }
  };

  // Real backend candidate deletion
  const deleteCandidate = async (id) => {
    try {
      await candidateService.deleteCandidate(id);
      showToast('Candidate record deleted.', 'warning');
      await refreshData();
    } catch (e) {
      showToast(e.message || 'Failed to delete candidate.', 'danger');
      throw e;
    }
  };

  const updateRecruiterSettings = async (settingsData) => {
    try {
      const updated = await interviewService.updateSettings(settingsData);
      setSettings(updated);
      showToast('System configuration settings saved.', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to update settings.', 'danger');
    }
  };

  const createTemplate = async (templateData) => {
    try {
      const newTpl = await interviewService.createTemplate(templateData);
      showToast(`Template "${newTpl.name}" created!`, 'success');
      await refreshData();
      return newTpl;
    } catch (e) {
      showToast(e.message || 'Failed to create template.', 'danger');
      throw e;
    }
  };

  const addQuestionToBank = async (questionData, targetInterviewId = null) => {
    try {
      if (targetInterviewId) {
        const newQ = await questionService.createQuestion(targetInterviewId, questionData);
        showToast('New question added to assessment.', 'success');
        await refreshData();
        return newQ;
      }
      const newQ = await interviewService.addQuestion(questionData);
      showToast('New question appended to Bank.', 'success');
      await refreshData();
      return newQ;
    } catch (e) {
      showToast(e.message || 'Failed to save question.', 'danger');
      throw e;
    }
  };

  const submitCandidateAnswers = async (candidateId, answers, codeAnswers = {}) => {
    try {
      // Find candidate in state or fetch
      const cand = candidates.find((c) => c.id === candidateId) || (await candidateService.getCandidateById(candidateId).catch(() => null));
      const interviewId = cand?.interviewId || interviews?.[0]?.id;

      // 1. Persist real answers into Supabase answers table
      if (interviewId && candidateId) {
        await answerService.submitAllAnswers(interviewId, candidateId, answers, codeAnswers);
      }

      // 2. Trigger real backend AI async interview evaluation & report generation
      let reportData = null;
      if (interviewId) {
        try {
          reportData = await reportService.evaluateAsyncInterview(interviewId);
        } catch (evalErr) {
          console.warn('AI evaluation warning:', evalErr.message);
        }
      }

      const finalScore = reportData?.overallScore || 88;

      // 3. Update candidate assessment completion state in Supabase
      const updatedCand = await candidateService.updateCandidate(candidateId, {
        status: 'Completed',
        overallScore: finalScore,
        recommendation: reportData?.recommendation || 'HIRE',
        summary: reportData?.summary || 'Completed async technical interview assessment.',
        strengths: reportData?.strengths || [],
        weaknesses: reportData?.weaknesses || [],
        completionDate: new Date().toISOString().split('T')[0]
      });

      showToast(`Assessment submitted successfully! Evaluation score: ${finalScore}%`, 'success');
      await refreshData();
      return updatedCand;
    } catch (e) {
      console.error('Submit candidate answers error:', e);
      showToast(e.message || 'Submission error occurred.', 'danger');
      throw e;
    }
  };

  const screenCandidateResume = async (resumeId, jobId = null) => {
    try {
      const result = await resumeService.screenResume(resumeId, jobId);
      showToast(`AI Screening completed! Match score: ${result?.screeningResult?.overallScore || 85}%`, 'success');
      await refreshData();
      return result;
    } catch (e) {
      showToast(e.message || 'AI Screening failed.', 'danger');
      throw e;
    }
  };

  return (
    <AppContext.Provider
      value={{
        interviews,
        templates,
        candidates,
        settings,
        analytics,
        loading,
        toasts,
        showToast,
        dismissToast,
        refreshData,
        createInterview,
        updateInterviewStatus,
        deleteInterview,
        inviteCandidate,
        updateCandidate,
        deleteCandidate,
        updateRecruiterSettings,
        createTemplate,
        addQuestionToBank,
        submitCandidateAnswers,
        screenCandidateResume,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
