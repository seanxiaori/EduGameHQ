import { IntelligentGameCrawler } from './intelligent-game-crawler.js';
import fs from 'fs';
import path from 'path';

class ScreenshotFocusedCrawler extends IntelligentGameCrawler {
  constructor() {
    super();
    this.gamesWithoutScreenshots = [];
    this.processedCount = 0;
    this.successCount = 0;
    this.skipCount = 0;
    this.failCount = 0;
    this.screenshotDir = 'public/images/games/details';
    
    // 确保截图目录存在
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async init() {
    await super.init();
    await this.identifyGamesNeedingScreenshots();
  }

  async identifyGamesNeedingScreenshots() {
    console.log('🔍 识别需要截图的游戏...');
    
    // 读取游戏数据
    const gamesData = JSON.parse(fs.readFileSync('src/data/games/games.json', 'utf8'));
    
    // 找出需要截图的游戏
    for (const [gameId, gameData] of Object.entries(gamesData)) {
      const needsScreenshot = !gameData.screenshots || 
                             gameData.screenshots.length === 0 || 
                             gameData.screenshots.some(s => s.includes('default-screenshot'));
      
      if (needsScreenshot && gameData.iframeUrl && !gameData.iframeUrl.includes('placeholder')) {
        this.gamesWithoutScreenshots.push({
          id: gameId,
          data: gameData,
          priority: this.calculatePriority(gameData)
        });
      }
    }
    
    // 按优先级排序
    this.gamesWithoutScreenshots.sort((a, b) => b.priority - a.priority);
    
    console.log(`📊 发现 ${this.gamesWithoutScreenshots.length} 个游戏需要截图`);
    console.log('🎯 将按播放次数优先级处理');
  }

  calculatePriority(gameData) {
    let priority = gameData.playCount || 0;
    
    // 热门分类加权
    const popularCategories = ['math', 'science', 'coding', 'sports'];
    if (popularCategories.includes(gameData.category)) {
      priority += 10000;
    }
    
    return priority;
  }

  // 从iframe URL提取真实游戏URL
  extractRealGameUrl(iframeUrl) {
    try {
      // CrazyGames: 从embed URL提取游戏页面URL
      if (iframeUrl.includes('crazygames.com/embed/')) {
        const gameSlug = iframeUrl.split('/embed/')[1];
        return `https://www.crazygames.com/game/${gameSlug}`;
      }
      
      // Miniplay: 从embed URL提取游戏页面URL
      if (iframeUrl.includes('miniplay.com/embed/')) {
        const gameSlug = iframeUrl.split('/embed/')[1];
        return `https://www.miniplay.com/game/${gameSlug}`;
      }
      
      // GameDistribution: 直接使用iframe URL
      if (iframeUrl.includes('gamedistribution.com')) {
        return iframeUrl;
      }
      
      // Itch.io: 直接使用页面URL
      if (iframeUrl.includes('itch.io')) {
        return iframeUrl;
      }
      
      // 其他情况直接使用原URL
      return iframeUrl;
      
    } catch (error) {
      console.log(`   ⚠️ URL解析失败，使用原URL: ${error.message}`);
      return iframeUrl;
    }
  }

  async crawlScreenshots() {
    console.log('🚀 开始截图专项爬取任务...');
    console.log(`📋 待处理游戏: ${this.gamesWithoutScreenshots.length}`);
    
    for (let i = 0; i < this.gamesWithoutScreenshots.length; i++) {
      const game = this.gamesWithoutScreenshots[i];
      this.processedCount++;
      
      console.log(`\n📋 [${this.processedCount}/${this.gamesWithoutScreenshots.length}] 正在处理: ${game.data.title}`);
      console.log(`📊 进度: ${this.processedCount}/${this.gamesWithoutScreenshots.length} (${Math.round(this.processedCount/this.gamesWithoutScreenshots.length*100)}%)`);
      console.log(`✅ 成功: ${this.successCount} | ⏭️ 跳过: ${this.skipCount} | ❌ 失败: ${this.failCount}`);
      
      try {
        // 检查是否有有效的iframe URL
        if (!game.data.iframeUrl || game.data.iframeUrl.includes('placeholder')) {
          console.log(`⏭️ ${game.data.title} 没有有效的iframe URL，跳过`);
          this.skipCount++;
          continue;
        }

        // 获取真实游戏URL
        const realGameUrl = this.extractRealGameUrl(game.data.iframeUrl);
        
        // 专门针对截图的爬取配置
        const screenshotConfig = {
          url: realGameUrl,
          iframeUrl: game.data.iframeUrl,
          waitTime: 8000, // 等待更长时间确保游戏加载
          screenshotCount: 3, // 多拍几张截图
          focusOnGameplay: true,
          skipIfExists: false // 强制重新截图
        };

        console.log(`🎮 正在访问游戏页面: ${realGameUrl}`);
        
        // 执行截图爬取
        const result = await this.crawlGameScreenshots(game.id, screenshotConfig);
        
        if (result.success) {
          console.log(`✅ ${game.data.title} 截图获取成功`);
          this.successCount++;
          
          // 更新游戏数据
          await this.updateGameScreenshots(game.id, result.screenshots);
        } else {
          console.log(`❌ ${game.data.title} 截图获取失败: ${result.error}`);
          this.failCount++;
        }
        
      } catch (error) {
        console.log(`❌ ${game.data.title} 处理出错: ${error.message}`);
        this.failCount++;
      }
      
      // 进度报告
      if (this.processedCount % 10 === 0) {
        console.log(`\n📊 阶段性报告:`);
        console.log(`   处理进度: ${this.processedCount}/${this.gamesWithoutScreenshots.length}`);
        console.log(`   成功率: ${Math.round(this.successCount/this.processedCount*100)}%`);
        console.log(`   剩余: ${this.gamesWithoutScreenshots.length - this.processedCount} 个游戏`);
      }
      
      // 延迟避免过于频繁的请求
      console.log(`⏳ 等待3秒后处理下一个游戏...`);
      await this.delay(3000);
    }
    
    console.log(`\n🎉 截图爬取任务完成！`);
    console.log(`📊 最终统计: 成功 ${this.successCount} | 跳过 ${this.skipCount} | 失败 ${this.failCount}`);
  }

  async crawlGameScreenshots(gameId, config) {
    try {
      const page = await this.browser.newPage();
      
      // 设置视口大小
      await page.setViewport({ width: 1200, height: 800 });
      
      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // 访问游戏页面
      await page.goto(config.url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      // 等待页面加载
      await this.delay(3000);
      
      // 尝试找到并点击游戏开始按钮
      const gameStarted = await this.tryStartGame(page, config);
      
      if (gameStarted) {
        console.log(`   🎯 成功启动游戏，等待游戏界面加载...`);
        await this.delay(config.waitTime);
      } else {
        console.log(`   ⚠️ 未找到游戏开始按钮，直接截图页面`);
        await this.delay(config.waitTime / 2);
      }
      
      // 拍摄多张截图
      const screenshots = [];
      for (let i = 0; i < config.screenshotCount; i++) {
        const screenshotName = `${gameId}-screenshot-${i + 1}.jpg`;
        const screenshotPath = path.join(this.screenshotDir, screenshotName);
        
        await page.screenshot({
          path: screenshotPath,
          type: 'jpeg',
          quality: 85,
          fullPage: false
        });
        
        screenshots.push(screenshotName);
        console.log(`   📸 已保存截图: ${screenshotName}`);
        
        // 如果不是最后一张，等待一下再截图
        if (i < config.screenshotCount - 1) {
          await this.delay(2000);
          
          // 尝试一些交互来获得不同的游戏状态
          try {
            await page.mouse.click(600, 400); // 点击屏幕中央
            await this.delay(1000);
          } catch (e) {
            // 忽略点击错误
          }
        }
      }
      
      await page.close();
      
      return {
        success: true,
        screenshots: screenshots
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async tryStartGame(page, config) {
    try {
      // 等待页面稳定
      await this.delay(2000);
      
      // 不同网站的游戏开始按钮选择器
      const startButtonSelectors = [
        // 通用开始按钮
        'button[class*="play"]',
        'button[class*="start"]',
        'div[class*="play"]',
        'div[class*="start"]',
        '.play-button',
        '.start-button',
        '.btn-play',
        '.btn-start',
        '#play',
        '#start',
        
        // CrazyGames 特定
        '.cg-play-button',
        '.play-now-button',
        '[data-cy="play-button"]',
        
        // Miniplay 特定
        '.mp-play-button',
        '.game-play-button',
        
        // 通用游戏启动元素
        'iframe[src*="game"]',
        'canvas',
        '.game-container',
        '.game-frame'
      ];
      
      // 尝试点击开始按钮
      for (const selector of startButtonSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            console.log(`   🎮 找到游戏元素: ${selector}`);
            
            // 如果是iframe，切换到iframe内部
            if (selector.includes('iframe')) {
              const iframe = elements[0];
              const frame = await iframe.contentFrame();
              if (frame) {
                console.log(`   🖼️ 切换到游戏iframe`);
                // 在iframe内部寻找开始按钮
                await this.delay(3000);
                const iframeStartSelectors = [
                  'button', 'div[class*="play"]', 'div[class*="start"]',
                  '.play', '.start', '#play', '#start'
                ];
                
                for (const iframeSelector of iframeStartSelectors) {
                  try {
                    const iframeElements = await frame.$$(iframeSelector);
                    if (iframeElements.length > 0) {
                      await iframeElements[0].click();
                      console.log(`   ✅ 在iframe中点击了: ${iframeSelector}`);
                      return true;
                    }
                  } catch (e) {
                    // 继续尝试下一个
                  }
                }
              }
            } else {
              // 直接点击元素
              await elements[0].click();
              console.log(`   ✅ 点击了开始按钮: ${selector}`);
              return true;
            }
          }
        } catch (e) {
          // 继续尝试下一个选择器
          continue;
        }
      }
      
      // 如果没有找到明确的开始按钮，尝试点击页面中央
      console.log(`   🎯 尝试点击页面中央启动游戏`);
      await page.mouse.click(600, 400);
      await this.delay(1000);
      
      // 尝试按空格键或回车键
      await page.keyboard.press('Space');
      await this.delay(500);
      await page.keyboard.press('Enter');
      
      return false; // 没有明确找到开始按钮
      
    } catch (error) {
      console.log(`   ⚠️ 启动游戏时出错: ${error.message}`);
      return false;
    }
  }

  // 延迟函数，替代已废弃的 page.waitForTimeout
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async updateGameScreenshots(gameId, screenshots) {
    try {
      // 读取当前游戏数据
      const gamesData = JSON.parse(fs.readFileSync('src/data/games/games.json', 'utf8'));
      
      if (gamesData[gameId]) {
        // 更新截图信息，保留最好的一张
        gamesData[gameId].screenshots = [screenshots[0]]; // 使用第一张截图
        
        // 保存更新后的数据
        fs.writeFileSync('src/data/games/games.json', JSON.stringify(gamesData, null, 2));
        
        // 同时更新public目录下的文件
        if (fs.existsSync('public/data/games/games.json')) {
          fs.writeFileSync('public/data/games/games.json', JSON.stringify(gamesData, null, 2));
        }
        
        console.log(`   📝 已更新 ${gameId} 的截图信息`);
      }
    } catch (error) {
      console.log(`   ❌ 更新游戏数据失败: ${error.message}`);
    }
  }
}

// 主函数
async function main() {
  const crawler = new ScreenshotFocusedCrawler();
  
  try {
    console.log('🎮 EduGameHQ 截图专项爬虫启动');
    console.log('='.repeat(50));
    
    await crawler.init();
    await crawler.crawlScreenshots();
    
  } catch (error) {
    console.error('❌ 爬虫运行出错:', error);
  } finally {
    await crawler.close();
    console.log('🔒 浏览器已关闭');
    console.log('🔚 截图爬虫已停止');
  }
}

// 如果直接运行此文件
if (process.argv[1] && process.argv[1].endsWith('screenshot-focused-crawler.js')) {
  main().catch(console.error);
}

export { ScreenshotFocusedCrawler }; 