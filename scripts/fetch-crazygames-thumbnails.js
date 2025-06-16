/**
 * CrazyGames缩略图获取脚本
 * 自动获取游戏的真实缩略图URL并更新数据库
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 需要更新缩略图的游戏列表
const GAMES_TO_UPDATE = [
  'number-line-match',
  'stack-it',
  'math-push', 
  'number-digger',
  'gravity-crowd',
  'math-duck',
  'bff-math-class',
  '100-doors-puzzle-box',
  'aritmazetic',
  'super-number-defense',
  'puzzle-survivor',
  'nullify',
  'number-masters',
  'math-expressions',
  'snake-blockade',
  'xor'
];

/**
 * 获取单个游戏的缩略图URL
 */
async function getGameThumbnail(page, gameSlug) {
  try {
    console.log(`🔍 正在获取 ${gameSlug} 的缩略图...`);
    
    // 访问游戏页面
    const gameUrl = `https://www.crazygames.com/game/${gameSlug}`;
    await page.goto(gameUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 等待页面加载完成
    await page.waitForTimeout(5000);
    
    let thumbnailUrl = null;
    
    // 方法1: 尝试获取meta标签的og:image
    try {
      const metaContent = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content'));
      if (metaContent && metaContent.includes('imgs.crazygames.com') && metaContent.includes('_16x9')) {
        thumbnailUrl = metaContent;
        console.log(`✅ 通过meta标签找到: ${thumbnailUrl}`);
        return {
          slug: gameSlug,
          thumbnailUrl: thumbnailUrl,
          success: true
        };
      }
    } catch (e) {
      console.log(`⚠ meta标签方法失败: ${e.message}`);
    }
    
    // 方法2: 查找游戏页面的主要缩略图
    try {
      const gameImage = await page.evaluate((slug) => {
        // 查找包含游戏名称的图片
        const images = Array.from(document.querySelectorAll('img'));
        
        // 优先查找alt属性包含游戏名的图片
        let targetImage = images.find(img => 
          img.alt && img.alt.toLowerCase().includes(slug.toLowerCase()) &&
          img.src && img.src.includes('imgs.crazygames.com') && img.src.includes('_16x9')
        );
        
        // 如果没找到，查找src包含游戏名的图片
        if (!targetImage) {
          targetImage = images.find(img => 
            img.src && img.src.includes(slug) && 
            img.src.includes('imgs.crazygames.com') && img.src.includes('_16x9')
          );
        }
        
        // 如果还没找到，查找页面主要的游戏图片
        if (!targetImage) {
          const gameContainer = document.querySelector('.game-container, .game-header, .game-info');
          if (gameContainer) {
            targetImage = gameContainer.querySelector('img[src*="imgs.crazygames.com"][src*="_16x9"]');
          }
        }
        
        return targetImage ? targetImage.src : null;
      }, gameSlug);
      
      if (gameImage) {
        thumbnailUrl = gameImage;
        console.log(`✅ 通过页面分析找到: ${thumbnailUrl}`);
        return {
          slug: gameSlug,
          thumbnailUrl: thumbnailUrl,
          success: true
        };
      }
    } catch (e) {
      console.log(`⚠ 页面分析方法失败: ${e.message}`);
    }
    
    // 方法3: 构造可能的URL格式
    const possibleUrls = [
      `https://imgs.crazygames.com/${gameSlug}_16x9/cover?metadata=none&quality=70`,
      `https://imgs.crazygames.com/games/${gameSlug}/cover_16x9.png?metadata=none&quality=70`,
      `https://imgs.crazygames.com/${gameSlug}_16x9/20241201/${gameSlug}_16x9-cover?metadata=none&quality=70`
    ];
    
    for (const url of possibleUrls) {
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        if (response && response.ok()) {
          thumbnailUrl = url;
          console.log(`✅ 通过URL构造找到: ${thumbnailUrl}`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个URL
      }
    }
    
    if (thumbnailUrl) {
      return {
        slug: gameSlug,
        thumbnailUrl: thumbnailUrl,
        success: true
      };
    } else {
      console.log(`❌ 未找到 ${gameSlug} 的缩略图`);
      return {
        slug: gameSlug,
        thumbnailUrl: null,
        success: false,
        error: '未找到缩略图'
      };
    }
    
  } catch (error) {
    console.error(`❌ 获取 ${gameSlug} 时出错:`, error.message);
    return {
      slug: gameSlug,
      thumbnailUrl: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * 更新games.json文件中的缩略图URL
 */
function updateGamesJson(results) {
  try {
    // 修复路径问题 - 从scripts目录回到项目根目录
    const gamesJsonPath = path.join(process.cwd(), '..', 'src', 'data', 'games.json');
    console.log(`📁 正在读取文件: ${gamesJsonPath}`);
    
    const gamesData = JSON.parse(fs.readFileSync(gamesJsonPath, 'utf-8'));
    
    let updatedCount = 0;
    
    // 更新每个游戏的缩略图URL
    results.forEach(result => {
      if (result.success && result.thumbnailUrl) {
        const gameIndex = gamesData.findIndex(game => game.slug === result.slug);
        if (gameIndex !== -1) {
          gamesData[gameIndex].thumbnailUrl = result.thumbnailUrl;
          updatedCount++;
          console.log(`✅ 已更新 ${result.slug} 的缩略图`);
        } else {
          console.log(`⚠ 未找到游戏: ${result.slug}`);
        }
      }
    });
    
    // 保存更新后的数据
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
  console.log('🚀 开始获取CrazyGames缩略图...\n');
  
  let browser;
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: "new", // 使用新的headless模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // 设置用户代理和视口
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    const results = [];
    
    // 逐个获取游戏缩略图
    for (const gameSlug of GAMES_TO_UPDATE) {
      const result = await getGameThumbnail(page, gameSlug);
      results.push(result);
      
      // 添加延迟避免被限制
      await page.waitForTimeout(3000);
    }
    
    // 输出结果摘要
    console.log('\n📊 获取结果摘要:');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功获取: ${successful.length} 个`);
    console.log(`❌ 获取失败: ${failed.length} 个`);
    
    if (successful.length > 0) {
      console.log('\n✅ 成功获取的游戏:');
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
    if (successful.length > 0) {
      console.log('\n🔄 正在更新games.json文件...');
      const updatedCount = updateGamesJson(results);
      
      if (updatedCount > 0) {
        console.log(`\n🎉 任务完成！成功更新了 ${updatedCount} 个游戏的缩略图！`);
      }
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