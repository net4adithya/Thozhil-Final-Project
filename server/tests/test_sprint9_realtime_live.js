import http from 'http';
import { WebSocket } from 'ws';
import app from '../src/app.js';
import supabase from '../src/config/supabase.js';
import { initLiveWebSocket } from '../src/realtime/liveWebSocketGateway.js';
import { createCandidate, deleteCandidateById } from '../src/services/candidateService.js';
import { createInterview, deleteInterviewById } from '../src/services/interviewService.js';
import { createQuestion } from '../src/services/questionService.js';
import liveSessionManager, { SESSION_STATES } from '../src/realtime/liveSessionManager.js';

let server;
let testPort = 5002;
let wsUrl = `ws://localhost:${testPort}/ws/live`;

// Helper for assertions
function assert(condition, message) {
  if (!condition) {
    console.error(`\x1b[31m✖ [FAIL] Assertion Failed: ${message}\x1b[0m`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`\x1b[32m ✓ [PASS] ${message}\x1b[0m`);
}

// Helper to wait for a specific WebSocket event
function waitForEvent(ws, targetEvent, timeoutMs = 15000) {
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
      } catch (e) {
        // ignore non-json
      }
    };

    ws.on('message', handler);
  });
}

async function runSprint9Tests() {
  console.log('\n=== Commencing Sprint 9 Real-Time Live Interview Test Suite ===\n');

  // 1. Setup local test server
  const httpServer = http.createServer(app);
  initLiveWebSocket(httpServer);

  await new Promise((resolve) => {
    server = httpServer.listen(testPort, () => {
      console.log(`Test server active on port: ${testPort}`);
      resolve();
    });
  });

  let testCandidateId = null;
  let testLiveInterviewId = null;
  let testAsyncInterviewId = null;

  try {
    // 2. Create test candidate using candidateService
    const cand = await createCandidate({
      name: 'Jordan Realtime',
      email: `jordan.realtime.${Date.now()}@example.com`,
      role: 'Senior Platform Engineer',
      status: 'Reviewing'
    });

    assert(cand && cand.id, 'Created test candidate in database');
    testCandidateId = cand.id;

    // 3. Create test LIVE interview with questions using interviewService
    const liveInt = await createInterview({
      title: 'Senior Platform Live Architecture Assessment',
      type: 'live',
      interviewType: 'live',
      jobRole: 'Senior Platform Engineer',
      duration: 30,
      status: 'Active',
      candidate: testCandidateId
    });

    assert(liveInt && liveInt.id, 'Created test Live Interview in database');
    testLiveInterviewId = liveInt.id;

    // Insert 2 test questions for live interview
    await createQuestion(testLiveInterviewId, {
      text: 'How do you design a distributed real-time messaging pipeline handling 100k events/sec with Redis and WebSockets?',
      category: 'System Design',
      difficulty: 'Hard',
      questionOrder: 0
    });

    await createQuestion(testLiveInterviewId, {
      text: 'Explain how you handle database connection pooling and failover during catastrophic network partitions.',
      category: 'Database Architecture',
      difficulty: 'Hard',
      questionOrder: 1
    });

    // 4. Create test ASYNC interview (for rejection validation)
    const asyncInt = await createInterview({
      title: 'Async Coding Screening',
      type: 'async',
      interviewType: 'async',
      jobRole: 'Software Engineer',
      duration: 30,
      status: 'Active'
    });

    testAsyncInterviewId = asyncInt?.id;

    // ----------------------------------------------------
    // TEST 1: WebSocket Connection & Handshake
    // ----------------------------------------------------
    console.log('\n--- Test 1: WebSocket Connection & Handshake ---');
    let ws = new WebSocket(wsUrl);
    const ackPromise = waitForEvent(ws, 'connection:ack');
    
    await new Promise((res) => ws.on('open', res));
    assert(ws.readyState === WebSocket.OPEN, 'WebSocket socket opened');
    
    const ackEvent = await ackPromise;
    assert(ackEvent.event === 'connection:ack', 'Received connection:ack from live gateway');
    assert(ackEvent.data.protocol === 'live.interview.v1', 'Protocol version verified');

    // ----------------------------------------------------
    // TEST 2: Reject Invalid Interview ID
    // ----------------------------------------------------
    console.log('\n--- Test 2: Validation - Invalid Interview ID ---');
    const invalidErrPromise = waitForEvent(ws, 'session:error');
    ws.send(JSON.stringify({
      event: 'session:init',
      data: {
        interviewId: 'not-a-valid-uuid',
        candidateId: testCandidateId
      }
    }));
    const invalidErr = await invalidErrPromise;
    assert(invalidErr.data.fatal === true, 'Fatal error emitted for invalid UUID format');

    // ----------------------------------------------------
    // TEST 3: Reject Async Interview from Live Session
    // ----------------------------------------------------
    console.log('\n--- Test 3: Validation - Reject Async Interview ---');
    const asyncErrPromise = waitForEvent(ws, 'session:error');
    ws.send(JSON.stringify({
      event: 'session:init',
      data: {
        interviewId: testAsyncInterviewId,
        candidateId: testCandidateId
      }
    }));
    const asyncErr = await asyncErrPromise;
    assert(asyncErr.data.message.includes('Async interviews cannot be conducted'), 'Async interview properly rejected from Live session');

    // ----------------------------------------------------
    // TEST 4: Live Session Initialization
    // ----------------------------------------------------
    console.log('\n--- Test 4: Live Session Initialization ---');
    const initPromise = waitForEvent(ws, 'session:initialized');
    ws.send(JSON.stringify({
      event: 'session:init',
      data: {
        interviewId: testLiveInterviewId,
        candidateId: testCandidateId
      }
    }));

    const initEvent = await initPromise;
    const activeSessionId = initEvent.data.sessionId;
    assert(initEvent.data.candidateName === 'Jordan Realtime', 'Candidate name properly attached');
    assert(initEvent.data.totalQuestions === 2, 'Loaded configured questions');
    assert(initEvent.data.state === SESSION_STATES.CONNECTED, 'Authoritative state is CONNECTED');

    // ----------------------------------------------------
    // TEST 5: Session Ready -> AI Introduction Speech
    // ----------------------------------------------------
    console.log('\n--- Test 5: Session Ready -> AI Intro Spoken ---');
    const introPromise = waitForEvent(ws, 'ai:speaking');
    ws.send(JSON.stringify({
      event: 'session:ready',
      sessionId: activeSessionId
    }));

    const introEvent = await introPromise;
    assert(introEvent.data.phraseType === 'intro', 'AI speaking intro phrase');

    // ----------------------------------------------------
    // TEST 6: Finished Intro -> Ask Question 1
    // ----------------------------------------------------
    console.log('\n--- Test 6: Finished Intro -> Ask Question 1 ---');
    const q1Promise = waitForEvent(ws, 'ai:speaking');
    ws.send(JSON.stringify({
      event: 'interviewer:finished_speaking',
      sessionId: activeSessionId,
      data: { phraseType: 'intro' }
    }));

    const q1Event = await q1Promise;
    assert(q1Event.data.phraseType === 'question', 'AI asks Question 1');
    assert(q1Event.data.phrase.includes('Question 1'), 'Phrase formatted as Question 1');

    // ----------------------------------------------------
    // TEST 7: Finished Asking -> Candidate Turn (LISTENING)
    // ----------------------------------------------------
    console.log('\n--- Test 7: Finished Asking -> Candidate Turn ---');
    const turnPromise = waitForEvent(ws, 'candidate:turn');
    ws.send(JSON.stringify({
      event: 'interviewer:finished_speaking',
      sessionId: activeSessionId,
      data: { phraseType: 'question' }
    }));

    const turnEvent = await turnPromise;
    assert(turnEvent.data.state === SESSION_STATES.LISTENING, 'Server state is LISTENING');
    assert(turnEvent.data.questionIndex === 0, 'Question index is 0');

    // ----------------------------------------------------
    // TEST 8: Candidate Submits Answer 1 -> Evaluation & Follow-Up
    // ----------------------------------------------------
    console.log('\n--- Test 8: Candidate Submits Answer 1 ---');
    const respPromise = waitForEvent(ws, 'ai:response');
    const speakingFuPromise = waitForEvent(ws, 'ai:speaking');
    
    ws.send(JSON.stringify({
      event: 'candidate:submit_answer',
      sessionId: activeSessionId,
      eventId: 'evt-q1-ans-1',
      data: {
        questionId: q1Event.data.question?.id,
        transcript: 'We utilize Redis pub/sub with WebSocket cluster gateways, maintaining connection heartbeats, backpressure queues, and horizontally scaled consumer nodes.',
        answerText: 'We utilize Redis pub/sub with WebSocket cluster gateways, maintaining connection heartbeats, backpressure queues, and horizontally scaled consumer nodes.',
        duration: 45
      }
    }));

    const respEvent = await respPromise;
    assert(typeof respEvent.data.evaluation.score === 'number' && respEvent.data.evaluation.score >= 50, `Evaluation score awarded: ${respEvent.data.evaluation.score}`);
    assert(respEvent.data.nextAction === 'FOLLOW_UP', 'Triggered follow-up question');

    const fuSpeakingEvent = await speakingFuPromise;
    assert(fuSpeakingEvent.data.phraseType === 'followup', 'AI speaking follow-up question');

    // ----------------------------------------------------
    // TEST 9: Duplicate Event Protection (Idempotency)
    // ----------------------------------------------------
    console.log('\n--- Test 9: Duplicate Event Protection ---');
    const dupPromise = waitForEvent(ws, 'session:turn_ignored');
    ws.send(JSON.stringify({
      event: 'candidate:submit_answer',
      sessionId: activeSessionId,
      eventId: 'evt-q1-ans-1', // Same event ID
      data: {
        questionId: q1Event.data.question?.id,
        transcript: 'Duplicate submission attempt',
        answerText: 'Duplicate submission attempt'
      }
    }));
    const dupEvent = await dupPromise;
    assert(dupEvent.data.reason === 'DUPLICATE_EVENT_DETECTED', 'Duplicate event successfully discarded by server');

    // ----------------------------------------------------
    // TEST 10: Disconnect and Reconnection without Restarting
    // ----------------------------------------------------
    console.log('\n--- Test 10: Disconnect & Reconnect without Restarting ---');
    ws.close(1000, 'Simulated network drop');
    await new Promise((res) => setTimeout(res, 300));

    // Connect new WebSocket and send session:reconnect
    const newWs = new WebSocket(wsUrl);
    await new Promise((res) => newWs.on('open', res));
    
    const reconnectedPromise = waitForEvent(newWs, 'session:reconnected');
    newWs.send(JSON.stringify({
      event: 'session:reconnect',
      data: {
        sessionId: activeSessionId,
        interviewId: testLiveInterviewId,
        candidateId: testCandidateId
      }
    }));

    const reconnEvent = await reconnectedPromise;
    assert(reconnEvent.data.sessionId === activeSessionId, 'Restored same session ID');
    assert(reconnEvent.data.currentQuestionIndex === 0, 'Preserved current question index without restarting');
    assert(reconnEvent.data.conversationHistory.length > 0, 'Preserved conversation history');

    // ----------------------------------------------------
    // TEST 11: Candidate Submits Follow-Up Answer -> Next Question
    // ----------------------------------------------------
    console.log('\n--- Test 11: Candidate Submits Follow-Up Answer -> Next Question ---');
    const q2SpeakingPromise = waitForEvent(newWs, 'ai:speaking');
    newWs.send(JSON.stringify({
      event: 'candidate:submit_answer',
      sessionId: activeSessionId,
      eventId: 'evt-fu-ans-1',
      data: {
        transcript: 'To handle cache invalidation during write spikes, we implement write-through caching with distributed locks in Redis.',
        answerText: 'To handle cache invalidation during write spikes, we implement write-through caching with distributed locks in Redis.',
        duration: 30
      }
    }));

    const q2Event = await q2SpeakingPromise;
    assert(q2Event.data.phraseType === 'question', 'AI advanced to Question 2');
    assert(q2Event.data.questionIndex === 1, 'Current question index is 1');

    // Finish speaking Question 2
    const turn2Promise = waitForEvent(newWs, 'candidate:turn');
    newWs.send(JSON.stringify({
      event: 'interviewer:finished_speaking',
      sessionId: activeSessionId,
      data: { phraseType: 'question' }
    }));
    await turn2Promise;

    // ----------------------------------------------------
    // TEST 12: Candidate Submits Question 2 Answer -> Q2 Follow-Up
    // ----------------------------------------------------
    console.log('\n--- Test 12: Candidate Submits Question 2 Answer -> Follow-up ---');
    const q2FuSpeakingPromise = waitForEvent(newWs, 'ai:speaking');
    newWs.send(JSON.stringify({
      event: 'candidate:submit_answer',
      sessionId: activeSessionId,
      eventId: 'evt-q2-ans-1',
      data: {
        transcript: 'We configure PgBouncer connection pools with aggressive max-lifetime timeouts and database read replicas.',
        answerText: 'We configure PgBouncer connection pools with aggressive max-lifetime timeouts and database read replicas.',
        duration: 40
      }
    }));

    const q2FuEvent = await q2FuSpeakingPromise;
    assert(q2FuEvent.data.phraseType === 'followup', 'Received Question 2 follow-up');

    // ----------------------------------------------------
    // TEST 13: Candidate Submits Final Follow-Up Answer -> Complete Interview
    // ----------------------------------------------------
    console.log('\n--- Test 13: Final Follow-Up Answer -> Complete Assessment ---');
    const completedPromise = waitForEvent(newWs, 'interview:completed', 45000);
    newWs.send(JSON.stringify({
      event: 'candidate:submit_answer',
      sessionId: activeSessionId,
      eventId: 'evt-q2-fu-ans-final',
      data: {
        transcript: 'Under multi-region network partitions, we utilize raft consensus and automated replica promotion to maintain quorum.',
        answerText: 'Under multi-region network partitions, we utilize raft consensus and automated replica promotion to maintain quorum.',
        duration: 35
      }
    }));

    const compEvent = await completedPromise;
    assert(compEvent.data.sessionId === activeSessionId, 'Live interview marked completed');
    assert(compEvent.data.completed === true, 'Completion status verified');

    // Clean up sockets
    newWs.close();

    console.log('\n\x1b[32m✔ ALL SPRINT 9 REAL-TIME LIVE INTERVIEW TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
  } finally {
    // Database cleanup
    console.log('Cleaning up test records...');
    try {
      if (testLiveInterviewId) {
        await supabase.from('answers').delete().eq('interview_id', testLiveInterviewId);
        await supabase.from('questions').delete().eq('interview_id', testLiveInterviewId);
        await supabase.from('reports').delete().eq('interview_id', testLiveInterviewId);
        await deleteInterviewById(testLiveInterviewId);
      }
      if (testAsyncInterviewId) {
        await deleteInterviewById(testAsyncInterviewId);
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

runSprint9Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✖ TEST SUITE FAILURE:', err);
    process.exit(1);
  });
