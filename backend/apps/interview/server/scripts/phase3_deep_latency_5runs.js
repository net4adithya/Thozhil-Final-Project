import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import WebSocket from 'ws';
import app from '../src/app.js';
import { createCandidate, getCandidateById } from '../src/services/candidateService.js';
import { createInterview, getInterviewById } from '../src/services/interviewService.js';
import { createQuestion, getQuestionsByInterviewId } from '../src/services/questionService.js';
import { initLiveWebSocket } from '../src/realtime/liveWebSocketGateway.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = 5097;

async function runDetailedLatencyInvestigation() {
  console.log('\n========================================================================');
  console.log('  PHASE 3 DEEP DIVE: 5 CONSECUTIVE LIVE SESSION BENCHMARK RUNS');
  console.log('========================================================================\n');

  const server = http.createServer(app);
  initLiveWebSocket(server);
  await new Promise(r => server.listen(PORT, r));

  try {
    // 1. Prepare 5 fresh candidate + interview records
    console.log('>> Creating 5 fresh test candidate and interview database records...');
    const testData = [];
    for (let i = 1; i <= 5; i++) {
      const candidate = await createCandidate({
        name: `Latency DeepDive Candidate ${i}`,
        email: `latency.deepdive.${Date.now()}.${i}@infra.io`,
        role: 'Distributed Systems Engineer'
      });

      const interview = await createInterview({
        title: `Live Session Latency Benchmark ${i}`,
        candidateId: candidate.id,
        type: 'live',
        jobRole: 'Distributed Systems Engineer',
        duration: 30
      });

      await createQuestion(interview.id, {
        text: `Question ${i}: How do you design consistent hashing and partition rebalancing in distributed storage systems?`,
        category: 'Architecture',
        difficulty: 'Hard',
        duration: 180
      });

      testData.push({ candidate, interview });
    }
    console.log('✓ 5 Test records ready in database.\n');

    // 2. Measure isolated individual query times vs parallelized WebSocket init
    const runResults = [];

    for (let i = 0; i < 5; i++) {
      const { candidate, interview } = testData[i];
      console.log(`------------------------------------------------------------------------`);
      console.log(`RUN ${i + 1} OF 5 (Interview ID: ${interview.id})`);
      console.log(`------------------------------------------------------------------------`);

      // Micro-benchmarking individual queries
      const t1 = performance.now();
      await getInterviewById(interview.id);
      const interviewQueryMs = performance.now() - t1;

      const t2 = performance.now();
      await getCandidateById(candidate.id);
      const candidateQueryMs = performance.now() - t2;

      const t3 = performance.now();
      await getQuestionsByInterviewId(interview.id);
      const questionsQueryMs = performance.now() - t3;

      console.log(`[Individual Query Breakdown]:`);
      console.log(`  - getInterviewById:          ${interviewQueryMs.toFixed(2)}ms`);
      console.log(`  - getCandidateById:          ${candidateQueryMs.toFixed(2)}ms`);
      console.log(`  - getQuestionsByInterviewId: ${questionsQueryMs.toFixed(2)}ms`);
      console.log(`  - Sequential Total:          ${(interviewQueryMs + candidateQueryMs + questionsQueryMs).toFixed(2)}ms`);

      // Live WebSocket session:init measurement (using parallel Promise.all in liveSessionManager)
      const ws = new WebSocket(`ws://localhost:${PORT}/ws/live`);
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      const wsStart = performance.now();
      const wsResponsePromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('WS init timeout')), 10000);
        ws.on('message', (msg) => {
          try {
            const data = JSON.parse(msg.toString());
            if (data.event === 'session:initialized') {
              clearTimeout(timer);
              resolve({
                latencyMs: performance.now() - wsStart,
                sessionId: data.data?.sessionId
              });
            }
          } catch (e) {}
        });
      });

      ws.send(JSON.stringify({
        event: 'session:init',
        data: {
          interviewId: interview.id,
          candidateId: candidate.id
        }
      }));

      const wsOutcome = await wsResponsePromise;
      console.log(`[Parallelized WebSocket init]:`);
      console.log(`  ✓ Total session:initialized received in: ${wsOutcome.latencyMs.toFixed(2)}ms (Session: ${wsOutcome.sessionId})\n`);

      ws.close();
      runResults.push({
        run: i + 1,
        interviewQueryMs,
        candidateQueryMs,
        questionsQueryMs,
        sequentialMs: interviewQueryMs + candidateQueryMs + questionsQueryMs,
        wsLatencyMs: wsOutcome.latencyMs
      });

      await new Promise(r => setTimeout(r, 400));
    }

    console.log('========================================================================');
    console.log('  5-RUN LATENCY SUMMARY TABLE');
    console.log('========================================================================');
    console.table(runResults.map(r => ({
      'Run #': r.run,
      'Interview Query (ms)': r.interviewQueryMs.toFixed(1),
      'Candidate Query (ms)': r.candidateQueryMs.toFixed(1),
      'Questions Query (ms)': r.questionsQueryMs.toFixed(1),
      'Sequential Total (ms)': r.sequentialMs.toFixed(1),
      'Parallel WS Total (ms)': r.wsLatencyMs.toFixed(1)
    })));

    const avgLatency = runResults.reduce((acc, r) => acc + r.wsLatencyMs, 0) / 5;
    const minLatency = Math.min(...runResults.map(r => r.wsLatencyMs));
    const maxLatency = Math.max(...runResults.map(r => r.wsLatencyMs));
    console.log(`\nLatency Statistics across 5 runs:`);
    console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
    console.log(`  Min:     ${minLatency.toFixed(2)}ms`);
    console.log(`  Max:     ${maxLatency.toFixed(2)}ms\n`);

  } finally {
    server.close();
  }
}

runDetailedLatencyInvestigation().catch(console.error);
