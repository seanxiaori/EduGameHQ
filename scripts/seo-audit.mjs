import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const inputDir = process.argv[2];
const defaultBuildDir = fs.existsSync('/tmp/edugamehq-build') ? '/tmp/edugamehq-build' : path.join(projectRoot, 'dist');
const buildDir = inputDir ? path.resolve(projectRoot, inputDir) : defaultBuildDir;
const reportPath = path.join(projectRoot, 'seo-audit-report.json');

const ignoredPaths = new Set([
  '/auto-screenshot/',
  '/yandex_60fb28260cdeec35/'
]);

if (!fs.existsSync(buildDir)) {
  console.error(`Build directory does not exist: ${buildDir}`);
  process.exit(1);
}

function walkHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function getFirstTag(html, tagName, predicate) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  let match = re.exec(html);
  while (match) {
    if (predicate(match[0])) {
      return match[0];
    }
    match = re.exec(html);
  }
  return '';
}

function getAttribute(tag, attrName) {
  if (!tag) return '';
  const re = new RegExp(`${attrName}\\s*=\\s*([\"'])([\\s\\S]*?)\\1`, 'i');
  const match = tag.match(re);
  return (match?.[2] || '').trim();
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function toUrlPath(filePath) {
  const relative = path.relative(buildDir, filePath).replace(/\\/g, '/');
  if (relative === 'index.html') return '/';
  const noIndex = relative.replace(/index\.html$/, '').replace(/\.html$/, '');
  const withLeadingSlash = noIndex.startsWith('/') ? noIndex : `/${noIndex}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function dupGroups(rows, field) {
  const map = new Map();
  for (const row of rows) {
    const value = row[field];
    if (!value) continue;
    const list = map.get(value) || [];
    list.push(row.url);
    map.set(value, list);
  }
  return [...map.entries()]
    .filter(([, urls]) => urls.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([value, urls]) => ({ value, count: urls.length, examples: urls.slice(0, 5) }));
}

const htmlFiles = walkHtmlFiles(buildDir);
const rows = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const title = normalizeText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''));

  const descriptionTag = getFirstTag(html, 'meta', (tag) => /name\s*=\s*["']description["']/i.test(tag));
  const robotsTag = getFirstTag(html, 'meta', (tag) => /name\s*=\s*["']robots["']/i.test(tag));
  const canonicalTag = getFirstTag(html, 'link', (tag) => /rel\s*=\s*["']canonical["']/i.test(tag));

  const description = normalizeText(getAttribute(descriptionTag, 'content'));
  const robots = normalizeText(getAttribute(robotsTag, 'content'));
  const canonical = normalizeText(getAttribute(canonicalTag, 'href'));
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const url = toUrlPath(file);
  const ignored = ignoredPaths.has(url);

  rows.push({
    url,
    title,
    description,
    robots,
    canonical,
    h1Count,
    titleLength: title.length,
    descriptionLength: description.length,
    ignored
  });
}

const analyzedRows = rows.filter((row) => !row.ignored);
const indexableRows = analyzedRows.filter((row) => !/noindex/i.test(row.robots));

const duplicateTitles = dupGroups(indexableRows, 'title');
const duplicateDescriptions = dupGroups(indexableRows, 'description');
const duplicateCanonicals = dupGroups(indexableRows, 'canonical');

const missing = {
  title: analyzedRows.filter((row) => !row.title).map((row) => row.url),
  description: analyzedRows.filter((row) => !row.description).map((row) => row.url),
  canonical: analyzedRows.filter((row) => !row.canonical).map((row) => row.url),
  robots: analyzedRows.filter((row) => !row.robots).map((row) => row.url)
};

const report = {
  generatedAt: new Date().toISOString(),
  buildDir,
  totalHtml: rows.length,
  ignoredPaths: [...ignoredPaths],
  analyzedHtml: analyzedRows.length,
  indexableHtml: indexableRows.length,
  duplicates: {
    titleGroups: duplicateTitles.length,
    descriptionGroups: duplicateDescriptions.length,
    canonicalGroups: duplicateCanonicals.length,
    topTitleDup: duplicateTitles.slice(0, 5),
    topDescriptionDup: duplicateDescriptions.slice(0, 5),
    topCanonicalDup: duplicateCanonicals.slice(0, 5)
  },
  missing: {
    title: missing.title.length,
    description: missing.description.length,
    canonical: missing.canonical.length,
    robots: missing.robots.length,
    titleExamples: missing.title.slice(0, 20),
    descriptionExamples: missing.description.slice(0, 20),
    canonicalExamples: missing.canonical.slice(0, 20),
    robotsExamples: missing.robots.slice(0, 20)
  },
  h1: {
    none: analyzedRows.filter((row) => row.h1Count === 0).length,
    multi: analyzedRows.filter((row) => row.h1Count > 1).length,
    noneExamples: analyzedRows.filter((row) => row.h1Count === 0).slice(0, 10).map((row) => row.url),
    multiExamples: analyzedRows.filter((row) => row.h1Count > 1).slice(0, 10).map((row) => ({ url: row.url, h1Count: row.h1Count }))
  },
  lengths: {
    description: {
      lt120: analyzedRows.filter((row) => row.descriptionLength > 0 && row.descriptionLength < 120).length,
      b120_149: analyzedRows.filter((row) => row.descriptionLength >= 120 && row.descriptionLength < 150).length,
      b150_160: analyzedRows.filter((row) => row.descriptionLength >= 150 && row.descriptionLength <= 160).length,
      gt160: analyzedRows.filter((row) => row.descriptionLength > 160).length
    },
    title: {
      lt30: analyzedRows.filter((row) => row.titleLength > 0 && row.titleLength < 30).length,
      b30_60: analyzedRows.filter((row) => row.titleLength >= 30 && row.titleLength <= 60).length,
      gt60: analyzedRows.filter((row) => row.titleLength > 60).length
    }
  },
  checks: {
    has404: fs.existsSync(path.join(buildDir, '404.html')),
    hasSitemapIndex: fs.existsSync(path.join(buildDir, 'sitemap-index.xml')),
    hasRootSitemap: fs.existsSync(path.join(buildDir, 'sitemap.xml')),
    hasRobots: fs.existsSync(path.join(buildDir, 'robots.txt'))
  }
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`SEO audit complete: ${reportPath}`);
console.log(JSON.stringify({
  analyzedHtml: report.analyzedHtml,
  indexableHtml: report.indexableHtml,
  dupTitleGroups: report.duplicates.titleGroups,
  dupDescriptionGroups: report.duplicates.descriptionGroups,
  dupCanonicalGroups: report.duplicates.canonicalGroups,
  missing: report.missing,
  h1: report.h1,
  checks: report.checks
}, null, 2));
