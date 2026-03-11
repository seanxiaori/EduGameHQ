#!/usr/bin/env node
import https from 'https';
import fs from 'fs';

// 按语言搜索游戏 - 使用游戏类型 + 代码语言
const gameTypes = ['tetris', 'snake', 'pacman', 'puzzle', 'chess', 'sudoku', 'memory', 'quiz'];

const languageRepos = {
  en: 'language:JavaScript',
  zh: 'language:JavaScript chinese OR 中文',
  es: 'language:JavaScript spanish OR español',
  fr: 'language:JavaScript french OR français',
  de: 'language:JavaScript german OR deutsch',
  ja: 'language:JavaScript japanese OR 日本語',
  ru: 'language:JavaScript russian OR русский',
  ko: 'language:JavaScript korean OR 한국어',
  ar: 'language:JavaScript arabic OR عربي',
  hi: 'language:JavaScript hindi OR हिंदी',
  he: 'language:JavaScript hebrew OR עברית'
};

const config = {
  minStars: 5,
  gamesPerLanguage: 10
};

const excludeKeywords = [
  'engine', 'framework', 'library', 'template', 'boilerplate',
  'starter', 'tutorial', 'phaser', 'pixi'
];

function isValidGame(repo) {
  const text = `${repo.name} ${repo.description || ''}`.toLowerCase();
  if (excludeKeywords.some(kw => text.includes(kw))) return false;
  if (!repo.homepage) return false;
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
  console.log('🔍 按语言搜索游戏...\n');
  const allGames = [];

  for (const [lang, langQuery] of Object.entries(languageRepos)) {
    console.log(`搜索 ${lang} 游戏...`);
    const langGames = [];

    for (const gameType of gameTypes) {
      const query = `${gameType} game html5 ${langQuery} stars:>${config.minStars}`;
      await new Promise(r => setTimeout(r, 2000));

      try {
        const result = await searchGitHub(query);
        const validGames = (result.items || [])
          .filter(isValidGame)
          .map(repo => ({
            name: repo.name,
            description: repo.description,
            homepage: repo.homepage,
            stars: repo.stargazers_count,
            language: lang,
            gameType: gameType,
            sourceUrl: repo.html_url
          }));

        langGames.push(...validGames);
      } catch (e) {
        console.error(`  ❌ ${gameType}: ${e.message}`);
      }
    }

    const unique = [...new Map(langGames.map(g => [g.homepage, g])).values()]
      .slice(0, config.gamesPerLanguage);

    console.log(`  ✅ 找到 ${unique.length} 款\n`);
    allGames.push(...unique);
  }

  fs.writeFileSync('output/search-results.json', JSON.stringify(allGames, null, 2));
  console.log(`\n✅ 总共找到 ${allGames.length} 款游戏`);
}

main();


