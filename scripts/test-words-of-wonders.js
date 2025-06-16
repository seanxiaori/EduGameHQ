import puppeteer from 'puppeteer';

/**
 * 检测游戏是否有连接问题或错误状态
 */
async function checkGameErrors(page) {
    console.log('检查游戏错误状态...');
    
    try {
        // 等待游戏初始加载
        console.log('等待游戏初始加载...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // 尝试点击游戏区域来启动游戏
        console.log('尝试启动游戏...');
        try {
            await page.click('canvas, iframe, .game-container, #game');
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (e) {
            console.log('无法点击游戏区域，继续检测...');
        }
        
        // 再等待一段时间让游戏尝试连接服务器
        console.log('等待游戏连接服务器...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 检查页面文本内容
        const pageText = await page.evaluate(() => document.body.textContent);
        console.log('页面文本片段:', pageText.substring(0, 500));
        
        // 检查常见的错误提示
        const errorKeywords = [
            'Connection issues',
            'connection issues',
            'Connection error',
            'Network error',
            'Unable to connect',
            'Server error',
            'Game unavailable',
            'Service unavailable',
            'Failed to load',
            'Loading failed',
            'Error loading',
            'Game failed to start',
            'Continue offline',
            'Offline mode',
            'No internet connection',
            'Reload game',
            'Try again',
            'Refresh page',
            'troubles connecting',
            'progress you make will be lost'
        ];
        
        for (const keyword of errorKeywords) {
            if (pageText.includes(keyword)) {
                console.log(`❌ 发现错误关键词: ${keyword}`);
                return true;
            }
        }
        
        // 检查是否有错误相关的按钮
        const buttons = await page.$$eval('button', buttons => 
            buttons.map(btn => btn.textContent.toLowerCase().trim())
        );
        
        console.log('页面按钮:', buttons);
        
        for (const buttonText of buttons) {
            if (buttonText.includes('reload') || 
                buttonText.includes('try again') || 
                buttonText.includes('refresh') ||
                buttonText.includes('continue offline')) {
                console.log(`❌ 发现错误按钮: ${buttonText}`);
                return true;
            }
        }
        
        // 检查是否有错误弹窗或模态框
        const errorElements = await page.$$eval('[class*="error"], [class*="modal"], [class*="popup"], [class*="dialog"]', 
            elements => elements.map(el => el.textContent.trim())
        );
        
        for (const errorText of errorElements) {
            if (errorText.includes('Connection') || errorText.includes('Error') || errorText.includes('offline')) {
                console.log(`❌ 发现错误元素: ${errorText}`);
                return true;
            }
        }
        
        console.log('✅ 未发现游戏错误');
        return false;
        
    } catch (error) {
        console.log(`检查错误状态失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试Words of Wonders游戏
 */
async function testWordsOfWonders() {
    console.log('🎮 测试 Words of Wonders 游戏连接问题检测');
    
    const browser = await puppeteer.launch({
        headless: false, // 显示浏览器以便观察
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        const embedUrl = 'https://www.crazygames.com/embed/words-of-wonders';
        console.log(`访问: ${embedUrl}`);
        
        await page.goto(embedUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('页面加载完成，开始深度检查错误...');
        
        // 检查游戏是否有连接问题
        const hasErrors = await checkGameErrors(page);
        
        if (hasErrors) {
            console.log('🚫 Words of Wonders 游戏有连接问题，应该被过滤');
        } else {
            console.log('✅ Words of Wonders 游戏正常，可以使用');
        }
        
        // 截图保存
        await page.screenshot({ 
            path: 'words-of-wonders-test.png',
            fullPage: true 
        });
        console.log('截图已保存为: words-of-wonders-test.png');
        
        // 等待一段时间以便观察
        console.log('等待15秒以便观察...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        await browser.close();
    }
}

// 运行测试
testWordsOfWonders(); 