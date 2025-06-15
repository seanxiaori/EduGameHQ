import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

// 游戏截图配置
const SCREENSHOT_CONFIG = {
    // 基础等待时间
    INITIAL_WAIT: 3000,        // 页面加载后等待3秒
    GAME_LOAD_WAIT: 5000,      // 游戏加载等待5秒
    GAMEPLAY_WAIT: 8000,       // 游戏开始后等待8秒再截图
    
    // 截图设置
    VIEWPORT: { width: 1920, height: 1080 },
    SCREENSHOT_QUALITY: 90,
    
    // 重试设置
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000
};

// 常见的游戏开始按钮选择器
const GAME_START_SELECTORS = [
    'button[class*="play"]',
    'button[class*="start"]',
    'button[class*="begin"]',
    '.play-button',
    '.start-button',
    '.game-start',
    '[data-testid="play-button"]',
    '[aria-label*="play"]',
    '[aria-label*="start"]',
    'div[class*="play"]',
    'div[class*="start"]',
    // CrazyGames特定选择器
    '.cta-button',
    '.play-cta',
    '#play-button',
    // 通用游戏按钮
    'canvas + button',
    '.game-container button'
];

/**
 * 智能等待游戏加载完成
 */
async function waitForGameLoad(page) {
    console.log('  等待游戏加载...');
    
    try {
        // 等待可能的iframe加载
        await page.waitForSelector('iframe, canvas, #game-container', { 
            timeout: 15000,
            visible: true
        }).catch(() => {
            console.log('  未找到游戏容器，继续...');
        });
        
        // 额外等待时间让游戏完全加载
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.GAME_LOAD_WAIT));
        
        console.log('  游戏加载完成');
        return true;
    } catch (error) {
        console.log('  游戏加载超时，继续尝试截图');
        return false;
    }
}

/**
 * 智能寻找并点击开始按钮
 */
async function findAndClickStartButton(page) {
    console.log('  寻找游戏开始按钮...');
    
    for (const selector of GAME_START_SELECTORS) {
        try {
            // 检查按钮是否存在且可见
            const button = await page.$(selector);
            if (button) {
                const isVisible = await button.isVisible();
                if (isVisible) {
                    console.log(`  找到开始按钮: ${selector}`);
                    
                    // 滚动到按钮位置
                    await button.scrollIntoViewIfNeeded();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // 点击按钮
                    await button.click();
                    console.log('  已点击开始按钮');
                    
                    // 等待游戏开始
                    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.GAMEPLAY_WAIT));
                    return true;
                }
            }
        } catch (error) {
            // 继续尝试下一个选择器
            continue;
        }
    }
    
    // 如果没找到按钮，尝试点击游戏区域
    try {
        console.log('  未找到开始按钮，尝试点击游戏区域...');
        
        // 尝试点击iframe或canvas
        const gameElement = await page.$('iframe, canvas, #game-container');
        if (gameElement) {
            await gameElement.click();
            await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.GAMEPLAY_WAIT));
            console.log('  已点击游戏区域');
            return true;
        }
        
        // 最后尝试：点击页面中心
        await page.click('body', { 
            offset: { 
                x: SCREENSHOT_CONFIG.VIEWPORT.width / 2, 
                y: SCREENSHOT_CONFIG.VIEWPORT.height / 2 
            }
        });
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.GAMEPLAY_WAIT));
        console.log('  已点击页面中心');
        return true;
        
    } catch (error) {
        console.log('  无法找到可点击的游戏元素');
        return false;
    }
}

/**
 * 模拟游戏操作以获得更好的截图
 */
async function simulateGameplay(page, gameCategory = 'general') {
    console.log('  模拟游戏操作...');
    
    try {
        switch (gameCategory) {
            case 'puzzle':
            case 'math':
                // 益智/数学游戏：方向键操作
                await page.keyboard.press('ArrowRight');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.keyboard.press('ArrowDown');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.keyboard.press('ArrowLeft');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.keyboard.press('ArrowUp');
                await new Promise(resolve => setTimeout(resolve, 1000));
                break;
                
            case 'action':
                // 动作游戏：移动和跳跃
                await page.keyboard.press('Space');
                await new Promise(resolve => setTimeout(resolve, 500));
                await page.keyboard.press('ArrowRight');
                await new Promise(resolve => setTimeout(resolve, 1000));
                break;
                
            default:
                // 通用操作：空格键和方向键
                await page.keyboard.press('Space');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 额外等待让游戏状态稳定
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('  游戏操作完成');
        
    } catch (error) {
        console.log('  游戏操作失败，继续截图');
    }
}

/**
 * 捕获游戏真实运行截图
 */
async function captureGameplayScreenshot(gameUrl, gameSlug, gameCategory = 'general') {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu'
        ]
    });
    
    let page;
    try {
        page = await browser.newPage();
        
        // 设置视口
        await page.setViewport(SCREENSHOT_CONFIG.VIEWPORT);
        
        // 设置用户代理，避免被识别为机器人
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log(`开始截图: ${gameSlug}`);
        console.log(`  访问: ${gameUrl}`);
        
        // 访问游戏页面
        await page.goto(gameUrl, { 
            waitUntil: 'networkidle0',
            timeout: 60000 
        });
        
        // 等待初始加载
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.INITIAL_WAIT));
        
        // 等待游戏加载
        await waitForGameLoad(page);
        
        // 寻找并点击开始按钮
        const gameStarted = await findAndClickStartButton(page);
        
        if (gameStarted) {
            // 模拟一些游戏操作
            await simulateGameplay(page, gameCategory);
        }
        
        // 确保目录存在
        const screenshotDir = path.join('public', 'images', 'games', gameCategory);
        await fs.mkdir(screenshotDir, { recursive: true });
        
        // 截图文件路径
        const filename = `${gameSlug}-gameplay.png`;
        const filepath = path.join(screenshotDir, filename);
        
        // 截图
        await page.screenshot({
            path: filepath,
            type: 'png',
            fullPage: false  // 只截图可视区域，避免包含太多空白
        });
        
        console.log(`  截图保存: ${filepath}`);
        
        // 返回相对路径用于数据库
        return `/images/games/${gameCategory}/${filename}`;
        
    } catch (error) {
        console.error(`  截图失败: ${error.message}`);
        return null;
    } finally {
        if (page) await page.close();
        await browser.close();
    }
}

/**
 * 批量处理游戏截图
 */
async function batchCaptureGameplayScreenshots() {
    try {
        // 读取游戏数据
        const gamesData = JSON.parse(await fs.readFile('src/data/games.json', 'utf8'));
        
        console.log(`开始批量截图，共 ${gamesData.length} 个游戏`);
        
        for (let i = 0; i < gamesData.length; i++) {
            const game = gamesData[i];
            
            console.log(`\n[${i + 1}/${gamesData.length}] 处理游戏: ${game.title}`);
            
            // 检查是否已有截图
            if (game.thumbnailUrl && !game.thumbnailUrl.includes('placeholder') && !game.thumbnailUrl.includes('.svg')) {
                console.log('  已有截图，跳过');
                continue;
            }
            
            // 确定游戏URL
            const gameUrl = game.iframeUrl || game.sourceUrl;
            if (!gameUrl) {
                console.log('  无游戏URL，跳过');
                continue;
            }
            
            // 重试机制
            let screenshotUrl = null;
            for (let retry = 0; retry < SCREENSHOT_CONFIG.MAX_RETRIES; retry++) {
                if (retry > 0) {
                    console.log(`  重试 ${retry}/${SCREENSHOT_CONFIG.MAX_RETRIES}`);
                    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.RETRY_DELAY));
                }
                
                screenshotUrl = await captureGameplayScreenshot(
                    gameUrl,
                    game.slug,
                    game.category
                );
                
                if (screenshotUrl) break;
            }
            
            // 更新游戏数据
            if (screenshotUrl) {
                game.thumbnailUrl = screenshotUrl;
                game.screenshotUrls = [screenshotUrl];
                console.log('  ✅ 截图成功');
            } else {
                console.log('  ❌ 截图失败');
            }
            
            // 每个游戏之间延迟，避免被封
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // 保存更新后的数据
        await fs.writeFile('src/data/games.json', JSON.stringify(gamesData, null, 2));
        console.log('\n✅ 批量截图完成，数据已保存');
        
    } catch (error) {
        console.error('批量截图失败:', error);
    }
}

/**
 * 单个游戏截图（用于测试）
 */
async function captureSingleGame(gameSlug) {
    try {
        const gamesData = JSON.parse(await fs.readFile('src/data/games.json', 'utf8'));
        const game = gamesData.find(g => g.slug === gameSlug);
        
        if (!game) {
            console.error(`未找到游戏: ${gameSlug}`);
            return;
        }
        
        console.log(`测试截图: ${game.title}`);
        
        const gameUrl = game.iframeUrl || game.sourceUrl;
        const screenshotUrl = await captureGameplayScreenshot(
            gameUrl,
            game.slug,
            game.category
        );
        
        if (screenshotUrl) {
            game.thumbnailUrl = screenshotUrl;
            await fs.writeFile('src/data/games.json', JSON.stringify(gamesData, null, 2));
            console.log('✅ 测试截图成功');
        } else {
            console.log('❌ 测试截图失败');
        }
        
    } catch (error) {
        console.error('测试截图失败:', error);
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.length > 0) {
    // 单个游戏测试
    captureSingleGame(args[0]);
} else {
    // 批量处理
    batchCaptureGameplayScreenshots();
}

export {
    captureGameplayScreenshot,
    batchCaptureGameplayScreenshots,
    captureSingleGame
}; 