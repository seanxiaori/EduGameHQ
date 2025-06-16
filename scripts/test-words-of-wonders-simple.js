import puppeteer from 'puppeteer';

/**
 * 点击PLAY NOW按钮启动游戏
 */
async function clickPlayNowButton(page) {
    console.log('寻找并点击PLAY NOW按钮...');
    
    try {
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 寻找PLAY NOW按钮的多种可能选择器
        const playButtonSelectors = [
            'button:has-text("PLAY NOW")',
            'button:has-text("Play Now")', 
            'button:has-text("play now")',
            'button[class*="play"]',
            '.play-button',
            '.start-button',
            'button:contains("PLAY")',
            'button:contains("START")'
        ];
        
        // 先尝试直接选择器
        for (const selector of playButtonSelectors) {
            try {
                const button = await page.$(selector);
                if (button) {
                    console.log(`找到PLAY按钮: ${selector}`);
                    await button.click();
                    console.log('✅ 已点击PLAY NOW按钮');
                    return true;
                }
            } catch (e) {
                continue;
            }
        }
        
        // 如果直接选择器失败，遍历所有按钮找包含play的
        console.log('尝试遍历所有按钮...');
        const buttons = await page.$$('button');
        for (const button of buttons) {
            try {
                const text = await button.evaluate(el => el.textContent.toLowerCase().trim());
                console.log(`检查按钮文本: "${text}"`);
                
                if (text.includes('play') || text.includes('start')) {
                    console.log(`找到PLAY按钮，文本: "${text}"`);
                    await button.scrollIntoViewIfNeeded();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await button.click();
                    console.log('✅ 已点击PLAY NOW按钮');
                    return true;
                }
            } catch (e) {
                continue;
            }
        }
        
        console.log('❌ 未找到PLAY NOW按钮');
        return false;
        
    } catch (error) {
        console.log(`点击PLAY NOW失败: ${error.message}`);
        return false;
    }
}

/**
 * 简化版登录检测 - 在游戏启动后检测
 */
async function checkIfGameNeedsLogin(page) {
    console.log('检查游戏是否需要登录...');
    
    try {
        // 等待游戏加载和可能的错误出现
        console.log('等待游戏加载...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 检测登录相关的关键词和元素
        const loginIndicators = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            const loginKeywords = [
                'sign in',
                'log in', 
                'login',
                'create account',
                'register',
                'connection issues',
                'network error',
                'server error',
                'try reloading',
                'continue offline',
                'reload game',
                'connection lost',
                'unable to connect',
                'troubles connecting',
                'progress you make will be lost',
                'any progress you make will be lost'
            ];
            
            // 检查文本内容
            const hasLoginText = loginKeywords.some(keyword => text.includes(keyword));
            
            // 检查登录按钮
            const loginButtons = document.querySelectorAll('button, a, div');
            const hasLoginButton = Array.from(loginButtons).some(btn => {
                const btnText = btn.textContent.toLowerCase();
                return btnText.includes('sign in') || 
                       btnText.includes('log in') || 
                       btnText.includes('login') ||
                       btnText.includes('reload') ||
                       btnText.includes('try again') ||
                       btnText.includes('continue offline');
            });
            
            // 检查错误模态框
            const errorModals = document.querySelectorAll('.modal, .popup, .dialog, .error-message, .alert');
            const hasErrorModal = errorModals.length > 0;
            
            // 获取页面文本用于调试
            const pageText = document.body.innerText;
            
            return {
                hasLoginText,
                hasLoginButton,
                hasErrorModal,
                needsLogin: hasLoginText || hasLoginButton || hasErrorModal,
                pageText: pageText.substring(0, 1000), // 前1000字符用于调试
                foundKeywords: loginKeywords.filter(keyword => text.includes(keyword))
            };
        });
        
        console.log('检测结果:');
        console.log(`  需要登录文本: ${loginIndicators.hasLoginText ? '是' : '否'}`);
        console.log(`  有登录按钮: ${loginIndicators.hasLoginButton ? '是' : '否'}`);
        console.log(`  有错误弹窗: ${loginIndicators.hasErrorModal ? '是' : '否'}`);
        console.log(`  总结: ${loginIndicators.needsLogin ? '❌ 需要登录/有连接问题' : '✅ 可直接玩'}`);
        
        if (loginIndicators.foundKeywords.length > 0) {
            console.log(`  发现关键词: ${loginIndicators.foundKeywords.join(', ')}`);
        }
        
        if (loginIndicators.needsLogin) {
            console.log('\n页面内容预览:');
            console.log(loginIndicators.pageText);
        }
        
        return loginIndicators;
        
    } catch (error) {
        console.log(`检查失败: ${error.message}`);
        return { needsLogin: true, error: error.message };
    }
}

/**
 * 测试Words of Wonders是否需要登录（完整流程）
 */
async function testWordsOfWondersLogin() {
    const browser = await puppeteer.launch({
        headless: false, // 显示浏览器，方便观察
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        console.log('🎯 测试Words of Wonders登录检测（完整流程）');
        console.log('访问: https://www.crazygames.com/embed/words-of-wonders');
        
        // 访问embed页面
        await page.goto('https://www.crazygames.com/embed/words-of-wonders', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // 第一步：点击PLAY NOW按钮
        const playClicked = await clickPlayNowButton(page);
        if (!playClicked) {
            console.log('❌ 无法找到或点击PLAY NOW按钮');
            return;
        }
        
        // 第二步：等待游戏启动并检查是否需要登录
        console.log('\n等待游戏启动...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 第三步：检查是否需要登录
        const result = await checkIfGameNeedsLogin(page);
        
        console.log('\n🎯 测试结论:');
        if (result.needsLogin) {
            console.log('❌ Words of Wonders需要登录或有连接问题，应该被过滤掉');
        } else {
            console.log('✅ Words of Wonders可以直接玩，可以保留');
        }
        
        // 等待一下让用户观察
        console.log('\n等待15秒让你观察浏览器中的游戏状态...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        if (page) await page.close();
        await browser.close();
    }
}

// 运行测试
testWordsOfWondersLogin(); 