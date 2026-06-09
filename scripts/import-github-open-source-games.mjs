#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';
import { chromium } from 'playwright';

const projectRoot = process.cwd();
const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  args.set(key, rest.join('=') || 'true');
}

const catalogPath = path.join(projectRoot, 'src', 'data', 'games.json');
const reportPath = path.join(projectRoot, args.get('report') || 'tmp/github-open-source-import-report.json');
const screenshotDir = path.join(projectRoot, 'public', 'images', 'games', 'github-quality');
const limit = Number(args.get('limit') || 25);
const maxRepos = Number(args.get('max-repos') || 180);
const minStars = Number(args.get('min-stars') || 25);
const timeoutMs = Number(args.get('timeout') || 18000);

const today = new Date().toISOString().slice(0, 10);
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
  userAgent: 'EduGameHQ-open-source-game-curator',
});

const categoryKeywords = {
  math: ['math', 'arithmetic', 'algebra', 'geometry', 'number', 'numbers', 'calculation'],
  science: ['science', 'physics', 'chemistry', 'biology', 'space', 'molecule', 'simulation'],
  coding: ['coding', 'programming', 'algorithm', 'code', 'javascript', 'regex', 'sql'],
  language: ['word', 'typing', 'spelling', 'vocabulary', 'crossword', 'hangman', 'letter'],
  puzzle: ['puzzle', 'sudoku', 'logic', 'maze', '2048', 'match', 'block', 'tile'],
  sports: ['sport', 'soccer', 'basketball', 'tennis', 'football', 'golf', 'racing'],
  art: ['art', 'paint', 'drawing', 'music', 'piano', 'guitar', 'color'],
  adventure: ['adventure', 'quest', 'platformer', 'rpg', 'dungeon', 'story'],
  creative: ['creative', 'sandbox', 'builder', 'maker', 'craft', 'pixel'],
  memory: ['memory', 'simon', 'matching', 'concentration'],
  geography: ['geography', 'map', 'flag', 'capital', 'country', 'countries'],
  strategy: ['strategy', 'chess', 'checkers', 'tactics', 'tower defense', 'turn based'],
  arcade: ['arcade', 'snake', 'pong', 'tetris', 'shooter', 'flappy', 'runner', 'retro'],
};

const categoryNames = Object.fromEntries(Object.keys(categoryKeywords).map((key) => [key, key[0].toUpperCase() + key.slice(1)]));
const educationalHooks = {
  math: 'number sense and problem solving',
  science: 'observation and systems thinking',
  coding: 'computational thinking',
  language: 'vocabulary and reading fluency',
  puzzle: 'logic and spatial reasoning',
  sports: 'timing, focus, and precision',
  art: 'creative expression and rhythm',
  adventure: 'planning and persistence',
  creative: 'creative problem solving',
  memory: 'attention and recall',
  geography: 'world knowledge',
  strategy: 'planning and decision making',
  arcade: 'reaction time and pattern recognition',
};

const localizedPhrases = {
  zh: ['通过浏览器游玩', '训练观察、反应和解决问题能力', '无需下载即可开始'],
  es: ['Juega en el navegador', 'Practica atención y resolución de problemas', 'Empieza sin descargas'],
  fr: ['Jouez dans le navigateur', 'Travaillez attention et résolution de problèmes', 'Commencez sans téléchargement'],
  de: ['Direkt im Browser spielen', 'Trainiert Aufmerksamkeit und Problemlösen', 'Ohne Download starten'],
  ja: ['ブラウザですぐ遊べます', '観察力と問題解決力を鍛えます', 'ダウンロード不要です'],
  ko: ['브라우저에서 바로 플레이', '관찰력과 문제 해결력을 연습', '다운로드 없이 시작'],
  ru: ['Играйте прямо в браузере', 'Развивает внимание и решение задач', 'Без загрузок'],
  hi: ['ब्राउज़र में तुरंत खेलें', 'ध्यान और समस्या समाधान का अभ्यास करें', 'डाउनलोड की जरूरत नहीं'],
  ar: ['العب مباشرة في المتصفح', 'درّب الانتباه وحل المشكلات', 'ابدأ دون تنزيل'],
};

const blockerTerms = [
  'engine',
  'framework',
  'library',
  'plugin',
  'template',
  'boilerplate',
  'tutorial',
  'example',
  'examples',
  'awesome',
  'collection',
  'development solution',
  'jquery',
  'list',
  'sdk',
  'editor',
  'generator',
  'emulator',
  'casino',
  'slot',
  'gambling',
  'pool',
  'billiard',
  'server',
  'multiplayer-server',
];

const queries = [
  `html5 game language:JavaScript archived:false stars:>${minStars}`,
  `canvas game language:JavaScript archived:false stars:>${minStars}`,
  `phaser game language:JavaScript archived:false stars:>${minStars}`,
  `javascript puzzle game archived:false stars:>${minStars}`,
  `javascript educational game archived:false stars:>${Math.max(5, Math.floor(minStars / 2))}`,
  `math game javascript archived:false stars:>${Math.max(5, Math.floor(minStars / 2))}`,
  `word game javascript archived:false stars:>${Math.max(5, Math.floor(minStars / 2))}`,
  `typing game javascript archived:false stars:>${Math.max(5, Math.floor(minStars / 2))}`,
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeTitle(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function titleize(value) {
  return String(value || 'Game')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function repoPageUrl(repo) {
  const homepage = String(repo.homepage || '').trim();
  if (/^https:\/\/[^/]+\.github\.io(\/|$)/i.test(homepage)) return homepage.endsWith('/') ? homepage : `${homepage}/`;
  if (repo.has_pages && repo.owner?.login && repo.name) return `https://${repo.owner.login}.github.io/${repo.name}/`;
  return '';
}

function inferCategory(repo) {
  const text = [repo.name, repo.description, ...(repo.topics || [])].join(' ').toLowerCase();
  let best = ['arcade', 0];
  for (const [category, terms] of Object.entries(categoryKeywords)) {
    const score = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
    if (score > best[1]) best = [category, score];
  }
  return best[0];
}

function inferDifficulty(repo) {
  const stars = Number(repo.stargazers_count || 0);
  const text = [repo.name, repo.description, ...(repo.topics || [])].join(' ').toLowerCase();
  if (text.includes('kids') || text.includes('simple') || text.includes('beginner')) return 'Easy';
  if (stars > 500 || text.includes('strategy') || text.includes('rpg')) return 'Hard';
  return 'Medium';
}

function ageRange(category, difficulty) {
  if (difficulty === 'Easy') return [6, 12];
  if (difficulty === 'Hard') return [10, 18];
  if (category === 'coding' || category === 'strategy') return [9, 18];
  return [8, 16];
}

function buildGuide(title, category) {
  return {
    howToPlay: [
      `Open ${title} and start from the game screen.`,
      'Use the available keyboard, mouse, or touch controls to complete each challenge.',
      `Focus on ${educationalHooks[category] || 'learning through play'} while improving your score.`,
    ],
    controls: {
      keyboard: 'Use arrow keys, WASD, Enter, Space, or the controls shown in the game.',
      mouse: 'Click, drag, or select items inside the game area when supported.',
      touch: 'Tap and swipe on mobile devices when the game supports touch input.',
    },
    tips: [
      'Play one practice round before aiming for a high score.',
      'Watch patterns carefully and adjust your strategy after each attempt.',
      'Take short breaks between rounds to keep focus sharp.',
    ],
  };
}

function buildLocalized(title, description, category) {
  const localized = {};
  for (const [lang, phrases] of Object.entries(localizedPhrases)) {
    localized[lang] = {
      title,
      description: `${title}: ${phrases[0]}. ${phrases[1]}. ${phrases[2]}.`,
      seoTitle: `${title} | ${categoryNames[category]} Game | EduGameHQ`,
      seoDescription: `${title} is a free ${categoryNames[category].toLowerCase()} game for students. ${phrases.join('. ')}.`,
      gameGuide: {
        howToPlay: phrases,
        controls: {
          keyboard: 'Keyboard controls are supported when shown in the game.',
          mouse: 'Click or drag inside the game area.',
          touch: 'Tap the game area on touch devices when supported.',
        },
        tips: [
          'Start slowly and learn the pattern.',
          'Replay short rounds to improve accuracy.',
          'Use the game feedback to adjust your strategy.',
        ],
      },
    };
  }
  localized.en = {
    title,
    description,
    seoTitle: `${title} | Free ${categoryNames[category]} Game | EduGameHQ`,
    seoDescription: `${description} Play instantly in your browser with no downloads.`,
    gameGuide: buildGuide(title, category),
  };
  return localized;
}

async function pageLooksPlayable(browser, url, slug) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  try {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        await page.waitForTimeout(700 * attempt);
      }
    }
    if (lastError) throw lastError;

    await page.waitForTimeout(2200);
    for (const key of ['Enter', 'Space', 'ArrowRight']) {
      await page.keyboard.press(key).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.mouse.click(600, 338).catch(() => {});
    await page.waitForTimeout(900);

    const visual = await page.evaluate(() => ({
      textLength: document.body?.innerText?.trim()?.length || 0,
      canvasCount: document.querySelectorAll('canvas').length,
      iframeCount: document.querySelectorAll('iframe').length,
      mediaCount: document.querySelectorAll('img, video, svg').length,
      title: document.title || '',
    }));
    const screenshotPath = path.join(screenshotDir, `${slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const { default: sharp } = await import('sharp');
    const { data, info } = await sharp(screenshotPath).resize(64, 36).raw().toBuffer({ resolveWithObject: true });
    const samples = [];
    for (let i = 0; i < data.length; i += info.channels) samples.push((data[i] + data[i + 1] + data[i + 2]) / 3);
    const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const variance = samples.reduce((sum, value) => sum + Math.abs(value - avg), 0) / samples.length;
    const pageTitle = String(visual.title || '').toLowerCase();
    const landingSignals = ['documentation', 'plugin', 'framework', 'library', 'github', 'demo list', 'more than just a game'];
    const looksLikeLanding = landingSignals.some((term) => pageTitle.includes(term));
    const passed = variance > 3 && !looksLikeLanding && (visual.canvasCount > 0 || visual.iframeCount > 0);
    return { passed, visual, screenshotPath: `/images/games/github-quality/${slug}.png`, reason: passed ? 'Playable page with visible content' : 'Visual content heuristic failed' };
  } catch (error) {
    return { passed: false, visual: null, screenshotPath: '', reason: error.message };
  } finally {
    await page.close().catch(() => {});
  }
}

function buildGame(repo, playableUrl, screenshotUrl) {
  const title = titleize(repo.name);
  const slug = slugify(repo.name);
  const category = inferCategory(repo);
  const difficulty = inferDifficulty(repo);
  const [minAge, maxAge] = ageRange(category, difficulty);
  const description =
    repo.description?.trim() ||
    `${title} is an open-source browser game that helps students practice ${educationalHooks[category] || 'learning skills'} through interactive play.`;
  const tags = [...new Set([category, 'open source', 'html5', 'browser game', ...(repo.topics || []).slice(0, 6)].map((tag) => tag.replace(/[-_]+/g, ' ').toLowerCase()))].slice(0, 10);

  return {
    slug,
    title,
    category,
    categoryName: categoryNames[category],
    iframeUrl: playableUrl,
    description,
    gameGuide: buildGuide(title, category),
    thumbnailUrl: screenshotUrl,
    image: screenshotUrl,
    difficulty,
    ageRange: `${minAge}-${maxAge}`,
    minAge,
    maxAge,
    tags,
    source: 'GitHub Open Source',
    iframeCompatible: true,
    verified: true,
    technology: 'HTML5',
    mobileSupport: true,
    responsive: true,
    sourceUrl: repo.html_url,
    lastUpdated: String(repo.updated_at || today).slice(0, 10),
    lastChecked: today,
    playCount: 0,
    featured: Number(repo.stargazers_count || 0) >= 300,
    trending: Number(repo.stargazers_count || 0) >= 100,
    isNew: true,
    developer: repo.owner?.login || 'Open Source Community',
    license: repo.license?.spdx_id || 'Open Source',
    uiLanguages: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'hi', 'ar'],
    languageSupportLevel: 'localized-metadata',
    textHeavy: ['language', 'coding', 'strategy'].includes(category),
    localizationEffort: ['language', 'coding', 'strategy'].includes(category) ? 'medium' : 'low',
    nonEnglishFriendly: !['language', 'coding'].includes(category),
    localized: buildLocalized(title, description, category),
  };
}

const games = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const existingSlugs = new Set(games.map((game) => game.slug));
const existingTitles = new Set(games.map((game) => normalizeTitle(game.title)));
const existingSources = new Set(games.map((game) => String(game.sourceUrl || '').toLowerCase()).filter(Boolean));
const existingIframes = new Set(games.map((game) => String(game.iframeUrl || '').toLowerCase()).filter(Boolean));

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });

const seenRepos = new Map();
for (const q of queries) {
  if (seenRepos.size >= maxRepos) break;
  const response = await octokit.search.repos({ q, sort: 'stars', order: 'desc', per_page: Math.min(100, maxRepos) });
  for (const repo of response.data.items) {
    if (seenRepos.size >= maxRepos) break;
    seenRepos.set(repo.full_name, repo);
  }
}

const candidates = [...seenRepos.values()]
  .filter((repo) => repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION')
  .filter((repo) => repoPageUrl(repo))
  .filter((repo) => {
    const blob = [repo.name, repo.full_name, repo.description, ...(repo.topics || [])].join(' ').toLowerCase();
    return !blockerTerms.some((term) => blob.includes(term));
  })
  .filter((repo) => {
    const slug = slugify(repo.name);
    return !existingSlugs.has(slug) && !existingTitles.has(normalizeTitle(repo.name)) && !existingSources.has(String(repo.html_url || '').toLowerCase()) && !existingIframes.has(repoPageUrl(repo).toLowerCase());
  })
  .sort((a, b) => Number(b.stargazers_count || 0) - Number(a.stargazers_count || 0));

const browser = await chromium.launch({ headless: true });
const imported = [];
const rejected = [];

for (const repo of candidates) {
  if (imported.length >= limit) break;
  const playableUrl = repoPageUrl(repo);
  const slug = slugify(repo.name);
  process.stdout.write(`Checking ${repo.full_name}... `);
  const check = await pageLooksPlayable(browser, playableUrl, slug);
  if (!check.passed) {
    console.log('reject');
    rejected.push({ repo: repo.full_name, playableUrl, reason: check.reason });
    continue;
  }
  const game = buildGame(repo, playableUrl, check.screenshotPath);
  imported.push(game);
  existingSlugs.add(game.slug);
  existingTitles.add(normalizeTitle(game.title));
  existingSources.add(game.sourceUrl.toLowerCase());
  existingIframes.add(game.iframeUrl.toLowerCase());
  console.log('import');
}

await browser.close();

if (imported.length) {
  const next = [...games, ...imported].sort((a, b) => a.title.localeCompare(b.title));
  fs.writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
}

const report = {
  generatedAt: new Date().toISOString(),
  searchedRepos: seenRepos.size,
  candidates: candidates.length,
  imported: imported.map((game) => ({ slug: game.slug, title: game.title, iframeUrl: game.iframeUrl, sourceUrl: game.sourceUrl, license: game.license })),
  rejected: rejected.slice(0, 80),
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Imported ${imported.length} GitHub Open Source games`);
console.log(`Report: ${path.relative(projectRoot, reportPath)}`);
