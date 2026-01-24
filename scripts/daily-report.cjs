/**
 * 每日游戏上架任务
 * 检查现有游戏状态，准备新游戏上架
 */

const fs = require('fs');
const path = require('path');
const { loadExistingGames, validateGameData } = require('./validate-game.cjs');

const GAMES_JSON_PATH = path.join(__dirname, '../src/data/games.json');

// 检查现有游戏状态
function checkExistingGames() {
  const games = loadExistingGames();
  const today = new Date().toISOString().split('T')[0];

  console.log('📊 游戏库状态报告');
  console.log('='.repeat(50));
  console.log(`总游戏数: ${games.length}`);

  // 按分类统计
  const byCategory = {};
  games.forEach(g => {
    byCategory[g.category] = (byCategory[g.category] || 0) + 1;
  });

  console.log('\n按分类统计:');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  // 新游戏统计
  const newGames = games.filter(g => g.isNew);
  console.log(`\n新游戏数量: ${newGames.length}`);

  // 检查数据完整性
  console.log('\n数据完整性检查:');
  let issues = 0;
  games.forEach(g => {
    const validation = validateGameData(g);
    if (!validation.isValid) {
      issues++;
      console.log(`  ❌ ${g.title}: ${validation.errors.join(', ')}`);
    }
  });

  if (issues === 0) {
    console.log('  ✅ 所有游戏数据完整');
  }

  return { total: games.length, byCategory, newGames: newGames.length, issues };
}

// 生成上架建议
function generateOnboardingSuggestions() {
  const games = loadExistingGames();
  const byCategory = {};

  games.forEach(g => {
    byCategory[g.category] = (byCategory[g.category] || 0) + 1;
  });

  console.log('\n📋 上架建议');
  console.log('='.repeat(50));

  // 找出数量较少的分类
  const lowCategories = Object.entries(byCategory)
    .filter(([_, count]) => count < 10)
    .sort((a, b) => a[1] - b[1]);

  if (lowCategories.length > 0) {
    console.log('建议增加以下分类的游戏:');
    lowCategories.forEach(([cat, count]) => {
      console.log(`  - ${cat} (当前: ${count})`);
    });
  }

  // 缺失的分类
  const allCategories = [
    'math', 'science', 'coding', 'language', 'puzzle',
    'logic', 'memory', 'strategy', 'arcade', 'sports',
    'art', 'adventure', 'creative', 'educational', 'geography'
  ];

  const missing = allCategories.filter(c => !byCategory[c]);
  if (missing.length > 0) {
    console.log('\n缺失的分类:');
    missing.forEach(c => console.log(`  - ${c}`));
  }
}

// 主函数
function dailyReport() {
  console.log(`\n🎮 EduGameHQ 每日报告 - ${new Date().toLocaleDateString()}\n`);
  checkExistingGames();
  generateOnboardingSuggestions();
  console.log('\n');
}

module.exports = { checkExistingGames, generateOnboardingSuggestions, dailyReport };

if (require.main === module) {
  dailyReport();
}
