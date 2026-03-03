import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureRadiusRaid() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('📸 Capturing: radius-raid');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('https://games.edugamehq.com/games/radius-raid/', {
      waitUntil: 'networkidle', timeout: 60000
    });

    // Wait for game to load
    console.log('  Waiting for game to load...');
    await page.waitForTimeout(4000);

    const outPath = path.join(OUTPUT_DIR, 'radius-raid', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
    await browser.close();
  }
}

captureRadiusRaid();
