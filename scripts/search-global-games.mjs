#!/usr/bin/env node
import https from 'https';

const QUERIES = [
  'game html5 china language:JavaScript stars:>10',
  'game html5 japan language:JavaScript stars:>10',
  'game html5 korea language:JavaScript stars:>10',
  'game html5 brazil language:JavaScript stars:>10',
  'game html5 russia language:JavaScript stars:>10',
  'puzzle html5 language:JavaScript stars:>10',
  'arcade html5 language:JavaScript stars:>10'
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
  const result = await githubRequest(`/search/repositories?q=${q}&sort=stars&per_page=15`);
  return result.items || [];
}

const allGames = [];

for (const query of QUERIES) {
  console.log(`🔍 ${query}`);
  try {
    const repos = await search(query);
    repos.forEach(r => {
      allGames.push({
        name: r.name,
        stars: r.stargazers_count,
        url: r.html_url,
        desc: r.description
      });
    });
  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 2000));
}

const unique = Array.from(new Map(allGames.map(g => [g.url, g])).values());
unique.sort((a, b) => b.stars - a.stars);

console.log(`\n✅ 找到 ${unique.length} 个游戏\n`);
unique.slice(0, 20).forEach((g, i) => {
  console.log(`${i+1}. ${g.name} (⭐${g.stars})`);
  console.log(`   ${g.url}`);
});
