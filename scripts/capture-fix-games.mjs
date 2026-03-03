import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';
const BASE_URL = 'https://games.edugamehq.com/games';

async function captureTowerBlocks(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: tower-blocks');
    await page.setViewportSize({ width: 400, height: 600 });
    await page.goto(`${BASE_URL}/tower-blocks/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click to start game
    await page.click('canvas');
    await page.waitForTimeout(1500);

    const outPath = path.join(OUTPUT_DIR, 'tower-blocks', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureArcheryGame(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: archery-game');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`${BASE_URL}/archery-game/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const outPath = path.join(OUTPUT_DIR, 'archery-game', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureHexGL(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: hexgl');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${BASE_URL}/hexgl/`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(5000);

    // Click play button if exists
    try {
      await page.click('#start', { timeout: 3000 });
      await page.waitForTimeout(3000);
    } catch (e) {}

    const outPath = path.join(OUTPUT_DIR, 'hexgl', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureGalaga(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: galaga');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`${BASE_URL}/galaga/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Press space or click to start
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    const outPath = path.join(OUTPUT_DIR, 'galaga', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureRadiusRaid(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: radius-raid');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`${BASE_URL}/radius-raid/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click to start game
    await page.click('canvas');
    await page.waitForTimeout(2000);

    const outPath = path.join(OUTPUT_DIR, 'radius-raid', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureWordle(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: wordle');
    await page.setViewportSize({ width: 600, height: 700 });
    await page.goto(`${BASE_URL}/wordle/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Type some letters to show game in progress
    await page.keyboard.type('HELLO');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);

    const outPath = path.join(OUTPUT_DIR, 'wordle', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🎮 Capturing game screenshots...\n');
  const browser = await chromium.launch({ headless: true });

  await captureTowerBlocks(browser);
  await captureArcheryGame(browser);
  await captureHexGL(browser);
  await captureGalaga(browser);
  await captureRadiusRaid(browser);
  await captureWordle(browser);

  await browser.close();
  console.log('\n✨ Done!');
}

main().catch(console.error);
