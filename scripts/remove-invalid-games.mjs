#!/usr/bin/env node
import fs from 'fs';

const games = JSON.parse(fs.readFileSync('src/data/games.json', 'utf-8'));

const invalidSlugs = [
  'gamedev-canvas-workshop',
  'javascript-tetris',
  'pong',
  'breakout-game',
  'dama',
  'games-tools',
  'web-chess',
  'mnemo'
];

const cleaned = games.filter(g => !invalidSlugs.includes(g.slug));

fs.writeFileSync('src/data/games.json', JSON.stringify(cleaned, null, 2));

console.log(`删除了 ${games.length - cleaned.length} 款无效游戏`);
console.log(`剩余: ${cleaned.length} 款游戏`);
