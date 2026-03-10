#!/usr/bin/env node
import https from 'https';
import fs from 'fs';

const config = {
  minStars: 10,
  maxResults: 20
};

// 具体的游戏类型关键词
const gameTypes = [
  'tetris', 'snake', 'pacman', 'breakout', 'pong',
  'chess', 'checkers', 'sudoku', 'puzzle', 'match3',
  'platformer', 'shooter', 'racing', 'card game',
  'memory game', 'quiz', 'trivia', 'word game'
];

// 排除关键词
const excludeKeywords = [
  'engine', 'framework', 'library', 'template', 'boilerplate',
  'starter', 'tutorial', 'example', 'phaser', 'pixi', 'libgdx',
  'cocos', 'babylon', 'three.js', 'matter.js', 'sdk', 'api'
];

function isValidGame(repo) {
  const text = `${repo.name} ${repo.description || ''}`.toLowerCase();

  // 排除游戏引擎
  if (excludeKeywords.some(kw => text.includes(kw))) return false;

  // 必须有homepage
  if (!repo.homepage) return false;

  // 排除已废弃
  if (text.includes('deprecated') || text.includes('archived')) return false;

  return true;
}

async function searchGitHub(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=10`,
      headers: {
        'User-Agent': 'EduGameHQ-Bot',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 搜索HTML5游戏...\n');

  const allGames = [];
  const seen = new Set();

  for (const gameType of gameTypes) {
    const query = `${gameType} html5 game stars:>${config.minStars}`;
    console.log(`查询: ${gameType}`);

    try {
      const data = await searchGitHub(query);

      if (data.items) {
        for (const repo of data.items) {
          if (isValidGame(repo) && !seen.has(repo.html_url)) {
            seen.add(repo.html_url);
            allGames.push({
              name: repo.name,
              stars: repo.stargazers_count,
              url: repo.html_url,
              homepage: repo.homepage,
              description: repo.description,
              gameType
            });
          }
        }
      }

      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`  ❌ ${e.message}`);
    }
  }

  // 按星数排序
  allGames.sort((a, b) => b.stars - a.stars);

  fs.mkdirSync('output', { recursive: true });
  fs.writeFileSync('output/search-results.json', JSON.stringify(allGames, null, 2));

  console.log(`\n✅ 找到 ${allGames.length} 个候选游戏`);
  console.log(`📄 结果: output/search-results.json`);
}

main().catch(console.error);
