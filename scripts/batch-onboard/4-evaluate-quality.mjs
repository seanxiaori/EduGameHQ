#!/usr/bin/env node
import fs from 'fs';

const games = JSON.parse(fs.readFileSync('output/url-verification.json')).passed;

console.log('⭐ 评估游戏质量...\n');

function evaluateQuality(game) {
  let score = 0;

  // GitHub指标 (40分)
  score += Math.min(game.stars / 10, 20);  // Stars: 最高20分

  // 技术质量 (30分)
  if (game.homepage) score += 10;  // 有Demo
  if (game.description) score += 10;  // 有描述

  // 游戏体验 (30分)
  if (game.urlCheck?.accessible) score += 15;  // URL可访问
  if (!game.urlCheck?.iframeBlocked) score += 15;  // iframe兼容

  return Math.round(score);
}

function rateGame(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'acceptable';
  return 'poor';
}

const results = {
  excellent: [],
  good: [],
  acceptable: [],
  poor: []
};

for (const game of games) {
  const score = evaluateQuality(game);
  const rating = rateGame(score);

  console.log(`${game.name}: ${score}分 (${rating})`);

  results[rating].push({ ...game, qualityScore: score, rating });
}

fs.writeFileSync('output/quality-report.json', JSON.stringify(results, null, 2));

console.log(`\n📊 质量评估:`);
console.log(`  精品 (excellent): ${results.excellent.length}`);
console.log(`  优质 (good): ${results.good.length}`);
console.log(`  合格 (acceptable): ${results.acceptable.length}`);
console.log(`  不推荐 (poor): ${results.poor.length}`);
console.log(`\n📄 结果: output/quality-report.json`);
