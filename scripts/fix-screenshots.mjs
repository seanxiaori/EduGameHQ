import { chromium } from 'playwright';
import path from 'path';

const games = [
  'tic-tac-toe',
  'space-invaders',
  'wordle',
  'sudoku'
];

const GAMES_BASE_URL = 'https://games.edugamehq.com/games';
const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureScreenshot(browser, slug) {
  const page = await browser.newPage();
  const url = `${GAMES_BASE_URL}/${slug}/`;

  try {
    console.log(`Capturing: ${slug}`);
    await page.setViewportSize({ width: 1200, height: 800 });

    // Navigate and wait for full load
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for canvas or game elements
    await page.waitForTimeout(8000);

    const outputPath = path.join(OUTPUT_DIR, slug, 'screenshot.png');
    await page.screenshot({ path: outputPath, type: 'png', fullPage: false });

    const fs = await import('fs');
    const stats = fs.statSync(outputPath);
    console.log(`  Saved: ${outputPath} (${stats.size} bytes)`);

    return true;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return false;
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const slug of games) {
    await captureScreenshot(browser, slug);
  }
  await browser.close();
  console.log('Done!');
}

main();
