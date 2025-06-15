import puppeteer from 'puppeteer';

/**
 * 测试特定游戏的iframe可用性
 */
async function testSpecificGames() {
    // 测试一些已知的CrazyGames游戏
    const testGames = [
        {
            name: '2048',
            url: 'https://www.crazygames.com/embed/2048'
        },
        {
            name: 'Little Alchemy 2',
            url: 'https://www.crazygames.com/embed/little-alchemy-2'
        },
        {
            name: 'Basketball Stars',
            url: 'https://www.crazygames.com/embed/basketball-stars'
        },
        {
            name: 'Thief Puzzle',
            url: 'https://www.crazygames.com/embed/thief-puzzle'
        },
        {
            name: 'Paper Minecraft',
            url: 'https://www.crazygames.com/embed/paper-minecraft'
        }
    ];
    
    console.log('🔍 测试特定游戏的iframe嵌入支持...\n');
    
    for (const game of testGames) {
        console.log(`测试: ${game.name}`);
        console.log(`URL: ${game.url}`);
        
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 720 });
            
            // 访问游戏页面
            const response = await page.goto(game.url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const status = response.status();
            console.log(`  状态码: ${status}`);
            
            if (status === 200) {
                // 等待页面加载
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // 检查页面内容
                const hasIframe = await page.$('iframe');
                const hasCanvas = await page.$('canvas');
                const hasGameContainer = await page.$('#game, .game-container, .unity-container');
                
                console.log(`  有iframe: ${!!hasIframe}`);
                console.log(`  有canvas: ${!!hasCanvas}`);
                console.log(`  有游戏容器: ${!!hasGameContainer}`);
                
                // 检查页面标题和内容
                const title = await page.title();
                console.log(`  页面标题: ${title}`);
                
                // 检查是否有错误信息
                const bodyText = await page.evaluate(() => document.body.textContent);
                const hasError = bodyText.toLowerCase().includes('error') || 
                               bodyText.toLowerCase().includes('not found') ||
                               bodyText.toLowerCase().includes('unavailable');
                
                console.log(`  有错误信息: ${hasError}`);
                
                if (hasIframe || hasCanvas || hasGameContainer) {
                    console.log(`  ✅ 可嵌入`);
                } else {
                    console.log(`  ❌ 无游戏内容`);
                }
            } else {
                console.log(`  ❌ HTTP错误: ${status}`);
            }
            
        } catch (error) {
            console.log(`  ❌ 错误: ${error.message}`);
        } finally {
            await browser.close();
        }
        
        console.log(''); // 空行分隔
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// 运行测试
testSpecificGames(); 