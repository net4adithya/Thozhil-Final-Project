import http from 'http';
import { WebSocket } from 'ws';
import app from './src/app.js';
import supabase from './src/config/supabase.js';
import { initLiveWebSocket } from './src/realtime/liveWebSocketGateway.js';
import { createCandidate, deleteCandidateById } from './src/services/candidateService.js';
import { createInterview, deleteInterviewById } from './src/services/interviewService.js';
import { ALLOWED_PROCTORING_EVENTS } from './src/services/proctoringService.js';

let server;
const testPort = 5003;
const baseUrl = `http://localhost:${testPort}/api`;
const wsUrl = `ws://localhost:${testPort}/ws/live`;

// Assertion helper
function assert(condition, message) {
  if (!condition) {
    console.error(`\x1b[31m✖ [FAIL] Assertion Failed: ${message}\x1b[0m`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`\x1b[32m ✓ [PASS] ${message}\x1b[0m`);
}

// Helper to wait for a WebSocket event
function waitForEvent(ws, targetEvent, timeoutMs = 10000) {
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

async function runSprint10Tests() {
  console.log('\n=== Commencing Sprint 10 Interview Recording & Proctoring Test Suite ===\n');

  // 1. Start test HTTP & WebSocket server
  const httpServer = http.createServer(app);
  initLiveWebSocket(httpServer);

  await new Promise((resolve) => {
    server = httpServer.listen(testPort, () => {
      console.log(`Test server active on port: ${testPort}`);
      resolve();
    });
  });

  let testCandidateId = null;
  let testInterviewId = null;
  let testAsyncInterviewId = null;

  try {
    // 2. Provision test candidate
    const cand = await createCandidate({
      name: 'Alex Vance',
      email: `alex.vance.${Date.now()}@example.com`,
      role: 'Full Stack Engineer',
      status: 'Reviewing'
    });
    assert(cand && cand.id, 'Created test candidate');
    testCandidateId = cand.id;

    // 3. Provision test interview
    const liveInt = await createInterview({
      title: 'Full Stack Live Recording Assessment',
      type: 'live',
      interviewType: 'live',
      jobRole: 'Full Stack Engineer',
      duration: 45,
      status: 'Active',
      candidate: testCandidateId
    });
    assert(liveInt && liveInt.id, 'Created test Live Interview');
    testInterviewId = liveInt.id;

    // Provision test async interview for regression
    const asyncInt = await createInterview({
      title: 'Async Regression Interview',
      type: 'async',
      interviewType: 'async',
      jobRole: 'Full Stack Engineer',
      duration: 30,
      status: 'Active'
    });
    testAsyncInterviewId = asyncInt?.id;

    // ----------------------------------------------------
    // TEST 1: Reject Empty Recording File Upload
    // ----------------------------------------------------
    console.log('\n--- Test 1: Reject Empty Recording Upload ---');
    const emptyForm = new FormData();
    const emptyBlob = new Blob([], { type: 'video/webm' });
    emptyForm.append('file', emptyBlob, 'empty.webm');
    emptyForm.append('candidateId', testCandidateId);

    const emptyRes = await fetch(`${baseUrl}/interviews/${testInterviewId}/recordings`, {
      method: 'POST',
      body: emptyForm
    });
    const emptyData = await emptyRes.json();
    assert(emptyRes.status === 400, 'Empty file rejected with 400 Bad Request');
    assert(emptyData.success === false, 'Response success is false for empty file');

    // ----------------------------------------------------
    // TEST 2: Successful Video Recording Upload & Metadata Persistence
    // ----------------------------------------------------
    console.log('\n--- Test 2: Video Recording Upload & Storage ---');
    const validVideoBuffer = Buffer.from('FAKE_WEBM_VIDEO_BINARY_HEADER_DATA_STREAM_TEST_CONTENT');
    const validVideoBlob = new Blob([validVideoBuffer], { type: 'video/webm' });

    const form = new FormData();
    form.append('file', validVideoBlob, 'interview_session_rec.webm');
    form.append('candidateId', testCandidateId);
    form.append('sessionId', `sess-live-${testInterviewId}`);
    form.append('recordingType', 'live_session');
    form.append('duration', '185');

    const uploadRes = await fetch(`${baseUrl}/interviews/${testInterviewId}/recordings`, {
      method: 'POST',
      body: form
    });
    const uploadData = await uploadRes.json();

    assert(uploadRes.status === 201, 'Recording upload status is 201 Created');
    assert(uploadData.success === true, 'Upload response success is true');
    assert(uploadData.data.storagePath.includes(testInterviewId), 'Storage path contains interview ID');
    assert(uploadData.data.mimeType.includes('video/webm'), 'MIME type preserved');
    assert(uploadData.data.duration === 185, 'Recording duration saved');
    assert(typeof uploadData.data.publicUrl === 'string' && uploadData.data.publicUrl.length > 0, 'Public URL returned');

    // ----------------------------------------------------
    // TEST 3: Retrieve Recordings List
    // ----------------------------------------------------
    console.log('\n--- Test 3: Retrieve Recordings List ---');
    const getRecsRes = await fetch(`${baseUrl}/interviews/${testInterviewId}/recordings`);
    const getRecsData = await getRecsRes.json();

    assert(getRecsRes.status === 200, 'Recordings list status is 200');
    assert(Array.isArray(getRecsData.data), 'Recordings data is an array');
    assert(getRecsData.data.length >= 1, 'Recordings array contains uploaded session recording');
    assert(getRecsData.data[0].recordingType === 'live_session', 'Recording type verified');

    // ----------------------------------------------------
    // TEST 4: Reject Invalid Proctoring Event Type
    // ----------------------------------------------------
    console.log('\n--- Test 4: Reject Invalid Proctoring Event Type ---');
    const invalidProcRes = await fetch(`${baseUrl}/interviews/${testInterviewId}/proctoring-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: testCandidateId,
        events: [
          { eventType: 'INVALID_UNKNOWN_CHEATING_EVENT', timestamp: new Date().toISOString() }
        ]
      })
    });
    const invalidProcData = await invalidProcRes.json();
    assert(invalidProcRes.status === 400, 'Invalid proctoring event rejected with 400');
    assert(invalidProcData.success === false, 'Invalid event response success is false');

    // ----------------------------------------------------
    // TEST 5: Log Observable Proctoring Events (Tab Hidden, Fullscreen, etc.)
    // ----------------------------------------------------
    console.log('\n--- Test 5: Log Valid Proctoring Observation Events ---');
    const validEventsPayload = {
      candidateId: testCandidateId,
      sessionId: `sess-live-${testInterviewId}`,
      events: [
        {
          eventType: 'RECORDING_STARTED',
          timestamp: new Date().toISOString(),
          details: { mimeType: 'video/webm' }
        },
        {
          eventType: 'FULLSCREEN_ENTERED',
          timestamp: new Date().toISOString()
        },
        {
          eventType: 'TAB_HIDDEN',
          timestamp: new Date().toISOString(),
          details: { visibilityState: 'hidden' }
        },
        {
          eventType: 'TAB_VISIBLE',
          timestamp: new Date().toISOString(),
          details: { visibilityState: 'visible' }
        },
        {
          eventType: 'FULLSCREEN_EXITED',
          timestamp: new Date().toISOString()
        },
        {
          eventType: 'RECORDING_STOPPED',
          timestamp: new Date().toISOString(),
          details: { duration: 185 }
        }
      ]
    };

    const logProcRes = await fetch(`${baseUrl}/interviews/${testInterviewId}/proctoring-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validEventsPayload)
    });
    const logProcData = await logProcRes.json();

    assert(logProcRes.status === 200, 'Proctoring events logged with status 200');
    assert(logProcData.success === true, 'Proctoring log response success is true');
    assert(logProcData.data.loggedEventsCount === 6, 'Logged all 6 observation events');
    assert(logProcData.data.summary.tabHiddenCount === 1, 'Summary calculates 1 tab hidden event');
    assert(logProcData.data.summary.fullscreenExits === 1, 'Summary calculates 1 fullscreen exit event');

    // ----------------------------------------------------
    // TEST 6: Retrieve Proctoring Summary & Log
    // ----------------------------------------------------
    console.log('\n--- Test 6: Retrieve Proctoring Observations Summary ---');
    const getProcRes = await fetch(`${baseUrl}/interviews/${testInterviewId}/proctoring-events`);
    const getProcData = await getProcRes.json();

    assert(getProcRes.status === 200, 'Get proctoring events status is 200');
    assert(getProcData.data.proctoringSummary.tabHiddenCount >= 1, 'Proctoring summary contains tabHiddenCount');
    assert(Array.isArray(getProcData.data.events) && getProcData.data.events.length >= 6, 'Proctoring log contains events');

    // ----------------------------------------------------
    // TEST 7: WebSocket Proctoring Event Exchange (Live Gateway)
    // ----------------------------------------------------
    console.log('\n--- Test 7: WebSocket Proctoring Event Exchange ---');
    const ws = new WebSocket(wsUrl);
    await new Promise((res) => ws.on('open', res));

    // Initialize session over WebSocket
    const initPromise = waitForEvent(ws, 'session:initialized');
    ws.send(JSON.stringify({
      event: 'session:init',
      data: {
        interviewId: testInterviewId,
        candidateId: testCandidateId
      }
    }));
    const initEvt = await initPromise;
    const activeSessionId = initEvt.data.sessionId;

    // Send proctoring:event over WebSocket
    const proctoringAckPromise = waitForEvent(ws, 'proctoring:ack');
    ws.send(JSON.stringify({
      event: 'proctoring:event',
      sessionId: activeSessionId,
      data: {
        eventType: 'TAB_HIDDEN',
        timestamp: new Date().toISOString(),
        details: { visibilityState: 'hidden' }
      }
    }));

    const ackEvt = await proctoringAckPromise;
    assert(ackEvt.event === 'proctoring:ack', 'Received proctoring:ack from WebSocket gateway');
    assert(ackEvt.data.eventType === 'TAB_HIDDEN', 'Acknowledged TAB_HIDDEN observation');

    ws.close();

    // ----------------------------------------------------
    // TEST 8: Async Interview Regression
    // ----------------------------------------------------
    console.log('\n--- Test 8: Async Interview Regression ---');
    const asyncGetRes = await fetch(`${baseUrl}/interviews/${testAsyncInterviewId}`);
    const asyncGetData = await asyncGetRes.json();
    assert(asyncGetRes.status === 200, 'Async interview retrieved normally');
    assert(asyncGetData.data.type === 'async', 'Async interview type preserved');

    console.log('\n\x1b[32m✔ ALL SPRINT 10 RECORDING & PROCTORING TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
  } finally {
    // Database cleanup
    console.log('Cleaning up test records...');
    try {
      if (testInterviewId) {
        await deleteInterviewById(testInterviewId);
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

runSprint10Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✖ SPRINT 10 TEST SUITE FAILURE:', err);
    process.exit(1);
  });
