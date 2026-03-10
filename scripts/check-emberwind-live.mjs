#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

console.log('🔍 访问 emberwind 游戏页面...');
await page.goto('https://www.edugamehq.com/games/emberwind/', { waitUntil: 'domcontentloaded', timeout: 30000 });

await page.waitForTimeout(5000);

// 检查iframe是否存在
const iframe = await page.$('iframe.game-iframe');
if (iframe) {
  console.log('✅ 找到游戏iframe');
  const src = await iframe.getAttribute('src');
  console.log('iframe src:', src);
} else {
  console.log('❌ 未找到游戏iframe');
}

// 等待用户观察
console.log('等待15秒，请观察浏览器...');
await page.waitForTimeout(15000);

await browser.close();
