#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const projectRoot = process.cwd();
const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  args.set(key, rest.join('=') || 'true');
}

const catalogPath = path.resolve(projectRoot, args.get('catalog') || 'src/data/games.json');
const reportPath = path.resolve(projectRoot, args.get('report') || 'tmp/game-playability-report.json');
const sourceFilter = args.get('source') || '';
const slugFilter = new Set((args.get('slugs') || '').split(',').map((x) => x.trim()).filter(Boolean));
const limit = Number(args.get('limit') || 0);
const timeoutMs = Number(args.get('timeout') || 15000);
const screenshotDir = path.resolve(projectRoot, args.get('screenshot-dir') || 'tmp/playability-screenshots');

const games = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let selected = games;
if (sourceFilter) selected = selected.filter((game) => game.source === sourceFilter);
if (slugFilter.size) selected = selected.filter((game) => slugFilter.has(game.slug));
if (limit > 0) selected = selected.slice(0, limit);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.floor(sorted.length / 2)];
}

async function hasVisualContent(page) {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText?.trim() || '';
    const iframes = Array.from(document.querySelectorAll('iframe'));
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const media = document.querySelectorAll('img, video, svg').length;
    const rects = [...iframes, ...canvases].map((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width * rect.height;
    });
    return {
      bodyTextLength: bodyText.length,
      iframeCount: iframes.length,
      canvasCount: canvases.length,
      mediaCount: media,
      largestInteractiveArea: rects.length ? Math.max(...rects) : 0,
    };
  });
}

async function validateGame(browser, game) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 240));
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.startsWith('data:')) failedRequests.push(url.slice(0, 240));
  });

  const startedAt = Date.now();
  try {
    let lastNavigationError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await page.goto(game.iframeUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
        lastNavigationError = null;
        break;
      } catch (error) {
        lastNavigationError = error;
        await page.waitForTimeout(800 * attempt).catch(() => {});
      }
    }
    if (lastNavigationError) throw lastNavigationError;
    await page.waitForTimeout(2500);

    for (const key of ['Enter', 'Space', 'ArrowRight']) {
      await page.keyboard.press(key).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.mouse.click(640, 360).catch(() => {});
    await page.waitForTimeout(1200);

    const visual = await hasVisualContent(page);
    const screenshotPath = path.join(screenshotDir, `${game.slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
    const durationMs = Date.now() - startedAt;

    const screenshotBuffer = fs.existsSync(screenshotPath) ? fs.readFileSync(screenshotPath) : null;
    let nonBlank = false;
    if (screenshotBuffer) {
      const { default: sharp } = await import('sharp');
      const { data, info } = await sharp(screenshotBuffer).resize(64, 36).raw().toBuffer({ resolveWithObject: true });
      const luminance = [];
      for (let i = 0; i < data.length; i += info.channels) {
        luminance.push((data[i] + data[i + 1] + data[i + 2]) / 3);
      }
      const med = median(luminance);
      const variance = luminance.reduce((sum, value) => sum + Math.abs(value - med), 0) / luminance.length;
      nonBlank = variance > 3;
    }

    const hasInteractiveSurface = visual.canvasCount > 0 || visual.iframeCount > 0;
    const hasLargeGameArea = visual.largestInteractiveArea > 160000;
    const hasNonEmptyScreenshot = Boolean(screenshotBuffer && screenshotBuffer.length > 4000);
    const passed =
      durationMs <= timeoutMs + 7000 &&
      (nonBlank || (hasInteractiveSurface && hasLargeGameArea && hasNonEmptyScreenshot)) &&
      (hasInteractiveSurface || visual.mediaCount > 2 || visual.bodyTextLength > 40);

    return {
      slug: game.slug,
      title: game.title,
      iframeUrl: game.iframeUrl,
      passed,
      durationMs,
      visual,
      screenshotPath: path.relative(projectRoot, screenshotPath),
      consoleErrors: consoleErrors.slice(0, 5),
      failedRequests: failedRequests.slice(0, 5),
      reason: passed ? 'Loaded with visible content' : 'Did not meet visible-content/playability heuristics',
    };
  } catch (error) {
    return {
      slug: game.slug,
      title: game.title,
      iframeUrl: game.iframeUrl,
      passed: false,
      durationMs: Date.now() - startedAt,
      visual: null,
      screenshotPath: '',
      consoleErrors: consoleErrors.slice(0, 5),
      failedRequests: failedRequests.slice(0, 5),
      reason: error.message,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const game of selected) {
  process.stdout.write(`Checking ${game.slug}... `);
  const result = await validateGame(browser, game);
  results.push(result);
  console.log(result.passed ? 'PASS' : 'FAIL');
}
await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  catalogPath: path.relative(projectRoot, catalogPath),
  totalChecked: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  results,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Playability checked: ${report.passed}/${report.totalChecked} passed`);
console.log(`Report: ${path.relative(projectRoot, reportPath)}`);

if (report.failed > 0 && args.get('fail-on-error') === 'true') {
  process.exit(1);
}
