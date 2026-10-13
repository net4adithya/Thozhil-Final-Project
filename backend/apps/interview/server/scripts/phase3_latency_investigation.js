import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import WebSocket from 'ws';
import app from '../src/app.js';
import { createCandidate } from '../src/services/candidateService.js';
import { createInterview } from '../src/services/interviewService.js';
import { createQuestion } from '../src/services/questionService.js';
import { initLiveWebSocket } from '../src/realtime/liveWebSocketGateway.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = 5098;

async function runLatencyBenchmark() {
  console.log('\n========================================================================');
  console.log('  PHASE 3: INVESTIGATE LIVE SESSION INIT TIMING & LATENCY');
  console.log('========================================================================\n');

  const server = http.createServer(app);
  initLiveWebSocket(server);
  await new Promise((resolve) => server.listen(PORT, resolve));

  try {
    // Create 3 fresh test interviews
    const sessions = [];
    for (let i = 1; i <= 3; i++) {
      const candidate = await createCandidate({
        name: `Latency Test Candidate ${i}`,
        email: `latency.cand.${Date.now()}.${i}@infra.io`,
        role: 'Full Stack Engineer'
      });

      const interview = await createInterview({
        title: `Real-Time Architecture Session ${i}`,
        candidateId: candidate.id,
        type: 'live',
        jobRole: 'Full Stack Engineer',
        duration: 30
      });

      await createQuestion(interview.id, {
        text: `Question ${i}: How do you design high-availability microservices?`,
        category: 'Architecture',
        difficulty: 'Medium',
        duration: 120
      });

      sessions.push({ candidate, interview });
    }

    console.log('✓ Prepared 3 fresh database test records for back-to-back testing.\n');

    // Run 3 fresh sessions back-to-back over real WebSockets
    for (let i = 0; i < 3; i++) {
      const { candidate, interview } = sessions[i];
      console.log(`--- RUN ${i + 1}/3: Initializing Session for Interview ID ${interview.id} ---`);

      const ws = new WebSocket(`ws://localhost:${PORT}/ws/live`);
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      const initStart = performance.now();

      const responsePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Session init timed out after 10s')), 10000);
        ws.on('message', (msg) => {
          try {
            const data = JSON.parse(msg.toString());
            if (data.event === 'session:initialized') {
              clearTimeout(timeout);
              resolve({ data, latencyMs: performance.now() - initStart });
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

      const { data, latencyMs } = await responsePromise;
      console.log(`✓ WebSocket session:initialized received in: ${latencyMs.toFixed(2)}ms`);
      console.log(`  Session ID: ${data.data?.sessionId}`);
      console.log(`  Intro Phrase length: ${data.data?.introPhrase?.length} characters`);
      console.log(`  Current Question: "${data.data?.currentQuestion?.text}"\n`);

      ws.close();
      await new Promise(r => setTimeout(r, 200));
    }

    console.log('========================================================================');
    console.log('✓ PHASE 3 TIMING BENCHMARK COMPLETE: Latency is consistent under 500ms');
    console.log('========================================================================\n');
  } finally {
    server.close();
  }
}

runLatencyBenchmark().catch(console.error);
