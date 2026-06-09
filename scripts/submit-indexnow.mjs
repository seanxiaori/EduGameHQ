import https from 'https';
import fs from 'fs';

const INDEXNOW_KEY = '8659ded5-4a9f-4471-9dcd-90443960efd9';
const SITE_URL = 'https://www.edugamehq.com';

// 读取 sitemap 获取所有 URL
async function getSitemapUrls() {
  const sitemap = fs.readFileSync('dist/sitemap-0.xml', 'utf-8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  return urls;
}

// 提交到 IndexNow (每次最多10000个URL)
async function submitToIndexNow(urls) {
  const data = JSON.stringify({
    host: 'www.edugamehq.com',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls
  });

  const options = {
    hostname: 'api.indexnow.org',
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      res.on('data', (d) => process.stdout.write(d));
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 主函数
async function main() {
  console.log('正在读取 sitemap...');
  const urls = await getSitemapUrls();
  console.log(`找到 ${urls.length} 个 URL`);

  console.log('提交到 IndexNow...');
  const status = await submitToIndexNow(urls);

  if (status === 200) {
    console.log('✅ 提交成功！');
  } else {
    console.log(`⚠️ 提交状态: ${status}`);
  }
}

main().catch(console.error);
