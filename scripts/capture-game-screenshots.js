import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

// 游戏截图配置 - 专门针对CrazyGames优化
const SCREENSHOT_CONFIG = {
    // 基础等待时间
    INITIAL_WAIT: 5000,        // 页面加载后等待5秒
    PLAY_BUTTON_WAIT: 8000,    // 点击Play按钮后等待8秒
    GAME_LOAD_WAIT: 12000,     // 游戏加载等待12秒
    GAMEPLAY_WAIT: 8000,       // 游戏开始后等待8秒再截图
    
    // 截图设置
    VIEWPORT: { width: 1280, height: 720 },
    SCREENSHOT_QUALITY: 95,
    
    // 重试设置
    MAX_RETRIES: 3,
    RETRY_DELAY: 5000
};

/**
 * 点击CrazyGames的Play按钮启动游戏
 */
async function clickPlayButton(page) {
    console.log('  寻找并点击Play按钮...');
    
    const playButtonSelectors = [
        'button:has-text("Play now")',
        'button[class*="css-bs2yur"]',
        'button:contains("Play")',
        'button:contains("Start")',
        '.play-button',
        '.start-button',
        'button[aria-label*="play"]',
        'button[aria-label*="start"]'
    ];
    
    for (const selector of playButtonSelectors) {
        try {
            // 使用更宽松的选择器
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await button.evaluate(el => el.textContent.toLowerCase());
                if (text.includes('play') || text.includes('start')) {
                    console.log(`  找到Play按钮，文本: "${text}"`);
                    
                    // 滚动到按钮位置
                    await button.scrollIntoViewIfNeeded();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // 点击按钮
                    await button.click();
                    console.log('  已点击Play按钮');
                    
                    // 等待游戏开始加载
                    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.PLAY_BUTTON_WAIT));
                    return true;
                }
            }
        } catch (error) {
            continue;
        }
    }
    
    console.log('  未找到Play按钮');
    return false;
}

/**
 * 等待并进入游戏iframe
 */
async function waitAndEnterGameIframe(page) {
    console.log('  等待游戏iframe加载...');
    
    try {
        // 等待iframe出现
        await page.waitForSelector('iframe', { 
            timeout: 25000,
            visible: true
        });
        
        console.log('  找到iframe，等待游戏内容加载...');
        
        // 等待iframe内容加载
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.GAME_LOAD_WAIT));
        
        // 获取iframe
        const iframeElement = await page.$('iframe');
        if (!iframeElement) {
            throw new Error('无法获取iframe元素');
        }
        
        // 进入iframe内容
        const iframe = await iframeElement.contentFrame();
        if (!iframe) {
            console.log('  iframe内容为空，可能游戏直接在主页面加载');
            return null; // 返回null表示游戏在主页面
        }
        
        // 检查iframe是否有实际内容
        const iframeSrc = await iframeElement.evaluate(el => el.src);
        console.log(`  iframe src: ${iframeSrc}`);
        
        if (iframeSrc === 'about:blank') {
            console.log('  iframe为空白页面，游戏可能在主页面');
            return null;
        }
        
        console.log('  成功进入游戏iframe');
        return iframe;
        
    } catch (error) {
        console.log(`  iframe处理失败: ${error.message}`);
        return null;
    }
}

/**
 * 等待游戏完全加载（在主页面或iframe中）
 */
async function waitForGameFullyLoaded(pageOrFrame) {
    console.log('  等待游戏完全加载...');
    
    try {
        // 等待游戏容器或canvas出现
        const gameSelectors = [
            'canvas',
            '#game',
            '#gameContainer',
            '.game-container',
            '.unity-container',
            '.game-canvas',
            '[id*="game"]',
            '[class*="game"]',
            '[id*="unity"]',
            '[class*="unity"]',
            // Words of Wonders 特定选择器
            '.game-board',
            '.word-game',
            '.puzzle-container',
            '.crossword-container'
        ];
        
        let gameElement = null;
        for (const selector of gameSelectors) {
            try {
                gameElement = await pageOrFrame.waitForSelector(selector, { 
                    timeout: 10000,
                    visible: true 
                });
                if (gameElement) {
                    console.log(`  找到游戏元素: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // 额外等待游戏资源加载
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        console.log('  游戏加载完成');
        return gameElement;
        
    } catch (error) {
        console.log('  游戏加载超时，继续尝试');
        return null;
    }
}

/**
 * 智能启动游戏（在主页面或iframe中）
 */
async function startGame(pageOrFrame) {
    console.log('  尝试启动游戏...');
    
    // 常见的游戏启动方式
    const startActions = [
        // 键盘操作
        async () => {
            await pageOrFrame.keyboard.press('Space');
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
        async () => {
            await pageOrFrame.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
        // 点击游戏区域
        async () => {
            const canvas = await pageOrFrame.$('canvas');
            if (canvas) {
                await canvas.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        },
        // 点击页面中心
        async () => {
            await pageOrFrame.mouse.click(640, 360);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    ];
    
    for (const action of startActions) {
        try {
            await action();
            console.log('  执行了启动操作');
        } catch (error) {
            continue;
        }
    }
    
    // 等待游戏响应
    await new Promise(resolve => setTimeout(resolve, 5000));
    return true;
}

/**
 * 模拟游戏操作获得更好的截图
 */
async function simulateGameplay(pageOrFrame, gameCategory = 'general') {
    console.log('  模拟游戏操作...');
    
    try {
        // 根据游戏类型进行不同操作
        switch (gameCategory) {
            case 'language':
                // 语言游戏：点击和拖拽操作
                await pageOrFrame.mouse.click(400, 300);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await pageOrFrame.mouse.click(600, 400);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await pageOrFrame.mouse.click(500, 350);
                await new Promise(resolve => setTimeout(resolve, 2000));
                break;
                
            case 'math':
            case 'puzzle':
                // 数学/益智游戏：方向键操作
                await pageOrFrame.keyboard.press('ArrowRight');
                await new Promise(resolve => setTimeout(resolve, 1500));
                await pageOrFrame.keyboard.press('ArrowDown');
                await new Promise(resolve => setTimeout(resolve, 1500));
                await pageOrFrame.keyboard.press('ArrowLeft');
                await new Promise(resolve => setTimeout(resolve, 1500));
                await pageOrFrame.keyboard.press('ArrowUp');
                await new Promise(resolve => setTimeout(resolve, 1500));
                break;
                
            case 'science':
                // 科学游戏：点击和探索
                await pageOrFrame.mouse.click(400, 300);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await pageOrFrame.mouse.click(600, 400);
                await new Promise(resolve => setTimeout(resolve, 2000));
                break;
                
            case 'coding':
                // 编程游戏：方向键和确认
                await pageOrFrame.keyboard.press('ArrowUp');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await pageOrFrame.keyboard.press('ArrowRight');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await pageOrFrame.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 2000));
                break;
                
            case 'sports':
                // 体育游戏：空格和方向键
                await pageOrFrame.keyboard.press('Space');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await pageOrFrame.keyboard.press('ArrowUp');
                await new Promise(resolve => setTimeout(resolve, 1500));
                break;
                
            default:
                // 通用操作
                await pageOrFrame.keyboard.press('Space');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await pageOrFrame.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await pageOrFrame.keyboard.press('ArrowRight');
                await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // 最终等待让游戏状态稳定
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.GAMEPLAY_WAIT));
        console.log('  游戏操作完成，准备截图');
        
    } catch (error) {
        console.log('  游戏操作失败，直接截图');
        await new Promise(resolve => setTimeout(resolve, 8000));
    }
}

/**
 * 智能识别并截取游戏核心区域
 */
async function captureGameAreaOnly(page, gameContext) {
    console.log('  智能识别游戏区域...');
    
    try {
        // 尝试找到游戏的核心区域
        const gameAreaSelectors = [
            // Words of Wonders 特定选择器
            '.game-board',
            '.word-game',
            '.puzzle-container',
            '.crossword-container',
            '.game-wrapper',
            // 通用游戏区域
            'canvas',
            '#game',
            '#gameContainer',
            '.unity-container',
            '.game-canvas',
            // 更广泛的游戏选择器
            '[id*="game"]',
            '[class*="game"]',
            '[id*="unity"]',
            '[class*="unity"]',
            // HTML5游戏容器
            '.html5-game',
            '.webgl-content',
            '.game-frame'
        ];
        
        let gameElement = null;
        let selector = null;
        
        for (const sel of gameAreaSelectors) {
            try {
                gameElement = await gameContext.$(sel);
                if (gameElement) {
                    selector = sel;
                    console.log(`  找到游戏区域: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (gameElement) {
            // 获取游戏元素的边界框
            const boundingBox = await gameElement.boundingBox();
            if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
                console.log(`  游戏区域位置: x=${boundingBox.x}, y=${boundingBox.y}, width=${boundingBox.width}, height=${boundingBox.height}`);
                
                // 检查是否是全屏游戏（占据大部分视口）
                const isFullscreen = boundingBox.width > SCREENSHOT_CONFIG.VIEWPORT.width * 0.8 && 
                                   boundingBox.height > SCREENSHOT_CONFIG.VIEWPORT.height * 0.8;
                
                if (isFullscreen) {
                    console.log('  检测到全屏游戏，使用中心区域截图');
                    // 对于全屏游戏，截取中心区域，去掉边缘的UI元素
                    const centerPadding = 100;
                    return {
                        x: centerPadding,
                        y: centerPadding,
                        width: SCREENSHOT_CONFIG.VIEWPORT.width - centerPadding * 2,
                        height: SCREENSHOT_CONFIG.VIEWPORT.height - centerPadding * 2
                    };
                }
                
                // 对于小游戏，添加适当边距
                const padding = Math.min(20, boundingBox.width * 0.1, boundingBox.height * 0.1);
                const clip = {
                    x: Math.max(0, boundingBox.x - padding),
                    y: Math.max(0, boundingBox.y - padding),
                    width: Math.min(SCREENSHOT_CONFIG.VIEWPORT.width - boundingBox.x + padding, boundingBox.width + padding * 2),
                    height: Math.min(SCREENSHOT_CONFIG.VIEWPORT.height - boundingBox.y + padding, boundingBox.height + padding * 2)
                };
                
                console.log(`  裁剪区域: x=${clip.x}, y=${clip.y}, width=${clip.width}, height=${clip.height}`);
                return clip;
            } else {
                console.log('  游戏元素边界框无效，使用默认区域');
            }
        }
        
        // 如果找不到特定游戏区域，使用iframe的边界
        if (gameContext !== page) {
            console.log('  使用iframe区域作为游戏区域');
            const iframeElement = await page.$('iframe');
            if (iframeElement) {
                const boundingBox = await iframeElement.boundingBox();
                if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
                    // 为iframe添加小边距，去掉边框
                    const padding = 10;
                    return {
                        x: boundingBox.x + padding,
                        y: boundingBox.y + padding,
                        width: boundingBox.width - padding * 2,
                        height: boundingBox.height - padding * 2
                    };
                }
            }
        }
        
        // 最后的备选方案：使用页面中心区域
        console.log('  使用页面中心区域作为游戏区域');
        const centerPadding = 150;
        return {
            x: centerPadding,
            y: centerPadding,
            width: SCREENSHOT_CONFIG.VIEWPORT.width - centerPadding * 2,
            height: SCREENSHOT_CONFIG.VIEWPORT.height - centerPadding * 2
        };
        
    } catch (error) {
        console.log(`  游戏区域识别失败: ${error.message}`);
        // 返回中心区域作为备选
        const centerPadding = 150;
        return {
            x: centerPadding,
            y: centerPadding,
            width: SCREENSHOT_CONFIG.VIEWPORT.width - centerPadding * 2,
            height: SCREENSHOT_CONFIG.VIEWPORT.height - centerPadding * 2
        };
    }
}

/**
 * 捕获CrazyGames游戏真实运行截图
 */
async function captureGameplayScreenshot(gameUrl, gameSlug, gameCategory = 'general') {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
        ]
    });
    
    let page;
    try {
        page = await browser.newPage();
        
        // 设置视口
        await page.setViewport(SCREENSHOT_CONFIG.VIEWPORT);
        
        // 设置用户代理
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log(`开始截图: ${gameSlug}`);
        console.log(`  访问: ${gameUrl}`);
        
        // 访问游戏页面
        await page.goto(gameUrl, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        // 初始等待
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.INITIAL_WAIT));
        
        // 点击Play按钮启动游戏
        const playClicked = await clickPlayButton(page);
        if (!playClicked) {
            console.log('  未找到Play按钮，尝试直接加载游戏');
        }
        
        // 等待并尝试进入游戏iframe
        const iframe = await waitAndEnterGameIframe(page);
        const gameContext = iframe || page; // 如果没有iframe，使用主页面
        
        console.log(`  游戏运行在: ${iframe ? 'iframe' : '主页面'}`);
        
        // 等待游戏完全加载
        await waitForGameFullyLoaded(gameContext);
        
        // 尝试启动游戏
        await startGame(gameContext);
        
        // 模拟游戏操作
        await simulateGameplay(gameContext, gameCategory);
        
        // 智能识别游戏区域
        const gameClip = await captureGameAreaOnly(page, gameContext);
        
        // 确保目录存在
        const screenshotDir = path.join('public', 'images', 'games', gameCategory);
        await fs.mkdir(screenshotDir, { recursive: true });
        
        // 截图文件路径
        const filename = `${gameSlug}-gameplay.png`;
        const filepath = path.join(screenshotDir, filename);
        
        // 截图配置
        const screenshotOptions = {
            path: filepath,
            type: 'png',
            fullPage: false
        };
        
        // 如果识别到了游戏区域，使用裁剪截图
        if (gameClip) {
            screenshotOptions.clip = gameClip;
            console.log('  使用智能裁剪截图');
        } else {
            console.log('  使用完整页面截图');
        }
        
        // 执行截图
        await page.screenshot(screenshotOptions);
        
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
            
            // 检查是否已有真实截图
            if (game.thumbnailUrl && 
                !game.thumbnailUrl.includes('placeholder') && 
                !game.thumbnailUrl.includes('.svg') &&
                game.thumbnailUrl.includes('-gameplay.png')) {
                console.log('  已有游戏截图，跳过');
                continue;
            }
            
            // 确定游戏URL
            const gameUrl = game.iframeUrl;
            if (!gameUrl) {
                console.log('  无iframe URL，跳过');
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
                if (!game.screenshotUrls) {
                    game.screenshotUrls = [];
                }
                game.screenshotUrls.push(screenshotUrl);
                console.log('  ✅ 截图成功');
            } else {
                console.log('  ❌ 截图失败');
            }
            
            // 每个游戏之间延迟，避免被封
            await new Promise(resolve => setTimeout(resolve, 5000));
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
        
        const gameUrl = game.iframeUrl;
        if (!gameUrl) {
            console.error('游戏没有iframe URL');
            return;
        }
        
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