#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const requestedDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'dist';
const siteDir = path.resolve(repoRoot, requestedDir);
const reportPath = path.join(repoRoot, 'tmp', 'seo-audit-report.json');

const issueLevels = {
  error: 3,
  warning: 2,
  info: 1,
};

const issues = [];

function addIssue(level, area, message, target = '') {
  issues.push({ level, area, message, target });
}

function walkFiles(dir, predicate, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results);
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function getMatches(html, regex) {
  return [...html.matchAll(regex)].map(match => match[1] || match[0]);
}

function getContent(html, regex) {
  return html.match(regex)?.[1]?.trim() || '';
}

function getTagAttribute(tag, attrName) {
  const pattern = new RegExp(`${attrName}=(["'])(.*?)\\1`, 'i');
  return tag.match(pattern)?.[2]?.trim() || '';
}

function getMetaContent(html, name) {
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  const match = tags.find(tag => getTagAttribute(tag, 'name').toLowerCase() === name.toLowerCase());
  return match ? getTagAttribute(match, 'content') : '';
}

function getLinkHref(html, rel) {
  const tags = html.match(/<link\s+[^>]*>/gi) || [];
  const match = tags.find(tag => getTagAttribute(tag, 'rel').toLowerCase() === rel.toLowerCase());
  return match ? getTagAttribute(match, 'href') : '';
}

function getHreflangs(html) {
  const tags = html.match(/<link\s+[^>]*>/gi) || [];
  return tags
    .filter(tag => getTagAttribute(tag, 'rel').toLowerCase() === 'alternate')
    .map(tag => getTagAttribute(tag, 'hreflang'))
    .filter(Boolean);
}

function urlPathForFile(filePath) {
  const relative = path.relative(siteDir, filePath).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/\/index\.html$/, '/').replace(/\.html$/, '/')}`;
}

function shouldAuditHtmlFile(filePath) {
  const relative = path.relative(siteDir, filePath).replaceAll(path.sep, '/');
  const basename = path.basename(relative);
  if (basename.startsWith('yandex_') || basename.startsWith('google') || basename.startsWith('BingSiteAuth')) {
    return false;
  }
  return true;
}

function auditBuildOutput() {
  if (!fs.existsSync(siteDir)) {
    addIssue('error', 'build', `Build directory does not exist. Run "npm run build" first, or pass a build directory.`, siteDir);
    return { htmlPages: 0, indexablePages: 0 };
  }

  const htmlFiles = walkFiles(siteDir, file => file.endsWith('.html') && shouldAuditHtmlFile(file));
  let indexablePages = 0;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const urlPath = urlPathForFile(file);
    const title = getContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = getMetaContent(html, 'description');
    const canonical = getLinkHref(html, 'canonical');
    const robots = getMetaContent(html, 'robots');
    const hreflangs = getHreflangs(html);
    const jsonLdCount = getMatches(html, /<script\s+type=["']application\/ld\+json["'][^>]*>/gi).length;
    const h1Count = getMatches(html, /<h1[\s>]/gi).length;

    if (!robots.toLowerCase().includes('noindex')) indexablePages += 1;

    if (!title) addIssue('error', 'on-page', 'Missing title tag.', urlPath);
    if (title && (title.length < 30 || title.length > 65)) {
      addIssue('warning', 'on-page', `Title length is ${title.length}; aim for roughly 30-65 characters.`, urlPath);
    }

    if (!description) addIssue('error', 'on-page', 'Missing meta description.', urlPath);
    if (description && (description.length < 120 || description.length > 160)) {
      addIssue('warning', 'on-page', `Meta description length is ${description.length}; aim for roughly 120-160 characters.`, urlPath);
    }

    if (!canonical) addIssue('error', 'indexation', 'Missing canonical URL.', urlPath);
    if (canonical && !canonical.startsWith('https://www.edugamehq.com/')) {
      addIssue('warning', 'indexation', `Canonical is not on https://www.edugamehq.com: ${canonical}`, urlPath);
    }

    if (!robots) addIssue('warning', 'indexation', 'Missing robots meta tag.', urlPath);
    if (h1Count !== 1) addIssue('warning', 'on-page', `Expected one H1, found ${h1Count}.`, urlPath);
    if (hreflangs.length > 0 && !hreflangs.includes('x-default')) {
      addIssue('warning', 'i18n', 'hreflang alternates are missing x-default.', urlPath);
    }
    if (urlPath.startsWith('/games/') && jsonLdCount === 0) {
      addIssue('warning', 'structured-data', 'Game page has no JSON-LD structured data.', urlPath);
    }
  }

  return { htmlPages: htmlFiles.length, indexablePages };
}

function auditRobotsAndSitemaps() {
  const robotsPath = path.join(siteDir, 'robots.txt');
  const sitemapIndexPath = path.join(siteDir, 'sitemap-index.xml');
  const sitemapPath = path.join(siteDir, 'sitemap.xml');

  if (!fs.existsSync(robotsPath)) {
    addIssue('error', 'crawlability', 'robots.txt is missing from the build output.', '/robots.txt');
  } else {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    if (!/Sitemap:\s*https:\/\/www\.edugamehq\.com\/sitemap-index\.xml/i.test(robots)) {
      addIssue('warning', 'crawlability', 'robots.txt should reference https://www.edugamehq.com/sitemap-index.xml.', '/robots.txt');
    }
    if (/Disallow:\s*\/games\//i.test(robots)) {
      addIssue('error', 'crawlability', 'robots.txt blocks /games/ URLs.', '/robots.txt');
    }
  }

  if (!fs.existsSync(sitemapIndexPath)) {
    addIssue('error', 'crawlability', 'sitemap-index.xml is missing from the build output.', '/sitemap-index.xml');
  }

  if (!fs.existsSync(sitemapPath)) {
    addIssue('error', 'crawlability', 'sitemap.xml is missing from the build output.', '/sitemap.xml');
  }
}

function auditGameCatalog() {
  const gamesPath = path.join(repoRoot, 'src', 'data', 'games.json');
  if (!fs.existsSync(gamesPath)) {
    addIssue('error', 'catalog', 'src/data/games.json is missing.');
    return { games: 0 };
  }

  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
  const slugs = new Set();
  const sourceHosts = new Map();
  const requiredFields = ['slug', 'title', 'description', 'category', 'iframeUrl', 'thumbnailUrl', 'minAge', 'maxAge', 'difficulty'];
  const missingCounts = new Map();
  let duplicateSlugs = 0;
  let thirdPartyIframeCount = 0;

  for (const game of games) {
    if (slugs.has(game.slug)) duplicateSlugs += 1;
    slugs.add(game.slug);

    for (const field of requiredFields) {
      if (game[field] === undefined || game[field] === null || game[field] === '') {
        missingCounts.set(field, (missingCounts.get(field) || 0) + 1);
      }
    }

    if (!game.gameGuide) missingCounts.set('gameGuide', (missingCounts.get('gameGuide') || 0) + 1);
    if (!game.sourceUrl) missingCounts.set('sourceUrl', (missingCounts.get('sourceUrl') || 0) + 1);
    if (!game.uiLanguages) missingCounts.set('uiLanguages', (missingCounts.get('uiLanguages') || 0) + 1);
    if (!game.languageSupportLevel) missingCounts.set('languageSupportLevel', (missingCounts.get('languageSupportLevel') || 0) + 1);

    try {
      const host = new URL(game.iframeUrl).hostname;
      sourceHosts.set(host, (sourceHosts.get(host) || 0) + 1);
      if (host !== 'games.edugamehq.com') thirdPartyIframeCount += 1;
    } catch {
      addIssue('error', 'catalog', 'Invalid iframeUrl.', game.slug || game.title || '');
    }
  }

  if (duplicateSlugs > 0) addIssue('error', 'catalog', `${duplicateSlugs} duplicate game slugs found.`);

  for (const [field, count] of missingCounts.entries()) {
    const level = ['uiLanguages', 'languageSupportLevel', 'sourceUrl', 'gameGuide'].includes(field) ? 'warning' : 'error';
    addIssue(level, 'catalog', `${count} games are missing ${field}.`, 'src/data/games.json');
  }

  if (thirdPartyIframeCount > 0) {
    addIssue('warning', 'catalog', `${thirdPartyIframeCount} games still iframe third-party hosts instead of games.edugamehq.com.`, 'src/data/games.json');
  }

  return {
    games: games.length,
    thirdPartyIframeCount,
    topIframeHosts: [...sourceHosts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
  };
}

const buildSummary = auditBuildOutput();
auditRobotsAndSitemaps();
const catalogSummary = auditGameCatalog();

const summary = {
  generatedAt: new Date().toISOString(),
  auditedDirectory: siteDir,
  ...buildSummary,
  ...catalogSummary,
  issueCounts: Object.fromEntries(
    Object.keys(issueLevels).map(level => [level, issues.filter(issue => issue.level === level).length])
  ),
};

const report = {
  summary,
  issues: issues.sort((a, b) => issueLevels[b.level] - issueLevels[a.level] || a.area.localeCompare(b.area)),
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log('SEO audit complete');
console.log(`Pages checked: ${summary.htmlPages}`);
console.log(`Games checked: ${summary.games}`);
console.log(`Issues: ${summary.issueCounts.error} errors, ${summary.issueCounts.warning} warnings, ${summary.issueCounts.info} info`);
console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

for (const issue of report.issues.slice(0, 20)) {
  console.log(`[${issue.level.toUpperCase()}] ${issue.area}: ${issue.message}${issue.target ? ` (${issue.target})` : ''}`);
}

process.exit(summary.issueCounts.error > 0 ? 1 : 0);
