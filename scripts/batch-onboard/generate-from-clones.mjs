#!/usr/bin/env node
import fs from 'fs';

const games = JSON.parse(fs.readFileSync('output/clone-results.json')).success;

console.log('📝 生成游戏数据...\n');

const gameData = games.map(game => {
  const slug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  return {
    slug,
    title: game.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: game.description,
    iframeUrl: `https://games.edugamehq.com/games/${slug}/`,
    sourceUrl: game.sourceUrl,
    category: 'arcade',
    tags: ['html5', 'canvas', 'classic'],
    stars: game.stars,
    localPath: game.localPath,
    entryPoint: game.entryPoint
  };
});

fs.writeFileSync('output/ready-to-deploy.json', JSON.stringify(gameData, null, 2));

console.log(`✅ 生成 ${gameData.length} 个游戏的数据`);
console.log('📄 结果: output/ready-to-deploy.json');
