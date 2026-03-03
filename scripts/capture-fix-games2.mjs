import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';
const BASE_URL = 'https://games.edugamehq.com/games';

async function captureTowerBlocks(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: tower-blocks');
    await page.setViewportSize({ width: 400, height: 600 });
    await page.goto(`${BASE_URL}/tower-blocks/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click the game-ready overlay
    try {
      await page.click('.game-ready', { timeout: 5000 });
    } catch (e) {
      await page.keyboard.press('Space');
    }
    await page.waitForTimeout(2000);

    const outPath = path.join(OUTPUT_DIR, 'tower-blocks', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureRadiusRaid(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: radius-raid');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`${BASE_URL}/radius-raid/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click the foreground canvas
    try {
      await page.click('#cfg', { timeout: 5000 });
    } catch (e) {
      await page.keyboard.press('Space');
    }
    await page.waitForTimeout(2000);

    const outPath = path.join(OUTPUT_DIR, 'radius-raid', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🎮 Capturing failed game screenshots...\n');
  const browser = await chromium.launch({ headless: true });

  await captureTowerBlocks(browser);
  await captureRadiusRaid(browser);

  await browser.close();
  console.log('\n✨ Done!');
}

main().catch(console.error);
