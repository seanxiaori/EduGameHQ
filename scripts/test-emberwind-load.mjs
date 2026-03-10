#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

console.log('🔍 访问 emberwind 游戏页面...');
await page.goto('https://www.edugamehq.com/games/emberwind/', { waitUntil: 'domcontentloaded', timeout: 30000 });

await page.waitForTimeout(3000);

// 查找并点击"Start Game"按钮
const startBtn = await page.$('.load-game-btn');
if (startBtn) {
  console.log('✅ 找到Start Game按钮，点击...');
  await startBtn.click();
  await page.waitForTimeout(8000);

  // 检查iframe是否加载
  const iframe = await page.$('iframe.game-iframe');
  const src = await iframe.getAttribute('src');
  console.log('iframe src after click:', src);

  console.log('等待10秒观察游戏加载...');
  await page.waitForTimeout(10000);
} else {
  console.log('❌ 未找到Start Game按钮');
}

await browser.close();
