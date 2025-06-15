import puppeteer from 'puppeteer';

/**
 * 调试CrazyGames页面结构
 */
async function debugCrazyGamesStructure() {
    console.log('🔍 调试CrazyGames页面结构...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // 显示浏览器窗口便于观察
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // 设置用户代理
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // 1. 检查分类页面结构
        console.log('1️⃣ 检查分类页面结构...');
        const categoryUrl = 'https://www.crazygames.com/c/puzzle';
        console.log(`访问: ${categoryUrl}`);
        
        await page.goto(categoryUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 分析页面结构
        const pageStructure = await page.evaluate(() => {
            const structure = {
                title: document.title,
                gameLinks: [],
                allLinks: [],
                gameElements: []
            };
            
            // 查找所有包含game的链接
            const allLinks = document.querySelectorAll('a');
            for (const link of allLinks) {
                if (link.href && link.href.includes('/game/')) {
                    structure.gameLinks.push({
                        href: link.href,
                        text: link.textContent?.trim(),
                        className: link.className
                    });
                }
                
                structure.allLinks.push({
                    href: link.href,
                    text: link.textContent?.trim()?.substring(0, 50),
                    className: link.className
                });
            }
            
            // 查找可能的游戏容器
            const possibleGameContainers = [
                '.game-card',
                '.game-item',
                '[class*="game"]',
                '[data-game]',
                '.card',
                '.item'
            ];
            
            for (const selector of possibleGameContainers) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    structure.gameElements.push({
                        selector: selector,
                        count: elements.length,
                        sample: elements[0]?.outerHTML?.substring(0, 200)
                    });
                }
            }
            
            return structure;
        });
        
        console.log(`页面标题: ${pageStructure.title}`);
        console.log(`找到游戏链接: ${pageStructure.gameLinks.length} 个`);
        console.log(`总链接数: ${pageStructure.allLinks.length} 个`);
        
        if (pageStructure.gameLinks.length > 0) {
            console.log('\n游戏链接示例:');
            pageStructure.gameLinks.slice(0, 5).forEach((link, i) => {
                console.log(`  ${i + 1}. ${link.text}`);
                console.log(`     URL: ${link.href}`);
                console.log(`     Class: ${link.className}`);
            });
        }
        
        console.log('\n可能的游戏容器:');
        pageStructure.gameElements.forEach(element => {
            console.log(`  ${element.selector}: ${element.count} 个元素`);
        });
        
        // 2. 检查具体游戏页面的embed按钮
        if (pageStructure.gameLinks.length > 0) {
            console.log('\n2️⃣ 检查游戏页面的embed按钮...');
            const firstGame = pageStructure.gameLinks[0];
            console.log(`检查游戏: ${firstGame.text}`);
            console.log(`URL: ${firstGame.href}`);
            
            await page.goto(firstGame.href, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // 等待页面加载
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 查找embed相关元素
            const embedInfo = await page.evaluate(() => {
                const info = {
                    title: document.title,
                    buttons: [],
                    embedElements: [],
                    shareElements: [],
                    codeElements: []
                };
                
                // 查找所有按钮
                const buttons = document.querySelectorAll('button, a, .button, [role="button"]');
                for (const button of buttons) {
                    const text = button.textContent?.toLowerCase() || '';
                    info.buttons.push({
                        text: button.textContent?.trim(),
                        className: button.className,
                        id: button.id,
                        href: button.href || null,
                        isEmbedRelated: text.includes('embed') || text.includes('share') || text.includes('code')
                    });
                }
                
                // 查找embed相关元素
                const embedSelectors = ['[class*="embed"]', '[id*="embed"]', '[data-embed]'];
                for (const selector of embedSelectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        info.embedElements.push({
                            selector: selector,
                            count: elements.length,
                            sample: elements[0]?.outerHTML?.substring(0, 200)
                        });
                    }
                }
                
                // 查找分享相关元素
                const shareSelectors = ['[class*="share"]', '[id*="share"]'];
                for (const selector of shareSelectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        info.shareElements.push({
                            selector: selector,
                            count: elements.length,
                            sample: elements[0]?.outerHTML?.substring(0, 200)
                        });
                    }
                }
                
                // 查找代码相关元素
                const codeElements = document.querySelectorAll('textarea, input[type="text"], code, pre');
                for (const element of codeElements) {
                    const value = element.value || element.textContent || '';
                    if (value.includes('<iframe') || value.includes('embed')) {
                        info.codeElements.push({
                            type: element.tagName,
                            value: value.substring(0, 200)
                        });
                    }
                }
                
                return info;
            });
            
            console.log(`游戏页面标题: ${embedInfo.title}`);
            console.log(`找到按钮: ${embedInfo.buttons.length} 个`);
            
            // 显示embed相关按钮
            const embedButtons = embedInfo.buttons.filter(b => b.isEmbedRelated);
            if (embedButtons.length > 0) {
                console.log('\n✅ 找到embed相关按钮:');
                embedButtons.forEach(button => {
                    console.log(`  • ${button.text}`);
                    console.log(`    Class: ${button.className}`);
                    console.log(`    ID: ${button.id}`);
                    if (button.href) console.log(`    Href: ${button.href}`);
                });
            } else {
                console.log('\n❌ 未找到embed相关按钮');
                console.log('\n所有按钮:');
                embedInfo.buttons.slice(0, 10).forEach(button => {
                    console.log(`  • ${button.text} (${button.className})`);
                });
            }
            
            if (embedInfo.embedElements.length > 0) {
                console.log('\n✅ 找到embed元素:');
                embedInfo.embedElements.forEach(element => {
                    console.log(`  ${element.selector}: ${element.count} 个`);
                });
            }
            
            if (embedInfo.shareElements.length > 0) {
                console.log('\n✅ 找到分享元素:');
                embedInfo.shareElements.forEach(element => {
                    console.log(`  ${element.selector}: ${element.count} 个`);
                });
            }
            
            if (embedInfo.codeElements.length > 0) {
                console.log('\n✅ 找到代码元素:');
                embedInfo.codeElements.forEach(element => {
                    console.log(`  ${element.type}: ${element.value}`);
                });
            }
        }
        
        // 3. 测试已知的embed URL
        console.log('\n3️⃣ 测试已知的embed URL...');
        const testEmbedUrl = 'https://www.crazygames.com/embed/2048';
        console.log(`测试: ${testEmbedUrl}`);
        
        try {
            const response = await page.goto(testEmbedUrl, { 
                waitUntil: 'networkidle2',
                timeout: 20000 
            });
            
            console.log(`状态码: ${response.status()}`);
            
            if (response.status() === 200) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const embedPageInfo = await page.evaluate(() => {
                    return {
                        title: document.title,
                        hasCanvas: !!document.querySelector('canvas'),
                        hasGameContainer: !!document.querySelector('#game, .game-container, .unity-container'),
                        hasIframe: !!document.querySelector('iframe'),
                        bodyText: document.body.textContent?.substring(0, 500)
                    };
                });
                
                console.log(`Embed页面标题: ${embedPageInfo.title}`);
                console.log(`有Canvas: ${embedPageInfo.hasCanvas}`);
                console.log(`有游戏容器: ${embedPageInfo.hasGameContainer}`);
                console.log(`有iframe: ${embedPageInfo.hasIframe}`);
                console.log(`页面内容预览: ${embedPageInfo.bodyText}`);
            }
        } catch (error) {
            console.log(`Embed URL测试失败: ${error.message}`);
        }
        
        console.log('\n✅ 调试完成！');
        
    } catch (error) {
        console.error('调试失败:', error);
    } finally {
        // 保持浏览器打开一段时间便于观察
        console.log('\n浏览器将在10秒后关闭...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await browser.close();
    }
}

// 运行调试
debugCrazyGamesStructure(); 