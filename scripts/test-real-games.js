import puppeteer from 'puppeteer';

/**
 * 测试真正存在的CrazyGames游戏
 */
async function testRealGames() {
    // 从搜索结果中找到的真实游戏
    const realGames = [
        {
            name: 'Space Waves',
            url: 'https://www.crazygames.com/embed/space-waves'
        },
        {
            name: 'Hazmob FPS: Online Shooter',
            url: 'https://www.crazygames.com/embed/hazmob-fps-online-shooter'
        },
        {
            name: 'Crazy Grand Prix',
            url: 'https://www.crazygames.com/embed/crazy-grand-prix'
        },
        {
            name: 'Construction Ramp Jumping',
            url: 'https://www.crazygames.com/embed/construction-ramp-jumping'
        },
        {
            name: 'Xtreme DRIFT Racing',
            url: 'https://www.crazygames.com/embed/xtreme-drift-racing'
        }
    ];
    
    console.log('🔍 测试真实存在的CrazyGames游戏...\n');
    
    const workingGames = [];
    
    for (const game of realGames) {
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
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // 检查页面内容
                const hasIframe = await page.$('iframe');
                const hasCanvas = await page.$('canvas');
                const hasGameContainer = await page.$('#game, .game-container, .unity-container');
                
                console.log(`  有iframe: ${!!hasIframe}`);
                console.log(`  有canvas: ${!!hasCanvas}`);
                console.log(`  有游戏容器: ${!!hasGameContainer}`);
                
                // 检查页面标题
                const title = await page.title();
                console.log(`  页面标题: ${title}`);
                
                // 检查是否是真正的游戏页面（不是"Game Files"页面）
                const isGameFiles = title.includes('Game Files');
                console.log(`  是Game Files页面: ${isGameFiles}`);
                
                if (!isGameFiles && (hasIframe || hasCanvas || hasGameContainer)) {
                    console.log(`  ✅ 真正可嵌入的游戏`);
                    workingGames.push({
                        ...game,
                        hasIframe: !!hasIframe,
                        hasCanvas: !!hasCanvas,
                        hasGameContainer: !!hasGameContainer,
                        title: title
                    });
                } else {
                    console.log(`  ❌ 不是真正的游戏页面或无游戏内容`);
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
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(50));
    console.log(`\n✅ 可用游戏: ${workingGames.length}/${realGames.length}`);
    
    if (workingGames.length > 0) {
        console.log('\n可用游戏列表:');
        workingGames.forEach(game => {
            console.log(`  ✓ ${game.name}`);
            console.log(`    URL: ${game.url}`);
            console.log(`    特征: iframe=${game.hasIframe}, canvas=${game.hasCanvas}, container=${game.hasGameContainer}`);
        });
    }
    
    return workingGames;
}

// 运行测试
testRealGames(); 