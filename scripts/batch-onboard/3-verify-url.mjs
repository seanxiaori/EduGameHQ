#!/usr/bin/env node
import https from 'https';
import http from 'http';
import fs from 'fs';

const games = JSON.parse(fs.readFileSync('output/duplicate-check.json')).unique;

console.log('🔍 验证游戏URL...\n');

async function checkUrl(url) {
  return new Promise((resolve) => {
    // 添加协议如果缺失
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

const results = { passed: [], failed: [] };

for (const game of games) {
  console.log(`检查: ${game.name}`);
  const result = await checkUrl(game.homepage);

  if (result.accessible && !result.iframeBlocked) {
    console.log(`  ✅ 通过 (${result.status})`);
    results.passed.push({ ...game, urlCheck: result });
  } else {
    console.log(`  ❌ 失败 - ${!result.accessible ? 'URL不可访问' : 'iframe被阻止'}`);
    results.failed.push({ ...game, urlCheck: result });
  }

  await new Promise(r => setTimeout(r, 1000));
}

fs.writeFileSync('output/url-verification.json', JSON.stringify(results, null, 2));

console.log(`\n📊 验证结果:`);
console.log(`  通过: ${results.passed.length}`);
console.log(`  失败: ${results.failed.length}`);
console.log(`\n📄 结果: output/url-verification.json`);
