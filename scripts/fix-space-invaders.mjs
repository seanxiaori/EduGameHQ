import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureSpaceInvaders(browser) {
  const page = await browser.newPage();
  try {
    console.log('Capturing: space-invaders');
    await page.setViewportSize({ width: 500, height: 500 });
    await page.goto('https://games.edugamehq.com/games/space-invaders/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Wait for grid to have children
    await page.waitForSelector('.grid div', { timeout: 5000 });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'space-invaders/screenshot.png') });
    console.log('  Done');
  } catch (e) { console.error('  Error:', e.message); }
  finally { await page.close(); }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  await captureSpaceInvaders(browser);
  await browser.close();

  const p = path.join(OUTPUT_DIR, 'space-invaders/screenshot.png');
  const s = fs.statSync(p);
  console.log(`space-invaders: ${s.size} bytes`);
}

main();
