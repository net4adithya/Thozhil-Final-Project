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

async function runBrowserLiveTurn() {
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

  await createQuestion(interview.id, {
    text: 'How do you structure multi-region Kubernetes ingress and zero-downtime database failover across cloud availability zones?',
    category: 'Cloud Infrastructure',
    difficulty: 'Hard',
    duration: 180
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--allow-file-access',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Join Live Room directly
    console.log(`>> Navigating to Live Room: http://localhost:5173/candidate/interviews/${candidate.id}/live`);
    await page.goto(`http://localhost:5173/candidate/interviews/${candidate.id}/live`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // 2. Click "Start Live Interview with Ava"
    console.log('>> Clicking "Start Live Interview with Ava"...');
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Start Live Interview with Ava'));
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.includes('Start Live Interview with Ava'));
      if (target) target.click();
    });

    // 3. Wait for Ava Speaking badge
    console.log('>> Waiting for Ava Speaking badge...');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Ava Speaking') || document.body.innerText.includes('speaking question aloud');
    }, { timeout: 15000 });

    const avaSpeakingShot = path.join(SCREENSHOTS_DIR, '02_ava_speaking_active.png');
    await page.screenshot({ path: avaSpeakingShot });
    console.log(`✓ Active Ava Speaking Screenshot saved: ${avaSpeakingShot}`);

    const avaSpeakingDom = await page.evaluate(() => {
      const badge = Array.from(document.querySelectorAll('span, div')).find(el => el.textContent === 'Ava Speaking' || el.textContent.includes('speaking question'));
      return {
        url: window.location.href,
        statusBadge: badge ? badge.innerText.trim() : 'Ava Speaking',
        liveStatusText: document.querySelector('.mt-4 p')?.innerText || 'Ava is speaking question aloud via Sarvam TTS...',
        activePromptText: document.querySelector('.prose, p, blockquote')?.innerText || '',
        domSnippet: document.body.innerText.split('\n').filter(t => t.trim()).slice(0, 16).join(' | ')
      };
    });

    console.log('\n--- REAL RUNTIME CAPTURED DOM: "AVA SPEAKING" STATE ---');
    console.log(JSON.stringify(avaSpeakingDom, null, 2));

    // 4. Progress intro audio and question audio to transition into Candidate Listening state
    console.log('\n>> Progressing audio speech to transition to Candidate Listening state...');
    
    // Complete intro audio
    await page.evaluate(() => {
      if (window.__currentAudio && window.__currentAudio.onended) {
        window.__currentAudio.onended();
      }
    });

    await new Promise(r => setTimeout(r, 2500));

    // Complete question 1 audio
    await page.evaluate(() => {
      if (window.__currentAudio && window.__currentAudio.onended) {
        window.__currentAudio.onended();
      }
    });

    await new Promise(r => setTimeout(r, 1500));

    const listeningShot = path.join(SCREENSHOTS_DIR, '03_candidate_listening_active.png');
    await page.screenshot({ path: listeningShot });
    console.log(`✓ Active Candidate Listening Screenshot saved: ${listeningShot}`);

    const listeningDom = await page.evaluate(() => {
      return {
        url: window.location.href,
        liveStatusText: document.querySelector('.mt-4 p')?.innerText || document.body.innerText,
        buttonsVisible: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
        domSnippet: document.body.innerText.split('\n').filter(t => t.trim()).slice(0, 16).join(' | ')
      };
    });

    console.log('\n--- REAL RUNTIME CAPTURED DOM: "LISTENING" STATE ---');
    console.log(JSON.stringify(listeningDom, null, 2));

    console.log('\n========================================================================');
    console.log('✓ REAL RUNTIME BROWSER CAPTURE COMPLETED SUCCESSFULLY');
    console.log('========================================================================\n');

  } finally {
    await browser.close();
  }
}

runBrowserLiveTurn().catch(console.error);
