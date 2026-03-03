import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const games = [
  'wordle',
  'pong-jake',
  'endless-runner',
  'breakout',
  'text-adventure'
];

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function capture(browser, slug) {
  const page = await browser.newPage();
  try {
    console.log(`Capturing: ${slug}`);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`https://games.edugamehq.com/games/${slug}/`, {
      waitUntil: 'networkidle', timeout: 60000
    });
    await page.waitForTimeout(5000);

    // Try clicking start button if exists
    try {
      const btn = await page.$('button, .start, #start, [class*="start"], [class*="play"]');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(2000);
      }
    } catch(e) {}

    const out = path.join(OUTPUT_DIR, slug, 'screenshot.png');
    await page.screenshot({ path: out });
    const size = fs.statSync(out).size;
    console.log(`  OK: ${size} bytes`);
  } catch (e) {
    console.error(`  Error: ${e.message}`);
  }
  finally { await page.close(); }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const g of games) {
    await capture(browser, g);
  }
  await browser.close();
}

main();
