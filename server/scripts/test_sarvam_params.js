import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env') });

async function checkSarvamPayload() {
  const apiKey = (process.env.SARVAM_API_KEY || process.env.SARVAM_API_Key || '').trim();
  console.log('Testing Sarvam LLM with response_format vs without...');

  // Test 1: With response_format
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: [
          { role: 'system', content: 'You are a test assistant. Respond in JSON with {"status": "ok"}.' },
          { role: 'user', content: 'Say hello in json.' }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });
    console.log(`With response_format: status=${res.status} in ${Date.now() - t0}ms`);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('With response_format failed:', err.message);
  }

  // Test 2: Without response_format
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: [
          { role: 'system', content: 'You are a test assistant. Respond strictly in JSON matching {"status": "ok"}. No markdown.' },
          { role: 'user', content: 'Say hello in json.' }
        ],
        temperature: 0.2
      })
    });
    console.log(`Without response_format: status=${res.status} in ${Date.now() - t0}ms`);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Without response_format failed:', err.message);
  }
}

checkSarvamPayload().catch(console.error);
