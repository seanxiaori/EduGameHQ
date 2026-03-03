import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = '/private/tmp/EduGameHQ-Games/games';

async function captureTextAdventure(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: text-adventure');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('https://games.edugamehq.com/games/text-adventure/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    await page.waitForTimeout(2000);

    // Click the Start button to go to game.html
    console.log('  Clicking Start button...');
    await page.click('a.btn');
    await page.waitForTimeout(3000);

    const outPath = path.join(OUTPUT_DIR, 'text-adventure', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureBreakout(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: breakout');
    await page.setViewportSize({ width: 600, height: 500 });
    await page.goto('https://games.edugamehq.com/games/breakout/', {
      waitUntil: 'networkidle', timeout: 60000
    });

    // Add background color and fix positioning for screenshot
    await page.addStyleTag({
      content: `
        body { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
        .grid {
          background: #0f0f23;
          border: 2px solid #4a4a6a;
          box-shadow: 0 0 20px rgba(100, 100, 255, 0.3);
        }
        #score {
          color: #fff;
          font-size: 32px;
          font-family: Arial, sans-serif;
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        .block {
          background: linear-gradient(180deg, #4a90d9 0%, #357abd 100%);
          border-radius: 3px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .user {
          background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%);
          border-radius: 5px;
        }
        .ball {
          background: radial-gradient(circle at 30% 30%, #ff6b6b, #ee5a5a);
          box-shadow: 0 0 10px rgba(255,100,100,0.5);
        }
      `
    });

    console.log('  Waiting for game to load and animate...');
    await page.waitForTimeout(2000);

    const outPath = path.join(OUTPUT_DIR, 'breakout', 'screenshot.png');
    await page.screenshot({ path: outPath });
    console.log(`  ✅ OK: ${fs.statSync(outPath).size} bytes`);
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureFlexboxFroggy(browser) {
  const page = await browser.newPage();
  try {
    console.log('\n📸 Capturing: flexboxfroggy');
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('https://games.edugamehq.com/games/flexboxfroggy/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    // Wait for game to fully load (Level 1)
    console.log('  Waiting for game to load...');
    await page.waitForTimeout(3000);

    const outPath = path.join(OUTPUT_DIR, 'flexboxfroggy', 'screenshot.png');
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
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('https://games.edugamehq.com/games/wordle/', {
      waitUntil: 'networkidle', timeout: 60000
    });
    // Wordle auto-loads
    console.log('  Waiting for game to load...');
    await page.waitForTimeout(3000);

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
  console.log('🎮 Game Screenshot Capture Tool');
  console.log('================================\n');

  const browser = await chromium.launch({ headless: true });

  await captureTextAdventure(browser);
  await captureBreakout(browser);
  await captureFlexboxFroggy(browser);
  await captureWordle(browser);

  await browser.close();
  console.log('\n✅ All done!');
}

main();
