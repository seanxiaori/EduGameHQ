import https from 'https';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'your-key-here';
const SITE_URL = 'https://www.edugamehq.com';

export async function submitToIndexNow(urls) {
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
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
