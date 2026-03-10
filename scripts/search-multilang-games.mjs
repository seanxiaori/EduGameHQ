#!/usr/bin/env node
import https from 'https';

const QUERIES = [
  '中文 游戏 html5 language:JavaScript stars:>5',
  '日本語 ゲーム html5 language:JavaScript stars:>5',
  'español juego html5 language:JavaScript stars:>5',
  'français jeu html5 language:JavaScript stars:>5',
  'deutsch spiel html5 language:JavaScript stars:>5',
  'русский игра html5 language:JavaScript stars:>5'
];

function githubRequest(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.github.com',
      path: path,
      headers: {
        'User-Agent': 'EduGameHQ-Bot',
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function search(query) {
  const q = encodeURIComponent(query);
  const result = await githubRequest(`/search/repositories?q=${q}&sort=stars&per_page=10`);
  return result.items || [];
}

console.log('🌍 搜索多语言游戏...\n');

for (const query of QUERIES) {
  console.log(`🔍 ${query.split(' ')[0]}`);
  try {
    const repos = await search(query);
    repos.forEach(r => {
      if (r.name.toLowerCase().includes('game') || r.description?.toLowerCase().includes('game')) {
        console.log(`  ✅ ${r.name} (⭐${r.stargazers_count}) - ${r.html_url}`);
      }
    });
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 2000));
}
