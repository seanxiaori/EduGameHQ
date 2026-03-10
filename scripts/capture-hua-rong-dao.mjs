#!/usr/bin/env node
import { chromium } from 'playwright';

const games = [
  { slug: 'hua-rong-dao', url: 'https://jeantimex.github.io/hua-rong-dao-html/', wait: 2000 }
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

for (const game of games) {
  try {
    console.log(`📸 截取 ${game.slug}...`);
    await page.goto(game.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(game.wait);
    await page.screenshot({ path: `public/screenshots/${game.slug}.png` });
    console.log(`✅ ${game.slug}.png`);
  } catch (e) {
    console.log(`❌ ${game.slug} 失败: ${e.message}`);
  }
}

await browser.close();
