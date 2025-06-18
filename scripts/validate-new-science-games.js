/**
 * 新科学游戏验证脚本
 * 验证CrazyGames科学分类中除已有6款外的其他科学游戏
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

// 需要验证的新科学游戏列表（从CrazyGames科学分类页面提取）
const NEW_SCIENCE_GAMES = [
  'galaxy-control-3d-strategy',
  'quantum-god', 
  'alchemy-merge-clicker',
  'space-pizza',
  'idle-molecules',
  'my-dream-setup',
  'alchemy',
  'giant-earthworm',
  'idle-world',
  'space-company'
];

/**
 * 验证单个游戏的可用性
 */
async function validateGame(page, gameSlug) {
  try {
    console.log(`\n🔍 验证游戏: ${gameSlug}`);
    
    const gameUrl = `https://www.crazygames.com/game/${gameSlug}`;
    console.log(`📍 访问: ${gameUrl}`);
    
    const response = await page.goto(gameUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    if (!response || !response.ok()) {
      return {
        slug: gameSlug,
        status: 'FAILED',
        error: `HTTP ${response ? response.status() : 'unknown'}`,
        available: false
      };
    }
    
    // 检查页面标题
    const pageTitle = await page.title();
    console.log(`📄 页面标题: ${pageTitle}`);
    
    if (pageTitle.toLowerCase().includes('404') || pageTitle.toLowerCase().includes('not found')) {
      return {
        slug: gameSlug,
        status: 'NOT_FOUND',
        error: '游戏页面不存在 (404)',
        available: false
      };
    }
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 检查是否有iframe游戏容器
    const hasIframe = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="embed"]');
      return iframe !== null;
    });
    
    // 检查是否是Flash游戏
    const isFlash = await page.evaluate(() => {
      const bodyText = document.body.textContent.toLowerCase();
      return bodyText.includes('flash') || 
             bodyText.includes('adobe flash') ||
             bodyText.includes('flash player') ||
             bodyText.includes('requires flash');
    });
    
    // 检查游戏是否可以嵌入
    const canEmbed = await page.evaluate(() => {
      const playButton = document.querySelector('button[class*="play"], .play-button, [data-testid*="play"]');
      return playButton !== null;
    });
    
    // 获取游戏基本信息
    const gameInfo = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      
      return {
        title: title || '',
        description: description || '',
        thumbnailUrl: ogImage || ''
      };
    });
    
    const isAvailable = hasIframe && !isFlash && canEmbed;
    
    console.log(`📊 验证结果:`);
    console.log(`   - 有iframe: ${hasIframe}`);
    console.log(`   - 是Flash: ${isFlash}`);
    console.log(`   - 可嵌入: ${canEmbed}`);
    console.log(`   - 最终结果: ${isAvailable ? '✅ 可用' : '❌ 不可用'}`);
    
    return {
      slug: gameSlug,
      status: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      available: isAvailable,
      hasIframe: hasIframe,
      isFlash: isFlash,
      canEmbed: canEmbed,
      title: gameInfo.title,
      description: gameInfo.description,
      thumbnailUrl: gameInfo.thumbnailUrl,
      iframeUrl: isAvailable ? `https://www.crazygames.com/embed/${gameSlug}` : null
    };
    
  } catch (error) {
    console.error(`❌ 验证 ${gameSlug} 时出错:`, error.message);
    return {
      slug: gameSlug,
      status: 'ERROR',
      error: error.message,
      available: false
    };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始验证新科学游戏...\n');
  
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    const results = [];
    
    // 验证每个游戏
    for (const gameSlug of NEW_SCIENCE_GAMES) {
      const result = await validateGame(page, gameSlug);
      results.push(result);
      
      // 延迟避免被限制
      await page.waitForTimeout(2000);
    }
    
    // 输出结果摘要
    console.log('\n📊 验证结果摘要:');
    console.log('='.repeat(80));
    
    const available = results.filter(r => r.available);
    const unavailable = results.filter(r => !r.available);
    
    console.log(`✅ 可用游戏: ${available.length} 个`);
    console.log(`❌ 不可用游戏: ${unavailable.length} 个`);
    
    if (available.length > 0) {
      console.log('\n✅ 可用的科学游戏:');
      available.forEach(game => {
        console.log(`  - ${game.slug}: ${game.title}`);
        console.log(`    描述: ${game.description?.substring(0, 100)}...`);
        console.log(`    嵌入URL: ${game.iframeUrl}`);
      });
    }
    
    if (unavailable.length > 0) {
      console.log('\n❌ 不可用的游戏:');
      unavailable.forEach(game => {
        console.log(`  - ${game.slug}: ${game.error || game.status}`);
      });
    }
    
    // 保存结果到JSON文件
    const resultData = {
      timestamp: new Date().toISOString(),
      total: results.length,
      available: available.length,
      unavailable: unavailable.length,
      games: results
    };
    
    fs.writeFileSync('new-science-games-validation.json', JSON.stringify(resultData, null, 2));
    console.log('\n💾 验证结果已保存到 new-science-games-validation.json');
    
    return available;
    
  } catch (error) {
    console.error('❌ 脚本执行出错:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 运行脚本
main().catch(console.error); 