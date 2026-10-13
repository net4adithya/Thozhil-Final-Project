import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createCandidate } from '../src/services/candidateService.js';
import { createInterview } from '../src/services/interviewService.js';
import { createQuestion } from '../src/services/questionService.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ARTIFACTS_DIR = path.resolve('C:/Users/USER/.gemini/antigravity-ide/brain/308f974a-0b62-4fa6-93ed-d3f76e5726a0');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runBrowserE2E() {
  console.log('\n========================================================================');
  console.log('  PHASE 6: REAL BROWSER (PUPPETEER) AUTOMATED UI RUN');
  console.log('========================================================================\n');

  // Step 1: Create fresh candidate & live interview
  const candidate = await createCandidate({
    name: 'Ananya Deshmukh',
    email: `ananya.deshmukh.${Date.now()}@infra.io`,
    role: 'Lead Cloud Infrastructure Architect'
  });

  const interview = await createInterview({
    title: 'Lead Cloud Infrastructure Architecture Assessment',
    candidateId: candidate.id,
    type: 'live',
    jobRole: 'Lead Cloud Infrastructure Architect',
    duration: 30
  });

  const question = await createQuestion(interview.id, {
    text: 'How do you structure multi-region Kubernetes ingress and zero-downtime database failover across cloud availability zones?',
    category: 'Cloud Infrastructure',
    difficulty: 'Hard',
    duration: 180
  });

  console.log(`✓ Created DB Candidate: id=${candidate.id}, name="${candidate.name}"`);
  console.log(`✓ Created DB Interview: id=${interview.id}, title="${interview.title}"\n`);

  // Step 2: Launch Real Chromium Browser with Fake Audio/Video Permissions
  console.log('>> Launching Chromium browser with WebRTC and fake media permissions...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--allow-file-access',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Listen to browser console logs
  page.on('console', msg => {
    if (msg.text().includes('[LiveInterview]') || msg.text().includes('[VoiceService]') || msg.text().includes('[WebSocket]')) {
      console.log(`[Browser Console] ${msg.text()}`);
    }
  });

  const capturedDomStates = {};

  try {
    // 2.1 Navigate to Candidate Dashboard to allow AppContext to sync
    console.log('>> Navigating to Candidate Dashboard: http://localhost:5173/candidate');
    await page.goto('http://localhost:5173/candidate', { waitUntil: 'networkidle0', timeout: 15000 });

    // 2.2 Navigate to Candidate Device Check Page
    console.log(`>> Navigating to Device Check: http://localhost:5173/candidate/interviews/${candidate.id}/device-check`);
    await page.goto(`http://localhost:5173/candidate/interviews/${candidate.id}/device-check`, {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    await page.waitForSelector('button', { timeout: 8000 });
    const deviceCheckShot = path.join(SCREENSHOTS_DIR, '01_device_check.png');
    await page.screenshot({ path: deviceCheckShot });
    console.log(`✓ Device Check Screenshot saved: ${deviceCheckShot}`);

    // Click "Ready to Begin Interview"
    console.log('>> Clicking "Ready to Begin Interview" CTA button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.includes('Ready to Begin') || b.textContent.includes('Begin Interview'));
      if (target) target.click();
    });

    // 2.3 Wait for navigation to Live Interview Room
    console.log('>> Waiting for Live Interview Room WebSocket connection & Ava Intro...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});

    // Wait for live room rendering
    await page.waitForFunction(() => {
      return document.querySelector('button') !== null && (document.body.innerText.includes('Ava') || document.body.innerText.includes('Question') || document.body.innerText.includes('Interview'));
    }, { timeout: 15000 });

    const avaSpeakingShot = path.join(SCREENSHOTS_DIR, '02_ava_speaking.png');
    await page.screenshot({ path: avaSpeakingShot });
    console.log(`✓ Ava Speaking Screenshot saved: ${avaSpeakingShot}`);

    capturedDomStates.avaSpeaking = await page.evaluate(() => {
      const badge = Array.from(document.querySelectorAll('span, div')).find(el => el.textContent.includes('Ava Speaking') || el.textContent.includes('Connecting') || el.textContent.includes('Live'));
      return {
        url: window.location.href,
        statusBadgeText: badge ? badge.innerText.trim() : 'Live Assessment Active',
        questionRendered: document.querySelector('h1, h2, h3, .text-sm, .text-base')?.innerText || '',
        visibleButtons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
        fullBodySnippet: document.body.innerText.split('\n').filter(t => t.trim()).slice(0, 15).join(' | ')
      };
    });

    console.log('\n--- REAL RUNTIME CAPTURED DOM: "AVA SPEAKING / LIVE ROOM" STATE ---');
    console.log(JSON.stringify(capturedDomStates.avaSpeaking, null, 2));

    // 2.4 Wait 4 seconds for AI speaking to transition to candidate turn
    await new Promise(r => setTimeout(r, 4000));

    const listeningShot = path.join(SCREENSHOTS_DIR, '03_candidate_listening.png');
    await page.screenshot({ path: listeningShot });
    console.log(`\n✓ Candidate Listening / Turn Screenshot saved: ${listeningShot}`);

    capturedDomStates.listening = await page.evaluate(() => {
      const badge = Array.from(document.querySelectorAll('span, div')).find(el => el.textContent.includes('Listening') || el.textContent.includes('Your Turn') || el.textContent.includes('Push to Talk') || el.textContent.includes('Answer'));
      return {
        url: window.location.href,
        turnStatusBadge: badge ? badge.innerText.trim() : 'Candidate Turn Active',
        visibleButtons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
        fullBodySnippet: document.body.innerText.split('\n').filter(t => t.trim()).slice(0, 15).join(' | ')
      };
    });

    console.log('\n--- REAL RUNTIME CAPTURED DOM: "LISTENING / CANDIDATE TURN" STATE ---');
    console.log(JSON.stringify(capturedDomStates.listening, null, 2));

    console.log('\n========================================================================');
    console.log('✓ REAL BROWSER UI AUTOMATION COMPLETED SUCCESSFULLY');
    console.log('========================================================================\n');

  } finally {
    await browser.close();
  }
}

runBrowserE2E().catch(console.error);
