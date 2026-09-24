import http from 'http';
import app from '../src/app.js';
import { createCandidate, deleteCandidateById } from '../src/services/candidateService.js';
import { createInterview, deleteInterviewById, updateInterviewById } from '../src/services/interviewService.js';

let server;
const testPort = 5007;
const baseUrl = `http://localhost:${testPort}/api`;

function assert(condition, message) {
  if (!condition) {
    console.error(`\x1b[31m✖ [FAIL] Assertion Failed: ${message}\x1b[0m`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`\x1b[32m ✓ [PASS] ${message}\x1b[0m`);
}

async function runSecurityAndScopingTests() {
  console.log('\n=== Commencing Master Production Security & Scoping Audit Test ===\n');

  const httpServer = http.createServer(app);
  await new Promise((resolve) => {
    server = httpServer.listen(testPort, () => {
      console.log(`Security test server listening on port ${testPort}`);
      resolve();
    });
  });

  let candA = null;
  let candB = null;
  let intA = null;
  let intB = null;

  try {
    // 1. Create two separate candidates: Candidate A (Alexander) and Candidate B (Bianca)
    candA = await createCandidate({
      name: 'Alexander Test',
      email: `alex_${Date.now()}@example.com`,
      role: 'Frontend Architect'
    });
    console.log(`Created Candidate A (Alexander): ${candA.id}`);

    candB = await createCandidate({
      name: 'Bianca Test',
      email: `bianca_${Date.now()}@example.com`,
      role: 'Backend Architect'
    });
    console.log(`Created Candidate B (Bianca): ${candB.id}`);

    // 2. Create Interview A assigned to Candidate A
    intA = await createInterview({
      title: 'Alexander Senior Frontend Track',
      jobRole: 'Frontend Architect',
      type: 'async',
      candidateId: candA.id,
      questions: [{ id: 'q1', text: 'Explain React Concurrent Mode', category: 'Technical' }]
    });
    console.log(`Created Interview A: ${intA.id} assigned to ${candA.id}`);

    // 3. Create Interview B assigned to Candidate B
    intB = await createInterview({
      title: 'Bianca Senior Backend Track',
      jobRole: 'Backend Architect',
      type: 'async',
      candidateId: candB.id,
      questions: [{ id: 'q2', text: 'Explain Distributed Transactions', category: 'Technical' }]
    });
    console.log(`Created Interview B: ${intB.id} assigned to ${candB.id}`);

    // Test 1: Candidate A listing interviews with X-User-Role: candidate & X-Candidate-Id: candA.id
    console.log('\n--- Test 1: Candidate A Scoping Isolation ---');
    const resA = await fetch(`${baseUrl}/interviews`, {
      headers: {
        'x-user-role': 'candidate',
        'x-candidate-id': candA.id
      }
    });
    const dataA = await resA.json();
    assert(resA.status === 200, 'Candidate A list request returns 200 OK');
    assert(Array.isArray(dataA.data), 'Candidate A data is an array');
    
    // Ensure Interview B is NOT in Candidate A's results
    const hasIntB = dataA.data.some((i) => i.id === intB.id);
    assert(!hasIntB, 'Data Leakage Prevented: Candidate A CANNOT see Candidate B interview');
    
    const hasIntA = dataA.data.some((i) => i.id === intA.id);
    assert(hasIntA, 'Candidate A correctly receives their assigned Interview A');

    // Test 2: Candidate A trying to access Candidate B profile directly -> Expect 403 Forbidden
    console.log('\n--- Test 2: Cross-Candidate Profile Access Block ---');
    const crossProfileRes = await fetch(`${baseUrl}/candidates/${candB.id}`, {
      headers: {
        'x-user-role': 'candidate',
        'x-candidate-id': candA.id
      }
    });
    assert(crossProfileRes.status === 403, 'Cross-candidate access blocked with 403 Forbidden');

    // Test 3: Candidate A trying to access Interview B directly -> Expect 403 Forbidden
    console.log('\n--- Test 3: Cross-Candidate Interview Access Block ---');
    const crossIntRes = await fetch(`${baseUrl}/interviews/${intB.id}`, {
      headers: {
        'x-user-role': 'candidate',
        'x-candidate-id': candA.id
      }
    });
    assert(crossIntRes.status === 403, 'Unassigned interview access blocked with 403 Forbidden');

    // Test 4: Lifecycle Lock on Completed Interview
    console.log('\n--- Test 4: Lifecycle Protection on Completed Assessment ---');
    // Mark Interview A as Completed
    await updateInterviewById(intA.id, { status: 'Completed' });

    // Attempting to modify questions on Completed assessment -> Expect 400 Bad Request
    let lifecycleErrorCaught = false;
    try {
      await updateInterviewById(intA.id, {
        questions: [{ id: 'q99', text: 'Tampered question', category: 'Cheating' }]
      });
    } catch (err) {
      lifecycleErrorCaught = true;
      assert(err.statusCode === 400, 'Lifecycle protection threw 400 when updating completed interview questions');
    }
    assert(lifecycleErrorCaught, 'Tampering with completed interview questions was blocked');

    // Test 5: Recruiter retains complete administrative access
    console.log('\n--- Test 5: Recruiter Administrative Access ---');
    const recruiterListRes = await fetch(`${baseUrl}/interviews`, {
      headers: {
        'x-user-role': 'recruiter'
      }
    });
    const recruiterData = await recruiterListRes.json();
    assert(recruiterListRes.status === 200, 'Recruiter receives 200 OK');
    const recruiterHasA = recruiterData.data.some((i) => i.id === intA.id);
    const recruiterHasB = recruiterData.data.some((i) => i.id === intB.id);
    assert(recruiterHasA && recruiterHasB, 'Recruiter has administrative visibility over all assessments');

    console.log('\n✔ ALL SECURITY & SCOPING TESTS PASSED PERFECTLY!\n');
  } finally {
    console.log('Cleaning up test data...');
    if (intA?.id) await deleteInterviewById(intA.id).catch(() => {});
    if (intB?.id) await deleteInterviewById(intB.id).catch(() => {});
    if (candA?.id) await deleteCandidateById(candA.id).catch(() => {});
    if (candB?.id) await deleteCandidateById(candB.id).catch(() => {});
    if (server) server.close();
  }
}

runSecurityAndScopingTests().catch((err) => {
  console.error('Test error:', err);
  if (server) server.close();
  process.exit(1);
});
