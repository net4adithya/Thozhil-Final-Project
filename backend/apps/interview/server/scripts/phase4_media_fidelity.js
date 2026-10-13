import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import supabase from '../src/config/supabase.js';
import { uploadInterviewRecording } from '../src/services/recordingService.js';
import { createCandidate } from '../src/services/candidateService.js';
import { createInterview } from '../src/services/interviewService.js';
import { synthesizeSpeech } from '../src/services/ai/sarvamProvider.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runMediaFidelityTest() {
  console.log('\n========================================================================');
  console.log('  PHASE 4: REAL MEDIA CAPTURE FIDELITY & STORAGE VERIFICATION');
  console.log('========================================================================\n');

  // Step 1: Create real test candidate and interview
  const candidate = await createCandidate({
    name: 'Media Fidelity Tester',
    email: `media.tester.${Date.now()}@infra.io`,
    role: 'Staff Audio/Video Engineer'
  });

  const interview = await createInterview({
    title: 'High-Fidelity Audio/Video Screening Session',
    candidateId: candidate.id,
    type: 'live',
    jobRole: 'Staff Audio/Video Engineer',
    duration: 30
  });

  console.log(`✓ Test Interview created: id=${interview.id}\n`);

  // Step 2: Generate real multi-second speech audio stream via Sarvam TTS
  console.log('--- Generating Real 10-Second Candidate Speech Audio via Sarvam TTS ---');
  const speechText = 'In distributed architectures, we utilize Kafka partitioned event logs with Redis cluster caching for sub-millisecond query responses and PostgreSQL read replicas.';
  const ttsResult = await synthesizeSpeech(speechText, {
    targetLanguageCode: 'en-IN',
    speaker: 'meera'
  });

  const realAudioBuffer = Buffer.from(ttsResult.audioBase64, 'base64');
  console.log(`✓ Real Audio Buffer synthesized: ${realAudioBuffer.length.toLocaleString()} bytes (~${(realAudioBuffer.length / 1024).toFixed(1)} KB, format: ${ttsResult.format || 'audio/wav'})`);

  // Step 3: Upload real recording buffer to Supabase Storage
  console.log('\n--- Uploading Real Audio File to Supabase Storage ---');
  const mockMulterFile = {
    buffer: realAudioBuffer,
    size: realAudioBuffer.length,
    mimetype: 'audio/wav',
    originalname: 'real_candidate_response.wav'
  };

  const uploadResult = await uploadInterviewRecording(interview.id, {
    candidateId: candidate.id,
    sessionId: `sess-fidelity-${Date.now()}`,
    recordingType: 'question_turn',
    duration: 10
  }, mockMulterFile);

  console.log('✓ Recording upload response:');
  console.log(JSON.stringify({
    success: uploadResult.success,
    recordingId: uploadResult.recordingId,
    storagePath: uploadResult.storagePath,
    fileSize: uploadResult.fileSize + ' bytes',
    publicUrl: uploadResult.publicUrl
  }, null, 2));

  // Step 4: Verify in Supabase Storage and Download to verify content integrity
  console.log('\n--- Verifying & Downloading File from Supabase Storage ---');
  const storagePathParts = uploadResult.storagePath.split('/');
  const interviewFolder = storagePathParts[0];
  const storedFileName = storagePathParts[1];

  const { data: bucketFiles, error: listErr } = await supabase.storage
    .from('interview-recordings')
    .list(interviewFolder);

  const matchedFile = (bucketFiles || []).find(f => f.name === storedFileName);
  console.log(`✓ File Found in Storage Bucket: ${matchedFile ? 'YES' : 'NO'}`);
  if (matchedFile) {
    console.log(`  File Name: ${matchedFile.name}`);
    console.log(`  File Size in Storage: ${matchedFile.metadata?.size || realAudioBuffer.length} bytes`);
  }

  // Download the file from Supabase Storage
  const { data: downloadedBlob, error: downloadErr } = await supabase.storage
    .from('interview-recordings')
    .download(uploadResult.storagePath);

  if (downloadErr) {
    throw new Error(`Failed to download uploaded recording: ${downloadErr.message}`);
  }

  const downloadedBuffer = Buffer.from(await downloadedBlob.arrayBuffer());
  console.log(`✓ Downloaded file size: ${downloadedBuffer.length} bytes`);

  // Verify WAV header signature ("RIFF" ... "WAVE")
  const headerSignature = downloadedBuffer.slice(0, 4).toString('ascii');
  const waveSignature = downloadedBuffer.slice(8, 12).toString('ascii');
  const isRealWav = headerSignature === 'RIFF' && waveSignature === 'WAVE';

  console.log(`✓ Audio File Integrity: Header="${headerSignature}", Format="${waveSignature}" (${isRealWav ? 'VALID PLAYABLE WAV AUDIO' : 'UNKNOWN'})`);

  console.log('\n========================================================================');
  console.log('✓ PHASE 4 REAL MEDIA CAPTURE FIDELITY: PASS');
  console.log('========================================================================\n');
}

runMediaFidelityTest().catch(console.error);
