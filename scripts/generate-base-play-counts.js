import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 智能基础人气值生成器
 * 根据游戏特性生成合理的基础playCount值
 */
class BasePlayCountGenerator {
  constructor() {
    this.gamesPath = path.join(__dirname, '../src/data/games.json');
  }

  /**
   * 生成基础playCount值
   * @param {Object} game - 游戏对象
   * @returns {number} 基础playCount值
   */
  generateBasePlayCount(game) {
    let baseRange = { min: 50, max: 300 }; // 默认基础范围

    // 1. 根据分类调整基础范围（教育价值越高，基础人气越高）
    const categoryRanges = {
      'math': { min: 200, max: 800 },      // 数学游戏 - 最受欢迎
      'science': { min: 150, max: 600 },   // 科学游戏
      'language': { min: 120, max: 500 },  // 语言游戏
      'puzzle': { min: 100, max: 400 },    // 益智游戏
      'art': { min: 80, max: 350 },        // 艺术游戏
      'sports': { min: 90, max: 380 },     // 体育游戏
      'strategy': { min: 110, max: 450 },  // 策略游戏
      'coding': { min: 160, max: 550 },    // 编程游戏
      'adventure': { min: 70, max: 320 },  // 冒险游戏
      'action': { min: 60, max: 280 }      // 动作游戏
    };

    const categoryRange = categoryRanges[game.category] || baseRange;
    baseRange = { ...categoryRange };

    // 2. 特色标签加成
    if (game.featured) {
      baseRange.min += 300;
      baseRange.max += 800;
    }
    if (game.trending) {
      baseRange.min += 200;
      baseRange.max += 600;
    }
    if (game.isNew) {
      baseRange.min += 100;
      baseRange.max += 400;
    }

    // 3. 难度调整（中等难度最受欢迎）
    const difficultyMultipliers = {
      'easy': 1.1,
      'medium': 1.3,
      'hard': 0.9
    };

    const difficulty = (game.difficulty || 'medium').toLowerCase();
    const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;
    
    baseRange.min = Math.floor(baseRange.min * difficultyMultiplier);
    baseRange.max = Math.floor(baseRange.max * difficultyMultiplier);

    // 4. 年龄段适应性（覆盖范围越广，人气越高）
    const ageRange = game.ageRange || '6-12';
    const [minAge, maxAge] = ageRange.split('-').map(age => parseInt(age) || 0);
    const ageSpan = maxAge - minAge;

    if (ageSpan >= 8) {
      baseRange.min += 50;
      baseRange.max += 150;
    } else if (ageSpan >= 6) {
      baseRange.min += 30;
      baseRange.max += 100;
    } else if (ageSpan >= 4) {
      baseRange.min += 15;
      baseRange.max += 50;
    }

    // 5. 技术兼容性加成
    if (game.mobileSupport) {
      baseRange.min += 40;
      baseRange.max += 120;
    }
    if (game.responsive) {
      baseRange.min += 30;
      baseRange.max += 80;
    }
    if (game.verified) {
      baseRange.min += 20;
      baseRange.max += 60;
    }

    // 6. 标签丰富度加成
    const tagCount = (game.tags || []).length;
    const tagBonus = Math.min(tagCount * 15, 100); // 最多100分标签加成
    baseRange.min += tagBonus;
    baseRange.max += tagBonus * 2;

    // 7. 游戏指南完整性加成
    if (game.gameGuide) {
      let guideBonus = 0;
      if (game.gameGuide.howToPlay && game.gameGuide.howToPlay.length > 0) {
        guideBonus += 20;
      }
      if (game.gameGuide.controls && Object.keys(game.gameGuide.controls).length > 0) {
        guideBonus += 20;
      }
      if (game.gameGuide.tips && game.gameGuide.tips.length > 0) {
        guideBonus += 20;
      }
      baseRange.min += guideBonus;
      baseRange.max += guideBonus * 2;
    }

    // 8. 确保合理的范围
    baseRange.min = Math.max(baseRange.min, 30);   // 最低30次播放
    baseRange.max = Math.min(baseRange.max, 2000); // 最高2000次播放
    baseRange.min = Math.min(baseRange.min, baseRange.max - 50); // 确保有合理的范围差

    // 9. 生成随机值（使用游戏slug作为随机种子，确保每次运行结果一致）
    const randomValue = this.seededRandom(game.slug, baseRange.min, baseRange.max);
    
    console.log(`🎮 ${game.slug}: ${randomValue} (范围: ${baseRange.min}-${baseRange.max}, 分类: ${game.category}${game.featured ? ', 精选' : ''}${game.trending ? ', 热门' : ''}${game.isNew ? ', 新品' : ''})`);
    
    return randomValue;
  }

  /**
   * 基于字符串生成伪随机数（确保一致性）
   * @param {string} seed - 随机种子
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机数
   */
  seededRandom(seed, min, max) {
    // 简单的字符串哈希函数
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    // 将哈希值转换为0-1之间的数
    const normalized = Math.abs(hash) / 2147483647;
    
    // 映射到指定范围
    return Math.floor(min + normalized * (max - min + 1));
  }

  /**
   * 更新所有游戏的playCount
   */
  async updateAllPlayCounts() {
    try {
      // 读取games.json文件
      const gamesData = JSON.parse(fs.readFileSync(this.gamesPath, 'utf8'));
      
      console.log(`📊 开始为 ${gamesData.length} 个游戏生成基础人气值...\n`);
      
      let updatedCount = 0;
      
      // 为每个游戏生成基础playCount
      gamesData.forEach(game => {
        if (game.playCount === 0) {
          game.playCount = this.generateBasePlayCount(game);
          updatedCount++;
        }
      });
      
      // 保存更新后的数据
      fs.writeFileSync(this.gamesPath, JSON.stringify(gamesData, null, 2), 'utf8');
      
      console.log(`\n✅ 成功更新了 ${updatedCount} 个游戏的基础人气值！`);
      console.log(`📁 文件已保存: ${this.gamesPath}`);
      
      // 生成统计报告
      this.generateReport(gamesData);
      
    } catch (error) {
      console.error('❌ 更新失败:', error);
    }
  }

  /**
   * 生成统计报告
   * @param {Array} games - 游戏数组
   */
  generateReport(games) {
    console.log('\n📈 基础人气值统计报告:');
    console.log('='.repeat(50));
    
    // 按分类统计
    const categoryStats = {};
    games.forEach(game => {
      if (!categoryStats[game.category]) {
        categoryStats[game.category] = {
          count: 0,
          totalPlayCount: 0,
          avgPlayCount: 0,
          minPlayCount: Infinity,
          maxPlayCount: 0
        };
      }
      
      const stats = categoryStats[game.category];
      stats.count++;
      stats.totalPlayCount += game.playCount;
      stats.minPlayCount = Math.min(stats.minPlayCount, game.playCount);
      stats.maxPlayCount = Math.max(stats.maxPlayCount, game.playCount);
    });
    
    // 计算平均值
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.avgPlayCount = Math.round(stats.totalPlayCount / stats.count);
    });
    
    // 输出统计信息
    console.log('📊 分类统计:');
    Object.entries(categoryStats).forEach(([category, stats]) => {
      console.log(`  ${category.toUpperCase()}: ${stats.count}个游戏, 平均${stats.avgPlayCount}次播放 (${stats.minPlayCount}-${stats.maxPlayCount})`);
    });
    
    // 特色游戏统计
    const featuredGames = games.filter(game => game.featured);
    const trendingGames = games.filter(game => game.trending);
    const newGames = games.filter(game => game.isNew);
    
    console.log('\n🌟 特色游戏统计:');
    console.log(`  精选游戏: ${featuredGames.length}个`);
    console.log(`  热门游戏: ${trendingGames.length}个`);
    console.log(`  新游戏: ${newGames.length}个`);
    
    // 人气值分布
    const playCountRanges = {
      '0-100': 0,
      '101-300': 0,
      '301-600': 0,
      '601-1000': 0,
      '1000+': 0
    };
    
    games.forEach(game => {
      const playCount = game.playCount;
      if (playCount <= 100) playCountRanges['0-100']++;
      else if (playCount <= 300) playCountRanges['101-300']++;
      else if (playCount <= 600) playCountRanges['301-600']++;
      else if (playCount <= 1000) playCountRanges['601-1000']++;
      else playCountRanges['1000+']++;
    });
    
    console.log('\n📈 人气值分布:');
    Object.entries(playCountRanges).forEach(([range, count]) => {
      console.log(`  ${range}次: ${count}个游戏`);
    });
    
    const totalPlayCount = games.reduce((sum, game) => sum + game.playCount, 0);
    const avgPlayCount = Math.round(totalPlayCount / games.length);
    
    console.log(`\n📊 总体统计:`);
    console.log(`  总游戏数: ${games.length}`);
    console.log(`  总基础人气值: ${totalPlayCount.toLocaleString()}`);
    console.log(`  平均基础人气值: ${avgPlayCount}`);
    console.log(`\n🎯 现在刷新页面，人气值将正常显示！`);
  }
}

// 执行脚本
const generator = new BasePlayCountGenerator();
generator.updateAllPlayCounts();

export default BasePlayCountGenerator; 