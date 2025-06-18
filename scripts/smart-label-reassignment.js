/**
 * 智能游戏标签重新分配脚本
 * 根据游戏内容、复杂度和教育价值重新分配标签
 */

import fs from 'fs';
import path from 'path';

// 智能标签分配规则
const LABEL_RULES = {
  // 难度评估规则
  difficulty: {
    easy: {
      keywords: ['simple', 'basic', 'easy', 'beginner', 'kids', 'fun', 'color', 'match'],
      ageRange: [4, 10],
      complexity: ['counting', 'simple math', 'color recognition', 'basic patterns']
    },
    medium: {
      keywords: ['strategy', 'puzzle', 'logic', 'merge', 'numbers', 'math', 'problem-solving'],
      ageRange: [8, 16],
      complexity: ['arithmetic', 'spatial reasoning', 'pattern recognition', 'strategic thinking']
    },
    hard: {
      keywords: ['complex', 'advanced', 'code', 'cipher', 'programming', 'algorithm', 'physics'],
      ageRange: [12, 18],
      complexity: ['advanced math', 'coding', 'complex logic', 'scientific concepts']
    }
  },

  // 年龄范围精确化规则
  ageRefinement: {
    'math': {
      'easy': [6, 12],
      'medium': [8, 16], 
      'hard': [10, 18]
    },
    'science': {
      'easy': [8, 14],
      'medium': [10, 16],
      'hard': [12, 18]
    },
    'language': {
      'easy': [6, 12],
      'medium': [8, 16],
      'hard': [10, 18]
    },
    'puzzle': {
      'easy': [6, 14],
      'medium': [8, 16],
      'hard': [10, 18]
    },
    'sports': {
      'easy': [6, 14],
      'medium': [8, 16],
      'hard': [10, 18]
    },
    'art': {
      'easy': [4, 12],
      'medium': [6, 16],
      'hard': [8, 18]
    }
  },

  // Trending游戏选择规则（每个分类1-2款最具代表性）
  trending: {
    'math': ['2048', 'drop-merge-the-numbers'],
    'science': ['little-alchemy-2', 'solar-system-scope'],
    'language': ['words-of-wonders', 'crossword-connect'],
    'puzzle': ['cut-the-rope', 'nuts-puzzle-sort-by-color'],
    'sports': ['table-tennis-world-tour', 'basket-random'],
    'art': ['skribblio', 'pottery-master']
  },

  // Featured游戏选择规则（每个分类2-3款高质量游戏）
  featured: {
    'math': ['2048', 'math-duck', 'five-o'],
    'science': ['little-alchemy-2', 'solar-system-scope', 'mini-scientist'],
    'language': ['words-of-wonders', 'crossword-connect', 'emoji-puzzle'],
    'puzzle': ['cut-the-rope', 'blockbuster-puzzle', 'find-the-difference'],
    'sports': ['table-tennis-world-tour', 'draw-climber', 'basket-random'],
    'art': ['skribblio', 'pottery-master', 'virtual-piano']
  },

  // NEW游戏规则（2024年7月后更新的游戏）
  newGameCutoff: '2024-07-01'
};

/**
 * 分析游戏内容并评估难度
 */
function analyzeDifficulty(game) {
  const content = `${game.title} ${game.description} ${game.tags.join(' ')}`.toLowerCase();
  
  // 检查困难关键词
  const hardKeywords = LABEL_RULES.difficulty.hard.keywords;
  const hardScore = hardKeywords.filter(keyword => content.includes(keyword)).length;
  
  // 检查简单关键词
  const easyKeywords = LABEL_RULES.difficulty.easy.keywords;
  const easyScore = easyKeywords.filter(keyword => content.includes(keyword)).length;
  
  // 检查中等关键词
  const mediumKeywords = LABEL_RULES.difficulty.medium.keywords;
  const mediumScore = mediumKeywords.filter(keyword => content.includes(keyword)).length;
  
  // 特殊规则判断
  if (content.includes('code') || content.includes('cipher') || content.includes('programming')) {
    return 'Hard';
  }
  
  if (content.includes('kids') || content.includes('simple') || content.includes('basic')) {
    return 'Easy';
  }
  
  // 基于分数判断
  if (hardScore >= 2) return 'Hard';
  if (easyScore >= 2) return 'Easy';
  if (mediumScore >= 1 || (hardScore === 1 && easyScore === 0)) return 'Medium';
  
  // 默认中等难度
  return 'Medium';
}

/**
 * 根据分类和难度精确化年龄范围
 */
function refineAgeRange(category, difficulty) {
  const ranges = LABEL_RULES.ageRefinement[category];
  if (!ranges) return [6, 16]; // 默认范围
  
  const range = ranges[difficulty.toLowerCase()];
  return range || [6, 16];
}

/**
 * 判断是否为NEW游戏
 */
function isNewGame(lastUpdated) {
  const cutoffDate = new Date(LABEL_RULES.newGameCutoff);
  const updateDate = new Date(lastUpdated);
  return updateDate >= cutoffDate;
}

/**
 * 判断是否为Trending游戏
 */
function isTrendingGame(slug, category) {
  const trendingGames = LABEL_RULES.trending[category] || [];
  return trendingGames.includes(slug);
}

/**
 * 判断是否为Featured游戏
 */
function isFeaturedGame(slug, category) {
  const featuredGames = LABEL_RULES.featured[category] || [];
  return featuredGames.includes(slug);
}

/**
 * 智能重新分配游戏标签
 */
function reassignGameLabels(game) {
  const updatedGame = { ...game };
  
  // 1. 重新评估难度
  const newDifficulty = analyzeDifficulty(game);
  updatedGame.difficulty = newDifficulty;
  
  // 2. 精确化年龄范围
  const [minAge, maxAge] = refineAgeRange(game.category, newDifficulty);
  updatedGame.minAge = minAge;
  updatedGame.maxAge = maxAge;
  updatedGame.ageRange = `${minAge}-${maxAge}`;
  
  // 3. 重新分配NEW标签
  updatedGame.isNew = isNewGame(game.lastUpdated);
  
  // 4. 重新分配Trending标签
  updatedGame.trending = isTrendingGame(game.slug, game.category);
  
  // 5. 重新分配Featured标签
  updatedGame.featured = isFeaturedGame(game.slug, game.category);
  
  return updatedGame;
}

/**
 * 处理所有游戏数据
 */
async function processAllGames() {
  try {
    console.log('🚀 开始智能标签重新分配...\n');
    
    // 读取游戏数据
    const gamesPath = path.join(process.cwd(), '..', 'src', 'data', 'games.json');
    const gamesData = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));
    
    console.log(`📊 总共找到 ${gamesData.length} 款游戏`);
    
    // 统计原始标签分布
    const originalStats = {
      difficulty: { Easy: 0, Medium: 0, Hard: 0 },
      isNew: 0,
      trending: 0,
      featured: 0,
      categories: {}
    };
    
    gamesData.forEach(game => {
      originalStats.difficulty[game.difficulty]++;
      if (game.isNew) originalStats.isNew++;
      if (game.trending) originalStats.trending++;
      if (game.featured) originalStats.featured++;
      
      if (!originalStats.categories[game.category]) {
        originalStats.categories[game.category] = 0;
      }
      originalStats.categories[game.category]++;
    });
    
    console.log('\n📋 原始标签分布:');
    console.log('难度分布:', originalStats.difficulty);
    console.log('NEW游戏:', originalStats.isNew);
    console.log('Trending游戏:', originalStats.trending);
    console.log('Featured游戏:', originalStats.featured);
    console.log('分类分布:', originalStats.categories);
    
    // 重新分配所有游戏标签
    const updatedGames = gamesData.map((game, index) => {
      const updatedGame = reassignGameLabels(game);
      
      // 显示进度
      if ((index + 1) % 10 === 0) {
        console.log(`✅ 已处理 ${index + 1}/${gamesData.length} 款游戏`);
      }
      
      return updatedGame;
    });
    
    // 统计更新后的标签分布
    const newStats = {
      difficulty: { Easy: 0, Medium: 0, Hard: 0 },
      isNew: 0,
      trending: 0,
      featured: 0,
      categories: {}
    };
    
    updatedGames.forEach(game => {
      newStats.difficulty[game.difficulty]++;
      if (game.isNew) newStats.isNew++;
      if (game.trending) newStats.trending++;
      if (game.featured) newStats.featured++;
      
      if (!newStats.categories[game.category]) {
        newStats.categories[game.category] = 0;
      }
      newStats.categories[game.category]++;
    });
    
    console.log('\n🎯 更新后标签分布:');
    console.log('难度分布:', newStats.difficulty);
    console.log('NEW游戏:', newStats.isNew);
    console.log('Trending游戏:', newStats.trending);
    console.log('Featured游戏:', newStats.featured);
    
    // 显示详细的Trending和Featured游戏列表
    console.log('\n🔥 Trending游戏列表:');
    Object.keys(LABEL_RULES.trending).forEach(category => {
      console.log(`  ${category.toUpperCase()}: ${LABEL_RULES.trending[category].join(', ')}`);
    });
    
    console.log('\n⭐ Featured游戏列表:');
    Object.keys(LABEL_RULES.featured).forEach(category => {
      console.log(`  ${category.toUpperCase()}: ${LABEL_RULES.featured[category].join(', ')}`);
    });
    
    // 保存更新后的数据
    fs.writeFileSync(gamesPath, JSON.stringify(updatedGames, null, 2), 'utf-8');
    
    console.log('\n🎉 标签重新分配完成！');
    console.log(`📁 已更新文件: ${gamesPath}`);
    
    // 生成标签分配报告
    const report = {
      timestamp: new Date().toISOString(),
      totalGames: updatedGames.length,
      originalStats,
      newStats,
      changes: {
        difficultyChanges: 0,
        ageRangeChanges: 0,
        newStatusChanges: 0,
        trendingChanges: 0,
        featuredChanges: 0
      },
      trendingGames: LABEL_RULES.trending,
      featuredGames: LABEL_RULES.featured
    };
    
    // 计算变化统计
    gamesData.forEach((original, index) => {
      const updated = updatedGames[index];
      if (original.difficulty !== updated.difficulty) report.changes.difficultyChanges++;
      if (original.ageRange !== updated.ageRange) report.changes.ageRangeChanges++;
      if (original.isNew !== updated.isNew) report.changes.newStatusChanges++;
      if (original.trending !== updated.trending) report.changes.trendingChanges++;
      if (original.featured !== updated.featured) report.changes.featuredChanges++;
    });
    
    // 保存报告
    const reportPath = path.join(process.cwd(), `label-reassignment-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    console.log(`📊 详细报告已保存: ${reportPath}`);
    console.log('\n📈 标签变化统计:');
    console.log(`  难度变化: ${report.changes.difficultyChanges} 款游戏`);
    console.log(`  年龄范围变化: ${report.changes.ageRangeChanges} 款游戏`);
    console.log(`  NEW状态变化: ${report.changes.newStatusChanges} 款游戏`);
    console.log(`  Trending状态变化: ${report.changes.trendingChanges} 款游戏`);
    console.log(`  Featured状态变化: ${report.changes.featuredChanges} 款游戏`);
    
  } catch (error) {
    console.error('❌ 标签重新分配过程中出错:', error);
  }
}

// 运行脚本
processAllGames().catch(console.error); 