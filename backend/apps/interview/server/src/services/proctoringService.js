import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getInterviewById } from './interviewService.js';

// Allowed Observable Technical Proctoring Event Types
export const ALLOWED_PROCTORING_EVENTS = [
  'RULES_ACKNOWLEDGED',
  'TAB_HIDDEN',
  'TAB_VISIBLE',
  'WINDOW_BLUR',
  'WINDOW_FOCUS',
  'FULLSCREEN_ENTERED',
  'FULLSCREEN_EXITED',
  'SCREEN_SHARE_STARTED',
  'SCREEN_SHARE_STOPPED',
  'CAMERA_ENABLED',
  'CAMERA_DISABLED',
  'MICROPHONE_ENABLED',
  'MICROPHONE_DISABLED',
  'CAMERA_PERMISSION_DENIED',
  'MICROPHONE_PERMISSION_DENIED',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'CONTEXT_MENU_ATTEMPT',
  'PAGE_RELOAD_ATTEMPT',
  'DEVTOOLS_SUSPECTED',
  'RECORDING_STARTED',
  'RECORDING_STOPPED',
  'RECORDING_UPLOAD_SUCCESS',
  'RECORDING_UPLOAD_FAILED'
];

/**
 * Validates and logs basic proctoring observation events
 * @param {string} interviewId - UUID of the interview
 * @param {Object} payload - Event payload
 * @returns {Promise<Object>}
 */
export const logProctoringEvents = async (interviewId, payload) => {
  const interview = await getInterviewById(interviewId);
  if (!interview) {
    throw new ApiError(404, `Interview ${interviewId} not found`);
  }

  const rawEvents = Array.isArray(payload.events) ? payload.events : [payload];
  if (!rawEvents.length) {
    throw new ApiError(400, 'At least one proctoring event is required');
  }

  const { candidateId, sessionId = `session-${Date.now()}` } = payload;

  const validEvents = [];
  for (const ev of rawEvents) {
    const eventType = (ev.eventType || ev.type || '').toUpperCase();
    if (!ALLOWED_PROCTORING_EVENTS.includes(eventType)) {
      throw new ApiError(400, `Invalid proctoring event type: '${eventType}'. Allowed types: ${ALLOWED_PROCTORING_EVENTS.join(', ')}`);
    }

    validEvents.push({
      eventType,
      timestamp: ev.timestamp || new Date().toISOString(),
      sessionId: ev.sessionId || sessionId,
      candidateId: ev.candidateId || candidateId || interview.candidate?.id || null,
      details: ev.details || {}
    });
  }

  // Update interview settings JSONB in Supabase
  const currentSettings = interview.settings || {};
  const existingEvents = Array.isArray(currentSettings.proctoringEvents) ? currentSettings.proctoringEvents : [];
  const updatedEvents = [...existingEvents, ...validEvents];

  // Calculate observable summary metrics
  const tabHiddenCount = updatedEvents.filter((e) => e.eventType === 'TAB_HIDDEN' || e.eventType === 'WINDOW_BLUR').length;
  const fullscreenExits = updatedEvents.filter((e) => e.eventType === 'FULLSCREEN_EXITED').length;
  const screenShareStopped = updatedEvents.filter((e) => e.eventType === 'SCREEN_SHARE_STOPPED').length;
  const copyAttempts = updatedEvents.filter((e) => e.eventType === 'COPY_ATTEMPT' || e.eventType === 'PASTE_ATTEMPT').length;

  // Deterministic Explainable Integrity Risk Score (0 - 100)
  const riskScore = Math.min(
    100,
    tabHiddenCount * 15 + fullscreenExits * 10 + screenShareStopped * 25 + copyAttempts * 5
  );

  const evidenceNotes = [];
  if (tabHiddenCount > 0) evidenceNotes.push(`Candidate switched tabs/windows ${tabHiddenCount} time${tabHiddenCount > 1 ? 's' : ''}`);
  if (fullscreenExits > 0) evidenceNotes.push(`Candidate exited fullscreen ${fullscreenExits} time${fullscreenExits > 1 ? 's' : ''}`);
  if (screenShareStopped > 0) evidenceNotes.push(`Screen sharing stopped ${screenShareStopped} time${screenShareStopped > 1 ? 's' : ''}`);
  if (copyAttempts > 0) evidenceNotes.push(`Clipboard copy/paste restricted actions detected ${copyAttempts} time${copyAttempts > 1 ? 's' : ''}`);

  const evidenceSummaryText = evidenceNotes.length > 0
    ? evidenceNotes.join('. ') + '.'
    : 'No suspicious browser actions observed during the assessment.';

  try {
    await supabase
      .from('interviews')
      .update({
        settings: {
          ...currentSettings,
          proctoringEvents: updatedEvents,
          proctoringSummary: {
            tabHiddenCount,
            fullscreenExits,
            screenShareStopped,
            copyAttempts,
            totalObservations: updatedEvents.length,
            integrityRiskScore: riskScore,
            evidenceSummaryText,
            lastObservedAt: new Date().toISOString()
          }
        }
      })
      .eq('id', interviewId);

    console.log(`[ProctoringService] Logged ${validEvents.length} proctoring observations for interview: ${interviewId}`);
  } catch (err) {
    console.error('[ProctoringService] Supabase persistence error:', err.message);
    throw new ApiError(500, `Failed to store proctoring observations: ${err.message}`);
  }

  return {
    success: true,
    loggedEventsCount: validEvents.length,
    summary: {
      tabHiddenCount,
      fullscreenExits,
      screenShareStopped,
      copyAttempts,
      integrityRiskScore: riskScore,
      evidenceSummaryText,
      totalObservations: updatedEvents.length
    },
    events: validEvents
  };
};

/**
 * Retrieves logged proctoring events for an interview
 */
export const getProctoringEvents = async (interviewId) => {
  const interview = await getInterviewById(interviewId);
  if (!interview) {
    throw new ApiError(404, `Interview ${interviewId} not found`);
  }

  return {
    interviewId,
    proctoringSummary: interview.settings?.proctoringSummary || {
      tabHiddenCount: 0,
      fullscreenExits: 0,
      totalObservations: 0
    },
    events: interview.settings?.proctoringEvents || []
  };
};

export default {
  ALLOWED_PROCTORING_EVENTS,
  logProctoringEvents,
  getProctoringEvents
};
