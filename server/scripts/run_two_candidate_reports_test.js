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

async function verifyTwoReports() {
  const candidatesToTest = [
    { id: '4bb300bf-8e93-40c8-afc6-df207a37fe41', name: 'Alexander Wright' },
    { id: 'b101ece9-92a3-483a-81cd-6a382a86554e', name: 'Meera Nambiar' }
  ];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024 });

  const results = [];

  try {
    for (let i = 0; i < candidatesToTest.length; i++) {
      const c = candidatesToTest[i];
      const reportUrl = `http://localhost:5173/recruiter/candidates/${c.id}/report`;
      console.log(`>> [Candidate ${i + 1}] Navigating to: ${reportUrl}`);
      await page.goto(reportUrl, { waitUntil: 'domcontentloaded' });

      // Wait for AppContext loading spinner to finish and h1 candidate header to render
      await page.waitForFunction(() => {
        return document.querySelector('h1') && document.querySelectorAll('.grid-cols-2 .text-2xl').length >= 4;
      }, { timeout: 20000 });

      await new Promise(r => setTimeout(r, 1000));

      const screenshotPath = path.join(SCREENSHOTS_DIR, `04_report_candidate_${i + 1}_${c.name.toLowerCase().replace(' ', '_')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const domData = await page.evaluate(() => {
        const name = document.querySelector('h1')?.innerText || '';
        const overallFit = Array.from(document.querySelectorAll('.text-4xl')).map(el => el.innerText.trim()).join(' ') || '';
        const recBadge = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('Hire') || s.innerText.includes('HIRE'))?.innerText || '';
        
        // Extract 4 card values
        const breakdownCards = Array.from(document.querySelectorAll('.grid-cols-2 > div')).map(el => {
          const lines = el.innerText.split('\n').filter(t => t.trim());
          return { label: lines[0], value: lines[1] };
        });

        return { 
          name, 
          overallFit, 
          recBadge, 
          breakdownCards 
        };
      });

      results.push({ candidate: c.name, id: c.id, screenshot: screenshotPath, domData });
    }

    console.log('\n========================================================================');
    console.log('  OBSERVED RUNTIME BREAKDOWN VALUES FROM TWO REAL CANDIDATES');
    console.log('========================================================================\n');
    console.log(JSON.stringify(results, null, 2));

  } finally {
    await browser.close();
  }
}

verifyTwoReports().catch(console.error);
