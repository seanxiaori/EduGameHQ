import puppeteer from 'puppeteer';

async function debugPageStructure(gameUrl) {
    const browser = await puppeteer.launch({
        headless: false,  // 显示浏览器窗口
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        console.log(`访问页面: ${gameUrl}`);
        await page.goto(gameUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 检查页面结构
        console.log('\n=== 页面结构分析 ===');
        
        // 检查iframe
        const iframes = await page.$$('iframe');
        console.log(`找到 ${iframes.length} 个iframe`);
        
        for (let i = 0; i < iframes.length; i++) {
            const iframe = iframes[i];
            const src = await iframe.evaluate(el => el.src);
            const id = await iframe.evaluate(el => el.id);
            const className = await iframe.evaluate(el => el.className);
            console.log(`  iframe ${i + 1}: src=${src}, id=${id}, class=${className}`);
        }
        
        // 检查canvas元素
        const canvases = await page.$$('canvas');
        console.log(`\n找到 ${canvases.length} 个canvas元素`);
        
        // 检查游戏容器
        const gameContainers = await page.$$('[id*="game"], [class*="game"], .unity-container');
        console.log(`\n找到 ${gameContainers.length} 个可能的游戏容器`);
        
        // 检查按钮
        const buttons = await page.$$('button');
        console.log(`\n找到 ${buttons.length} 个按钮`);
        
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
            const button = buttons[i];
            const text = await button.evaluate(el => el.textContent);
            const className = await button.evaluate(el => el.className);
            console.log(`  按钮 ${i + 1}: text="${text}", class="${className}"`);
        }
        
        // 获取页面HTML结构（前1000字符）
        const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 1000));
        console.log('\n=== 页面HTML结构（前1000字符）===');
        console.log(bodyHTML);
        
        // 等待用户观察
        console.log('\n浏览器窗口已打开，请观察页面结构...');
        console.log('按任意键继续...');
        
        // 等待30秒让用户观察
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('调试失败:', error);
    } finally {
        await browser.close();
    }
}

// 测试几个游戏URL
const testUrls = [
    'https://www.crazygames.com/embed/2048',
    'https://www.crazygames.com/embed/count-masters-stickman-games',
    'https://www.crazygames.com/embed/little-alchemy-2'
];

async function debugMultipleGames() {
    for (const url of testUrls) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`调试游戏: ${url}`);
        console.log('='.repeat(50));
        
        await debugPageStructure(url);
        
        console.log('\n等待5秒后继续下一个游戏...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

// 如果提供了URL参数，调试单个游戏，否则调试多个
const args = process.argv.slice(2);
if (args.length > 0) {
    debugPageStructure(args[0]);
} else {
    debugMultipleGames();
}

async function testSprunkiLinks() {
    const testUrls = [
        'https://www.crazygames.com/embed/sprunki',
        'https://www.crazygames.com/embed/sprunki-itn', 
        'https://www.crazygames.com/game/sprunki-itn',
        'https://www.crazygames.com/game/sprunki'
    ];
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (const url of testUrls) {
        try {
            console.log(`\n测试链接: ${url}`);
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 720 });
            
            const response = await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            console.log(`状态码: ${response.status()}`);
            
            if (response.status() === 200) {
                // 检查页面内容
                const title = await page.title();
                console.log(`页面标题: ${title}`);
                
                // 检查是否有游戏内容
                const hasGame = await page.$('iframe, canvas, #game, .game-container');
                console.log(`包含游戏内容: ${hasGame ? '是' : '否'}`);
                
                // 如果是embed页面，检查iframe
                if (url.includes('/embed/')) {
                    const iframes = await page.$$('iframe');
                    console.log(`iframe数量: ${iframes.length}`);
                }
            }
            
            await page.close();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`错误: ${error.message}`);
        }
    }
    
    await browser.close();
}

testSprunkiLinks(); 