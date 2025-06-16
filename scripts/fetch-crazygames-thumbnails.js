/**
 * CrazyGames游戏信息获取脚本 (缩略图 + 开发者信息)
 * 专注于META标签获取，提供详细的调试信息
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 需要更新信息的CrazyGames游戏列表 (所有CrazyGames游戏)
const GAMES_TO_UPDATE = [
  // 数学游戏
  'count-masters-stickman-games',
  'five-o',
  'merge-the-numbers',
  '2048',
  'numbers-arena',
  'stone-puzzle-games',
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
  'the-last-light-of-lyra',
  'nullify',
  'number-masters',
  'math-expressions',
  'snake-blockade',
  'xor',
  'dicetris'
];

/**
 * 获取单个游戏的信息 (缩略图 + 开发者)
 */
async function getGameInfo(page, gameSlug) {
  try {
    console.log(`\n🔍 正在获取 ${gameSlug} 的游戏信息...`);
    
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
        developer: null,
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
        developer: null,
        success: false,
        error: '游戏页面不存在 (404)'
      };
    }
    
    let thumbnailUrl = null;
    let developer = null;
    
    // 方法1: 深度挖掘META标签和开发者信息
    console.log(`🔍 方法1: 深度分析META标签和开发者信息...`);
    try {
      // 获取所有可能的META标签和开发者信息
      const gameInfo = await page.evaluate(() => {
        const info = {
          metaTags: {},
          developer: null,
          allImageMetas: []
        };
        
        // 获取META标签
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) info.metaTags.ogImage = ogImage.getAttribute('content');
        
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) info.metaTags.twitterImage = twitterImage.getAttribute('content');
        
        const imageUrl = document.querySelector('meta[name="image"]');
        if (imageUrl) info.metaTags.imageUrl = imageUrl.getAttribute('content');
        
        // 获取开发者信息 - 多种方法尝试
        // 方法1: 查找包含"Developer"文本的元素
        const developerElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent || '';
          return text.toLowerCase().includes('developer') && 
                 text.length < 100 && // 避免获取到长文本
                 !text.toLowerCase().includes('web developer'); // 排除无关内容
        });
        
        if (developerElements.length > 0) {
          // 查找紧邻的元素或同一元素中的开发者名称
          for (const element of developerElements) {
            const parent = element.parentElement;
            const siblings = parent ? Array.from(parent.children) : [];
            const currentIndex = siblings.indexOf(element);
            
            // 检查下一个兄弟元素
            if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
              const nextSibling = siblings[currentIndex + 1];
              const nextText = nextSibling.textContent.trim();
              if (nextText && nextText.length < 50 && !nextText.toLowerCase().includes('developer')) {
                info.developer = nextText;
                break;
              }
            }
            
            // 检查同一元素内的文本
            const fullText = element.textContent;
            const match = fullText.match(/Developer[:\s]+([^,\n\r]+)/i);
            if (match && match[1]) {
              info.developer = match[1].trim();
              break;
            }
          }
        }
        
        // 方法2: 查找特定的CSS选择器
        const possibleSelectors = [
          '.developer-name',
          '.game-developer',
          '.developer-info',
          '[data-developer]',
          '.game-info .developer'
        ];
        
        for (const selector of possibleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            info.developer = element.textContent.trim();
            break;
          }
        }
        
        // 方法3: 查找JSON-LD结构化数据
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data.author && data.author.name) {
              info.developer = data.author.name;
              break;
            }
            if (data.creator && data.creator.name) {
              info.developer = data.creator.name;
              break;
            }
          } catch (e) {
            // 忽略JSON解析错误
          }
        }
        
        // 获取页面中所有图片相关的META标签进行调试
        const allMetas = Array.from(document.querySelectorAll('meta')).map(meta => ({
          name: meta.getAttribute('name'),
          property: meta.getAttribute('property'),
          content: meta.getAttribute('content')
        })).filter(meta => 
          meta.content && 
          (meta.content.includes('img') || meta.content.includes('image') || meta.content.includes('crazygames'))
        );
        
        info.allImageMetas = allMetas;
        
        return info;
      });
      
      console.log(`📋 找到的游戏信息:`, JSON.stringify(gameInfo, null, 2));
      
      // 处理缩略图URL
      if (gameInfo.metaTags.ogImage && gameInfo.metaTags.ogImage.includes('imgs.crazygames.com')) {
        thumbnailUrl = gameInfo.metaTags.ogImage;
        console.log(`✅ 通过og:image找到缩略图: ${thumbnailUrl}`);
      }
      else if (gameInfo.metaTags.twitterImage && gameInfo.metaTags.twitterImage.includes('imgs.crazygames.com')) {
        thumbnailUrl = gameInfo.metaTags.twitterImage;
        console.log(`✅ 通过twitter:image找到缩略图: ${thumbnailUrl}`);
      }
      else if (gameInfo.metaTags.imageUrl && gameInfo.metaTags.imageUrl.includes('imgs.crazygames.com')) {
        thumbnailUrl = gameInfo.metaTags.imageUrl;
        console.log(`✅ 通过image标签找到缩略图: ${thumbnailUrl}`);
      }
      
      // 处理开发者信息
      if (gameInfo.developer) {
        developer = gameInfo.developer;
        console.log(`✅ 找到开发者信息: ${developer}`);
      }
      
    } catch (e) {
      console.log(`⚠ META标签和开发者信息获取失败: ${e.message}`);
    }
    
    // 如果还没找到缩略图，尝试页面分析方法
    if (!thumbnailUrl) {
      console.log(`🔍 方法2: 分析页面结构寻找缩略图...`);
      try {
        const pageAnalysis = await page.evaluate((slug) => {
          const analysis = {
            gameImages: [],
            allCrazyGamesImages: []
          };
          
          // 查找所有CrazyGames图片
          const allImages = Array.from(document.querySelectorAll('img'));
          analysis.allCrazyGamesImages = allImages
            .map(img => img.src)
            .filter(src => src && src.includes('imgs.crazygames.com'))
            .slice(0, 10);
          
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
            title: img.title
          }));
          
          return analysis;
        }, gameSlug);
        
        if (pageAnalysis.gameImages.length > 0) {
          const bestImage = pageAnalysis.gameImages.find(img => 
            img.src.includes('imgs.crazygames.com') && img.src.includes('_16x9')
          );
          
          if (bestImage) {
            thumbnailUrl = bestImage.src;
            console.log(`✅ 通过页面分析找到缩略图: ${thumbnailUrl}`);
          }
        }
        
        if (!thumbnailUrl && pageAnalysis.allCrazyGamesImages.length > 0) {
          const firstCrazyGamesImage = pageAnalysis.allCrazyGamesImages.find(src => 
            src.includes('_16x9')
          );
          
          if (firstCrazyGamesImage) {
            thumbnailUrl = firstCrazyGamesImage;
            console.log(`✅ 通过通用CrazyGames图片找到缩略图: ${thumbnailUrl}`);
          }
        }
        
      } catch (e) {
        console.log(`⚠ 页面分析方法失败: ${e.message}`);
      }
    }
    
    // 如果还没找到开发者信息，使用默认值
    if (!developer) {
      developer = 'CrazyGames Team'; // 默认值
      console.log(`⚠ 未找到开发者信息，使用默认值: ${developer}`);
    }
    
    const success = thumbnailUrl !== null;
    
    if (success) {
      console.log(`✅ ${gameSlug} 信息获取成功:`);
      console.log(`   缩略图: ${thumbnailUrl}`);
      console.log(`   开发者: ${developer}`);
    } else {
      console.log(`❌ ${gameSlug} 缩略图获取失败`);
    }
    
    return {
      slug: gameSlug,
      thumbnailUrl: thumbnailUrl,
      developer: developer,
      success: success,
      method: success ? 'META标签分析' : '获取失败'
    };
    
  } catch (error) {
    console.error(`❌ 获取 ${gameSlug} 时出错:`, error.message);
    return {
      slug: gameSlug,
      thumbnailUrl: null,
      developer: 'CrazyGames Team',
      success: false,
      error: error.message
    };
  }
}

/**
 * 更新games.json文件中的游戏信息
 */
function updateGamesJson(results) {
  try {
    // 修复路径问题 - 从scripts目录回到项目根目录
    const gamesJsonPath = path.join(process.cwd(), '..', 'src', 'data', 'games.json');
    console.log(`📁 正在读取文件: ${gamesJsonPath}`);
    
    const gamesData = JSON.parse(fs.readFileSync(gamesJsonPath, 'utf-8'));
    
    let updatedCount = 0;
    
    // 更新每个游戏的信息
    results.forEach(result => {
      const gameIndex = gamesData.findIndex(game => game.slug === result.slug);
      if (gameIndex !== -1) {
        let hasUpdates = false;
        
        // 更新缩略图
        if (result.thumbnailUrl && result.thumbnailUrl !== gamesData[gameIndex].thumbnailUrl) {
          const oldThumbnail = gamesData[gameIndex].thumbnailUrl;
          gamesData[gameIndex].thumbnailUrl = result.thumbnailUrl;
          console.log(`✅ 已更新 ${result.slug} 的缩略图`);
          console.log(`   旧URL: ${oldThumbnail}`);
          console.log(`   新URL: ${result.thumbnailUrl}`);
          hasUpdates = true;
        }
        
        // 更新开发者信息
        if (result.developer && result.developer !== gamesData[gameIndex].developer) {
          const oldDeveloper = gamesData[gameIndex].developer || '未设置';
          gamesData[gameIndex].developer = result.developer;
          console.log(`✅ 已更新 ${result.slug} 的开发者信息`);
          console.log(`   旧开发者: ${oldDeveloper}`);
          console.log(`   新开发者: ${result.developer}`);
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          updatedCount++;
        }
      } else {
        console.log(`⚠ 未找到游戏: ${result.slug}`);
      }
    });
    
    // 保存更新后的数据
    fs.writeFileSync(gamesJsonPath, JSON.stringify(gamesData, null, 2), 'utf-8');
    
    console.log(`\n🎉 成功更新了 ${updatedCount} 个游戏的信息！`);
    
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
  console.log('🚀 开始获取CrazyGames游戏信息 (缩略图 + 开发者)...\n');
  
  let browser;
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: "new",
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
    
    // 逐个获取游戏信息
    for (const gameSlug of GAMES_TO_UPDATE) {
      const result = await getGameInfo(page, gameSlug);
      results.push(result);
      
      // 添加延迟避免被限制
      console.log(`⏱ 等待3秒后继续下一个游戏...`);
      await page.waitForTimeout(3000);
    }
    
    // 输出详细结果摘要
    console.log('\n📊 获取结果摘要:');
    console.log('='.repeat(80));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功获取: ${successful.length} 个`);
    console.log(`❌ 获取失败: ${failed.length} 个`);
    
    if (successful.length > 0) {
      console.log('\n✅ 成功获取的游戏:');
      successful.forEach(result => {
        console.log(`  - ${result.slug}:`);
        console.log(`    缩略图: ${result.thumbnailUrl}`);
        console.log(`    开发者: ${result.developer}`);
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
    const updatedCount = updateGamesJson(results);
    
    if (updatedCount > 0) {
      console.log(`\n🎉 任务完成！成功更新了 ${updatedCount} 个游戏的信息！`);
    } else {
      console.log('\n⚠ 没有需要更新的信息。');
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