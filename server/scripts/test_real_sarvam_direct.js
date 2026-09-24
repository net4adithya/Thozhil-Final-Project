import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('server/.env') });

const apiKey = (process.env.SARVAM_API_KEY || process.env.SARVAM_API_Key || '').trim();
console.log('Testing Sarvam API key availability:', apiKey ? `Key present (length: ${apiKey.length})` : 'MISSING');

async function testSarvam() {
  // 1. Test LLM Chat Completion
  console.log('\n--- 1. Testing Sarvam LLM Chat Completion ---');
  const llmUrl = 'https://api.sarvam.ai/v1/chat/completions';
  const llmRes = await fetch(llmUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey
    },
    body: JSON.stringify({
      model: 'sarvam-105b-conversations',
      messages: [
        { role: 'system', content: 'You are an AI Interviewer. Respond in JSON format: {"message": string, "category": string}' },
        { role: 'user', content: 'Introduce yourself and ask the first technical question about database indexing.' }
      ],
      temperature: 0.2
    })
  });
  console.log('LLM Status:', llmRes.status);
  const llmJson = await llmRes.json();
  console.log('LLM Response:', JSON.stringify(llmJson, null, 2));

  // 2. Test TTS Audio Synthesis
  console.log('\n--- 2. Testing Sarvam TTS ---');
  const ttsUrl = 'https://api.sarvam.ai/text-to-speech';
  const ttsRes = await fetch(ttsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey
    },
    body: JSON.stringify({
      inputs: ['Hello! Welcome to your technical assessment on InterviewX AI.'],
      target_language_code: 'en-IN',
      speaker: 'kavya',
      model: 'bulbul:v3',
      speech_sample_rate: 24000
    })
  });
  console.log('TTS Status:', ttsRes.status);
  if (!ttsRes.ok) {
    const errText = await ttsRes.text();
    console.log('TTS Error text:', errText);
  }
  const ttsJson = ttsRes.ok ? await ttsRes.json() : {};
  const audioBase64 = ttsJson.audios?.[0] || '';
  console.log('TTS Audio Base64 length:', audioBase64.length);

  // 3. Test STT Audio Transcription with the generated audio!
  if (audioBase64) {
    console.log('\n--- 3. Testing Sarvam STT using synthesized audio ---');
    const sttUrl = 'https://api.sarvam.ai/speech-to-text';
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'sample.wav');
    formData.append('model', 'saaras:v3');
    formData.append('language_code', 'en-IN');

    const sttRes = await fetch(sttUrl, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey
      },
      body: formData
    });
    console.log('STT Status:', sttRes.status);
    const sttJson = await sttRes.json();
    console.log('STT Response:', JSON.stringify(sttJson, null, 2));
  }
}

testSarvam().catch(console.error);
