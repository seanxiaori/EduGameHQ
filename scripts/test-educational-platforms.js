import puppeteer from 'puppeteer';

/**
 * 测试真正可用的教育游戏平台
 */
async function testEducationalPlatforms() {
    // 测试真正支持iframe的教育游戏
    const testGames = [
        {
            name: 'OnlineGames.io - Highway Traffic',
            url: 'https://www.onlinegames.io/games/2022/unity/highway-traffic/index.html',
            platform: 'OnlineGames.io'
        },
        {
            name: 'OnlineGames.io - Drift King',
            url: 'https://www.onlinegames.io/games/2022/unity/drift-king/index.html',
            platform: 'OnlineGames.io'
        },
        {
            name: 'CokoGames - Math Duck',
            url: 'https://www.cokogames.com/game/math-duck/',
            platform: 'CokoGames'
        },
        {
            name: 'Eclipse 2024 Widget',
            url: 'https://widget.simulationcurriculum.com/embedded/eclipse-2024-embedded.html',
            platform: 'SimulationCurriculum'
        },
        {
            name: 'PolyTrack Racing Game',
            url: 'https://polytrack.org/',
            platform: 'PolyTrack'
        }
    ];
    
    console.log('🔍 测试真正可用的教育游戏平台...\n');
    
    const workingGames = [];
    
    for (const game of testGames) {
        console.log(`测试: ${game.name}`);
        console.log(`平台: ${game.platform}`);
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
                const hasCanvas = await page.$('canvas');
                const hasGameContainer = await page.$('#game, .game-container, .unity-container');
                const hasGameContent = await page.$('.game-content, .game-area, .game-wrapper');
                
                console.log(`  有canvas: ${!!hasCanvas}`);
                console.log(`  有游戏容器: ${!!hasGameContainer}`);
                console.log(`  有游戏内容: ${!!hasGameContent}`);
                
                // 检查页面标题
                const title = await page.title();
                console.log(`  页面标题: ${title}`);
                
                // 检查是否有错误信息
                const bodyText = await page.evaluate(() => document.body.textContent);
                const hasError = bodyText.toLowerCase().includes('error') || 
                               bodyText.toLowerCase().includes('not found') ||
                               bodyText.toLowerCase().includes('unavailable');
                
                console.log(`  有错误信息: ${hasError}`);
                
                // 检查是否可以嵌入iframe
                const canEmbed = !hasError && (hasCanvas || hasGameContainer || hasGameContent || game.platform === 'SimulationCurriculum');
                
                if (canEmbed) {
                    console.log(`  ✅ 可以嵌入iframe`);
                    workingGames.push({
                        ...game,
                        hasCanvas: !!hasCanvas,
                        hasGameContainer: !!hasGameContainer,
                        hasGameContent: !!hasGameContent,
                        title: title
                    });
                } else {
                    console.log(`  ❌ 不适合iframe嵌入`);
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
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 教育游戏平台测试结果汇总');
    console.log('='.repeat(60));
    console.log(`\n✅ 可用游戏: ${workingGames.length}/${testGames.length}`);
    
    if (workingGames.length > 0) {
        console.log('\n✅ 可用游戏列表:');
        workingGames.forEach(game => {
            console.log(`  ✓ ${game.name}`);
            console.log(`    平台: ${game.platform}`);
            console.log(`    URL: ${game.url}`);
            console.log(`    特征: canvas=${game.hasCanvas}, container=${game.hasGameContainer}, content=${game.hasGameContent}`);
            console.log('');
        });
        
        console.log('🎯 推荐使用的平台:');
        const platforms = [...new Set(workingGames.map(g => g.platform))];
        platforms.forEach(platform => {
            const count = workingGames.filter(g => g.platform === platform).length;
            console.log(`  • ${platform}: ${count}个可用游戏`);
        });
    }
    
    return workingGames;
}

// 运行测试
testEducationalPlatforms(); 