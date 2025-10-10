/**
 * 智能游戏爬虫系统
 * 功能：从多个教育游戏网站自动发现新游戏
 * 
 * 工作流程：
 * 1. 读取配置文件
 * 2. 从各个来源网站爬取游戏数据
 * 3. 数据标准化处理
 * 4. 质量评估和筛选
 * 5. 去重检测
 * 6. 生成PR内容
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateBatch } from './game-evaluator.mjs';
import { deduplicateBatch, loadExistingGames } from './utils/game-deduplicator.mjs';
import config from './game-sources-config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 工具函数：生成slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

/**
 * 工具函数：延迟执行
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * CrazyGames 爬虫
 * 由于没有真实的爬取能力（需要puppeteer等），这里模拟数据结构
 * 实际使用时需要接入真实的爬虫逻辑
 */
async function crawlCrazyGames(categoryConfig) {
  console.log('🕷️ 爬取 CrazyGames...');
  
  // 这里应该使用puppeteer或其他工具进行真实爬取
  // 目前返回模拟数据结构，展示期望的数据格式
  
  const mockGames = [];
  
  // 实际实现时，应该：
  // 1. 访问 categoryConfig.baseUrl + categoryConfig.categories.math
  // 2. 解析HTML，提取游戏列表
  // 3. 对每个游戏提取详细信息
  
  console.log('   ℹ️ 注意：当前为演示模式，需要实现真实爬虫逻辑');
  
  return mockGames;
}

/**
 * Cool Math Games 爬虫
 */
async function crawlCoolMathGames(categoryConfig) {
  console.log('🕷️ 爬取 Cool Math Games...');
  
  const mockGames = [];
  
  console.log('   ℹ️ 注意：当前为演示模式，需要实现真实爬虫逻辑');
  
  return mockGames;
}

/**
 * 数据标准化
 * 将爬取的原始数据转换为统一格式
 */
function normalizeGameData(rawGame, source) {
  const now = new Date().toISOString().split('T')[0];
  
  return {
    slug: rawGame.slug || generateSlug(rawGame.title),
    title: rawGame.title,
    category: rawGame.category || 'educational',
    categoryName: rawGame.categoryName || 'Educational',
    iframeUrl: rawGame.iframeUrl || rawGame.url,
    description: rawGame.description || `Play ${rawGame.title} - an educational game`,
    
    // 游戏指南
    gameGuide: rawGame.gameGuide || {
      howToPlay: rawGame.howToPlay || [
        'Click to start the game',
        'Follow the on-screen instructions',
        'Complete the objectives to win'
      ],
      controls: rawGame.controls || {
        mouse: 'Click and drag to interact',
        keyboard: 'Use arrow keys to move'
      },
      tips: rawGame.tips || [
        'Take your time to understand the game',
        'Practice makes perfect'
      ]
    },
    
    // 媒体
    thumbnailUrl: rawGame.thumbnailUrl || rawGame.thumbnail || rawGame.image,
    
    // 难度和年龄
    difficulty: rawGame.difficulty || 'Medium',
    ageRange: rawGame.ageRange || '6-16',
    minAge: rawGame.minAge || 6,
    maxAge: rawGame.maxAge || 16,
    
    // 标签
    tags: rawGame.tags || [rawGame.category],
    
    // 技术信息
    source: source,
    iframeCompatible: rawGame.iframeCompatible !== false,
    verified: false, // 新发现的游戏默认未验证
    technology: rawGame.technology || 'HTML5',
    mobileSupport: rawGame.mobileSupport !== false,
    responsive: rawGame.responsive !== false,
    
    // 统计数据
    rating: rawGame.rating || 0,
    playCount: rawGame.playCount || 0,
    
    // 元数据
    sourceUrl: rawGame.sourceUrl,
    lastUpdated: now,
    lastChecked: now,
    
    // 状态标记
    featured: false,
    trending: false,
    isNew: true
  };
}

/**
 * 主爬虫函数
 */
async function crawlGames() {
  console.log('🚀 开始智能游戏爬虫任务...\n');
  console.log('='.repeat(60));
  
  const allDiscoveredGames = [];
  
  // 1. 从各个来源爬取
  for (const [sourceName, sourceConfig] of Object.entries(config.sources)) {
    if (!sourceConfig.enabled) {
      console.log(`⏭️ 跳过 ${sourceName} (已禁用)\n`);
      continue;
    }
    
    console.log(`\n📡 处理来源: ${sourceName}`);
    console.log(`   优先级: ${sourceConfig.priority}`);
    console.log(`   限制: 每分类${sourceConfig.limits.gamesPerCategory}个游戏\n`);
    
    try {
      let sourceGames = [];
      
      // 根据来源调用不同的爬虫
      if (sourceName === 'crazygames') {
        sourceGames = await crawlCrazyGames(sourceConfig);
      } else if (sourceName === 'coolmathgames') {
        sourceGames = await crawlCoolMathGames(sourceConfig);
      }
      
      // 标准化数据
      const normalizedGames = sourceGames.map(game => 
        normalizeGameData(game, sourceName)
      );
      
      allDiscoveredGames.push(...normalizedGames);
      console.log(`   ✅ 从 ${sourceName} 发现 ${normalizedGames.length} 个游戏`);
      
      // 延迟，避免请求过快
      await delay(config.retryConfig?.retryDelay || 2000);
      
    } catch (error) {
      console.error(`   ❌ 爬取 ${sourceName} 失败:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 总计发现: ${allDiscoveredGames.length} 个游戏\n`);
  
  return allDiscoveredGames;
}

/**
 * 主流程
 */
async function main() {
  try {
    const startTime = Date.now();
    
    // 1. 爬取游戏
    console.log('📝 第1步：爬取游戏数据\n');
    const discoveredGames = await crawlGames();
    
    if (discoveredGames.length === 0) {
      console.log('\n⚠️ 未发现任何游戏，结束任务');
      process.exit(0);
    }
    
    // 2. 质量评估
    console.log('\n📝 第2步：质量评估与筛选\n');
    console.log('='.repeat(60));
    const evaluationResult = evaluateBatch(discoveredGames);
    
    console.log(`\n📊 评估统计:`);
    console.log(`   总计: ${evaluationResult.stats.total} 个`);
    console.log(`   ✅ 通过: ${evaluationResult.stats.passed} 个`);
    console.log(`   ❌ 未通过: ${evaluationResult.stats.failed} 个`);
    console.log(`   📊 平均分: ${evaluationResult.stats.averageScore.toFixed(1)}/100`);
    
    const qualifiedGames = evaluationResult.evaluations
      .filter(e => e.passed)
      .map(e => {
        const gameData = discoveredGames.find(g => g.slug === e.game.slug);
        return {
          ...gameData,
          _evaluation: e // 保存评估信息用于生成PR
        };
      });
    
    if (qualifiedGames.length === 0) {
      console.log('\n⚠️ 没有游戏通过质量评估，结束任务');
      process.exit(0);
    }
    
    // 3. 去重检测
    console.log('\n📝 第3步：去重检测\n');
    console.log('='.repeat(60));
    const existingGames = loadExistingGames();
    console.log(`📚 已加载 ${existingGames.length} 个现有游戏`);
    
    const deduplicationResult = deduplicateBatch(qualifiedGames, existingGames);
    
    console.log(`\n📊 去重统计:`);
    console.log(`   总计: ${deduplicationResult.stats.total} 个`);
    console.log(`   ✅ 唯一: ${deduplicationResult.stats.unique} 个`);
    console.log(`   ❌ 重复: ${deduplicationResult.stats.duplicates} 个`);
    
    const uniqueGames = deduplicationResult.unique;
    
    if (uniqueGames.length === 0) {
      console.log('\n⚠️ 所有游戏都已存在，无需创建PR');
      process.exit(0);
    }
    
    // 4. 应用数量限制
    const maxGames = config.filters?.maxGamesPerRun || 10;
    const finalGames = uniqueGames
      .sort((a, b) => (b._evaluation?.totalScore || 0) - (a._evaluation?.totalScore || 0))
      .slice(0, maxGames);
    
    console.log(`\n📝 第4步：应用限制 (最多${maxGames}个)\n`);
    console.log(`   最终选择: ${finalGames.length} 个游戏`);
    
    // 5. 更新games.json
    console.log('\n📝 第5步：更新游戏数据\n');
    const updatedGames = [
      ...existingGames,
      ...finalGames.map(g => {
        const { _evaluation, ...gameData } = g;
        return gameData;
      })
    ];
    
    const gamesPath = path.join(__dirname, '../src/data/games.json');
    fs.writeFileSync(gamesPath, JSON.stringify(updatedGames, null, 2), 'utf-8');
    console.log(`   ✅ 已更新 games.json (+${finalGames.length} 个游戏)`);
    
    // 6. 生成PR内容
    console.log('\n📝 第6步：生成PR内容\n');
    const prBody = generatePRBody(finalGames);
    
    // 创建临时目录
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 保存新游戏数据（供PR参考）
    fs.writeFileSync(
      path.join(tempDir, 'new-games.json'),
      JSON.stringify(finalGames, null, 2),
      'utf-8'
    );
    
    // 保存PR内容
    fs.writeFileSync(
      path.join(tempDir, 'pr-body.md'),
      prBody,
      'utf-8'
    );
    
    console.log(`   ✅ 已生成PR内容`);
    
    // 7. 完成
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log(`✅ 任务完成！`);
    console.log(`   发现新游戏: ${finalGames.length} 个`);
    console.log(`   总耗时: ${duration}秒`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 任务执行失败:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * 生成PR描述内容
 */
function generatePRBody(games) {
  const date = new Date().toISOString().split('T')[0];
  
  let body = `## 🎮 自动发现的新教育游戏 - ${date}\n\n`;
  body += `本次发现 **${games.length}** 个优质教育游戏，已通过质量评估和去重检测。\n\n`;
  body += `---\n\n`;
  
  games.forEach((game, index) => {
    const evaluation = game._evaluation;
    
    body += `### ${index + 1}. ${game.title}\n\n`;
    body += `| 属性 | 值 |\n`;
    body += `|------|----|\n`;
    body += `| **分类** | ${game.categoryName} (${game.category}) |\n`;
    body += `| **适龄** | ${game.ageRange} 岁 |\n`;
    body += `| **难度** | ${game.difficulty} |\n`;
    body += `| **来源** | ${game.source} |\n`;
    body += `| **技术** | ${game.technology} |\n`;
    body += `| **移动端** | ${game.mobileSupport ? '✅ 支持' : '❌ 不支持'} |\n`;
    
    if (evaluation) {
      body += `| **AI评分** | ${evaluation.totalScore}/100 (${evaluation.grade}级) |\n`;
      body += `| **推荐度** | ${evaluation.recommendation} |\n`;
    }
    
    body += `\n**描述**: ${game.description}\n\n`;
    
    if (game.thumbnailUrl) {
      body += `**预览图**:\n\n`;
      body += `![${game.title}](${game.thumbnailUrl})\n\n`;
    }
    
    body += `**试玩链接**: [点击测试](${game.iframeUrl})\n\n`;
    
    if (evaluation) {
      body += `<details>\n<summary>📊 详细评分</summary>\n\n`;
      body += `- 来源评分: ${evaluation.scores.sourceRating.score.toFixed(1)}/30\n`;
      body += `- 热度评分: ${evaluation.scores.popularity.score.toFixed(1)}/25\n`;
      body += `- 技术评分: ${evaluation.scores.technology.score.toFixed(1)}/20\n`;
      body += `- 安全评分: ${evaluation.scores.safety.score.toFixed(1)}/15\n`;
      body += `- 新鲜度: ${evaluation.scores.freshness.score.toFixed(1)}/10\n`;
      body += `\n</details>\n\n`;
    }
    
    body += `---\n\n`;
  });
  
  body += `## 📋 审核指南\n\n`;
  body += `### ✅ 全部批准\n`;
  body += `直接点击下方的 **Merge pull request** 按钮即可上线所有游戏。\n\n`;
  body += `### ✅ 部分批准\n`;
  body += `1. 点击 **Files changed** 标签\n`;
  body += `2. 编辑 \`src/data/games.json\` 文件\n`;
  body += `3. 删除不想要的游戏条目\n`;
  body += `4. 点击 **Merge pull request**\n\n`;
  body += `### ❌ 全部拒绝\n`;
  body += `点击 **Close pull request** 按钮。\n\n`;
  body += `---\n\n`;
  body += `*🤖 此PR由自动游戏发现系统生成*\n`;
  
  return body;
}

// 执行主流程
main();

