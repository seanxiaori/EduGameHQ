#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const catalogPath = path.join(projectRoot, 'src', 'data', 'games.json');
const games = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const requiredFields = [
  'slug',
  'title',
  'category',
  'categoryName',
  'iframeUrl',
  'description',
  'thumbnailUrl',
  'difficulty',
  'ageRange',
  'minAge',
  'maxAge',
  'sourceUrl',
  'gameGuide',
  'developer',
  'technology',
  'uiLanguages',
  'languageSupportLevel',
];

const validCategories = new Set([
  'math',
  'science',
  'coding',
  'language',
  'puzzle',
  'sports',
  'art',
  'adventure',
  'creative',
  'memory',
  'geography',
  'strategy',
  'arcade',
]);

const validDifficulty = new Set(['Easy', 'Medium', 'Hard']);
const errors = [];
const warnings = [];
const seenSlugs = new Set();
const seenIframeUrls = new Set();

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

for (const game of games) {
  const label = game.slug || game.title || '(unknown game)';

  if (seenSlugs.has(game.slug)) errors.push(`${label}: duplicate slug`);
  if (game.slug) seenSlugs.add(game.slug);

  if (seenIframeUrls.has(game.iframeUrl)) warnings.push(`${label}: duplicate iframeUrl`);
  if (game.iframeUrl) seenIframeUrls.add(game.iframeUrl);

  for (const field of requiredFields) {
    if (isMissing(game[field])) errors.push(`${label}: missing ${field}`);
  }

  if (game.category && !validCategories.has(game.category)) errors.push(`${label}: invalid category ${game.category}`);
  if (game.difficulty && !validDifficulty.has(game.difficulty)) errors.push(`${label}: invalid difficulty ${game.difficulty}`);
  if (typeof game.minAge !== 'number' || typeof game.maxAge !== 'number' || game.minAge > game.maxAge) {
    errors.push(`${label}: invalid age range`);
  }
  if (game.iframeUrl && !game.iframeUrl.startsWith('https://')) errors.push(`${label}: iframeUrl must use https`);
  if (game.thumbnailUrl && !game.thumbnailUrl.startsWith('https://') && !game.thumbnailUrl.startsWith('/')) {
    errors.push(`${label}: thumbnailUrl must be https or site-relative`);
  }
  if (!Array.isArray(game.tags) || game.tags.length < 3) warnings.push(`${label}: fewer than 3 tags`);
  if (!game.gameGuide?.howToPlay?.length) errors.push(`${label}: gameGuide.howToPlay missing`);
  if (!game.gameGuide?.controls || Object.keys(game.gameGuide.controls).length === 0) errors.push(`${label}: gameGuide.controls missing`);
  if (!game.gameGuide?.tips?.length) errors.push(`${label}: gameGuide.tips missing`);
}

const hostCounts = new Map();
for (const game of games) {
  try {
    const host = new URL(game.iframeUrl).hostname;
    hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
  } catch {
    errors.push(`${game.slug}: invalid iframeUrl`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  totalGames: games.length,
  errors,
  warnings,
  topIframeHosts: Array.from(hostCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20),
};

fs.mkdirSync(path.join(projectRoot, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(projectRoot, 'tmp', 'game-catalog-validation-report.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Catalog games: ${games.length}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log('Top iframe hosts:');
for (const [host, count] of report.topIframeHosts.slice(0, 10)) {
  console.log(`- ${host}: ${count}`);
}
console.log('Report: tmp/game-catalog-validation-report.json');

if (errors.length > 0) {
  for (const error of errors.slice(0, 30)) console.log(`[ERROR] ${error}`);
  process.exit(1);
}
