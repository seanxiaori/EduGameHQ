#!/usr/bin/env node
import https from 'https';
import http from 'http';
import fs from 'fs';
import { chromium } from 'playwright';

const games = JSON.parse(fs.readFileSync('output/duplicate-check.json')).unique;

console.log('🔍 验证游戏URL...\n');

async function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      const xFrameOptions = res.headers['x-frame-options'];
      const csp = res.headers['content-security-policy'];

      resolve({
        status: res.statusCode,
        accessible: res.statusCode === 200,
        iframeBlocked: xFrameOptions === 'DENY' || xFrameOptions === 'SAMEORIGIN' ||
                      (csp && csp.includes("frame-ancestors 'none'"))
      });
    });

    req.on('error', () => resolve({ status: 0, accessible: false, iframeBlocked: false }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, accessible: false, iframeBlocked: false });
    });
    req.end();
  });
}

async function verifyGameContent(url, browser) {
  const page = await browser.newPage();

  try {
    // 创建一个包含iframe的测试页面
    await page.setContent(`<iframe src="${url}" width="800" height="600"></iframe>`);
    await page.waitForTimeout(5000);

    // 检查iframe是否成功加载
    const iframe = page.frameLocator('iframe');
    const iframeLoaded = await iframe.locator('body').count().catch(() => 0);

    if (iframeLoaded === 0) {
      await page.close();
      return false;
    }

    // 检查iframe内是否有游戏元素
    const hasCanvas = await iframe.locator('canvas').count().catch(() => 0);
    const hasGame = await iframe.locator('#game, .game, [id*="game"]').count().catch(() => 0);

    await page.close();
    return hasCanvas > 0 || hasGame > 0;
  } catch (e) {
    await page.close();
    return false;
  }
}

const results = { passed: [], failed: [] };
const browser = await chromium.launch();

for (const game of games) {
  console.log(`检查: ${game.name}`);
  const urlCheck = await checkUrl(game.homepage);

  if (urlCheck.accessible && !urlCheck.iframeBlocked) {
    // 进一步验证是否真的是游戏
    const isGame = await verifyGameContent(game.homepage, browser);

    if (isGame) {
      console.log(`  ✅ 通过 (${urlCheck.status})`);
      results.passed.push({ ...game, urlCheck });
    } else {
      console.log(`  ❌ 失败 - 不是游戏页面`);
      results.failed.push({ ...game, urlCheck, reason: 'Not a game' });
    }
  } else {
    console.log(`  ❌ 失败 - ${!urlCheck.accessible ? 'URL不可访问' : 'iframe被阻止'}`);
    results.failed.push({ ...game, urlCheck });
  }

  await new Promise(r => setTimeout(r, 1000));
}

await browser.close();

fs.writeFileSync('output/url-verification.json', JSON.stringify(results, null, 2));

console.log(`\n📊 验证结果:`);
console.log(`  通过: ${results.passed.length}`);
console.log(`  失败: ${results.failed.length}`);
console.log(`\n📄 结果: output/url-verification.json`);
