import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import supabase from '../src/config/supabase.js';
import { createInterview } from '../src/services/interviewService.js';
import { createCandidate } from '../src/services/candidateService.js';
import { createQuestion } from '../src/services/questionService.js';
import { createAnswer } from '../src/services/answerService.js';
import { evaluateInterview } from '../src/services/ai/interviewEvaluationService.js';
import { synthesizeSpeech, transcribeSpeech } from '../src/services/ai/sarvamProvider.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runFullVoiceToReportLoop() {
  console.log('\n========================================================================');
  console.log('  FULL END-TO-END LOOP: TTS -> STT -> SUBMIT -> LLM EVAL -> REPORT');
  console.log('========================================================================\n');

  // 1. Candidate speech text to test
  const candidateSpokenText = 'I implemented a cache-aside architecture with Redis in front of Postgres, using TTLs of 300 seconds for read-heavy product endpoints and pub-sub events to invalidate stale cache keys when records are updated.';

  console.log('1. [TTS Phase] Synthesizing real candidate speech audio via Sarvam TTS (bulbul:v3)...');
  const ttsResult = await synthesizeSpeech(candidateSpokenText, { speaker: 'kavya' });
  const audioBuffer = Buffer.from(ttsResult.audioBase64, 'base64');
  console.log(`   ✓ TTS Generated: ${audioBuffer.length} bytes of WAV audio (format: ${ttsResult.format}, provider: ${ttsResult.provider})`);

  console.log('2. [STT Phase] Transcribing audio buffer via Sarvam STT (saaras:v3)...');
  const sttResult = await transcribeSpeech(audioBuffer, 'audio/wav', 'candidate_turn.wav', 'en-IN');
  const transcript = sttResult.transcript;
  console.log(`   ✓ STT Transcribed Text: "${transcript}"`);

  console.log('3. [Setup & Submit] Creating live candidate, interview, question & submitting answer...');
  const candidate = await createCandidate({
    name: 'Ananya Rao (Full Loop Verification)',
    email: `ananya.rao.${Date.now()}@example.com`,
    role: 'Backend Architect'
  });

  const interview = await createInterview({
    title: 'Distributed Systems & Caching Architecture Assessment',
    candidateId: candidate.id,
    type: 'live',
    jobRole: 'Backend Architect',
    duration: 30
  });

  const question = await createQuestion(interview.id, {
    text: 'Explain how you design a distributed caching layer using Redis to optimize database read performance.',
    category: 'System Design',
    difficulty: 'Medium',
    duration: 120
  });

  const savedAnswer = await createAnswer(interview.id, {
    candidateId: candidate.id,
    questionId: question.id,
    answerText: transcript,
    transcript: transcript,
    evaluationStatus: 'pending',
    status: 'Completed'
  });
  console.log(`   ✓ Answer saved to DB: id=${savedAnswer.id}`);

  console.log('4. [LLM Evaluation Phase] Running AI Evaluation Engine via Sarvam LLM (sarvam-105b-conversations)...');
  const evaluatedReport = await evaluateInterview(interview.id);
  console.log(`   ✓ Evaluation complete: Overall Score = ${evaluatedReport.overallScore}% | Recommendation = ${evaluatedReport.recommendation}`);

  console.log('5. [Database Verification] Fetching final Report record directly from Supabase DB `reports` table...');
  const { data: dbReport, error: repErr } = await supabase
    .from('reports')
    .select('*')
    .eq('interview_id', interview.id)
    .single();

  if (repErr) throw repErr;

  console.log('\n------------------------------------------------------------------------');
  console.log('  FINAL PERSISTED REPORT RECORD IN SUPABASE DB');
  console.log('------------------------------------------------------------------------');
  console.log(JSON.stringify({
    report_id: dbReport.id,
    interview_id: dbReport.interview_id,
    candidate_id: dbReport.candidate_id,
    overall_score: dbReport.overall_score,
    technical_score: dbReport.technical_score,
    communication_score: dbReport.communication_score,
    problem_solving_score: dbReport.problem_solving_score,
    recommendation: dbReport.recommendation,
    strengths: dbReport.strengths,
    weaknesses: dbReport.weaknesses,
    summary: dbReport.summary,
    generated_at: dbReport.generated_at
  }, null, 2));

  console.log('\n========================================================================');
  console.log('✓ FULL LOOP TEST PASSED: Voice -> STT -> Answer DB -> LLM Eval -> Report DB');
  console.log('========================================================================\n');
}

runFullVoiceToReportLoop().catch(console.error);
