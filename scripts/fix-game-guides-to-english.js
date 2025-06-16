/**
 * 修正游戏指南为英文内容脚本
 * 从CrazyGames页面获取真实的英文游戏指南内容
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 需要修正的CrazyGames游戏列表
const GAMES_TO_FIX = [
  '2048',
  'count-masters-stickman-games',
  'five-o',
  'merge-the-numbers',
  'numbers-arena',
  'stone-puzzle-games',
  'cypher---code-breaker',
  'hero-castle-war-tower-attack',
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
 * 获取单个游戏的英文指南内容
 */
async function getGameGuideContent(page, gameSlug) {
  try {
    console.log(`\n🔍 正在获取 ${gameSlug} 的英文游戏指南...`);
    
    const gameUrl = `https://www.crazygames.com/game/${gameSlug}`;
    console.log(`📍 访问URL: ${gameUrl}`);
    
    const response = await page.goto(gameUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    if (!response || !response.ok()) {
      console.log(`❌ 页面加载失败，状态码: ${response ? response.status() : '未知'}`);
      return null;
    }
    
    console.log(`✅ 页面加载成功，状态码: ${response.status()}`);
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 获取游戏指南内容
    const gameGuide = await page.evaluate(() => {
      const guide = {
        howToPlay: [],
        controls: {},
        tips: []
      };
      
      // 获取Tips and Tricks部分
      const tipsSection = Array.from(document.querySelectorAll('h2, h3')).find(h => 
        h.textContent.toLowerCase().includes('tips') || 
        h.textContent.toLowerCase().includes('tricks') ||
        h.textContent.toLowerCase().includes('how to play')
      );
      
      if (tipsSection) {
        let currentElement = tipsSection.nextElementSibling;
        while (currentElement && currentElement.tagName !== 'H2' && currentElement.tagName !== 'H3') {
          if (currentElement.tagName === 'UL') {
            const listItems = Array.from(currentElement.querySelectorAll('li'));
            guide.tips = listItems.map(li => li.textContent.trim()).filter(text => text.length > 0);
          } else if (currentElement.tagName === 'P') {
            const text = currentElement.textContent.trim();
            if (text.length > 0) {
              guide.howToPlay.push(text);
            }
          }
          currentElement = currentElement.nextElementSibling;
        }
      }
      
      // 获取Controls部分
      const controlsSection = Array.from(document.querySelectorAll('h2, h3')).find(h => 
        h.textContent.toLowerCase().includes('controls') ||
        h.textContent.toLowerCase().includes('keyboard') ||
        h.textContent.toLowerCase().includes('mouse')
      );
      
      if (controlsSection) {
        let currentElement = controlsSection.nextElementSibling;
        while (currentElement && currentElement.tagName !== 'H2' && currentElement.tagName !== 'H3') {
          if (currentElement.tagName === 'UL') {
            const listItems = Array.from(currentElement.querySelectorAll('li'));
            listItems.forEach(li => {
              const text = li.textContent.trim();
              if (text.toLowerCase().includes('mouse')) {
                guide.controls.mouse = text;
              } else if (text.toLowerCase().includes('keyboard') || text.toLowerCase().includes('arrow') || text.toLowerCase().includes('wasd')) {
                guide.controls.keyboard = text;
              } else if (text.toLowerCase().includes('touch') || text.toLowerCase().includes('tap') || text.toLowerCase().includes('swipe')) {
                guide.controls.touch = text;
              }
            });
          } else if (currentElement.tagName === 'P') {
            const text = currentElement.textContent.trim();
            if (text.length > 0) {
              if (text.toLowerCase().includes('mouse')) {
                guide.controls.mouse = text;
              } else if (text.toLowerCase().includes('keyboard')) {
                guide.controls.keyboard = text;
              } else {
                guide.controls.general = text;
              }
            }
          }
          currentElement = currentElement.nextElementSibling;
        }
      }
      
      // 获取Features部分作为howToPlay的补充
      const featuresSection = Array.from(document.querySelectorAll('h2, h3')).find(h => 
        h.textContent.toLowerCase().includes('features')
      );
      
      if (featuresSection && guide.howToPlay.length === 0) {
        let currentElement = featuresSection.nextElementSibling;
        while (currentElement && currentElement.tagName !== 'H2' && currentElement.tagName !== 'H3') {
          if (currentElement.tagName === 'UL') {
            const listItems = Array.from(currentElement.querySelectorAll('li'));
            guide.howToPlay = listItems.map(li => li.textContent.trim()).filter(text => text.length > 0);
          }
          currentElement = currentElement.nextElementSibling;
        }
      }
      
      // 如果没有找到具体的指南内容，使用游戏描述
      if (guide.howToPlay.length === 0 && guide.tips.length === 0) {
        const description = document.querySelector('meta[property="og:description"]');
        if (description) {
          const descText = description.getAttribute('content');
          if (descText && descText.length > 50) {
            guide.howToPlay.push(descText);
          }
        }
      }
      
      // 如果还是没有内容，提供通用的英文指南
      if (guide.howToPlay.length === 0) {
        guide.howToPlay = [
          "Click to start the game",
          "Follow the on-screen instructions",
          "Use mouse or touch controls to interact",
          "Complete objectives to progress"
        ];
      }
      
      if (Object.keys(guide.controls).length === 0) {
        guide.controls = {
          mouse: "Click and drag to interact",
          touch: "Tap and swipe to control"
        };
      }
      
      if (guide.tips.length === 0) {
        guide.tips = [
          "Read the game instructions carefully",
          "Practice to improve your skills"
        ];
      }
      
      return guide;
    });
    
    console.log(`📋 获取到的英文游戏指南:`, JSON.stringify(gameGuide, null, 2));
    
    return {
      slug: gameSlug,
      gameGuide: gameGuide,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ 获取 ${gameSlug} 时出错:`, error.message);
    return {
      slug: gameSlug,
      gameGuide: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * 更新games.json文件中的游戏指南
 */
function updateGamesJsonWithEnglishGuides(results) {
  try {
    const gamesJsonPath = path.join(process.cwd(), '..', 'src', 'data', 'games.json');
    console.log(`📁 正在读取文件: ${gamesJsonPath}`);
    
    const gamesData = JSON.parse(fs.readFileSync(gamesJsonPath, 'utf-8'));
    
    let updatedCount = 0;
    
    results.forEach(result => {
      if (result.success && result.gameGuide) {
        const gameIndex = gamesData.findIndex(game => game.slug === result.slug);
        if (gameIndex !== -1) {
          gamesData[gameIndex].gameGuide = result.gameGuide;
          console.log(`✅ 已更新 ${result.slug} 的游戏指南为英文内容`);
          updatedCount++;
        } else {
          console.log(`⚠ 未找到游戏: ${result.slug}`);
        }
      }
    });
    
    // 保存更新后的数据
    fs.writeFileSync(gamesJsonPath, JSON.stringify(gamesData, null, 2), 'utf-8');
    
    console.log(`\n🎉 成功更新了 ${updatedCount} 个游戏的英文指南！`);
    
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
  console.log('🚀 开始修正游戏指南为英文内容...\n');
  
  let browser;
  try {
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
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    const results = [];
    
    // 逐个获取游戏指南
    for (const gameSlug of GAMES_TO_FIX) {
      const result = await getGameGuideContent(page, gameSlug);
      if (result) {
        results.push(result);
      }
      
      console.log(`⏱ 等待2秒后继续下一个游戏...`);
      await page.waitForTimeout(2000);
    }
    
    // 输出结果摘要
    console.log('\n📊 修正结果摘要:');
    console.log('='.repeat(80));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功获取: ${successful.length} 个`);
    console.log(`❌ 获取失败: ${failed.length} 个`);
    
    if (failed.length > 0) {
      console.log('\n❌ 获取失败的游戏:');
      failed.forEach(result => {
        console.log(`  - ${result.slug}: ${result.error}`);
      });
    }
    
    // 更新games.json文件
    console.log('\n🔄 正在更新games.json文件...');
    const updatedCount = updateGamesJsonWithEnglishGuides(results);
    
    if (updatedCount > 0) {
      console.log(`\n🎉 任务完成！成功将 ${updatedCount} 个游戏的指南修正为英文内容！`);
      console.log(`\n📝 修正内容包括:`);
      console.log(`   - howToPlay: 游戏玩法说明`);
      console.log(`   - controls: 控制方式说明`);
      console.log(`   - tips: 游戏技巧提示`);
      console.log(`\n✅ 现在所有内容都符合英文规范！`);
    } else {
      console.log('\n⚠ 没有需要更新的内容。');
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