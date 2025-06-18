/**
 * CrazyGames游戏可用性验证脚本
 * 系统性检查所有游戏URL的可用性，避免无效游戏的嵌入工作
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 从教育游戏资源文档中提取的所有CrazyGames游戏列表
const CRAZYGAMES_TO_VALIDATE = [
  // 语言游戏
  'words-of-wonders',
  'crossword',
  'crossword-connect', 
  'word-wipe',
  'emoji-puzzle',
  'typing-speed-test',
  'keybr',
  
  // 编程游戏
  'code-combat',
  'lightbot',
  'robot-programming',
  
  // 解谜游戏
  'bloxorz',
  'cut-the-rope',
  'brain-test-tricky-puzzles',
  'red-ball-4',
  'fireboy-and-watergirl-forest-temple',
  'memory-test',
  'simon-says',
  
  // 体育游戏
  'basketball-stars',
  'soccer-skills-world-cup',
  'table-tennis-world-tour',
  'tennis-masters',
  
  // 艺术创意游戏
  'draw-climber',
  'draw-story',
  'coloring-book',
  'pixel-art',
  
  // 历史地理游戏
  'geography-quiz-flags-and-capitals',
  'world-geography-quiz',
  'flags-of-the-world-quiz',
  'trivia-crack',
  'quizzland-trivia'
];

/**
 * 验证单个游戏的可用性
 */
async function validateGame(page, gameSlug) {
  try {
    console.log(`\n🔍 验证游戏: ${gameSlug}`);
    
    const gameUrl = `https://www.crazygames.com/game/${gameSlug}`;
    console.log(`📍 访问URL: ${gameUrl}`);
    
    // 访问游戏页面
    const response = await page.goto(gameUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    const finalUrl = page.url();
    const statusCode = response ? response.status() : 'unknown';
    
    console.log(`📊 状态码: ${statusCode}`);
    console.log(`🔗 最终URL: ${finalUrl}`);
    
    // 检查是否为404页面
    if (statusCode === 404) {
      return {
        slug: gameSlug,
        status: 'NOT_FOUND',
        statusCode: 404,
        finalUrl: finalUrl,
        issue: '游戏页面不存在 (404错误)'
      };
    }
    
    // 检查是否重定向到其他页面
    if (finalUrl !== gameUrl) {
      console.log(`⚠ 发生重定向: ${gameUrl} -> ${finalUrl}`);
      
      // 检查是否重定向到分类页面或首页
      if (finalUrl.includes('/c/') || finalUrl.includes('/t/') || finalUrl === 'https://www.crazygames.com/') {
        return {
          slug: gameSlug,
          status: 'REDIRECTED',
          statusCode: statusCode,
          finalUrl: finalUrl,
          issue: '游戏不存在，重定向到分类页面或首页'
        };
      }
    }
    
    // 等待页面加载完成
    await page.waitForTimeout(3000);
    
    // 检查页面标题和内容
    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const hasGameIframe = document.querySelector('iframe') !== null;
      const hasGameOverMessage = document.querySelector('h1')?.textContent?.includes('GAME OVER') || false;
      const has404Content = title.toLowerCase().includes('404') || 
                           title.toLowerCase().includes('not found') ||
                           document.body.textContent.toLowerCase().includes('page you\'re looking for doesn\'t exist');
      
      // 检查是否为Flash游戏
      const technologyElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('flash')
      );
      const isFlashGame = technologyElements.some(el => 
        el.textContent.toLowerCase().includes('flash (emulated)') ||
        el.textContent.toLowerCase().includes('technology: flash')
      );
      
      // 检查游戏是否可以iframe嵌入
      const embedButton = document.querySelector('button[title*="Embed"]');
      const hasEmbedOption = embedButton !== null;
      
      return {
        title,
        hasGameIframe,
        hasGameOverMessage,
        has404Content,
        isFlashGame,
        hasEmbedOption
      };
    });
    
    console.log(`📄 页面标题: ${pageInfo.title}`);
    console.log(`🎮 包含游戏iframe: ${pageInfo.hasGameIframe}`);
    console.log(`⚡ Flash游戏: ${pageInfo.isFlashGame}`);
    console.log(`📦 支持嵌入: ${pageInfo.hasEmbedOption}`);
    
    // 判断游戏状态
    if (pageInfo.has404Content || pageInfo.hasGameOverMessage) {
      return {
        slug: gameSlug,
        status: 'NOT_FOUND',
        statusCode: statusCode,
        finalUrl: finalUrl,
        issue: '页面内容显示游戏不存在'
      };
    }
    
    if (pageInfo.isFlashGame) {
      return {
        slug: gameSlug,
        status: 'FLASH_GAME',
        statusCode: statusCode,
        finalUrl: finalUrl,
        issue: 'Flash游戏，需要模拟器支持',
        title: pageInfo.title,
        hasIframe: pageInfo.hasGameIframe,
        canEmbed: pageInfo.hasEmbedOption
      };
    }
    
    if (!pageInfo.hasGameIframe) {
      return {
        slug: gameSlug,
        status: 'NO_IFRAME',
        statusCode: statusCode,
        finalUrl: finalUrl,
        issue: '页面没有游戏iframe，可能不支持嵌入',
        title: pageInfo.title
      };
    }
    
    // 游戏可用
    return {
      slug: gameSlug,
      status: 'AVAILABLE',
      statusCode: statusCode,
      finalUrl: finalUrl,
      title: pageInfo.title,
      hasIframe: pageInfo.hasGameIframe,
      canEmbed: pageInfo.hasEmbedOption,
      isFlash: pageInfo.isFlashGame
    };
    
  } catch (error) {
    console.error(`❌ 验证 ${gameSlug} 时出错:`, error.message);
    return {
      slug: gameSlug,
      status: 'ERROR',
      statusCode: 'error',
      finalUrl: null,
      issue: `验证过程出错: ${error.message}`
    };
  }
}

/**
 * 生成验证报告
 */
function generateReport(results) {
  const available = results.filter(r => r.status === 'AVAILABLE');
  const flashGames = results.filter(r => r.status === 'FLASH_GAME');
  const notFound = results.filter(r => r.status === 'NOT_FOUND');
  const redirected = results.filter(r => r.status === 'REDIRECTED');
  const noIframe = results.filter(r => r.status === 'NO_IFRAME');
  const errors = results.filter(r => r.status === 'ERROR');
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 CrazyGames游戏验证报告');
  console.log('='.repeat(80));
  
  console.log(`\n📊 验证统计:`);
  console.log(`✅ 可用游戏: ${available.length} 个`);
  console.log(`⚡ Flash游戏: ${flashGames.length} 个 (需要模拟器)`);
  console.log(`❌ 不存在游戏: ${notFound.length} 个`);
  console.log(`🔄 重定向游戏: ${redirected.length} 个`);
  console.log(`📦 无iframe游戏: ${noIframe.length} 个`);
  console.log(`⚠ 验证错误: ${errors.length} 个`);
  console.log(`📈 总验证数: ${results.length} 个`);
  
  if (available.length > 0) {
    console.log(`\n✅ 可用的HTML5游戏 (推荐使用):`);
    available.forEach(game => {
      console.log(`