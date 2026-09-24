import apiClient from './apiClient';

// Set of all active HTMLAudioElement instances for immediate teardown
const activeAudioInstances = new Set();

export const voiceService = {
  /**
   * Transcribes audio blob using Sarvam Speech-to-Text
   * @param {Blob} audioBlob - Recorded audio binary blob
   * @param {string} [languageCode='en-IN'] - Target transcription language
   * @returns {Promise<{transcript: string, languageCode: string, provider: string}>}
   */
  transcribeAudio: async (audioBlob, languageCode = 'en-IN') => {
    if (!audioBlob) {
      throw new Error('Audio recording data is required for transcription');
    }

    const formData = new FormData();
    const filename = `recording-${Date.now()}.${audioBlob.type?.includes('webm') ? 'webm' : 'wav'}`;
    formData.append('file', audioBlob, filename);
    formData.append('audio', audioBlob, filename);
    formData.append('languageCode', languageCode);

    const response = await apiClient.post('/voice/transcribe', formData, {
      headers: {
        'Content-Type': undefined // Allow browser/Axios to set multipart boundary
      }
    });

    return response.data?.data;
  },

  /**
   * Synthesizes natural speech from text using Sarvam Text-to-Speech
   * @param {string} text - Text to speak
   * @param {Object} [options] - Synthesis options (speaker, targetLanguageCode, pace, pitch)
   * @returns {Promise<{audioBase64: string, format: string, text: string, speaker: string}>}
   */
  synthesizeSpeech: async (text, options = {}) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text input is required for voice synthesis');
    }

    const payload = {
      text: text.trim(),
      targetLanguageCode: options.targetLanguageCode || 'en-IN',
      speaker: options.speaker || 'priya',
      pace: options.pace || 1.0,
      pitch: options.pitch || 0
    };

    const response = await apiClient.post('/voice/synthesize', payload);
    return response.data?.data;
  },

  /**
   * Helper function to play base64 audio in the browser with lifecycle tracking
   * @param {string} audioBase64 - Base64 encoded audio string
   * @param {string} [mimeType='audio/wav'] - Audio MIME format
   * @returns {Promise<HTMLAudioElement>}
   */
  playAudioFromBase64: (audioBase64, mimeType = 'audio/wav') => {
    return new Promise((resolve, reject) => {
      if (!audioBase64) {
        return reject(new Error('No audio data provided for playback'));
      }

      try {
        // Stop previous audio to avoid overlapping voices
        voiceService.stopAllPlayback();

        // Convert base64 to Blob URL for clean browser decoding
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes.buffer], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const audio = new Audio(blobUrl);
        audio.volume = 1.0;
        activeAudioInstances.add(audio);

        const cleanup = () => {
          activeAudioInstances.delete(audio);
          try {
            URL.revokeObjectURL(blobUrl);
          } catch (e) {}
        };

        audio.addEventListener('ended', cleanup, { once: true });
        audio.addEventListener('error', cleanup, { once: true });
        audio.addEventListener('pause', () => {
          if (audio.currentTime === 0 || audio.ended) {
            cleanup();
          }
        });

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              resolve(audio);
            })
            .catch((playErr) => {
              cleanup();
              console.warn('[VoiceService] Audio autoplay blocked or failed:', playErr.message);
              reject(playErr);
            });
        } else {
          resolve(audio);
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Immediately terminates all playing audio elements and Web SpeechSynthesis
   */
  stopAllPlayback: () => {
    // 1. Terminate all tracked HTMLAudioElement instances
    activeAudioInstances.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        if (audio.src) {
          try {
            URL.revokeObjectURL(audio.src);
          } catch (e) {}
          audio.src = '';
        }
      } catch (err) {
        console.warn('[VoiceService] Audio pause error:', err);
      }
    });
    activeAudioInstances.clear();

    // 2. Terminate Web Speech API Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('[VoiceService] SpeechSynthesis cancel error:', err);
      }
    }
  }
};

export default voiceService;
