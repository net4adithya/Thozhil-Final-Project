const testSprint7VoiceEngine = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== SPRINT 7: Testing Sarvam STT + TTS Voice Engine ===\n');

    // 1. Test Text-to-Speech (TTS)
    console.log('1. Testing POST /api/voice/synthesize (Text-to-Speech)...');
    const ttsText = 'Welcome to your InterviewX AI interview assessment. We are ready to begin.';
    const ttsRes = await fetch(`${baseUrl}/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ttsText,
        speaker: 'meera',
        targetLanguageCode: 'en-IN'
      })
    });

    const ttsJson = await ttsRes.json();
    console.log('   Status Code:', ttsRes.status);
    console.log('   Success:', ttsJson.success);
    console.log('   Audio Format:', ttsJson.data?.format);
    console.log('   Provider:', ttsJson.data?.provider);
    console.log('   Base64 Audio Length:', ttsJson.data?.audioBase64?.length);

    if (ttsRes.status !== 200 || !ttsJson.data?.audioBase64) {
      throw new Error('TTS failed: Missing audioBase64 response');
    }

    // Validate WAV header from Base64
    const audioBuffer = Buffer.from(ttsJson.data.audioBase64, 'base64');
    const headerStr = audioBuffer.toString('utf8', 0, 4);
    console.log('   Binary Audio Header Tag:', headerStr);
    if (headerStr !== 'RIFF') {
      throw new Error(`Expected RIFF WAV header, received: ${headerStr}`);
    }

    // 2. Test Speech-to-Text (STT)
    console.log('\n2. Testing POST /api/voice/transcribe (Speech-to-Text)...');
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('file', audioBlob, 'sample_test_recording.wav');
    formData.append('languageCode', 'en-IN');

    const sttRes = await fetch(`${baseUrl}/voice/transcribe`, {
      method: 'POST',
      body: formData
    });

    const sttJson = await sttRes.json();
    console.log('   Status Code:', sttRes.status);
    console.log('   Success:', sttJson.success);
    console.log('   Provider:', sttJson.data?.provider);
    console.log('   Transcript:', sttJson.data?.transcript);

    if (sttRes.status !== 200 || !sttJson.data?.transcript) {
      throw new Error('STT failed: Missing transcript response');
    }

    // 3. Test Validation Error Cases
    console.log('\n3. Testing Validation Error Cases...');

    // 3A: TTS Empty Text
    const emptyTtsRes = await fetch(`${baseUrl}/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' })
    });
    console.log('   3A. Empty TTS Text status (expect 400):', emptyTtsRes.status);
    if (emptyTtsRes.status !== 400) throw new Error('Expected 400 for empty TTS text');

    // 3B: STT Missing File
    const emptySttRes = await fetch(`${baseUrl}/voice/transcribe`, {
      method: 'POST',
      body: new FormData()
    });
    console.log('   3B. Missing STT File status (expect 400):', emptySttRes.status);
    if (emptySttRes.status !== 400) throw new Error('Expected 400 for missing STT file');

    console.log('\n============================================================');
    console.log('✓ SPRINT 7 VERIFICATION: SARVAM STT + TTS VOICE ENGINE PASS!');
    console.log('============================================================');
  } catch (err) {
    console.error('Sprint 7 Voice Test Failed:', err);
    process.exit(1);
  }
};

testSprint7VoiceEngine();
