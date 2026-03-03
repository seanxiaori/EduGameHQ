import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const games = [
  'tic-tac-toe',
  'connect-four',
  'memory-game',
  'whack-a-mole',
  'frogger',
  'space-invaders',
  'breakout',
  'jsCheckersAI',
  'guess-capitals',
  'memory-match',
  'calculator-zx',
  'text-adventure',
  'mindplay',
  'beat-maker',
  'puzzle-numbers',
  'crack-code',
  'js-quiz',
  'borders-quiz'
];

const GAMES_BASE_URL = 'https://games.edugamehq.com/games';
const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureScreenshot(browser, slug) {
  const page = await browser.newPage();
  const url = `${GAMES_BASE_URL}/${slug}/`;

  try {
    console.log(`Capturing: ${slug}`);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const outputPath = path.join(OUTPUT_DIR, slug, 'screenshot.png');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`  Saved: ${outputPath}`);
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
