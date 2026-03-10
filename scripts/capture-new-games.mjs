#!/usr/bin/env node
import { chromium } from 'playwright';

const games = [
  { slug: 'hextris', url: 'https://hextris.io', wait: 3000 },
  { slug: 'anti-pacman', url: 'https://vmikhav.github.io/AntiPacMan/', wait: 4000 },
  { slug: 'hua-rong-dao', url: 'https://jeantimex.github.io/hua-rong-dao-html/', wait: 2000 }
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

for (const game of games) {
  console.log(`📸 截取 ${game.slug}...`);
  await page.goto(game.url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(game.wait);
  await page.screenshot({ path: `public/screenshots/${game.slug}.png` });
  console.log(`✅ ${game.slug}.png`);
}

await browser.close();
console.log('✅ 完成');
