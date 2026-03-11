#!/usr/bin/env node
import fs from 'fs';
import levenshtein from 'fast-levenshtein';

// 读取现有游戏
const existingGames = JSON.parse(fs.readFileSync('src/data/games.json', 'utf-8'));

// 读取候选游戏
const candidates = JSON.parse(fs.readFileSync('output/search-results.json', 'utf-8'));

console.log('🔍 检测重复游戏...\n');

const results = {
  duplicates: [],
  unique: [],
  needsReview: []
};

for (const candidate of candidates) {
  console.log(`检查: ${candidate.name}`);

  // 1. URL精确匹配
  const urlMatch = existingGames.find(g =>
    (g.iframeUrl && g.iframeUrl === candidate.homepage) ||
    (g.sourceUrl && candidate.sourceUrl && g.sourceUrl === candidate.sourceUrl)
  );

  if (urlMatch) {
    console.log(`  ❌ 重复 - URL匹配: ${urlMatch.slug}`);
    results.duplicates.push({
      candidate: candidate.name,
      reason: 'URL match',
      existing: urlMatch.slug
    });
    continue;
  }

  // 2. 标题相似度
  let titleMatch = null;
  let minDistance = Infinity;

  for (const game of existingGames) {
    const dist = levenshtein.get(
      candidate.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      game.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    if (dist < minDistance) {
      minDistance = dist;
      titleMatch = game;
    }
  }

  if (minDistance < 3) {
    console.log(`  ⚠️ 可能重复 - 标题相似: ${titleMatch.slug} (距离${minDistance})`);
    results.needsReview.push({
      candidate: candidate.name,
      reason: `Title similar (distance ${minDistance})`,
      existing: titleMatch.slug,
      candidateData: candidate
    });
    continue;
  }

  console.log(`  ✅ 唯一游戏`);
  results.unique.push(candidate);
}

// 保存结果
fs.writeFileSync('output/duplicate-check.json', JSON.stringify(results, null, 2));

console.log(`\n📊 检测结果:`);
console.log(`  重复: ${results.duplicates.length}`);
console.log(`  需要审核: ${results.needsReview.length}`);
console.log(`  唯一: ${results.unique.length}`);
console.log(`\n📄 结果: output/duplicate-check.json`);
