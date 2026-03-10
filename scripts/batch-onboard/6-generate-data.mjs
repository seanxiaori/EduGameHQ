#!/usr/bin/env node
import fs from 'fs';

const games = JSON.parse(fs.readFileSync('output/quality-report.json'));
const goodGames = [...games.excellent, ...games.good];

console.log('📝 生成游戏数据...\n');

const gameData = [];

for (const game of goodGames) {
  const slug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const data = {
    slug,
    title: game.name,
    category: game.gameType || 'arcade',
    categoryName: (game.gameType || 'arcade').charAt(0).toUpperCase() + (game.gameType || 'arcade').slice(1),
    iframeUrl: game.homepage,
    sourceUrl: game.url,
    description: game.description || `Play ${game.name} - HTML5 game`,
    thumbnailUrl: `/screenshots/${slug}.png`,
    image: `/screenshots/${slug}.png`,
    difficulty: 'Medium',
    ageRange: '8-16',
    minAge: 8,
    maxAge: 16,
    tags: [game.gameType || 'game', 'html5', 'browser'],
    source: 'EduGameHQ',
    developer: game.url.split('/')[3],
    technology: 'HTML5',
    lastUpdated: new Date().toISOString().split('T')[0],
    lastChecked: new Date().toISOString().split('T')[0],
    isNew: true,
    verified: false,
    featured: false,
    trending: false,
    iframeCompatible: true,
    mobileSupport: true,
    responsive: true,
    playCount: 0,
    rating: 0,
    qualityScore: game.qualityScore
  };

  gameData.push(data);
  console.log(`✅ ${data.title}`);
}

fs.writeFileSync('output/ready-to-onboard.json', JSON.stringify(gameData, null, 2));

console.log(`\n📄 生成了 ${gameData.length} 款游戏数据`);
console.log(`📄 结果: output/ready-to-onboard.json`);
