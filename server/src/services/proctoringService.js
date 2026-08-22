import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getInterviewById } from './interviewService.js';

// Allowed Basic Proctoring Observation Event Types
export const ALLOWED_PROCTORING_EVENTS = [
  'TAB_HIDDEN',
  'TAB_VISIBLE',
  'FULLSCREEN_ENTERED',
  'FULLSCREEN_EXITED',
  'CAMERA_DISABLED',
  'MICROPHONE_DISABLED',
  'CAMERA_PERMISSION_DENIED',
  'MICROPHONE_PERMISSION_DENIED',
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

  // Calculate summary metrics
  const tabHiddenCount = updatedEvents.filter((e) => e.eventType === 'TAB_HIDDEN').length;
  const fullscreenExits = updatedEvents.filter((e) => e.eventType === 'FULLSCREEN_EXITED').length;

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
            totalObservations: updatedEvents.length,
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
