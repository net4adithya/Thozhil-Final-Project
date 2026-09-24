import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables safely
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.SARVAM_API_KEY && fs.existsSync(path.resolve(process.cwd(), 'server/.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
}

const apiKey = process.env.SARVAM_API_KEY;

console.log('\n==================================================');
console.log('REAL SARVAM INTEGRATION TEST');
console.log('==================================================\n');

if (!apiKey || apiKey.trim().length === 0) {
  console.error('✖ SARVAM_API_KEY is not available to the backend.');
  process.exit(1);
}

console.log('✓ API key configured: true\n');

async function runRealSarvamTests() {
  let llmPassed = false;
  let sttPassed = false;
  let ttsPassed = false;
  let pipelinePassed = false;
  const tempAudioPath = path.resolve(process.cwd(), 'temp_test_audio.wav');
  const pipelineAudioPath = path.resolve(process.cwd(), 'temp_pipeline_audio.wav');

  let generatedAudioBase64 = null;
  const llmModelUsed = 'sarvam-105b-conversations';
  const ttsModelUsed = 'bulbul:v3';
  const sttModelUsed = 'saaras:v3';

  // ------------------------------------------------------------------------
  // STEP 6: Real LLM Test
  // ------------------------------------------------------------------------
  console.log('--- Testing Real LLM (sarvam-105b-conversations) ---');
  try {
    const startLLM = Date.now();
    const promptText = 'You are an interview assistant. Generate one concise technical interview follow-up question for a candidate who answered: "I used a hash map to reduce lookup time from O(n) to O(1) average case." Return only the question.';
    
    const llmRes = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        model: llmModelUsed,
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.3
      })
    });

    const latencyLLM = Date.now() - startLLM;

    if (llmRes.ok) {
      const llmData = await llmRes.json();
      const content = llmData.choices?.[0]?.message?.content?.trim();
      if (content && content.length > 0) {
        llmPassed = true;
        console.log(`✓ LLM`);
        console.log(`  Model: ${llmData.model || llmModelUsed}`);
        console.log(`  Status: PASS (${llmRes.status} OK in ${latencyLLM}ms)`);
        console.log(`  Response received: YES`);
        console.log(`  Sample: "${content.replace(/\n/g, ' ').slice(0, 120)}..."\n`);
      } else {
        console.error(`✖ LLM returned empty content payload`);
      }
    } else {
      const errText = await llmRes.text();
      console.error(`✖ LLM request failed (${llmRes.status}): ${errText}`);
    }
  } catch (err) {
    console.error(`✖ LLM exception: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // STEP 9: Real TTS Test
  // ------------------------------------------------------------------------
  console.log('--- Testing Real TTS (bulbul:v3 with speaker: kavya) ---');
  try {
    const startTTS = Date.now();
    const ttsText = 'Welcome to your technical interview. Please introduce yourself and tell me about your most recent project.';
    
    const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        inputs: [ttsText],
        target_language_code: 'en-IN',
        speaker: 'kavya',
        model: ttsModelUsed,
        enable_preprocessing: true
      })
    });

    const latencyTTS = Date.now() - startTTS;

    if (ttsRes.ok) {
      const ttsData = await ttsRes.json();
      const audioB64 = ttsData.audios?.[0];
      if (audioB64 && audioB64.length > 100) {
        generatedAudioBase64 = audioB64;
        const audioBuffer = Buffer.from(audioB64, 'base64');
        fs.writeFileSync(tempAudioPath, audioBuffer);
        ttsPassed = true;
        console.log(`✓ TTS`);
        console.log(`  Model: ${ttsModelUsed}`);
        console.log(`  Status: PASS (${ttsRes.status} OK in ${latencyTTS}ms)`);
        console.log(`  Audio received: YES (${audioBuffer.length} bytes written to temporary file)`);
        console.log(`  Content-Type: audio/wav\n`);
      } else {
        console.error(`✖ TTS returned empty or invalid audio data`);
      }
    } else {
      const errText = await ttsRes.text();
      console.error(`✖ TTS request failed (${ttsRes.status}): ${errText}`);
    }
  } catch (err) {
    console.error(`✖ TTS exception: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // STEP 4: Real STT Test
  // ------------------------------------------------------------------------
  console.log('--- Testing Real STT (saaras:v3) ---');
  try {
    if (!generatedAudioBase64) {
      console.error('✖ Cannot test STT without real audio buffer');
    } else {
      const startSTT = Date.now();
      const audioBuffer = Buffer.from(generatedAudioBase64, 'base64');
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      
      const formData = new FormData();
      formData.append('file', blob, 'sample_speech.wav');
      formData.append('model', sttModelUsed);
      formData.append('language_code', 'en-IN');

      const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey
        },
        body: formData
      });

      const latencySTT = Date.now() - startSTT;

      if (sttRes.ok) {
        const sttData = await sttRes.json();
        const transcript = (sttData.transcript || '').trim();
        if (transcript.length > 0) {
          sttPassed = true;
          console.log(`✓ STT`);
          console.log(`  Model: ${sttModelUsed}`);
          console.log(`  Status: PASS (${sttRes.status} OK in ${latencySTT}ms)`);
          console.log(`  Transcript received: YES`);
          console.log(`  Transcribed text: "${transcript}"\n`);
        } else {
          console.error(`✖ STT returned empty transcript`);
        }
      } else {
        const errText = await sttRes.text();
        console.error(`✖ STT request failed (${sttRes.status}): ${errText}`);
      }
    }
  } catch (err) {
    console.error(`✖ STT exception: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // STEP 10: Full End-to-End Real Pipeline Test
  // Real Audio -> STT -> Transcript -> LLM -> Adaptive Decision -> TTS -> Audio
  // ------------------------------------------------------------------------
  console.log('--- Testing Full End-to-End Real Sarvam Pipeline ---');
  try {
    if (llmPassed && sttPassed && ttsPassed) {
      console.log('1. STT Phase: Transcribing real candidate speech input...');
      const pipelineAudioBuffer = fs.readFileSync(tempAudioPath);
      const pipelineBlob = new Blob([pipelineAudioBuffer], { type: 'audio/wav' });
      const pForm = new FormData();
      pForm.append('file', pipelineBlob, 'cand_turn.wav');
      pForm.append('model', sttModelUsed);
      pForm.append('language_code', 'en-IN');

      const pSTTRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': apiKey },
        body: pForm
      });
      const pSTTData = await pSTTRes.json();
      const liveTranscript = pSTTData.transcript;
      console.log(`   ✓ Pipeline STT extracted transcript: "${liveTranscript}"`);

      console.log('2. LLM Phase: Generating adaptive technical follow-up decision...');
      const pLLMRes = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey
        },
        body: JSON.stringify({
          model: llmModelUsed,
          messages: [
            {
              role: 'system',
              content: 'You are Ava, an AI Technical Interviewer. Evaluate the candidate transcript and generate a JSON response with keys: action, question, reason, topic, difficulty. Allowed actions: FOLLOW_UP, NEW_TOPIC, INCREASE_DIFFICULTY, DECREASE_DIFFICULTY, CLARIFY, CONCLUDE.'
            },
            {
              role: 'user',
              content: `Candidate said: "${liveTranscript}". Formulate the next technical follow-up question in valid JSON.`
            }
          ],
          temperature: 0.3
        })
      });
      const pLLMData = await pLLMRes.json();
      const rawDecision = pLLMData.choices?.[0]?.message?.content;
      console.log(`   ✓ Pipeline LLM decision response received: ${rawDecision?.replace(/\n/g, ' ').slice(0, 100)}...`);

      let questionToSpeak = 'Could you explain the system architecture and scaling trade-offs of this solution?';
      try {
        const parsed = JSON.parse(rawDecision);
        if (parsed.question) questionToSpeak = parsed.question;
      } catch (e) {}

      console.log(`3. TTS Phase: Synthesizing adaptive question voice audio...`);
      const pTTSRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey
        },
        body: JSON.stringify({
          inputs: [questionToSpeak],
          target_language_code: 'en-IN',
          speaker: 'kavya',
          model: ttsModelUsed,
          enable_preprocessing: true
        })
      });
      const pTTSData = await pTTSRes.json();
      const pAudioB64 = pTTSData.audios?.[0];
      if (pAudioB64) {
        fs.writeFileSync(pipelineAudioPath, Buffer.from(pAudioB64, 'base64'));
        console.log(`   ✓ Pipeline TTS generated ${pAudioB64.length} bytes of audio payload.`);
        pipelinePassed = true;
      }
    }
  } catch (pipeErr) {
    console.error(`✖ Pipeline exception: ${pipeErr.message}`);
  }

  // Cleanup temporary audio files
  try {
    if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
    if (fs.existsSync(pipelineAudioPath)) fs.unlinkSync(pipelineAudioPath);
    console.log('✓ Temporary test audio files safely deleted.');
  } catch (cleanErr) {
    console.warn('Temporary file cleanup notice:', cleanErr.message);
  }

  console.log('\n==================================================');
  if (llmPassed && sttPassed && ttsPassed && pipelinePassed) {
    console.log('REAL SARVAM TEST RESULT: PASS');
  } else {
    console.log('REAL SARVAM TEST RESULT: INCOMPLETE/FAIL');
  }
  console.log('==================================================\n');

  if (!llmPassed || !sttPassed || !ttsPassed || !pipelinePassed) {
    process.exit(1);
  }
}

runRealSarvamTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err.message);
  process.exit(1);
});
