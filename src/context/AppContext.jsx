import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { interviewService } from '../services/interviewService';
import { candidateService } from '../services/candidateService';
import { reportService } from '../services/reportService';

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
        interviewService.getInterviews(),
        interviewService.getTemplates(),
        candidateService.getCandidates(),
        interviewService.getSettings(),
        reportService.getAnalytics(),
      ]);

      setInterviews(intList);
      setTemplates(tplList);
      setCandidates(candList);
      setSettings(settingsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load application data:', error);
      showToast('Failed to sync data from mock database.', 'danger');
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
      showToast('Failed to create interview.', 'danger');
      throw e;
    }
  };

  const updateInterviewStatus = async (id, status) => {
    try {
      await interviewService.updateInterviewStatus(id, status);
      showToast(`Interview status updated to ${status}.`, 'primary');
      await refreshData();
    } catch (e) {
      showToast('Failed to update status.', 'danger');
    }
  };

  const deleteInterview = async (id) => {
    try {
      await interviewService.deleteInterview(id);
      showToast('Interview deleted.', 'warning');
      await refreshData();
    } catch (e) {
      showToast('Failed to delete interview.', 'danger');
    }
  };

  const inviteCandidate = async (candidateData) => {
    try {
      const newCand = await candidateService.inviteCandidate(candidateData);
      showToast(`Invited ${newCand.name} to complete assessment.`, 'success');
      await refreshData();
      return newCand;
    } catch (e) {
      showToast('Failed to send invitation.', 'danger');
      throw e;
    }
  };

  const updateRecruiterSettings = async (settingsData) => {
    try {
      const updated = await interviewService.updateSettings(settingsData);
      setSettings(updated);
      showToast('System configuration settings saved.', 'success');
    } catch (e) {
      showToast('Failed to update settings.', 'danger');
    }
  };

  const createTemplate = async (templateData) => {
    try {
      const newTpl = await interviewService.createTemplate(templateData);
      showToast(`Template "${newTpl.name}" created!`, 'success');
      await refreshData();
      return newTpl;
    } catch (e) {
      showToast('Failed to create template.', 'danger');
      throw e;
    }
  };

  const addQuestionToBank = async (questionData) => {
    try {
      const newQ = await interviewService.addQuestion(questionData);
      showToast('New question appended to Bank.', 'success');
      await refreshData();
      return newQ;
    } catch (e) {
      showToast('Failed to save question.', 'danger');
      throw e;
    }
  };

  const submitCandidateAnswers = async (candidateId, answers, codeAnswers = {}) => {
    try {
      const cand = await candidateService.submitCandidateAnswers(candidateId, answers, codeAnswers);
      showToast(`Assessment submitted successfully! Evaluation score: ${cand.overallScore}%`, 'success');
      await refreshData();
      return cand;
    } catch (e) {
      showToast('Submission error occurred.', 'danger');
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
        updateRecruiterSettings,
        createTemplate,
        addQuestionToBank,
        submitCandidateAnswers,
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
