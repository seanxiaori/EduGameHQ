import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const games = [
  { slug: 'connect-four', url: 'https://games.edugamehq.com/games/connect-four/' },
  { slug: 'space-invaders', url: 'https://games.edugamehq.com/games/space-invaders/' },
  { slug: 'breakout', url: 'https://games.edugamehq.com/games/breakout/' },
  { slug: 'frogger', url: 'https://games.edugamehq.com/games/frogger/' }
];

const outputDir = '../public/images/games';

async function captureScreenshots() {
  const browser = await puppeteer.launch({ headless: true });

  for (const game of games) {
    console.log(`Capturing ${game.slug}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });

    try {
      await page.goto(game.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      const outputPath = path.join(outputDir, `${game.slug}.png`);
      await page.screenshot({ path: outputPath });
      console.log(`Saved: ${outputPath}`);
    } catch (err) {
      console.error(`Error capturing ${game.slug}:`, err.message);
    }

    await page.close();
  }

  await browser.close();
  console.log('Done!');
}

captureScreenshots();
