/**
 * 新科学游戏缩略图获取脚本
 * 专门为5个新添加的科学游戏获取真实缩略图
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 需要更新缩略图的5个新科学游戏
const NEW_SCIENCE_GAMES = [
  'galaxy-control-3d-strategy',
  'quantum-god',
  'alchemy-merge-clicker',
  'alchemy',
  'idle-molecules'
];

/**
 * 获取单个游戏的缩略图
 */
async function getGameThumbnail(page, gameSlug) {
  try {
    console.log(`\n🔍 正在获取 ${gameSlug} 的缩略图...`);
    
    const gameUrl = `https://www.crazygames.com/game/${gameSlug}`;
    console.log(`📍 访问URL: ${gameUrl}`);
    
    const response = await page.goto(gameUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    if (!response || !response.ok()) {
      console.log(`❌ 页面加载失败，状态码: ${response ? response.status() : '未知'}`);
      return {
        slug: gameSlug,
        thumbnailUrl: null,
        success: false,
        error: `页面加载失败，状态码: ${response ? response.status() : '未知'}`
      };
    }
    
    console.log(`✅ 页面加载成功，状态码: ${response.status()}`);
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 获取META标签中的缩略图
    const thumbnailInfo = await page.evaluate(() => {
      const ogImage = document.querySelector('meta[property="og:image"]');
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      const imageUrl = document.querySelector('meta[name="image"]');
      
      return {
        ogImage: ogImage ? ogImage.getAttribute('content') : null,
        twitterImage: twitterImage ? twitterImage.getAttribute('content') : null,
        imageUrl: imageUrl ? imageUrl.getAttribute('content') : null
      };
    });
    
    let thumbnailUrl = null;
    
    // 优先使用og:image
    if (thumbnailInfo.ogImage && thumbnailInfo.ogImage.includes('imgs.crazygames.com')) {
      thumbnailUrl = thumbnailInfo.ogImage;
      console.log(`✅ 通过og:image找到缩略图: ${thumbnailUrl}`);
    }
    // 其次使用twitter:image
    else if (thumbnailInfo.twitterImage && thumbnailInfo.twitterImage.includes('imgs.crazygames.com')) {
      thumbnailUrl = thumbnailInfo.twitterImage;
      console.log(`✅ 通过twitter:image找到缩略图: ${thumbnailUrl}`);
    }
    // 最后使用image标签
    else if (thumbnailInfo.imageUrl && thumbnailInfo.imageUrl.includes('imgs.crazygames.com')) {
      thumbnailUrl = thumbnailInfo.imageUrl;
      console.log(`✅ 通过image标签找到缩略图: ${thumbnailUrl}`);
    }
    
    if (!thumbnailUrl) {
      console.log(`❌ 未找到有效的缩略图URL`);
      return {
        slug: gameSlug,
        thumbnailUrl: null,
        success: false,
        error: '未找到有效的缩略图URL'
      };
    }
    
    return {
      slug: gameSlug,
      thumbnailUrl: thumbnailUrl,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ 获取 ${gameSlug} 缩略图时出错:`, error.message);
    return {
      slug: gameSlug,
      thumbnailUrl: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * 更新games.json文件中的缩略图
 */
function updateGamesThumbnails(results) {
  try {
    const gamesJsonPath = path.join(process.cwd(), '..', 'src', 'data', 'games.json');
    console.log(`📁 正在读取文件: ${gamesJsonPath}`);
    
    const gamesData = JSON.parse(fs.readFileSync(gamesJsonPath, 'utf-8'));
    
    let updatedCount = 0;
    
    results.forEach(result => {
      if (result.success) {
        const gameIndex = gamesData.findIndex(game => game.slug === result.slug);
        if (gameIndex !== -1) {
          const oldThumbnail = gamesData[gameIndex].thumbnailUrl;
          gamesData[gameIndex].thumbnailUrl = result.thumbnailUrl;
          console.log(`✅ 已更新 ${result.slug} 的缩略图`);
          console.log(`   旧URL: ${oldThumbnail}`);
          console.log(`   新URL: ${result.thumbnailUrl}`);
          updatedCount++;
        } else {
          console.log(`⚠ 未找到游戏: ${result.slug}`);
        }
      }
    });
    
    fs.writeFileSync(gamesJsonPath, JSON.stringify(gamesData, null, 2), 'utf-8');
    
    console.log(`\n🎉 成功更新了 ${updatedCount} 个游戏的缩略图！`);
    
    return updatedCount;
  } catch (error) {
    console.error('❌ 更新games.json时出错:', error);
    return 0;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始获取新科学游戏缩略图...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    const results = [];
    
    for (const gameSlug of NEW_SCIENCE_GAMES) {
      const result = await getGameThumbnail(page, gameSlug);
      results.push(result);
      
      // 添加延迟避免被限制
      console.log(`⏱ 等待2秒后继续下一个游戏...`);
      await page.waitForTimeout(2000);
    }
    
    // 输出结果摘要
    console.log('\n📊 获取结果摘要:');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功获取缩略图: ${successful.length} 个`);
    console.log(`❌ 获取失败: ${failed.length} 个`);
    
    if (successful.length > 0) {
      console.log('\n✅ 成功获取缩略图的游戏:');
      successful.forEach(result => {
        console.log(`  - ${result.slug}: ${result.thumbnailUrl}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ 获取失败的游戏:');
      failed.forEach(result => {
        console.log(`  - ${result.slug}: ${result.error}`);
      });
    }
    
    // 更新games.json文件
    console.log('\n🔄 正在更新games.json文件...');
    const updatedCount = updateGamesThumbnails(results);
    
    if (updatedCount > 0) {
      console.log(`\n🎉 任务完成！成功更新了 ${updatedCount} 个游戏的缩略图！`);
    } else {
      console.log('\n⚠ 没有需要更新的缩略图。');
    }
    
  } catch (error) {
    console.error('❌ 脚本执行出错:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 运行脚本
main().catch(console.error); 