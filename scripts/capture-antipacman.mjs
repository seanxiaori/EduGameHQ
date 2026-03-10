#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

try {
  await page.goto('https://vmikhav.github.io/AntiPacMan/', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'public/screenshots/anti-pacman.png' });
  console.log('✅ anti-pacman.png');
} catch (e) {
  console.log('❌ 失败，使用备用方案');
  // 创建一个简单的占位图
  await page.setContent('<div style="width:800px;height:600px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:48px;">Anti PacMan</div>');
  await page.screenshot({ path: 'public/screenshots/anti-pacman.png' });
}

await browser.close();
