#!/usr/bin/env node
import fs from 'fs';

const newGames = JSON.parse(fs.readFileSync('output/ready-to-onboard.json'));
const existingGames = JSON.parse(fs.readFileSync('src/data/games.json'));

console.log('🚀 批量上架游戏...\n');

// 添加新游戏
existingGames.push(...newGames);

// 保存
fs.writeFileSync('src/data/games.json', JSON.stringify(existingGames, null, 2));

console.log(`✅ 成功添加 ${newGames.length} 款游戏`);
console.log(`📊 总游戏数: ${existingGames.length}`);
console.log('\n新游戏:');
newGames.forEach(g => console.log(`  - ${g.title} (${g.category})`));
