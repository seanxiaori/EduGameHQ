import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取游戏数据
const gamesPath = path.join(__dirname, '../src/data/games/games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));

// 统计各分类游戏数量
const stats = {};
Object.values(games).forEach(game => {
  if (game.category) {
    stats[game.category] = (stats[game.category] || 0) + 1;
  }
});

console.log('🎮 当前游戏库统计:');
console.log('==================');
Object.entries(stats).forEach(([category, count]) => {
  const categoryNames = {
    'math': '数学游戏',
    'science': '科学游戏', 
    'coding': '编程游戏',
    'language': '语言游戏',
    'puzzle': '益智游戏',
    'sports': '体育游戏',
    'art': '艺术创意游戏',
    'history': '历史地理游戏'
  };
  console.log(`${categoryNames[category] || category}: ${count}个`);
});

console.log('==================');
console.log(`总计: ${Object.keys(games).length}个游戏`);

// 显示目标
console.log('\n🎯 扩展目标:');
console.log('每个分类30个游戏，总计240个游戏');
console.log(`还需要添加: ${240 - Object.keys(games).length}个游戏`); 