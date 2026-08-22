import { useState, useRef, useCallback, useEffect } from 'react';
import { interviewService } from '../services/interviewService';

export const RECORDING_STATES = {
  IDLE: 'IDLE',
  REQUESTING_PERMISSION: 'REQUESTING_PERMISSION',
  MEDIA_READY: 'MEDIA_READY',
  RECORDING: 'RECORDING',
  PAUSED: 'PAUSED',
  STOPPING: 'STOPPING',
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  FAILED: 'FAILED'
};

export const useInterviewRecording = ({
  interviewId,
  candidateId,
  sessionId,
  onRecordingStarted,
  onRecordingStopped,
  onUploadSuccess,
  onUploadFailed,
  autoUpload = true
} = {}) => {
  const [recordingState, setRecordingState] = useState(RECORDING_STATES.IDLE);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingMetadata, setRecordingMetadata] = useState(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const durationTimerRef = useRef(null);
  const startTimeRef = useRef(0);

  /**
   * Helper to detect the best supported video/audio MIME codec in the current browser
   */
  const getSupportedMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return '';

    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a',
      'video/mp4',
      'audio/webm;codecs=opus',
      'audio/webm'
    ];

    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }, []);

  /**
   * Stops and cleans up all active MediaStream tracks
   */
  const stopAllMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
  }, []);

  /**
   * Requests camera and microphone streams from browser
   */
  const prepareMedia = useCallback(async () => {
    setErrorMessage('');
    setRecordingState(RECORDING_STATES.REQUESTING_PERMISSION);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices getUserMedia API is not supported in this browser environment');
      }

      // Request both video & audio for interview recording
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      mediaStreamRef.current = stream;
      setRecordingState(RECORDING_STATES.MEDIA_READY);
      return stream;
    } catch (err) {
      console.warn('[useInterviewRecording] Media access notice:', err.message);
      
      // Attempt audio-only fallback if camera is in use or unavailable
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = audioStream;
        setRecordingState(RECORDING_STATES.MEDIA_READY);
        return audioStream;
      } catch (audioErr) {
        setRecordingState(RECORDING_STATES.FAILED);
        setErrorMessage(err.name === 'NotAllowedError' 
          ? 'Camera/microphone permission was denied. Please allow device access in browser settings.' 
          : `Device access error: ${err.message}`);
        return null;
      }
    }
  }, []);

  /**
   * Starts video & audio recording
   */
  const startRecording = useCallback(async (existingStream = null) => {
    setErrorMessage('');
    let stream = existingStream || mediaStreamRef.current;

    if (!stream || !stream.active) {
      stream = await prepareMedia();
      if (!stream) return false;
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setRecordingState(RECORDING_STATES.FAILED);
      setErrorMessage('MediaRecorder is not supported or no compatible codecs available in this browser');
      return false;
    }

    try {
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstart = () => {
        setRecordingState(RECORDING_STATES.RECORDING);
        startTimeRef.current = Date.now();
        setRecordingDuration(0);

        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        durationTimerRef.current = setInterval(() => {
          setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        if (onRecordingStarted) onRecordingStarted();
      };

      recorder.onerror = (event) => {
        console.error('[useInterviewRecording] MediaRecorder error:', event);
        setRecordingState(RECORDING_STATES.FAILED);
        setErrorMessage('Recording error occurred during capture');
        if (onUploadFailed) onUploadFailed(new Error('Recording error occurred'));
      };

      // Timeslice of 2000ms ensures chunks are collected periodically
      recorder.start(2000);
      mediaRecorderRef.current = recorder;
      return true;
    } catch (err) {
      console.error('[useInterviewRecording] Failed to start recorder:', err);
      setRecordingState(RECORDING_STATES.FAILED);
      setErrorMessage(`Failed to start recording: ${err.message}`);
      return false;
    }
  }, [prepareMedia, getSupportedMimeType, onRecordingStarted, onUploadFailed]);

  /**
   * Stops recording, collects final Blob, and triggers upload
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return null;
    }

    setRecordingState(RECORDING_STATES.STOPPING);
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);

        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        console.log(`[useInterviewRecording] Recording stopped. Size: ${(blob.size / 1024).toFixed(1)} KB, Duration: ${finalDuration}s`);

        if (onRecordingStopped) onRecordingStopped(blob, finalDuration);

        // Upload to backend if autoUpload is active
        if (autoUpload && interviewId && blob.size > 0) {
          try {
            setRecordingState(RECORDING_STATES.UPLOADING);
            const formData = new FormData();
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            formData.append('file', blob, `interview_rec_${Date.now()}.${ext}`);
            formData.append('candidateId', candidateId || '');
            formData.append('sessionId', sessionId || `live-${interviewId}`);
            formData.append('recordingType', 'live_session');
            formData.append('duration', finalDuration);

            const uploadRes = await interviewService.uploadRecording(interviewId, formData);
            setRecordingMetadata(uploadRes);
            setRecordingState(RECORDING_STATES.UPLOADED);

            if (onUploadSuccess) onUploadSuccess(uploadRes);
            resolve({ blob, metadata: uploadRes });
          } catch (uploadErr) {
            console.error('[useInterviewRecording] Upload error:', uploadErr);
            setRecordingState(RECORDING_STATES.FAILED);
            setErrorMessage(`Failed to upload recording: ${uploadErr.message}`);
            if (onUploadFailed) onUploadFailed(uploadErr);
            resolve({ blob, error: uploadErr });
          }
        } else {
          setRecordingState(RECORDING_STATES.IDLE);
          resolve({ blob });
        }
      };

      try {
        recorder.stop();
      } catch (e) {
        resolve(null);
      }
    });
  }, [autoUpload, interviewId, candidateId, sessionId, onRecordingStopped, onUploadSuccess, onUploadFailed]);

  // Clean up all streams and timers on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      stopAllMediaTracks();
    };
  }, [stopAllMediaTracks]);

  return {
    recordingState,
    recordingDuration,
    errorMessage,
    recordedBlob,
    uploadProgress,
    recordingMetadata,
    mediaStream: mediaStreamRef.current,
    prepareMedia,
    startRecording,
    stopRecording,
    stopAllMediaTracks,
    setErrorMessage
  };
};

export default useInterviewRecording;
