import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ARTIFACTS_DIR = path.resolve('C:/Users/USER/.gemini/antigravity-ide/brain/308f974a-0b62-4fa6-93ed-d3f76e5726a0');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function verifyRecruiterDashboard() {
  console.log('\n========================================================================');
  console.log('  SCREEN 2: REAL BROWSER RECRUITER DASHBOARD & LISTS VERIFICATION');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024 });

  const snapshots = {};

  try {
    // 1. Recruiter Overview Dashboard
    console.log('>> 1. Navigating to Dashboard: http://localhost:5173/recruiter');
    await page.goto('http://localhost:5173/recruiter', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.text-4xl').length >= 4, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const dashScreenshot = path.join(SCREENSHOTS_DIR, '05_recruiter_dashboard_overview.png');
    await page.screenshot({ path: dashScreenshot, fullPage: true });
    console.log(`✓ Recruiter Overview Screenshot saved: ${dashScreenshot}`);

    snapshots.dashboard = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.innerText || '';
      const kpiValues = Array.from(document.querySelectorAll('.grid-cols-4 > div, .grid-cols-1 > div.bg-white')).map(el => {
        const lines = el.innerText.split('\n').filter(t => t.trim());
        return { label: lines[0], number: lines[1] };
      });
      const submissions = Array.from(document.querySelectorAll('.divide-y > div')).slice(0, 3).map(el => el.innerText.split('\n').join(' | '));
      return { heading, kpiValues, submissions };
    });

    // 2. Candidates Hub List
    console.log('>> 2. Navigating to Candidates Hub: http://localhost:5173/recruiter/candidates');
    await page.goto('http://localhost:5173/recruiter/candidates', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length > 0, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const candScreenshot = path.join(SCREENSHOTS_DIR, '06_recruiter_candidates_hub.png');
    await page.screenshot({ path: candScreenshot, fullPage: true });
    console.log(`✓ Candidates Hub Screenshot saved: ${candScreenshot}`);

    snapshots.candidates = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.innerText || '';
      const rowCount = document.querySelectorAll('tbody tr').length;
      const sampleRows = Array.from(document.querySelectorAll('tbody tr')).slice(0, 3).map(tr => {
        return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim().replace('\n', ' - ')).join(' | ');
      });
      return { heading, rowCount, sampleRows };
    });

    // 3. Interviews / Hiring Openings List
    console.log('>> 3. Navigating to Hiring Openings: http://localhost:5173/recruiter/interviews');
    await page.goto('http://localhost:5173/recruiter/interviews', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.grid-cols-3 > div').length > 0 || document.body.innerText.includes('Hiring Openings'), { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const intScreenshot = path.join(SCREENSHOTS_DIR, '07_recruiter_hiring_openings.png');
    await page.screenshot({ path: intScreenshot, fullPage: true });
    console.log(`✓ Hiring Openings Screenshot saved: ${intScreenshot}`);

    snapshots.interviews = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.innerText || '';
      const cards = Array.from(document.querySelectorAll('.grid-cols-3 > div')).map(el => {
        return el.innerText.split('\n').filter(t => t.trim()).join(' | ');
      });
      return { heading, openingCards: cards };
    });

    console.log('\n========================================================================');
    console.log('  REAL RUNTIME CAPTURED RECRUITER SUITE DOM SNAPSHOT');
    console.log('========================================================================\n');
    console.log(JSON.stringify(snapshots, null, 2));

  } finally {
    await browser.close();
  }
}

verifyRecruiterDashboard().catch(console.error);
