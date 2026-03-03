import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const games = [
  { slug: 'wordle', dir: 'wordle' },
  { slug: 'sudoku', dir: 'sudoku' },
  { slug: 'labyrinth', dir: 'labyrinth' },
  { slug: 'checkers-devon', dir: 'checkers-devon' },
  { slug: 'piano-game', dir: 'piano-game' },
  { slug: 'sudoku-game', dir: 'sudoku-game' },
  { slug: 'jsCheckersAI', dir: 'jsCheckersAI' }
];

const GAMES_BASE_URL = 'https://games.edugamehq.com/games';
const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureScreenshot(browser, game) {
  const page = await browser.newPage();
  const url = `${GAMES_BASE_URL}/${game.slug}/`;

  try {
    console.log(`Capturing: ${game.slug}`);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const outputPath = path.join(OUTPUT_DIR, game.dir, 'screenshot.png');
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
  for (const game of games) {
    await captureScreenshot(browser, game);
  }
  await browser.close();
  console.log('Done!');
}

main();
