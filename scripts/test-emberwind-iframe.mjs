#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

console.log('🔍 测试 emberwind 在 iframe 中的表现...');

// 创建一个测试页面，包含iframe
const testHtml = `
<!DOCTYPE html>
<html>
<body>
  <iframe src="https://games.edugamehq.com/games/emberwind/"
          width="1200" height="700"
          style="border:none;"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation">
  </iframe>
</body>
</html>
`;

await page.setContent(testHtml);
await page.waitForTimeout(8000);

// 截图
await page.screenshot({ path: 'emberwind-iframe-test.png' });
console.log('✅ 截图: emberwind-iframe-test.png');

// 检查iframe内容
const frame = page.frameLocator('iframe');
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

console.log('错误:', errors.length > 0 ? errors : '无');

await browser.close();
