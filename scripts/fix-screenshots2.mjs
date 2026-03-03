import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureTicTacToe(browser) {
  const page = await browser.newPage();
  try {
    console.log('Capturing: tic-tac-toe');
    await page.setViewportSize({ width: 600, height: 600 });
    await page.goto('https://games.edugamehq.com/games/tic-tac-toe/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Click some cells to show X and O
    const cells = await page.$$('.cell');
    if (cells.length >= 5) {
      await cells[0].click(); await page.waitForTimeout(200);
      await cells[4].click(); await page.waitForTimeout(200);
      await cells[2].click(); await page.waitForTimeout(200);
      await cells[6].click(); await page.waitForTimeout(200);
      await cells[1].click(); await page.waitForTimeout(200);
    }

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'tic-tac-toe/screenshot.png') });
    console.log('  Done');
  } catch (e) { console.error('  Error:', e.message); }
  finally { await page.close(); }
}

async function captureSpaceInvaders(browser) {
  const page = await browser.newPage();
  try {
    console.log('Capturing: space-invaders');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('https://games.edugamehq.com/games/space-invaders/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'space-invaders/screenshot.png') });
    console.log('  Done');
  } catch (e) { console.error('  Error:', e.message); }
  finally { await page.close(); }
}

async function captureWordle(browser) {
  const page = await browser.newPage();
  try {
    console.log('Capturing: wordle');
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto('https://games.edugamehq.com/games/wordle/', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'wordle/screenshot.png') });
    console.log('  Done');
  } catch (e) { console.error('  Error:', e.message); }
  finally { await page.close(); }
}

async function captureSudoku(browser) {
  const page = await browser.newPage();
  try {
    console.log('Capturing: sudoku');
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto('https://games.edugamehq.com/games/sudoku/', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'sudoku/screenshot.png') });
    console.log('  Done');
  } catch (e) { console.error('  Error:', e.message); }
  finally { await page.close(); }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  await captureTicTacToe(browser);
  await captureSpaceInvaders(browser);
  await captureWordle(browser);
  await captureSudoku(browser);
  await browser.close();

  // Check file sizes
  for (const g of ['tic-tac-toe', 'space-invaders', 'wordle', 'sudoku']) {
    const p = path.join(OUTPUT_DIR, g, 'screenshot.png');
    const s = fs.statSync(p);
    console.log(`${g}: ${s.size} bytes`);
  }
}

main();
