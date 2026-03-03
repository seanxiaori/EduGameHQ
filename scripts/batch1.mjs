import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const games = [
  'flags-quiz', 'othello', 'simon-game', 'simon-says', 'hangman',
  'maze-game', 'sliding-puzzle', 'typing-test', 'rgb-game',
  'rock-paper-scissors', 'snake-classic', 'number-guess'
];

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function capture(browser, slug) {
  const page = await browser.newPage();
  try {
    console.log(`Capturing: ${slug}`);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`https://games.edugamehq.com/games/${slug}/`, {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(3000);
    const out = path.join(OUTPUT_DIR, slug, 'screenshot.png');
    await page.screenshot({ path: out });
    console.log(`  OK: ${fs.statSync(out).size} bytes`);
  } catch (e) { console.error(`  Error: ${e.message}`); }
  finally { await page.close(); }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const g of games) { await capture(browser, g); }
  await browser.close();
}

main();
