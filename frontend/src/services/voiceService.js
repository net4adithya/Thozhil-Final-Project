import apiClient from './apiClient';

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
      speaker: options.speaker || 'meera',
      pace: options.pace || 1.0,
      pitch: options.pitch || 0
    };

    const response = await apiClient.post('/voice/synthesize', payload);
    return response.data?.data;
  },

  /**
   * Helper function to play base64 audio in the browser
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
        const audioSrc = `data:${mimeType};base64,${audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => resolve(audio);
        audio.onerror = (err) => reject(err);
        audio.play().catch((playErr) => {
          // In environments where autoplay is restricted or silent fallback
          console.warn('Audio playback notice:', playErr.message);
          resolve(audio);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};

export default voiceService;
