import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import supabase from '../src/config/supabase.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ARTIFACTS_DIR = path.resolve('C:/Users/USER/.gemini/antigravity-ide/brain/308f974a-0b62-4fa6-93ed-d3f76e5726a0');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runReportScreenshot() {
  console.log('\n========================================================================');
  console.log('  SCREEN 2: REAL BROWSER REPORT VIEW VERIFICATION');
  console.log('========================================================================\n');

  // Fetch an existing candidate with a completed report
  const { data: reports } = await supabase.from('reports').select('*').limit(1);
  if (!reports || reports.length === 0) {
    throw new Error('No reports found in Supabase database');
  }

  const candidateId = reports[0].candidate_id;
  console.log(`✓ Testing Candidate Report for ID: ${candidateId} (Overall Score: ${reports[0].overall_score}%)`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024 });

  try {
    // 1. Visit Candidates list to initialize AppContext
    console.log('>> Visiting Candidates List: http://localhost:5173/recruiter/candidates');
    await page.goto('http://localhost:5173/recruiter/candidates', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    // 2. Direct Navigation to Candidate Report
    const reportUrl = `http://localhost:5173/recruiter/candidates/${candidateId}/report`;
    console.log(`>> Navigating to Report View: ${reportUrl}`);
    await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for report content to render
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Overall Fit Rating') || document.body.innerText.includes('Key Strengths') || document.body.innerText.includes('Technical Depth') || document.body.innerText.includes('Fit Rating');
    }, { timeout: 15000 });

    const reportScreenshotPath = path.join(SCREENSHOTS_DIR, '04_candidate_report_redesign.png');
    await page.screenshot({ path: reportScreenshotPath, fullPage: true });
    console.log(`✓ Full-page Candidate Report Screenshot saved: ${reportScreenshotPath}`);

    const capturedDom = await page.evaluate(() => {
      return {
        url: window.location.href,
        candidateName: document.querySelector('h1')?.innerText || '',
        recommendationBadge: Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('Hire') || s.innerText.includes('HIRE'))?.innerText || '',
        overallScoreText: Array.from(document.querySelectorAll('.text-4xl')).map(el => el.innerText).join(' ') || '',
        breakdownCards: Array.from(document.querySelectorAll('.grid-cols-2 .bg-white')).map(el => el.innerText.split('\n').join(' - ')),
        strengthsSection: Array.from(document.querySelectorAll('li')).slice(0, 3).map(el => el.innerText.trim()),
        bodySnippet: document.body.innerText.split('\n').filter(t => t.trim()).slice(0, 16).join(' | ')
      };
    });

    console.log('\n--- REAL CAPTURED REPORT DOM SNAPSHOT ---');
    console.log(JSON.stringify(capturedDom, null, 2));

    console.log('\n========================================================================');
    console.log('✓ SCREEN 2 CANDIDATE REPORT VERIFICATION SUCCESSFUL');
    console.log('========================================================================\n');

  } finally {
    await browser.close();
  }
}

runReportScreenshot().catch(console.error);
