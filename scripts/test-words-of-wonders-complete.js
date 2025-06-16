import puppeteer from 'puppeteer';

/**
 * 完整测试Words of Wonders游戏，包括启动游戏
 */
async function completeTestWordsOfWonders() {
    console.log('🎮 完整测试 Words of Wonders 游戏');
    
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
        
        console.log('页面加载完成');
        
        // 等待Play Now按钮出现
        console.log('等待Play Now按钮...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 查找并点击Play Now按钮
        try {
            const playButton = await page.$('button:contains("Play Now"), button:contains("play now"), .play-button, [class*="play"]');
            if (playButton) {
                console.log('找到Play Now按钮，点击启动游戏...');
                await playButton.click();
            } else {
                console.log('未找到Play Now按钮，尝试点击页面中心...');
                await page.click('body', { x: 640, y: 360 });
            }
        } catch (e) {
            console.log('点击失败，尝试其他方式...');
            await page.keyboard.press('Space');
        }
        
        // 等待游戏启动
        console.log('等待游戏启动...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // 检查是否出现连接问题
        for (let i = 0; i < 6; i++) {
            console.log(`检查第 ${i + 1} 次...`);
            
            const pageText = await page.evaluate(() => document.body.textContent);
            
            // 检查连接问题关键词
            const connectionIssues = [
                'Connection issues',
                'connection issues',
                'troubles connecting',
                'progress you make will be lost',
                'Continue offline',
                'Reload game'
            ];
            
            let foundError = false;
            for (const keyword of connectionIssues) {
                if (pageText.includes(keyword)) {
                    console.log(`❌ 发现连接问题: ${keyword}`);
                    foundError = true;
                    break;
                }
            }
            
            if (foundError) {
                console.log('🚫 Words of Wonders 确实有连接问题！');
                
                // 截图保存错误状态
                await page.screenshot({ 
                    path: 'words-of-wonders-error.png',
                    fullPage: true 
                });
                console.log('错误截图已保存为: words-of-wonders-error.png');
                
                return true; // 有错误
            }
            
            // 等待5秒再检查
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        console.log('✅ 30秒内未发现连接问题');
        
        // 截图保存正常状态
        await page.screenshot({ 
            path: 'words-of-wonders-normal.png',
            fullPage: true 
        });
        console.log('正常截图已保存为: words-of-wonders-normal.png');
        
        return false; // 无错误
        
    } catch (error) {
        console.error('测试失败:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// 运行测试
completeTestWordsOfWonders().then(hasError => {
    if (hasError) {
        console.log('\n🎯 结论: Words of Wonders 游戏有连接问题，验证脚本应该过滤此类游戏');
    } else {
        console.log('\n🎯 结论: Words of Wonders 游戏正常，或连接问题未在测试期间出现');
    }
}); 