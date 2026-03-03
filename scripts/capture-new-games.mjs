import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';
const BASE_URL = 'https://games.edugamehq.com/games';

// 需要截图的游戏列表
const GAMES = [
  { slug: 'sokoban', width: 800, height: 600, wait: 2000 },
  { slug: 'solitaire', width: 800, height: 600, wait: 3000 },
  { slug: 'bubble-shooter', width: 600, height: 500, wait: 2000 },
  { slug: 'duckhunt', width: 800, height: 600, wait: 2000 },
  { slug: 'angrybirds', width: 800, height: 600, wait: 3000 },
  { slug: 'polydash', width: 800, height: 600, wait: 2000 },
  { slug: 'galaga', width: 800, height: 600, wait: 2000 },
  { slug: 'space-defender', width: 800, height: 600, wait: 2000 },
  { slug: 'asteroids', width: 800, height: 600, wait: 2000 },
];

async function captureGame(browser, game) {
  const page = await browser.newPage();
  try {
    console.log(`\n📸 Capturing: ${game.slug}`);
    await page.setViewportSize({ width: game.width, height: game.height });

    const url = `${BASE_URL}/${game.slug}/`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(game.wait);

    const outPath = path.join(OUTPUT_DIR, game.slug, 'screenshot.png');
    await page.screenshot({ path: outPath });

    const size = fs.statSync(outPath).size;
    console.log(`  ✅ OK: ${size} bytes -> ${outPath}`);
    return true;
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
    return false;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🎮 Starting game screenshot capture...\n');

  const browser = await chromium.launch({ headless: true });
  let success = 0;
  let failed = 0;

  for (const game of GAMES) {
    const result = await captureGame(browser, game);
    if (result) success++;
    else failed++;
  }

  await browser.close();

  console.log(`\n✨ Done! Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
