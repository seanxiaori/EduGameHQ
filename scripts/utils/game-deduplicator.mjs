/**
 * 游戏去重检测工具
 * 功能：防止重复收录游戏
 * 
 * 检测方法：
 * 1. URL完全匹配
 * 2. 标题相似度（Levenshtein距离）
 * 3. Slug冲突检测
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 计算两个字符串的Levenshtein距离（编辑距离）
 * 用于判断标题相似度
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 删除
        matrix[i][j - 1] + 1,      // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 计算两个字符串的相似度（0-1之间）
 * 1表示完全相同，0表示完全不同
 */
function similarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * 标准化字符串（用于比较）
 * - 转小写
 * - 移除特殊字符
 * - 移除多余空格
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 从URL提取域名
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return '';
  }
}

/**
 * 生成游戏的唯一指纹
 * 基于标题和URL
 */
function generateFingerprint(game) {
  const normalizedTitle = normalizeString(game.title);
  const domain = extractDomain(game.iframeUrl || game.sourceUrl || '');
  return `${normalizedTitle}::${domain}`;
}

/**
 * 检查游戏是否重复
 * @param {Object} newGame - 待检查的新游戏
 * @param {Array} existingGames - 已存在的游戏列表
 * @param {Object} options - 检测选项
 * @returns {Object} { isDuplicate: boolean, reason: string, matchedGame: Object }
 */
export function checkDuplicate(newGame, existingGames, options = {}) {
  const {
    titleSimilarityThreshold = 0.85, // 标题相似度阈值
    checkUrl = true,                  // 是否检查URL
    checkSlug = true,                 // 是否检查slug
    checkFingerprint = true           // 是否检查指纹
  } = options;

  // 1. 检查slug冲突
  if (checkSlug && newGame.slug) {
    const slugMatch = existingGames.find(g => g.slug === newGame.slug);
    if (slugMatch) {
      return {
        isDuplicate: true,
        reason: 'Slug已存在',
        matchedGame: slugMatch,
        confidence: 1.0
      };
    }
  }

  // 2. 检查URL完全匹配
  if (checkUrl && newGame.iframeUrl) {
    const urlMatch = existingGames.find(g => 
      g.iframeUrl === newGame.iframeUrl ||
      g.sourceUrl === newGame.iframeUrl
    );
    if (urlMatch) {
      return {
        isDuplicate: true,
        reason: 'URL完全匹配',
        matchedGame: urlMatch,
        confidence: 1.0
      };
    }
  }

  // 3. 检查标题相似度
  const normalizedNewTitle = normalizeString(newGame.title);
  for (const existingGame of existingGames) {
    const normalizedExistingTitle = normalizeString(existingGame.title);
    const titleSimilarity = similarity(normalizedNewTitle, normalizedExistingTitle);
    
    if (titleSimilarity >= titleSimilarityThreshold) {
      // 标题相似，进一步检查是否来自同一来源
      const newDomain = extractDomain(newGame.iframeUrl || newGame.sourceUrl || '');
      const existingDomain = extractDomain(existingGame.iframeUrl || existingGame.sourceUrl || '');
      
      if (newDomain && existingDomain && newDomain === existingDomain) {
        return {
          isDuplicate: true,
          reason: `标题高度相似 (${(titleSimilarity * 100).toFixed(1)}%) 且来源相同`,
          matchedGame: existingGame,
          confidence: titleSimilarity
        };
      }
    }
  }

  // 4. 检查指纹
  if (checkFingerprint) {
    const newFingerprint = generateFingerprint(newGame);
    const fingerprintMatch = existingGames.find(g => 
      generateFingerprint(g) === newFingerprint
    );
    if (fingerprintMatch) {
      return {
        isDuplicate: true,
        reason: '游戏指纹匹配',
        matchedGame: fingerprintMatch,
        confidence: 0.9
      };
    }
  }

  return {
    isDuplicate: false,
    reason: '未发现重复',
    matchedGame: null,
    confidence: 0
  };
}

/**
 * 批量去重
 * @param {Array} newGames - 待检查的新游戏列表
 * @param {Array} existingGames - 已存在的游戏列表
 * @returns {Object} { unique: Array, duplicates: Array }
 */
export function deduplicateBatch(newGames, existingGames) {
  const unique = [];
  const duplicates = [];
  const processedFingerprints = new Set();

  for (const newGame of newGames) {
    // 先检查在新游戏列表内部是否重复
    const fingerprint = generateFingerprint(newGame);
    if (processedFingerprints.has(fingerprint)) {
      duplicates.push({
        game: newGame,
        reason: '在本批次中重复',
        matchedGame: null
      });
      continue;
    }

    // 检查与现有游戏是否重复
    const duplicateCheck = checkDuplicate(newGame, existingGames);
    
    if (duplicateCheck.isDuplicate) {
      duplicates.push({
        game: newGame,
        ...duplicateCheck
      });
    } else {
      unique.push(newGame);
      processedFingerprints.add(fingerprint);
    }
  }

  return {
    unique,
    duplicates,
    stats: {
      total: newGames.length,
      unique: unique.length,
      duplicates: duplicates.length
    }
  };
}

/**
 * 加载现有游戏数据
 */
export function loadExistingGames() {
  try {
    const gamesPath = path.join(__dirname, '../../src/data/games.json');
    const gamesData = fs.readFileSync(gamesPath, 'utf-8');
    return JSON.parse(gamesData);
  } catch (error) {
    console.error('❌ 加载现有游戏数据失败:', error.message);
    return [];
  }
}

/**
 * 生成去重报告
 */
export function generateDeduplicationReport(result) {
  const { unique, duplicates, stats } = result;
  
  let report = '\n📊 去重检测报告\n';
  report += '━'.repeat(50) + '\n';
  report += `总计游戏: ${stats.total}\n`;
  report += `✅ 唯一游戏: ${stats.unique}\n`;
  report += `❌ 重复游戏: ${stats.duplicates}\n`;
  report += '━'.repeat(50) + '\n';

  if (duplicates.length > 0) {
    report += '\n🔍 重复游戏详情:\n';
    duplicates.forEach((dup, index) => {
      report += `\n${index + 1}. ${dup.game.title}\n`;
      report += `   原因: ${dup.reason}\n`;
      if (dup.matchedGame) {
        report += `   匹配: ${dup.matchedGame.title}\n`;
      }
      report += `   置信度: ${(dup.confidence * 100).toFixed(1)}%\n`;
    });
  }

  return report;
}

// 如果直接运行此脚本，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 测试去重功能...\n');
  
  const existingGames = loadExistingGames();
  console.log(`📚 已加载 ${existingGames.length} 个现有游戏\n`);
  
  // 测试用例
  const testGames = [
    {
      slug: 'test-game-1',
      title: 'Math Adventure',
      iframeUrl: 'https://example.com/game1'
    },
    {
      slug: 'test-game-2',
      title: 'Math Adventur',  // 相似标题
      iframeUrl: 'https://example.com/game2'
    }
  ];
  
  const result = deduplicateBatch(testGames, existingGames);
  console.log(generateDeduplicationReport(result));
}

