/**
 * 检查所有来源的游戏
 * 分析哪些网站可能有embed问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取游戏数据
const gamesPath = path.join(__dirname, '../src/data/games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));

console.log(`📊 当前游戏总数: ${games.length}\n`);

// 按来源分组
const gamesBySource = {};
games.forEach(game => {
  const source = game.source || 'unknown';
  if (!gamesBySource[source]) {
    gamesBySource[source] = [];
  }
  gamesBySource[source].push(game);
});

// 分析每个来源
console.log('📋 各来源游戏统计和URL分析:\n');
console.log('='.repeat(80));

for (const [source, sourceGames] of Object.entries(gamesBySource)) {
  console.log(`\n【${source}】 - ${sourceGames.length}个游戏`);
  console.log('-'.repeat(80));
  
  // 取前3个游戏样本
  const samples = sourceGames.slice(0, 3);
  
  samples.forEach((game, index) => {
    console.log(`\n  样本${index + 1}: ${game.title}`);
    console.log(`  └─ URL: ${game.iframeUrl}`);
    
    // 分析URL类型
    const url = game.iframeUrl || '(无URL)';
    let urlType = '未知';
    
    if (!game.iframeUrl) {
      urlType = '❌ 缺少URL';
    } else if (url.includes('/embed/')) {
      urlType = '✅ Embed URL（推荐）';
    } else if (url.includes('/games/') || url.includes('/game/')) {
      urlType = '⚠️  完整页面URL（可能有问题）';
    } else {
      urlType = '❓ 其他格式';
    }
    
    console.log(`  └─ 类型: ${urlType}`);
  });
  
  // 统计URL类型
  const embedCount = sourceGames.filter(g => g.iframeUrl?.includes('/embed/')).length;
  const gamePageCount = sourceGames.filter(g => 
    (g.iframeUrl?.includes('/games/') || g.iframeUrl?.includes('/game/')) &&
    !g.iframeUrl?.includes('/embed/')
  ).length;
  
  console.log(`\n  📊 URL类型统计:`);
  console.log(`     ✅ Embed URL: ${embedCount}个`);
  console.log(`     ⚠️  游戏页面URL: ${gamePageCount}个`);
  console.log(`     ❓ 其他: ${sourceGames.length - embedCount - gamePageCount}个`);
  
  // 判断风险等级
  let risk = '未知';
  if (embedCount === sourceGames.length) {
    risk = '✅ 安全（全部使用embed URL）';
  } else if (gamePageCount > sourceGames.length * 0.8) {
    risk = '❌ 高风险（大部分是完整页面）';
  } else if (gamePageCount > 0) {
    risk = '⚠️  中风险（混合URL类型）';
  }
  
  console.log(`\n  🎯 风险评估: ${risk}`);
}

console.log('\n' + '='.repeat(80));

// 生成建议
console.log('\n💡 建议:\n');

const safeSources = [];
const riskySources = [];

for (const [source, sourceGames] of Object.entries(gamesBySource)) {
  const embedCount = sourceGames.filter(g => g.iframeUrl?.includes('/embed/')).length;
  
  if (embedCount === sourceGames.length) {
    safeSources.push(source);
  } else {
    riskySources.push({ source, count: sourceGames.length });
  }
}

console.log('✅ 安全来源（使用embed URL）:');
safeSources.forEach(s => console.log(`   - ${s}`));

console.log(`\n❌ 有风险来源（不使用embed URL）:`);
riskySources.forEach(({source, count}) => console.log(`   - ${source} (${count}个游戏)`));

console.log(`\n📊 统计:`);
console.log(`   安全游戏: ${safeSources.reduce((sum, s) => sum + gamesBySource[s].length, 0)}个`);
console.log(`   风险游戏: ${riskySources.reduce((sum, {count}) => sum + count, 0)}个`);

console.log('\n');

