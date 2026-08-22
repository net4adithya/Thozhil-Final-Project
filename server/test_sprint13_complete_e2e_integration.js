import http from 'http';
import { WebSocket } from 'ws';
import app from './src/app.js';
import supabase from './src/config/supabase.js';
import { initLiveWebSocket } from './src/realtime/liveWebSocketGateway.js';
import { createCandidate, getCandidateById, deleteCandidateById } from './src/services/candidateService.js';
import { createInterview, getInterviewById, deleteInterviewById } from './src/services/interviewService.js';
import { createQuestion, getQuestionsByInterviewId } from './src/services/questionService.js';
import { createAnswer, getAnswersByInterviewId } from './src/services/answerService.js';
import { evaluateAsyncInterview } from './src/services/ai/interviewEvaluationService.js';
import { getReportByInterviewId, getAnalytics } from './src/services/reportService.js';
import { logProctoringEvents, getProctoringEvents } from './src/services/proctoringService.js';
import { uploadInterviewRecording, getInterviewRecordings } from './src/services/recordingService.js';
import { synthesizeSpeech, transcribeSpeech } from './src/services/ai/sarvamProvider.js';

let server;
const testPort = 5006;
const baseUrl = `http://localhost:${testPort}/api`;
const wsUrl = `ws://localhost:${testPort}/ws/live`;

function assert(condition, message) {
  if (!condition) {
    console.error(`\x1b[31m✖ [FAIL] Assertion Failed: ${message}\x1b[0m`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`\x1b[32m ✓ [PASS] ${message}\x1b[0m`);
}

async function withRetry(fn, retries = 4, delayMs = 600) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastErr;
}

function waitForEvent(ws, targetEvent, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${targetEvent}`));
    }, timeoutMs);

    const handler = (rawData) => {
      try {
        const parsed = JSON.parse(rawData.toString());
        if (parsed.event === targetEvent) {
          clearTimeout(timer);
          ws.off('message', handler);
          resolve(parsed);
        }
      } catch (e) {}
    };

    ws.on('message', handler);
  });
}

async function runSprint13IntegrationTests() {
  console.log('\n=== Commencing Sprint 13 Complete Real-World Product Integration Test Suite ===\n');

  // Start HTTP + WebSocket test server
  const httpServer = http.createServer(app);
  initLiveWebSocket(httpServer);

  await new Promise((resolve) => {
    server = httpServer.listen(testPort, () => {
      console.log(`Sprint 13 E2E test server running on port: ${testPort}`);
      resolve();
    });
  });

  let testCandidateId = null;
  let testAsyncInterviewId = null;
  let testLiveInterviewId = null;

  try {
    // ----------------------------------------------------
    // PHASE 1: Recruiter Creates Job & Async Interview
    // ----------------------------------------------------
    console.log('\n--- Phase 1: Recruiter Creates Job & Async Interview ---');
    const asyncInt = await withRetry(() =>
      createInterview({
        title: 'Senior Distributed Systems Engineer (Async)',
        type: 'async',
        interviewType: 'async',
        jobRole: 'Senior Distributed Systems Engineer',
        department: 'Infrastructure',
        duration: 45,
        status: 'Active'
      })
    );
    assert(asyncInt && asyncInt.id, 'Recruiter successfully created Async Interview');
    testAsyncInterviewId = asyncInt.id;

    // ----------------------------------------------------
    // PHASE 2: Recruiter Configures Questions
    // ----------------------------------------------------
    console.log('\n--- Phase 2: Recruiter Configures Questions ---');
    const q1 = await withRetry(() =>
      createQuestion(testAsyncInterviewId, {
        text: 'Explain how Raft consensus algorithm handles leader election and log replication during network partitions.',
        category: 'Distributed Systems',
        difficulty: 'Hard',
        duration: 180,
        questionOrder: 0
      })
    );
    const q2 = await withRetry(() =>
      createQuestion(testAsyncInterviewId, {
        text: 'How do you design an idempotent payment processing pipeline with at-least-once message delivery?',
        category: 'System Architecture',
        difficulty: 'Hard',
        duration: 180,
        questionOrder: 1
      })
    );
    assert(q1 && q1.id && q2 && q2.id, 'Configured 2 technical questions in assessment');

    const fetchedQuestions = await withRetry(() => getQuestionsByInterviewId(testAsyncInterviewId));
    assert(fetchedQuestions.length === 2, 'Retrieved configured questions from database');

    // ----------------------------------------------------
    // PHASE 3: Recruiter Invites / Assigns Candidate
    // ----------------------------------------------------
    console.log('\n--- Phase 3: Recruiter Invites / Assigns Candidate ---');
    const cand = await withRetry(() =>
      createCandidate({
        name: 'Alexander Wright',
        email: `alex.wright.${Date.now()}@infra.io`,
        role: 'Senior Distributed Systems Engineer',
        interviewId: testAsyncInterviewId,
        status: 'Invited'
      })
    );
    assert(cand && cand.id, 'Candidate record created in database');
    testCandidateId = cand.id;

    const fetchedCand = await withRetry(() => getCandidateById(testCandidateId));
    assert(fetchedCand.email === cand.email, 'Candidate details successfully resolved');

    // ----------------------------------------------------
    // PHASE 4: Candidate Async Submission & Proctoring
    // ----------------------------------------------------
    console.log('\n--- Phase 4: Async Candidate Submission & Proctoring Events ---');
    
    // Log proctoring observation
    await withRetry(() =>
      logProctoringEvents(testAsyncInterviewId, {
        events: [
          { type: 'TAB_HIDDEN', timestamp: new Date().toISOString() },
          { type: 'TAB_VISIBLE', timestamp: new Date().toISOString() },
          { type: 'FULLSCREEN_ENTERED', timestamp: new Date().toISOString() }
        ]
      })
    );
    const proctorData = await withRetry(() => getProctoringEvents(testAsyncInterviewId));
    assert(proctorData && proctorData.proctoringSummary && proctorData.proctoringSummary.tabHiddenCount >= 1, 'Proctoring observation events persisted and summarized');

    // Submit answers
    const ans1 = await withRetry(() =>
      createAnswer(testAsyncInterviewId, {
        candidateId: testCandidateId,
        questionId: q1.id,
        answerText: 'Raft uses randomized election timers to avoid split votes. When a follower does not hear heartbeats, it transitions to candidate, increments term, votes for itself, and requests votes from peers.',
        transcript: 'Raft uses randomized election timers to avoid split votes. When a follower does not hear heartbeats, it transitions to candidate, increments term, votes for itself, and requests votes from peers.',
        timeTaken: 75,
        status: 'Completed'
      })
    );
    const ans2 = await withRetry(() =>
      createAnswer(testAsyncInterviewId, {
        candidateId: testCandidateId,
        questionId: q2.id,
        answerText: 'We assign unique idempotency keys to each transaction, store processed keys in Redis with TTL and PostgreSQL unique constraints, and employ transactional outbox with Kafka.',
        transcript: 'We assign unique idempotency keys to each transaction, store processed keys in Redis with TTL and PostgreSQL unique constraints, and employ transactional outbox with Kafka.',
        timeTaken: 90,
        status: 'Completed'
      })
    );
    assert(ans1 && ans1.id && ans2 && ans2.id, 'Candidate submitted answers persisted to database');

    // ----------------------------------------------------
    // PHASE 5: AI Evaluation & Recruiter Report Generation
    // ----------------------------------------------------
    console.log('\n--- Phase 5: AI Evaluation & Recruiter Report Generation ---');
    const report = await withRetry(() => evaluateAsyncInterview(testAsyncInterviewId));
    assert(report && typeof report.overallScore === 'number' && report.overallScore >= 50, `Report evaluated with overall score (Actual: ${report?.overallScore})`);
    assert(typeof report.technicalScore === 'number', 'Technical accuracy score computed');
    assert(typeof report.recommendation === 'string' && report.recommendation.length > 0, `Recommendation generated: ${report.recommendation}`);
    assert(Array.isArray(report.strengths) && report.strengths.length > 0, 'Strengths extracted');

    const retrievedReport = await withRetry(() => getReportByInterviewId(testAsyncInterviewId));
    assert(retrievedReport && retrievedReport.id === report.id, 'Recruiter retrieved report by interview ID');

    // ----------------------------------------------------
    // PHASE 6: Live Adaptive Interview + WebSocket + Sarvam
    // ----------------------------------------------------
    console.log('\n--- Phase 6: Live Adaptive Interview + WebSocket + Sarvam ---');
    const liveInt = await withRetry(() =>
      createInterview({
        title: 'Principal Cloud Systems Live Interview',
        type: 'live',
        interviewType: 'live',
        jobRole: 'Principal Cloud Systems Engineer',
        duration: 30,
        status: 'Active',
        candidate: testCandidateId
      })
    );
    assert(liveInt && liveInt.id, 'Provisioned Live Interview');
    testLiveInterviewId = liveInt.id;

    await withRetry(() =>
      createQuestion(testLiveInterviewId, {
        text: 'How do you structure microservices with low-latency caching and handle database connection pool saturation?',
        category: 'System Design',
        difficulty: 'Hard',
        duration: 180,
        questionOrder: 0
      })
    );

    const ws = new WebSocket(wsUrl);
    await new Promise((res) => ws.on('open', res));

    // Connect & Init
    const initPromise = waitForEvent(ws, 'session:initialized');
    ws.send(JSON.stringify({
      event: 'session:init',
      data: {
        interviewId: testLiveInterviewId,
        candidateId: testCandidateId
      }
    }));
    const initEvt = await initPromise;
    const activeSessionId = initEvt.data.sessionId;
    assert(activeSessionId, 'Live WebSocket session initialized');

    // Ready -> AI intro
    const introPromise = waitForEvent(ws, 'ai:speaking');
    ws.send(JSON.stringify({
      event: 'session:ready',
      sessionId: activeSessionId
    }));
    const introEvt = await introPromise;
    assert(introEvt.data.phraseType === 'intro', 'AI host speaks introduction phrase');

    // Finish intro -> Ask Q1
    const q1Promise = waitForEvent(ws, 'ai:speaking');
    ws.send(JSON.stringify({
      event: 'interviewer:finished_speaking',
      sessionId: activeSessionId,
      data: { phraseType: 'intro' }
    }));
    const q1Evt = await q1Promise;
    assert(q1Evt.data.phraseType === 'question', 'AI interviewer asks Question 1');

    // Finished Q1 -> Candidate turn
    const turnPromise = waitForEvent(ws, 'candidate:turn');
    ws.send(JSON.stringify({
      event: 'interviewer:finished_speaking',
      sessionId: activeSessionId,
      data: { phraseType: 'question' }
    }));
    await turnPromise;

    // Candidate speaks answer -> Sarvam STT/LLM adaptive response
    const adaptiveResponsePromise = waitForEvent(ws, 'ai:response');
    const aiFollowUpSpeakingPromise = waitForEvent(ws, 'ai:speaking');

    ws.send(JSON.stringify({
      event: 'candidate:submit_answer',
      sessionId: activeSessionId,
      eventId: 'evt-sprint13-live-turn-1',
      data: {
        questionId: q1Evt.data.question?.id,
        transcript: 'We deploy Redis cluster caches in front of PostgreSQL and use PgBouncer for connection pooling to prevent backend exhaustion.',
        duration: 45
      }
    }));

    const respEvt = await adaptiveResponsePromise;
    const fuEvt = await aiFollowUpSpeakingPromise;

    assert(respEvt.data.nextAction === 'FOLLOW_UP', 'Sarvam Adaptive Engine selected FOLLOW_UP');
    assert(fuEvt.data.phraseType === 'followup', 'AI speaking synthesized follow-up question');

    // TTS & STT Verification
    const tts = await synthesizeSpeech('Testing Sarvam voice synthesis pipeline.');
    assert(typeof tts.audioBase64 === 'string' && tts.audioBase64.length > 50, 'Sarvam TTS generated valid audio payload');

    const stt = await transcribeSpeech(Buffer.from('RIFF....WAVEfmt ....data....'), 'audio/wav');
    assert(typeof stt.transcript === 'string' && stt.transcript.length > 0, 'Sarvam STT returned transcript');

    ws.close();

    // ----------------------------------------------------
    // PHASE 7: Recruiter Dashboard Analytics
    // ----------------------------------------------------
    console.log('\n--- Phase 7: Recruiter Dashboard Analytics ---');
    const analytics = await withRetry(() => getAnalytics());
    assert(analytics && analytics.kpis, 'Recruiter analytics generated');
    assert(typeof analytics.kpis.activeInterviews === 'number', 'KPI: activeInterviews is numeric');
    assert(typeof analytics.kpis.completions === 'number', 'KPI: completions is numeric');
    assert(Array.isArray(analytics.weeklyCompletions), 'Weekly completions dataset is array');
    assert(Array.isArray(analytics.scoreDistribution), 'Score distribution is array');

    console.log('\n\x1b[32m✔ ALL SPRINT 13 PRODUCT INTEGRATION TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
  } finally {
    console.log('Cleaning up test records...');
    try {
      if (testAsyncInterviewId) {
        await supabase.from('reports').delete().eq('interview_id', testAsyncInterviewId);
        await supabase.from('answers').delete().eq('interview_id', testAsyncInterviewId);
        await deleteInterviewById(testAsyncInterviewId);
      }
      if (testLiveInterviewId) {
        await supabase.from('reports').delete().eq('interview_id', testLiveInterviewId);
        await supabase.from('answers').delete().eq('interview_id', testLiveInterviewId);
        await deleteInterviewById(testLiveInterviewId);
      }
      if (testCandidateId) {
        await deleteCandidateById(testCandidateId);
      }
    } catch (cleanupErr) {
      console.warn('Cleanup notice:', cleanupErr.message);
    }

    if (server) {
      server.close();
    }
  }
}

runSprint13IntegrationTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✖ SPRINT 13 INTEGRATION TEST FAILURE:', err);
    process.exit(1);
  });
