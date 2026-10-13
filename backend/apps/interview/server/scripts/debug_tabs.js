import puppeteer from 'puppeteer';
import path from 'path';
import dotenv from 'dotenv';
import supabase from '../src/config/supabase.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugTabs() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const { data: reports } = await supabase.from('reports').select('*').limit(1);
  const candId = reports[0].candidate_id;

  await page.goto(`http://localhost:5173/recruiter/candidates/${candId}/report`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#screen-recording-player');

  console.log('1. Clicking webcam tab...');
  await page.evaluate(() => {
    document.querySelector('[data-testid="tab-webcam"]')?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await browser.close();
}

debugTabs().catch(console.error);
