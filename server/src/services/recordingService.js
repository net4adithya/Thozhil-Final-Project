import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getInterviewById } from './interviewService.js';
import { getCandidateById } from './candidateService.js';

const STORAGE_BUCKET = 'interview-recordings';

/**
 * Ensures the interview-recordings storage bucket exists in Supabase
 */
const ensureStorageBucket = async () => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('[RecordingService] List buckets warning:', listError.message);
      return;
    }

    const exists = (buckets || []).some((b) => b.name === STORAGE_BUCKET || b.id === STORAGE_BUCKET);
    if (!exists) {
      console.log(`[RecordingService] Creating dedicated storage bucket: ${STORAGE_BUCKET}`);
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true
      });
      if (createError) {
        console.warn(`[RecordingService] Create bucket notice: ${createError.message}`);
      }
    }
  } catch (err) {
    console.warn('[RecordingService] Storage bucket check notice:', err.message);
  }
};

/**
 * Uploads an interview recording file to Supabase Storage and records metadata
 * @param {string} interviewId - UUID of the interview
 * @param {Object} payload - Upload parameters
 * @param {Express.Multer.File} file - Multer uploaded file object
 * @returns {Promise<Object>}
 */
export const uploadInterviewRecording = async (interviewId, payload, file) => {
  if (!file || !file.buffer) {
    throw new ApiError(400, 'Recording media file data is required');
  }

  if (file.size === 0) {
    throw new ApiError(400, 'Recording file is empty (0 bytes)');
  }

  const {
    candidateId,
    sessionId = `session-${Date.now()}`,
    recordingType = 'live_session', // 'live_session' | 'question_turn' | 'async_response'
    duration = 0,
    questionId = null
  } = payload;

  // 1. Validate interview exists
  const interview = await getInterviewById(interviewId);
  if (!interview) {
    throw new ApiError(404, `Interview ${interviewId} not found`);
  }

  if (candidateId) {
    await getCandidateById(candidateId);
  }

  // 2. Validate MIME Type
  const allowedMimeTypes = [
    'video/webm',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/mp4',
    'video/ogg',
    'audio/webm',
    'audio/wav',
    'audio/ogg',
    'application/octet-stream'
  ];

  const incomingMimeType = (file.mimetype || 'video/webm').toLowerCase().split(';')[0];
  const isValidMime = allowedMimeTypes.some((t) => t.startsWith(incomingMimeType));
  if (!isValidMime && !file.mimetype?.startsWith('video/') && !file.mimetype?.startsWith('audio/')) {
    throw new ApiError(400, `Unsupported media recording MIME type: ${file.mimetype}`);
  }

  // 3. Construct deterministic non-sensitive storage path
  const fileExt = file.originalname?.includes('.')
    ? file.originalname.split('.').pop().toLowerCase()
    : incomingMimeType.includes('mp4') ? 'mp4' : 'webm';

  const cleanSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePathKey = `${interviewId}/${cleanSessionId}/rec_${Date.now()}.${fileExt}`;

  let publicUrl = '';
  let uploadedToStorage = false;

  await ensureStorageBucket();

  try {
    // 4. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePathKey, file.buffer, {
        contentType: file.mimetype || 'video/webm',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    uploadedToStorage = true;

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePathKey);

    publicUrl = publicUrlData?.publicUrl || storagePathKey;
    console.log(`[RecordingService] Uploaded recording to Supabase Storage: ${storagePathKey}`);
  } catch (storageErr) {
    console.warn(`[RecordingService] Supabase Storage upload notice (${storageErr.message}). Utilizing local fallback.`);
    
    // Local storage fallback
    try {
      const uploadsDir = path.resolve('uploads', 'recordings', interviewId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFileName = `rec_${Date.now()}.${fileExt}`;
      const localFilePath = path.join(uploadsDir, localFileName);
      fs.writeFileSync(localFilePath, file.buffer);
      publicUrl = `/uploads/recordings/${interviewId}/${localFileName}`;
    } catch (fsErr) {
      throw new ApiError(500, `Failed to save recording: ${storageErr.message}`);
    }
  }

  // 5. Store recording metadata
  const recordingMetadata = {
    id: `rec-${crypto.randomUUID()}`,
    interviewId,
    candidateId: candidateId || interview.candidate?.id || null,
    sessionId,
    questionId: questionId || null,
    storagePath: storagePathKey,
    publicUrl,
    fileSize: file.size,
    mimeType: file.mimetype || 'video/webm',
    duration: Number(duration) || 0,
    recordingType,
    status: 'Ready',
    uploadedAt: new Date().toISOString()
  };

  try {
    // 5a. Persist metadata into interview settings JSONB
    const currentSettings = interview.settings || {};
    const existingRecordings = Array.isArray(currentSettings.recordings) ? currentSettings.recordings : [];
    const updatedRecordings = [...existingRecordings, recordingMetadata];

    await supabase
      .from('interviews')
      .update({
        settings: {
          ...currentSettings,
          recordings: updatedRecordings,
          lastRecordingUrl: publicUrl
        }
      })
      .eq('id', interviewId);

    // 5b. If question answer recording, update answer row if applicable
    if (questionId && candidateId) {
      try {
        await supabase
          .from('answers')
          .update({ recording_url: publicUrl })
          .eq('interview_id', interviewId)
          .eq('question_id', questionId);
      } catch (ansErr) {
        console.warn('[RecordingService] Answer recording_url update notice:', ansErr.message);
      }
    }

    // 5c. Update candidate record with recording URL so it displays in candidate profile
    const targetCandId = candidateId || interview.candidate?.id;
    if (targetCandId) {
      try {
        await supabase
          .from('candidates')
          .update({ recording_url: publicUrl })
          .eq('id', targetCandId);
      } catch (candErr) {
        console.warn('[RecordingService] Candidate recording_url update notice:', candErr.message);
      }
    }

    // 5d. Update assessment report with recording URL so evaluation view can play it
    try {
      if (targetCandId) {
        await supabase
          .from('reports')
          .update({ recording_url: publicUrl })
          .eq('candidate_id', targetCandId);
      } else {
        await supabase
          .from('reports')
          .update({ recording_url: publicUrl })
          .eq('interview_id', interviewId);
      }
    } catch (repErr) {
      console.warn('[RecordingService] Report recording_url update notice:', repErr.message);
    }

    console.log(`[RecordingService] Persisted recording metadata for interview: ${interviewId}`);
  } catch (dbErr) {
    console.error('[RecordingService] DB metadata persistence error:', dbErr.message);
    
    // Clean up uploaded storage file if DB metadata insertion fatally crashed
    if (uploadedToStorage) {
      supabase.storage.from(STORAGE_BUCKET).remove([storagePathKey]).catch(() => {});
    }
    throw new ApiError(500, `Database failed to store recording metadata: ${dbErr.message}`);
  }

  return recordingMetadata;
};

/**
 * Retrieves all recordings for an interview
 */
export const getInterviewRecordings = async (interviewId) => {
  const interview = await getInterviewById(interviewId);
  if (!interview) {
    throw new ApiError(404, `Interview ${interviewId} not found`);
  }

  const recordings = interview.settings?.recordings || [];
  return recordings;
};

export default {
  uploadInterviewRecording,
  getInterviewRecordings
};
