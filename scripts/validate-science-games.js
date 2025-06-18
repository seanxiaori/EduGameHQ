/**
 * 科学游戏验证脚本
 * 验证CrazyGames科学分类中的游戏可用性
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

// 需要验证的科学游戏列表
const SCIENCE_GAMES = [
  'little-alchemy-2',
  'solar-system-scope', 
  'animal-dna-run',
  'mini-scientist',
  'idle-research',
  'skeleton-simulator',
  // 新游戏候选
  'galaxy-control-3d-strategy',
  'quantum-god',
  'alchemy-merge-clicker'
];

/**
 * 验证单个游戏
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
        error: `HTTP ${response ? response.status() : 'TIMEOUT'}`,
        available: false
      };
    }
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 检查页面标题
    const pageTitle = await page.title();
    console.log(`📄 页面标题: ${pageTitle}`);
    
    if (pageTitle.toLowerCase().includes('404') || pageTitle.toLowerCase().includes('not found')) {
      return {
        slug: gameSlug,
        status: 'NOT_FOUND',
        error: '游戏页面不存在',
        available: false
      };
    }
    
    // 检查是否有iframe嵌入
    const gameInfo = await page.evaluate(() => {
      // 查找游戏iframe
      const iframe = document.querySelector('iframe[src*="embed"]');
      const playButton = document.querySelector('button[class*="play"], .play-button, [data-testid*="play"]');
      
      // 检查Flash标识
      const flashIndicators = document.querySelectorAll('*');
      let hasFlash = false;
      
      for (const element of flashIndicators) {
        const text = element.textContent || '';
        if (text.toLowerCase().includes('flash') || 
            text.toLowerCase().includes('adobe') ||
            text.toLowerCase().includes('requires flash')) {
          hasFlash = true;
          break;
        }
      }
      
      return {
        hasIframe: !!iframe,
        hasPlayButton: !!playButton,
        hasFlash: hasFlash,
        iframeUrl: iframe ? iframe.src : null
      };
    });
    
    console.log(`🎮 游戏信息:`, gameInfo);
    
    let status = 'UNKNOWN';
    let available = false;
    
    if (gameInfo.hasFlash) {
      status = 'FLASH_GAME';
      available = false;
    } else if (gameInfo.hasIframe) {
      status = 'HTML5_AVAILABLE';
      available = true;
    } else if (gameInfo.hasPlayButton) {
      status = 'PLAYABLE';
      available = true;
    } else {
      status = 'NO_GAME_FOUND';
      available = false;
    }
    
    console.log(`✅ 验证结果: ${status} - ${available ? '可用' : '不可用'}`);
    
    return {
      slug: gameSlug,
      status: status,
      available: available,
      gameInfo: gameInfo
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
  console.log('🚀 开始验证科学游戏...\n');
  
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
    
    for (const gameSlug of SCIENCE_GAMES) {
      const result = await validateGame(page, gameSlug);
      results.push(result);
      
      // 延迟避免被限制
      await page.waitForTimeout(2000);
    }
    
    // 输出结果摘要
    console.log('\n📊 验证结果摘要:');
    console.log('='.repeat(60));
    
    const available = results.filter(r => r.available);
    const unavailable = results.filter(r => !r.available);
    const flash = results.filter(r => r.status === 'FLASH_GAME');
    
    console.log(`✅ 可用游戏: ${available.length} 个`);
    console.log(`❌ 不可用游戏: ${unavailable.length} 个`);
    console.log(`🔥 Flash游戏: ${flash.length} 个`);
    
    if (available.length > 0) {
      console.log('\n✅ 可用的科学游戏:');
      available.forEach(result => {
        console.log(`  - ${result.slug}: ${result.status}`);
      });
    }
    
    if (unavailable.length > 0) {
      console.log('\n❌ 不可用的科学游戏:');
      unavailable.forEach(result => {
        console.log(`  - ${result.slug}: ${result.status} (${result.error || ''})`);
      });
    }
    
    // 保存详细结果
    fs.writeFileSync('science-games-validation.json', JSON.stringify(results, null, 2));
    console.log('\n💾 详细结果已保存到 science-games-validation.json');
    
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