/**
 * CrazyGames缩略图获取脚本 (优化版)
 * 专注于META标签获取，提供详细的调试信息
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 需要更新缩略图的游戏列表 (重点关注遗漏的游戏)
const GAMES_TO_UPDATE = [
  // 遗漏的游戏 - 需要修正缩略图
  'dicetris',
  'the-last-light-of-lyra'
];

/**
 * 获取单个游戏的缩略图URL (优化版)
 */
async function getGameThumbnail(page, gameSlug) {
  try {
    console.log(`\n🔍 正在获取 ${gameSlug} 的缩略图...`);
    
    // 访问游戏页面
    const gameUrl = `https://www.crazygames.com/game/${gameSlug}`;
    console.log(`📍 访问URL: ${gameUrl}`);
    
    const response = await page.goto(gameUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    // 检查页面是否成功加载
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
    await page.waitForTimeout(5000);
    
    // 检查页面标题，确认是否为正确的游戏页面
    const pageTitle = await page.title();
    console.log(`📄 页面标题: ${pageTitle}`);
    
    // 如果页面标题包含"404"或"Not Found"，说明游戏不存在
    if (pageTitle.toLowerCase().includes('404') || pageTitle.toLowerCase().includes('not found')) {
      console.log(`❌ 游戏页面不存在 (404)`);
      return {
        slug: gameSlug,
        thumbnailUrl: null,
        success: false,
        error: '游戏页面不存在 (404)'
      };
    }
    
    let thumbnailUrl = null;
    
    // 方法1: 深度挖掘META标签
    console.log(`🔍 方法1: 深度分析META标签...`);
    try {
      // 获取所有可能的META标签
      const metaTags = await page.evaluate(() => {
        const tags = {};
        
        // og:image
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) tags.ogImage = ogImage.getAttribute('content');
        
        // twitter:image
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) tags.twitterImage = twitterImage.getAttribute('content');
        
        // 其他可能的图片META标签
        const imageUrl = document.querySelector('meta[name="image"]');
        if (imageUrl) tags.imageUrl = imageUrl.getAttribute('content');
        
        // 获取页面中所有META标签进行调试
        const allMetas = Array.from(document.querySelectorAll('meta')).map(meta => ({
          name: meta.getAttribute('name'),
          property: meta.getAttribute('property'),
          content: meta.getAttribute('content')
        })).filter(meta => 
          meta.content && 
          (meta.content.includes('img') || meta.content.includes('image') || meta.content.includes('crazygames'))
        );
        
        tags.allImageMetas = allMetas;
        
        return tags;
      });
      
      console.log(`📋 找到的META标签:`, JSON.stringify(metaTags, null, 2));
      
      // 优先使用og:image
      if (metaTags.ogImage && metaTags.ogImage.includes('imgs.crazygames.com')) {
        thumbnailUrl = metaTags.ogImage;
        console.log(`✅ 通过og:image找到: ${thumbnailUrl}`);
      }
      // 备选twitter:image
      else if (metaTags.twitterImage && metaTags.twitterImage.includes('imgs.crazygames.com')) {
        thumbnailUrl = metaTags.twitterImage;
        console.log(`✅ 通过twitter:image找到: ${thumbnailUrl}`);
      }
      // 备选其他image标签
      else if (metaTags.imageUrl && metaTags.imageUrl.includes('imgs.crazygames.com')) {
        thumbnailUrl = metaTags.imageUrl;
        console.log(`✅ 通过image标签找到: ${thumbnailUrl}`);
      }
      
      if (thumbnailUrl) {
        return {
          slug: gameSlug,
          thumbnailUrl: thumbnailUrl,
          success: true,
          method: 'META标签'
        };
      }
      
    } catch (e) {
      console.log(`⚠ META标签方法失败: ${e.message}`);
    }
    
    // 方法2: 分析页面结构，寻找游戏相关的图片
    console.log(`🔍 方法2: 分析页面结构...`);
    try {
      const pageAnalysis = await page.evaluate((slug) => {
        const analysis = {
          gameImages: [],
          allCrazyGamesImages: [],
          pageStructure: {}
        };
        
        // 查找所有CrazyGames图片
        const allImages = Array.from(document.querySelectorAll('img'));
        analysis.allCrazyGamesImages = allImages
          .map(img => img.src)
          .filter(src => src && src.includes('imgs.crazygames.com'))
          .slice(0, 10); // 限制数量避免输出过多
        
        // 查找游戏相关的图片
        const gameRelatedImages = allImages.filter(img => {
          const alt = (img.alt || '').toLowerCase();
          const src = (img.src || '').toLowerCase();
          const title = (img.title || '').toLowerCase();
          
          return (
            alt.includes(slug.toLowerCase()) ||
            src.includes(slug.toLowerCase()) ||
            title.includes(slug.toLowerCase()) ||
            (src.includes('imgs.crazygames.com') && src.includes('_16x9'))
          );
        });
        
        analysis.gameImages = gameRelatedImages.map(img => ({
          src: img.src,
          alt: img.alt,
          title: img.title,
          className: img.className
        }));
        
        // 分析页面结构
        const gameContainer = document.querySelector('.game-container, .game-header, .game-info, .game-details');
        if (gameContainer) {
          const containerImages = gameContainer.querySelectorAll('img');
          analysis.pageStructure.containerImages = Array.from(containerImages).map(img => img.src);
        }
        
        return analysis;
      }, gameSlug);
      
      console.log(`📊 页面分析结果:`, JSON.stringify(pageAnalysis, null, 2));
      
      // 从分析结果中寻找合适的缩略图
      if (pageAnalysis.gameImages.length > 0) {
        const bestImage = pageAnalysis.gameImages.find(img => 
          img.src.includes('imgs.crazygames.com') && img.src.includes('_16x9')
        );
        
        if (bestImage) {
          thumbnailUrl = bestImage.src;
          console.log(`✅ 通过页面分析找到: ${thumbnailUrl}`);
          return {
            slug: gameSlug,
            thumbnailUrl: thumbnailUrl,
            success: true,
            method: '页面分析'
          };
        }
      }
      
      // 如果没找到游戏特定图片，尝试使用第一个CrazyGames图片
      if (pageAnalysis.allCrazyGamesImages.length > 0) {
        const firstCrazyGamesImage = pageAnalysis.allCrazyGamesImages.find(src => 
          src.includes('_16x9')
        );
        
        if (firstCrazyGamesImage) {
          thumbnailUrl = firstCrazyGamesImage;
          console.log(`✅ 通过通用CrazyGames图片找到: ${thumbnailUrl}`);
          return {
            slug: gameSlug,
            thumbnailUrl: thumbnailUrl,
            success: true,
            method: '通用图片'
          };
        }
      }
      
    } catch (e) {
      console.log(`⚠ 页面分析方法失败: ${e.message}`);
    }
    
    // 方法3: 尝试常见的URL模式
    console.log(`🔍 方法3: 尝试URL模式构造...`);
    const possibleUrls = [
      `https://imgs.crazygames.com/${gameSlug}_16x9/cover?metadata=none&quality=70`,
      `https://imgs.crazygames.com/games/${gameSlug}/cover_16x9.png?metadata=none&quality=70`,
      `https://imgs.crazygames.com/${gameSlug}_16x9/20241201/${gameSlug}_16x9-cover?metadata=none&quality=70`,
      `https://imgs.crazygames.com/${gameSlug}_16x9/20240101/${gameSlug}_16x9-cover?metadata=none&quality=70`
    ];
    
    for (const url of possibleUrls) {
      try {
        console.log(`🔗 测试URL: ${url}`);
        const testResponse = await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        if (testResponse && testResponse.ok()) {
          thumbnailUrl = url;
          console.log(`✅ 通过URL构造找到: ${thumbnailUrl}`);
          return {
            slug: gameSlug,
            thumbnailUrl: thumbnailUrl,
            success: true,
            method: 'URL构造'
          };
        }
      } catch (e) {
        console.log(`❌ URL测试失败: ${e.message}`);
      }
    }
    
    console.log(`❌ 所有方法都未找到 ${gameSlug} 的缩略图`);
    return {
      slug: gameSlug,
      thumbnailUrl: null,
      success: false,
      error: '所有方法都未找到缩略图'
    };
    
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
          const oldUrl = gamesData[gameIndex].thumbnailUrl;
          gamesData[gameIndex].thumbnailUrl = result.thumbnailUrl;
          updatedCount++;
          console.log(`✅ 已更新 ${result.slug} 的缩略图 (方法: ${result.method})`);
          console.log(`   旧URL: ${oldUrl}`);
          console.log(`   新URL: ${result.thumbnailUrl}`);
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
  console.log('🚀 开始获取CrazyGames缩略图 (优化版)...\n');
  
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
      console.log(`⏱ 等待3秒后继续下一个游戏...`);
      await page.waitForTimeout(3000);
    }
    
    // 输出详细结果摘要
    console.log('\n📊 获取结果摘要:');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功获取: ${successful.length} 个`);
    console.log(`❌ 获取失败: ${failed.length} 个`);
    
    if (successful.length > 0) {
      console.log('\n✅ 成功获取的游戏:');
      successful.forEach(result => {
        console.log(`  - ${result.slug} (${result.method}): ${result.thumbnailUrl}`);
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
    } else {
      console.log('\n⚠ 没有成功获取到新的缩略图，未更新文件。');
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