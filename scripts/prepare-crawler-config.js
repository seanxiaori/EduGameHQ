import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 分析需要爬取的游戏...');

// 读取游戏数据
const gamesDataPath = path.join(__dirname, '../src/data/games/games.json');
const gamesData = JSON.parse(fs.readFileSync(gamesDataPath, 'utf8'));

// 统计需要爬取的游戏
const needsCrawling = [];
const hasImages = [];
const totalGames = Object.keys(gamesData).length;

Object.entries(gamesData).forEach(([gameId, game]) => {
  const hasDefaultImage = game.images && game.images.includes('default-intro.jpg');
  const hasRealImages = game.images && game.images.some(img => img !== 'default-intro.jpg');
  
  if (hasDefaultImage || !hasRealImages) {
    needsCrawling.push({
      id: gameId,
      title: game.title,
      category: game.category,
      iframeUrl: game.iframeUrl,
      currentImages: game.images || []
    });
  } else {
    hasImages.push(gameId);
  }
});

console.log('\n📊 游戏图片状态统计:');
console.log('==================');
console.log(`总游戏数: ${totalGames}`);
console.log(`已有图片: ${hasImages.length}个`);
console.log(`需要爬取: ${needsCrawling.length}个`);
console.log(`完成度: ${((hasImages.length / totalGames) * 100).toFixed(1)}%`);

// 按分类统计
const categoryStats = {};
needsCrawling.forEach(game => {
  if (!categoryStats[game.category]) {
    categoryStats[game.category] = [];
  }
  categoryStats[game.category].push(game);
});

console.log('\n📋 按分类需要爬取的游戏:');
console.log('========================');
Object.entries(categoryStats).forEach(([category, games]) => {
  console.log(`${category}: ${games.length}个游戏`);
  games.slice(0, 5).forEach(game => {
    console.log(`  - ${game.title} (${game.id})`);
  });
  if (games.length > 5) {
    console.log(`  ... 还有${games.length - 5}个游戏`);
  }
});

// 生成爬虫配置
const crawlerConfig = {};
needsCrawling.forEach(game => {
  // 从iframe URL推断游戏来源
  let source = 'Unknown';
  if (game.iframeUrl.includes('crazygames.com')) {
    source = 'CrazyGames';
  } else if (game.iframeUrl.includes('miniplay.com')) {
    source = 'Miniplay';
  } else if (game.iframeUrl.includes('itch.io')) {
    source = 'Itch.io';
  } else if (game.iframeUrl.includes('mathplayground.com')) {
    source = 'MathPlayground';
  }

  crawlerConfig[game.id] = {
    name: game.title,
    url: game.iframeUrl,
    embedUrl: game.iframeUrl,
    category: game.category,
    source: source,
    ageRange: game.ageRange || '8-16',
    difficulty: game.difficulty || 'Medium'
  };
});

// 保存爬虫配置
const configPath = path.join(__dirname, 'crawler-config.json');
fs.writeFileSync(configPath, JSON.stringify(crawlerConfig, null, 2));

console.log(`\n💾 爬虫配置已保存到: ${configPath}`);
console.log(`🎯 准备爬取 ${Object.keys(crawlerConfig).length} 个游戏的资源`);

// 生成优先级列表（按分类和重要性排序）
const priorityList = [];
const categoryPriority = ['math', 'science', 'coding', 'language', 'puzzle', 'sports', 'geography', 'art'];

categoryPriority.forEach(category => {
  const categoryGames = needsCrawling.filter(game => game.category === category);
  priorityList.push(...categoryGames.slice(0, 10)); // 每个分类最多10个优先游戏
});

console.log(`\n🔥 高优先级游戏 (前${priorityList.length}个):`);
priorityList.forEach((game, index) => {
  console.log(`${index + 1}. ${game.title} (${game.category})`);
});

export { crawlerConfig, needsCrawling, priorityList }; 