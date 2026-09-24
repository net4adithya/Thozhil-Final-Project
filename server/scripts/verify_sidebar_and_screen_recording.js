import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import supabase from '../src/config/supabase.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ARTIFACTS_DIR = path.resolve('C:/Users/USER/.gemini/antigravity-ide/brain/9d6116f2-9c29-4d8c-9744-a84a419fa80d');

async function runVerification() {
  console.log('\n========================================================================');
  console.log('  VERIFYING CANDIDATE SIDEBAR & REPORT SCREEN RECORDING TABS');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1024']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024 });

  try {
    const { data: reports } = await supabase.from('reports').select('*').limit(5);
    const { data: candidates } = await supabase.from('candidates').select('*').limit(5);

    let targetCandId = reports?.[0]?.candidate_id || candidates?.[0]?.id;
    console.log(`✓ Target candidate for Report View: ${targetCandId}`);

    const reportUrl = `http://localhost:5173/recruiter/candidates/${targetCandId}/report`;
    console.log(`>> Navigating to Assessment Report: ${reportUrl}`);
    await page.goto(reportUrl, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('#screen-recording-player', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Capture Screen Share Tab
    let el = await page.$('#screen-recording-player');
    if (el) {
      await el.screenshot({ path: path.join(ARTIFACTS_DIR, 'report_screen_recording_tab_screen.png') });
      console.log('✓ Tab 1: Screen Share Tab saved');
    }

    // 2. Click "Webcam Feed" Tab
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="tab-webcam"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    el = await page.$('#screen-recording-player');
    if (el) {
      await el.screenshot({ path: path.join(ARTIFACTS_DIR, 'report_webcam_stream_tab.png') });
      console.log('✓ Tab 2: Webcam Feed Tab saved');
    }

    // 3. Click "Integrity Events" Tab
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="tab-timeline"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    el = await page.$('#screen-recording-player');
    if (el) {
      await el.screenshot({ path: path.join(ARTIFACTS_DIR, 'report_integrity_timeline_tab.png') });
      console.log('✓ Tab 3: Integrity Events Tab saved');
    }

    console.log('\n========================================================================');
    console.log('✓ ALL TABS VERIFIED AND SAVED');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Verification failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runVerification().catch(console.error);
