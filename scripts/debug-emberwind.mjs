#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

console.log('🔍 检查 emberwind 游戏...');
await page.goto('https://games.edugamehq.com/games/emberwind/', { waitUntil: 'domcontentloaded', timeout: 30000 });

await page.waitForTimeout(5000);

// 检查控制台错误
page.on('console', msg => console.log('Console:', msg.text()));
page.on('pageerror', err => console.log('Error:', err.message));

// 截图看看
await page.screenshot({ path: 'emberwind-debug.png' });
console.log('✅ 截图保存到 emberwind-debug.png');

await page.waitForTimeout(10000);
await browser.close();
