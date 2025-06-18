import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 科学游戏列表
const scienceGames = [
  'little-alchemy-2',
  'solar-system-scope', 
  'animal-dna-run',
  'mini-scientist',
  'idle-research',
  'skeleton-simulator'
];

async function getScienceThumbnails() {
  console.log('🔬 开始获取科学游戏缩略图...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const thumbnails = {};
  
  for (const gameSlug of scienceGames) {
    try {
      console.log(`📸 正在获取 ${gameSlug} 的缩略图...`);
      
      const url = `https://www.crazygames.com/game/${gameSlug}`;
      await page.goto(url, { waitUntil: 'networkidle0' });
      
      // 获取 og:image meta 标签
      const thumbnailUrl = await page.evaluate(() => {
        const ogImage = document.querySelector('meta[property="og:image"]');
        return ogImage ? ogImage.content : null;
      });
      
      if (thumbnailUrl) {
        thumbnails[gameSlug] = thumbnailUrl;
        console.log(`✅ ${gameSlug}: ${thumbnailUrl}`);
      } else {
        console.log(`❌ ${gameSlug}: 未找到缩略图`);
      }
      
      // 等待一下避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ 获取 ${gameSlug} 缩略图失败:`, error.message);
    }
  }
  
  await browser.close();
  
  // 更新 games.json 文件
  const gamesFilePath = path.join(process.cwd(), 'src/data/games.json');
  const gamesData = JSON.parse(fs.readFileSync(gamesFilePath, 'utf8'));
  
  let updatedCount = 0;
  
  for (const game of gamesData) {
    if (game.category === 'science' && thumbnails[game.slug]) {
      game.thumbnailUrl = thumbnails[game.slug];
      updatedCount++;
      console.log(`🔄 已更新 ${game.slug} 的缩略图URL`);
    }
  }
  
  // 保存更新后的数据
  fs.writeFileSync(gamesFilePath, JSON.stringify(gamesData, null, 2));
  
  console.log(`🎉 完成！成功更新了 ${updatedCount} 个科学游戏的缩略图`);
  console.log('📋 缩略图URL列表:');
  console.log(JSON.stringify(thumbnails, null, 2));
}

// 运行脚本
getScienceThumbnails().catch(console.error); 