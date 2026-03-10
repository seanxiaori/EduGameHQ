#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';

const games = JSON.parse(fs.readFileSync('output/quality-report.json'));
const goodGames = [...games.excellent, ...games.good, ...games.acceptable];

console.log('📸 截取游戏画面...\n');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

fs.mkdirSync('public/screenshots', { recursive: true });

for (const game of goodGames) {
  console.log(`截取: ${game.name}`);

  try {
    await page.goto(game.homepage, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 尝试点击开始按钮
    const startBtn = await page.$('button, .start, #start, [class*="play"]');
    if (startBtn) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }

    const slug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await page.screenshot({ path: `public/screenshots/${slug}.png` });
    console.log(`  ✅ ${slug}.png`);
  } catch (e) {
    console.log(`  ❌ 失败: ${e.message}`);
  }
}

await browser.close();
console.log('\n✅ 截图完成');
