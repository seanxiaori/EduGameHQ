import { chromium } from 'playwright';
import path from 'path';

const games = [
  { slug: 'tic-tac-toe', dir: 'tic-tac-toe' },
  { slug: 'space-invaders', dir: 'space-invaders' },
  { slug: 'wordle', dir: 'wordle' },
  { slug: 'sudoku', dir: 'sudoku' }
];

const GAMES_BASE_URL = 'https://games.edugamehq.com/games';
const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureScreenshot(browser, game) {
  const page = await browser.newPage();
  const url = `${GAMES_BASE_URL}/${game.slug}/`;

  try {
    console.log(`Capturing: ${game.slug} from ${url}`);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // Wait longer for game to fully render
    await page.waitForTimeout(5000);

    // Try to click start button if exists
    try {
      const startBtn = await page.$('button, .start, #start, [class*="start"]');
      if (startBtn) await startBtn.click();
      await page.waitForTimeout(2000);
    } catch (e) {}

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
