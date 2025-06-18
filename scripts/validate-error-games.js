/**
 * 验证之前出错的游戏 - 简化版
 */

import puppeteer from 'puppeteer';

// 之前验证出错的游戏列表
const ERROR_GAMES = [
  'words-of-wonders',
  'crossword',
  'crossword-connect',
  'word-wipe',
  'emoji-puzzle',
  'bloxorz',
  'cut-the-rope',
  'table-tennis-world-tour',
  'tennis-masters',
  'draw-climber',
  'trivia-crack'
];

async function validateGame(page, gameSlug) {
  try {
    console.log(`\n🔍 验证游戏: ${gameSlug}`);
    
    const gameUrl = `https://www.crazygames.com/game/${gameSlug}`;
    const response = await page.goto(gameUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    const finalUrl = page.url();
    const statusCode = response ? response.status() : 'unknown';
    
    console.log(`📊 状态码: ${statusCode}`);
    console.log(`🔗 最终URL: ${finalUrl}`);
    
    // 检查是否为404
    if (statusCode === 404) {
      return { slug: gameSlug, status: 'NOT_FOUND', issue: '404错误' };
    }
    
    // 检查重定向
    if (finalUrl !== gameUrl) {
      if (finalUrl.includes('/c/') || finalUrl.includes('/t/') || finalUrl === 'https://www.crazygames.com/') {
        return { slug: gameSlug, status: 'REDIRECTED', issue: '重定向到分类页面' };
      }
    }
    
    await page.waitForTimeout(3000);
    
    // 简化的页面检查
    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const hasGameIframe = document.querySelector('iframe') !== null;
      const has404Content = title.toLowerCase().includes('404') || 
                           title.toLowerCase().includes('not found');
      
      // 检查Flash游戏
      const bodyText = document.body.textContent.toLowerCase();
      const isFlashGame = bodyText.includes('flash (emulated)') || 
                         bodyText.includes('technology: flash');
      
      return { title, hasGameIframe, has404Content, isFlashGame };
    });
    
    console.log(`📄 标题: ${pageInfo.title}`);
    console.log(`🎮 有iframe: ${pageInfo.hasGameIframe}`);
    console.log(`⚡ Flash游戏: ${pageInfo.isFlashGame}`);
    
    if (pageInfo.has404Content) {
      return { slug: gameSlug, status: 'NOT_FOUND', issue: '页面显示404' };
    }
    
    if (pageInfo.isFlashGame) {
      return { 
        slug: gameSlug, 
        status: 'FLASH_GAME', 
        issue: 'Flash游戏，需要模拟器',
        title: pageInfo.title,
        hasIframe: pageInfo.hasGameIframe
      };
    }
    
    if (!pageInfo.hasGameIframe) {
      return { 
        slug: gameSlug, 
        status: 'NO_IFRAME', 
        issue: '没有游戏iframe',
        title: pageInfo.title
      };
    }
    
    return { 
      slug: gameSlug, 
      status: 'AVAILABLE', 
      title: pageInfo.title,
      hasIframe: pageInfo.hasGameIframe
    };
    
  } catch (error) {
    console.error(`❌ 验证 ${gameSlug} 出错:`, error.message);
    return { slug: gameSlug, status: 'ERROR', issue: error.message };
  }
}

async function main() {
  console.log('🚀 验证之前出错的游戏...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const results = [];
    
    for (let i = 0; i < ERROR_GAMES.length; i++) {
      const gameSlug = ERROR_GAMES[i];
      console.log(`\n[${i + 1}/${ERROR_GAMES.length}] 验证: ${gameSlug}`);
      
      const result = await validateGame(page, gameSlug);
      results.push(result);
      
      const statusEmoji = {
        'AVAILABLE': '✅',
        'FLASH_GAME': '⚡',
        'NOT_FOUND': '❌',
        'REDIRECTED': '🔄',
        'NO_IFRAME': '📦',
        'ERROR': '⚠'
      };
      
      console.log(`${statusEmoji[result.status]} ${result.status}: ${result.issue || '游戏可用'}`);
      
      if (i < ERROR_GAMES.length - 1) {
        await page.waitForTimeout(2000);
      }
    }
    
    // 生成报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 验证结果汇总');
    console.log('='.repeat(60));
    
    const available = results.filter(r => r.status === 'AVAILABLE');
    const flashGames = results.filter(r => r.status === 'FLASH_GAME');
    const notFound = results.filter(r => r.status === 'NOT_FOUND');
    const redirected = results.filter(r => r.status === 'REDIRECTED');
    const noIframe = results.filter(r => r.status === 'NO_IFRAME');
    const errors = results.filter(r => r.status === 'ERROR');
    
    console.log(`✅ 可用HTML5游戏: ${available.length} 个`);
    console.log(`⚡ Flash游戏: ${flashGames.length} 个`);
    console.log(`❌ 不存在游戏: ${notFound.length} 个`);
    console.log(`🔄 重定向游戏: ${redirected.length} 个`);
    console.log(`📦 无iframe游戏: ${noIframe.length} 个`);
    console.log(`⚠ 验证错误: ${errors.length} 个`);
    
    if (available.length > 0) {
      console.log('\n✅ 可用的HTML5游戏:');
      available.forEach(game => console.log(`  - ${game.slug}: ${game.title}`));
    }
    
    if (flashGames.length > 0) {
      console.log('\n⚡ Flash游戏 (需要模拟器):');
      flashGames.forEach(game => console.log(`  - ${game.slug}: ${game.title}`));
    }
    
    const unusable = [...notFound, ...redirected, ...noIframe];
    if (unusable.length > 0) {
      console.log('\n🗑 需要移除的游戏:');
      unusable.forEach(game => console.log(`  - ${game.slug}: ${game.issue}`));
    }
    
  } catch (error) {
    console.error('❌ 脚本执行出错:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main().catch(console.error); 