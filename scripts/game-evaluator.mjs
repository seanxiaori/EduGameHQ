/**
 * 游戏质量评估系统
 * 基于规则的智能评分，无需AI API
 * 
 * 评分维度（总分100分）：
 * 1. 来源评分 (30分) - 基于来源网站的评分
 * 2. 热度评分 (25分) - 基于播放次数
 * 3. 技术评分 (20分) - HTML5、响应式、移动端支持
 * 4. 安全评分 (15分) - 内容安全检测
 * 5. 新鲜度评分 (10分) - 游戏更新时间
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 读取配置文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'game-sources-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

/**
 * 1. 来源评分（最高30分）
 * 基于游戏在来源网站的评分
 */
function evaluateSourceRating(game) {
  const rating = game.rating || 0;
  
  // 评分范围：0-5，转换为0-30分
  // rating * 6 = 最高30分
  const score = Math.min(rating * 6, 30);
  
  return {
    score,
    maxScore: 30,
    details: `来源评分: ${rating}/5 → ${score.toFixed(1)}分`
  };
}

/**
 * 2. 热度评分（最高25分）
 * 基于游戏播放次数，使用对数函数避免极值影响
 */
function evaluatePopularity(game) {
  const playCount = game.playCount || 0;
  
  if (playCount === 0) {
    return {
      score: 0,
      maxScore: 25,
      details: '无播放数据'
    };
  }
  
  // 使用对数函数：log10(playCount) * 2.5
  // 10,000次播放 = 10分
  // 100,000次 = 12.5分
  // 1,000,000次 = 15分
  // 10,000,000次 = 17.5分
  const score = Math.min(Math.log10(playCount) * 2.5, 25);
  
  return {
    score,
    maxScore: 25,
    details: `播放次数: ${playCount.toLocaleString()} → ${score.toFixed(1)}分`
  };
}

/**
 * 3. 技术评分（最高20分）
 * 评估游戏的技术特性
 */
function evaluateTechnology(game) {
  let score = 0;
  const details = [];
  
  // HTML5技术：基础15分
  if (game.technology === 'HTML5' || !game.requiresFlash) {
    score += 15;
    details.push('✅ HTML5技术 (+15)');
  } else if (game.technology === 'Flash' || game.requiresFlash) {
    details.push('❌ Flash技术 (0)');
  } else {
    score += 10;
    details.push('⚠️ 未知技术 (+10)');
  }
  
  // 响应式设计：+3分
  if (game.responsive) {
    score += 3;
    details.push('✅ 响应式 (+3)');
  }
  
  // 移动端支持：+2分
  if (game.mobileSupport) {
    score += 2;
    details.push('✅ 移动端 (+2)');
  }
  
  return {
    score: Math.min(score, 20),
    maxScore: 20,
    details: details.join(', ')
  };
}

/**
 * 4. 安全评分（最高15分）
 * 检测游戏内容是否安全适合儿童
 */
function evaluateSafety(game) {
  const blacklist = config.blacklist || [];
  const textToCheck = [
    game.title,
    game.description,
    ...(game.tags || [])
  ].join(' ').toLowerCase();
  
  let score = 15; // 默认满分
  const issues = [];
  
  // 检查黑名单关键词
  for (const keyword of blacklist) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      score = 0;
      issues.push(`⛔ 包含敏感词: ${keyword}`);
    }
  }
  
  // 检查iframe兼容性
  if (!game.iframeCompatible && game.iframeUrl) {
    score -= 5;
    issues.push('⚠️ iframe兼容性未确认 (-5)');
  }
  
  return {
    score: Math.max(score, 0),
    maxScore: 15,
    details: issues.length > 0 ? issues.join(', ') : '✅ 内容安全',
    safe: score > 0
  };
}

/**
 * 5. 新鲜度评分（最高10分）
 * 评估游戏的更新时间
 */
function evaluateFreshness(game) {
  const lastUpdated = game.lastUpdated || game.releaseDate;
  
  if (!lastUpdated) {
    return {
      score: 5,
      maxScore: 10,
      details: '无更新信息 (默认5分)'
    };
  }
  
  try {
    const updateDate = new Date(lastUpdated);
    const now = new Date();
    const daysOld = Math.floor((now - updateDate) / (1000 * 60 * 60 * 24));
    
    let score;
    let detail;
    
    if (daysOld <= 30) {
      score = 10;
      detail = '最近30天内更新';
    } else if (daysOld <= 90) {
      score = 8;
      detail = '最近3个月内更新';
    } else if (daysOld <= 180) {
      score = 6;
      detail = '最近半年内更新';
    } else if (daysOld <= 365) {
      score = 4;
      detail = '最近1年内更新';
    } else {
      score = 2;
      detail = `${Math.floor(daysOld / 365)}年前更新`;
    }
    
    return {
      score,
      maxScore: 10,
      details: `${detail} → ${score}分`
    };
  } catch (e) {
    return {
      score: 5,
      maxScore: 10,
      details: '日期格式错误 (默认5分)'
    };
  }
}

/**
 * 综合评估游戏
 * @param {Object} game - 游戏对象
 * @returns {Object} 评估结果
 */
export function evaluateGame(game) {
  // 执行各项评分
  const sourceRating = evaluateSourceRating(game);
  const popularity = evaluatePopularity(game);
  const technology = evaluateTechnology(game);
  const safety = evaluateSafety(game);
  const freshness = evaluateFreshness(game);
  
  // 计算总分
  const totalScore = 
    sourceRating.score +
    popularity.score +
    technology.score +
    safety.score +
    freshness.score;
  
  // 计算百分比
  const percentage = (totalScore / 100) * 100;
  
  // 评级
  let grade;
  if (percentage >= 90) grade = 'S';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else grade = 'D';
  
  return {
    game: {
      slug: game.slug,
      title: game.title,
      category: game.category
    },
    scores: {
      sourceRating,
      popularity,
      technology,
      safety,
      freshness
    },
    totalScore: Math.round(totalScore * 10) / 10,
    percentage: Math.round(percentage),
    grade,
    passed: totalScore >= (config.filters?.minScore || 70) && safety.safe,
    recommendation: getRecommendation(totalScore, safety.safe)
  };
}

/**
 * 获取推荐建议
 */
function getRecommendation(score, isSafe) {
  if (!isSafe) {
    return '❌ 不推荐 - 内容安全问题';
  }
  
  if (score >= 90) {
    return '⭐⭐⭐⭐⭐ 强烈推荐 - 优质游戏';
  } else if (score >= 80) {
    return '⭐⭐⭐⭐ 推荐 - 质量良好';
  } else if (score >= 70) {
    return '⭐⭐⭐ 可以考虑 - 基本合格';
  } else if (score >= 60) {
    return '⭐⭐ 谨慎考虑 - 质量一般';
  } else {
    return '⭐ 不推荐 - 质量较差';
  }
}

/**
 * 批量评估游戏
 */
export function evaluateBatch(games) {
  const evaluations = games.map(game => evaluateGame(game));
  
  // 统计
  const passed = evaluations.filter(e => e.passed);
  const failed = evaluations.filter(e => !e.passed);
  
  // 按分数排序
  const sorted = [...evaluations].sort((a, b) => b.totalScore - a.totalScore);
  
  return {
    evaluations,
    sorted,
    stats: {
      total: games.length,
      passed: passed.length,
      failed: failed.length,
      averageScore: evaluations.reduce((sum, e) => sum + e.totalScore, 0) / games.length
    }
  };
}

/**
 * 生成评估报告
 */
export function generateEvaluationReport(evaluation) {
  const { game, scores, totalScore, percentage, grade, passed, recommendation } = evaluation;
  
  let report = '\n' + '='.repeat(60) + '\n';
  report += `🎮 ${game.title}\n`;
  report += `📁 分类: ${game.category} | Slug: ${game.slug}\n`;
  report += '='.repeat(60) + '\n\n';
  
  report += '📊 评分详情:\n';
  report += `  1️⃣ 来源评分: ${scores.sourceRating.score.toFixed(1)}/${scores.sourceRating.maxScore} - ${scores.sourceRating.details}\n`;
  report += `  2️⃣ 热度评分: ${scores.popularity.score.toFixed(1)}/${scores.popularity.maxScore} - ${scores.popularity.details}\n`;
  report += `  3️⃣ 技术评分: ${scores.technology.score.toFixed(1)}/${scores.technology.maxScore} - ${scores.technology.details}\n`;
  report += `  4️⃣ 安全评分: ${scores.safety.score.toFixed(1)}/${scores.safety.maxScore} - ${scores.safety.details}\n`;
  report += `  5️⃣ 新鲜度: ${scores.freshness.score.toFixed(1)}/${scores.freshness.maxScore} - ${scores.freshness.details}\n`;
  report += '\n';
  
  report += `📈 综合得分: ${totalScore}/100 (${percentage}%) - 等级: ${grade}\n`;
  report += `🎯 评估结果: ${passed ? '✅ 通过' : '❌ 未通过'}\n`;
  report += `💡 推荐建议: ${recommendation}\n`;
  report += '='.repeat(60) + '\n';
  
  return report;
}

// 如果直接运行此脚本，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 测试游戏评估系统...\n');
  
  const testGames = [
    {
      slug: 'test-math-game',
      title: 'Math Master',
      category: 'math',
      description: 'A fun math game for kids',
      rating: 4.5,
      playCount: 150000,
      technology: 'HTML5',
      responsive: true,
      mobileSupport: true,
      iframeCompatible: true,
      lastUpdated: '2025-09-15',
      tags: ['math', 'education']
    },
    {
      slug: 'test-old-game',
      title: 'Old Flash Game',
      category: 'puzzle',
      description: 'An old puzzle game',
      rating: 3.0,
      playCount: 5000,
      technology: 'Flash',
      requiresFlash: true,
      iframeCompatible: false,
      lastUpdated: '2020-01-01',
      tags: ['puzzle']
    }
  ];
  
  const result = evaluateBatch(testGames);
  
  console.log('\n📊 批量评估结果:');
  console.log(`总计: ${result.stats.total} 个游戏`);
  console.log(`✅ 通过: ${result.stats.passed} 个`);
  console.log(`❌ 未通过: ${result.stats.failed} 个`);
  console.log(`📊 平均分: ${result.stats.averageScore.toFixed(1)}\n`);
  
  result.sorted.forEach(evaluation => {
    console.log(generateEvaluationReport(evaluation));
  });
}

