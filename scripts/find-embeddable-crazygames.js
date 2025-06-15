import puppeteer from 'puppeteer';
import fs from 'fs/promises';

/**
 * CrazyGames分类映射 - 教育相关分类
 */
const CRAZYGAMES_CATEGORIES = {
    'math': {
        name: '数学游戏',
        searchTerms: ['math', 'numbers', 'calculation', 'arithmetic', 'puzzle'],
        crazyGamesCategory: 'puzzle' // CrazyGames上的分类
    },
    'science': {
        name: '科学游戏', 
        searchTerms: ['science', 'physics', 'chemistry', 'biology', 'space'],
        crazyGamesCategory: 'educational'
    },
    'coding': {
        name: '编程游戏',
        searchTerms: ['coding', 'programming', 'logic', 'algorithm'],
        crazyGamesCategory: 'puzzle'
    },
    'language': {
        name: '语言游戏',
        searchTerms: ['word', 'spelling', 'vocabulary', 'trivia'],
        crazyGamesCategory: 'puzzle'
    },
    'puzzle': {
        name: '益智游戏',
        searchTerms: ['puzzle', 'brain', 'logic', 'strategy'],
        crazyGamesCategory: 'puzzle'
    },
    'sports': {
        name: '体育游戏',
        searchTerms: ['sports', 'basketball', 'football', 'soccer'],
        crazyGamesCategory: 'sports'
    },
    'creative': {
        name: '创意游戏',
        searchTerms: ['creative', 'art', 'music', 'drawing'],
        crazyGamesCategory: 'casual'
    },
    'geography': {
        name: '地理历史',
        searchTerms: ['geography', 'history', 'world', 'countries'],
        crazyGamesCategory: 'educational'
    }
};

/**
 * 搜索CrazyGames分类页面中的游戏
 */
async function searchCategoryGames(page, category, maxGames = 20) {
    console.log(`\n🔍 搜索分类: ${category}`);
    
    try {
        // 访问CrazyGames分类页面
        const categoryUrl = `https://www.crazygames.com/c/${category}`;
        console.log(`  访问: ${categoryUrl}`);
        
        await page.goto(categoryUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 等待游戏列表加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 获取游戏链接 - 使用调试发现的正确选择器
        const gameLinks = await page.evaluate(() => {
            const links = [];
            // 使用调试发现的游戏链接选择器
            const gameElements = document.querySelectorAll('a[href*="/game/"].GameThumb_gameThumbLinkDesktop__wcir5');
            
            for (const element of gameElements) {
                const href = element.href;
                // 查找游戏标题 - 可能在不同的子元素中
                let title = '';
                
                // 尝试多种方式获取标题
                const titleSelectors = [
                    'h3', 
                    '.game-title', 
                    '[class*="title"]',
                    '[class*="Title"]',
                    'span',
                    'div'
                ];
                
                for (const selector of titleSelectors) {
                    const titleElement = element.querySelector(selector);
                    if (titleElement && titleElement.textContent?.trim()) {
                        title = titleElement.textContent.trim();
                        break;
                    }
                }
                
                // 如果还没找到标题，使用alt属性或其他属性
                if (!title) {
                    const img = element.querySelector('img');
                    if (img && img.alt) {
                        title = img.alt;
                    }
                }
                
                // 最后尝试使用链接的文本内容
                if (!title) {
                    title = element.textContent?.trim() || 'Unknown Game';
                }
                
                if (href && title && href.includes('/game/')) {
                    links.push({
                        url: href,
                        title: title,
                        slug: href.split('/game/')[1]?.split('?')[0]?.split('/')[0]
                    });
                }
            }
            
            return links;
        });
        
        console.log(`  找到 ${gameLinks.length} 个游戏`);
        
        // 限制数量避免过多请求
        return gameLinks.slice(0, maxGames);
        
    } catch (error) {
        console.log(`  分类搜索失败: ${error.message}`);
        return [];
    }
}

/**
 * 检查单个游戏是否有embed按钮
 */
async function checkGameEmbedButton(page, gameInfo) {
    console.log(`\n  检查游戏: ${gameInfo.title}`);
    console.log(`    URL: ${gameInfo.url}`);
    
    try {
        // 访问游戏页面
        await page.goto(gameInfo.url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 查找embed按钮 - 使用调试发现的信息
        const embedInfo = await page.evaluate(() => {
            let embedButton = null;
            let shareButton = null;
            let embedCode = null;
            
            // 查找embed和share按钮 - 使用调试发现的类名
            const buttons = document.querySelectorAll('button, a, .button, [role="button"]');
            for (const button of buttons) {
                const text = button.textContent?.toLowerCase()?.trim() || '';
                const className = button.className || '';
                
                if (text === 'embed' && className.includes('Button_czyButton__y8IRs')) {
                    embedButton = {
                        text: button.textContent?.trim(),
                        className: button.className,
                        id: button.id
                    };
                }
                
                if (text === 'share' && className.includes('Button_czyButton__y8IRs')) {
                    shareButton = {
                        text: button.textContent?.trim(),
                        className: button.className,
                        id: button.id
                    };
                }
            }
            
            // 查找现成的embed代码
            const codeElements = document.querySelectorAll('textarea, input[type="text"], code, pre');
            for (const element of codeElements) {
                const value = element.value || element.textContent || '';
                if (value.includes('<iframe') && value.includes('embed')) {
                    embedCode = value.trim();
                    break;
                }
            }
            
            // 检查页面是否有游戏内容
            const hasCanvas = !!document.querySelector('canvas');
            const hasGameContainer = !!document.querySelector('#game, .game-container, .unity-container');
            const hasIframe = !!document.querySelector('iframe');
            
            return {
                hasEmbedButton: !!embedButton,
                hasShareButton: !!shareButton,
                embedButton: embedButton,
                shareButton: shareButton,
                embedCode: embedCode,
                hasGameContent: hasCanvas || hasGameContainer || hasIframe,
                hasCanvas: hasCanvas,
                hasGameContainer: hasGameContainer,
                hasIframe: hasIframe
            };
        });
        
        console.log(`    有embed按钮: ${embedInfo.hasEmbedButton ? '✅' : '❌'}`);
        console.log(`    有游戏内容: ${embedInfo.hasGameContent ? '✅' : '❌'}`);
        
        if (embedInfo.hasEmbedButton) {
            console.log(`    Embed按钮: ${embedInfo.embedButton?.text}`);
        }
        
        if (embedInfo.embedCode) {
            console.log(`    找到embed代码`);
        }
        
        // 如果有embed按钮或代码，尝试构造embed URL
        let embedUrl = null;
        if (embedInfo.hasEmbedButton || embedInfo.embedCode) {
            // 构造标准的CrazyGames embed URL
            embedUrl = `https://www.crazygames.com/embed/${gameInfo.slug}`;
        }
        
        return {
            ...gameInfo,
            ...embedInfo,
            embedUrl: embedUrl,
            canEmbed: embedInfo.hasEmbedButton && embedInfo.hasGameContent
        };
        
    } catch (error) {
        console.log(`    检查失败: ${error.message}`);
        return {
            ...gameInfo,
            hasEmbedButton: false,
            hasGameContent: false,
            canEmbed: false,
            error: error.message
        };
    }
}

/**
 * 验证embed URL是否真正可用
 */
async function verifyEmbedUrl(page, gameInfo) {
    if (!gameInfo.embedUrl) {
        return { ...gameInfo, embedVerified: false };
    }
    
    console.log(`    验证embed: ${gameInfo.embedUrl}`);
    
    try {
        const response = await page.goto(gameInfo.embedUrl, { 
            waitUntil: 'networkidle2',
            timeout: 20000 
        });
        
        const status = response.status();
        console.log(`    Embed状态: ${status}`);
        
        if (status === 200) {
            // 检查embed页面是否有游戏内容 - CrazyGames使用动态加载
            await new Promise(resolve => setTimeout(resolve, 5000)); // 增加等待时间
            
            const embedPageInfo = await page.evaluate(() => {
                const hasCanvas = !!document.querySelector('canvas');
                const hasGameContainer = !!document.querySelector('#game, .game-container, .unity-container');
                const hasIframe = !!document.querySelector('iframe');
                
                // 检查是否有CrazyGames的loader配置
                const bodyText = document.body.textContent || '';
                const hasLoaderOptions = bodyText.includes('loaderOptions') || bodyText.includes('game-files.crazygames.com');
                
                // 检查页面标题是否包含"Game Files"（这是embed页面的特征）
                const isGameFilesPage = document.title.includes('Game Files');
                
                return {
                    hasCanvas: hasCanvas,
                    hasGameContainer: hasGameContainer,
                    hasIframe: hasIframe,
                    hasLoaderOptions: hasLoaderOptions,
                    isGameFilesPage: isGameFilesPage,
                    title: document.title,
                    hasGameContent: hasIframe || hasCanvas || hasGameContainer || hasLoaderOptions
                };
            });
            
            console.log(`    Embed页面标题: ${embedPageInfo.title}`);
            console.log(`    是Game Files页面: ${embedPageInfo.isGameFilesPage ? '✅' : '❌'}`);
            console.log(`    有iframe: ${embedPageInfo.hasIframe ? '✅' : '❌'}`);
            console.log(`    有loader配置: ${embedPageInfo.hasLoaderOptions ? '✅' : '❌'}`);
            console.log(`    Embed有游戏内容: ${embedPageInfo.hasGameContent ? '✅' : '❌'}`);
            
            return {
                ...gameInfo,
                embedVerified: embedPageInfo.hasGameContent,
                embedStatus: status,
                embedPageInfo: embedPageInfo
            };
        } else {
            return {
                ...gameInfo,
                embedVerified: false,
                embedStatus: status
            };
        }
        
    } catch (error) {
        console.log(`    Embed验证失败: ${error.message}`);
        return {
            ...gameInfo,
            embedVerified: false,
            embedError: error.message
        };
    }
}

/**
 * 评估游戏的教育价值
 */
function evaluateEducationalValue(gameInfo, category) {
    const title = gameInfo.title.toLowerCase();
    const categoryConfig = CRAZYGAMES_CATEGORIES[category];
    
    let educationalScore = 0;
    let educationalReasons = [];
    
    // 检查标题中的教育关键词
    for (const term of categoryConfig.searchTerms) {
        if (title.includes(term)) {
            educationalScore += 2;
            educationalReasons.push(`包含关键词: ${term}`);
        }
    }
    
    // 额外的教育关键词
    const educationalKeywords = [
        'learn', 'education', 'school', 'quiz', 'brain', 'smart', 
        'challenge', 'skill', 'training', 'practice', 'study'
    ];
    
    for (const keyword of educationalKeywords) {
        if (title.includes(keyword)) {
            educationalScore += 1;
            educationalReasons.push(`教育关键词: ${keyword}`);
        }
    }
    
    // 避免的关键词（降低教育价值）
    const avoidKeywords = ['violent', 'war', 'kill', 'blood', 'fight'];
    for (const keyword of avoidKeywords) {
        if (title.includes(keyword)) {
            educationalScore -= 3;
            educationalReasons.push(`不适合关键词: ${keyword}`);
        }
    }
    
    return {
        ...gameInfo,
        educationalScore: Math.max(0, educationalScore),
        educationalReasons: educationalReasons,
        isEducational: educationalScore > 0
    };
}

/**
 * 搜索指定分类的可嵌入教育游戏
 */
async function findEmbeddableGamesInCategory(category, maxGames = 10) {
    console.log(`\n🎯 搜索分类: ${CRAZYGAMES_CATEGORIES[category].name}`);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // 设置用户代理
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // 搜索分类中的游戏
        const categoryConfig = CRAZYGAMES_CATEGORIES[category];
        const gameLinks = await searchCategoryGames(page, categoryConfig.crazyGamesCategory, maxGames * 2);
        
        if (gameLinks.length === 0) {
            console.log('  未找到游戏');
            return [];
        }
        
        const embeddableGames = [];
        
        // 检查每个游戏
        for (let i = 0; i < Math.min(gameLinks.length, maxGames * 2); i++) {
            const gameInfo = gameLinks[i];
            
            // 检查embed按钮
            const gameWithEmbed = await checkGameEmbedButton(page, gameInfo);
            
            // 如果有embed可能性，验证embed URL
            if (gameWithEmbed.canEmbed) {
                const verifiedGame = await verifyEmbedUrl(page, gameWithEmbed);
                
                // 评估教育价值
                const educationalGame = evaluateEducationalValue(verifiedGame, category);
                
                // 只保留真正可嵌入且有教育价值的游戏
                if (educationalGame.embedVerified && educationalGame.isEducational) {
                    embeddableGames.push(educationalGame);
                    console.log(`    ✅ 找到可用游戏: ${educationalGame.title}`);
                    
                    // 达到目标数量就停止
                    if (embeddableGames.length >= maxGames) {
                        break;
                    }
                }
            }
            
            // 延迟避免被封
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log(`\n📊 分类 ${category} 结果: 找到 ${embeddableGames.length} 个可用游戏`);
        return embeddableGames;
        
    } catch (error) {
        console.error(`分类 ${category} 搜索失败:`, error);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * 搜索所有分类的可嵌入游戏
 */
async function findAllEmbeddableGames() {
    console.log('🚀 开始搜索CrazyGames上真正可嵌入的教育游戏...\n');
    
    const allGames = {};
    const summary = {
        totalGames: 0,
        categoryCounts: {},
        timestamp: new Date().toISOString()
    };
    
    // 搜索每个分类
    for (const [category, config] of Object.entries(CRAZYGAMES_CATEGORIES)) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`搜索分类: ${config.name} (${category})`);
        console.log('='.repeat(50));
        
        const games = await findEmbeddableGamesInCategory(category, 8);
        allGames[category] = games;
        summary.categoryCounts[category] = games.length;
        summary.totalGames += games.length;
        
        // 分类间延迟
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 生成报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 搜索结果汇总');
    console.log('='.repeat(60));
    
    console.log(`\n总计找到: ${summary.totalGames} 个可嵌入的教育游戏\n`);
    
    for (const [category, games] of Object.entries(allGames)) {
        const config = CRAZYGAMES_CATEGORIES[category];
        console.log(`${config.name}: ${games.length} 个游戏`);
        
        games.forEach(game => {
            console.log(`  ✓ ${game.title}`);
            console.log(`    URL: ${game.embedUrl}`);
            console.log(`    教育分数: ${game.educationalScore}`);
        });
        console.log('');
    }
    
    // 保存结果
    const report = {
        summary: summary,
        games: allGames,
        searchConfig: CRAZYGAMES_CATEGORIES
    };
    
    await fs.writeFile('scripts/embeddable-games-report.json', JSON.stringify(report, null, 2));
    console.log('📄 详细报告已保存到: scripts/embeddable-games-report.json');
    
    return report;
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.length > 0) {
    // 搜索特定分类
    const category = args[0];
    if (CRAZYGAMES_CATEGORIES[category]) {
        findEmbeddableGamesInCategory(category, 10);
    } else {
        console.log('可用分类:', Object.keys(CRAZYGAMES_CATEGORIES).join(', '));
    }
} else {
    // 搜索所有分类
    findAllEmbeddableGames();
}

export {
    findEmbeddableGamesInCategory,
    findAllEmbeddableGames,
    CRAZYGAMES_CATEGORIES
}; 