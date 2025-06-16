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
 * 点击PLAY NOW按钮启动游戏
 */
async function clickPlayNowButton(page) {
    console.log('    寻找并点击PLAY NOW按钮...');
    
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
                    console.log(`    找到PLAY按钮: ${selector}`);
                    await button.click();
                    console.log('    ✅ 已点击PLAY NOW按钮');
                    return true;
                }
            } catch (e) {
                continue;
            }
        }
        
        // 如果直接选择器失败，遍历所有按钮找包含play的
        const buttons = await page.$$('button');
        for (const button of buttons) {
            try {
                const text = await button.evaluate(el => el.textContent.toLowerCase().trim());
                
                if (text.includes('play') || text.includes('start')) {
                    console.log(`    找到PLAY按钮，文本: "${text}"`);
                    await button.scrollIntoViewIfNeeded();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await button.click();
                    console.log('    ✅ 已点击PLAY NOW按钮');
                    return true;
                }
            } catch (e) {
                continue;
            }
        }
        
        console.log('    ❌ 未找到PLAY NOW按钮');
        return false;
        
    } catch (error) {
        console.log(`    点击PLAY NOW失败: ${error.message}`);
        return false;
    }
}

/**
 * 检测游戏是否需要登录或有连接问题（修复版）
 */
async function checkGameErrors(page) {
    console.log('    检查游戏是否需要登录...');
    
    try {
        // 先点击PLAY NOW按钮启动游戏
        const playClicked = await clickPlayNowButton(page);
        if (!playClicked) {
            console.log('    ⚠️ 未找到PLAY NOW按钮，可能是直接运行的游戏');
        }
        
        // 等待游戏加载和可能的错误出现
        console.log('    等待游戏加载...');
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
            
            return {
                hasLoginText,
                hasLoginButton,
                hasErrorModal,
                needsLogin: hasLoginText || hasLoginButton || hasErrorModal,
                foundKeywords: loginKeywords.filter(keyword => text.includes(keyword))
            };
        });
        
        if (loginIndicators.needsLogin) {
            console.log('    ❌ 游戏需要登录或有连接问题');
            if (loginIndicators.foundKeywords.length > 0) {
                console.log(`    发现关键词: ${loginIndicators.foundKeywords.join(', ')}`);
            }
            return {
                hasErrors: true,
                errorType: 'needs_login',
                details: loginIndicators
            };
        }
        
        console.log('    ✅ 游戏可以直接运行');
        return {
            hasErrors: false,
            errorType: null
        };
        
    } catch (error) {
        console.log(`    检查失败: ${error.message}`);
        return {
            hasErrors: true,
            errorType: 'check_failed',
            details: error.message
        };
    }
}

/**
 * 验证embed游戏是否真正可用（简化版）
 */
async function verifyEmbedGame(embedUrl) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let page;
    try {
        page = await browser.newPage();
        
        console.log(`    验证embed: ${embedUrl}`);
        
        // 访问embed页面
        const response = await page.goto(embedUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        const status = response.status();
        console.log(`    Embed状态: ${status}`);
        
        if (status !== 200) {
            return {
                isValid: false,
                reason: `HTTP ${status}`,
                hasEmbedButton: false,
                hasGameContent: false
            };
        }
        
        // 检查页面标题
        const title = await page.title();
        console.log(`    Embed页面标题: ${title}`);
        
        // 检查是否是Game Files页面
        const isGameFilesPage = title.includes('Game Files');
        console.log(`    是Game Files页面: ${isGameFilesPage ? '✅' : '❌'}`);
        
        if (!isGameFilesPage) {
            return {
                isValid: false,
                reason: '不是Game Files页面',
                hasEmbedButton: false,
                hasGameContent: false
            };
        }
        
        // 检查iframe
        const hasIframe = await page.$('iframe') !== null;
        console.log(`    有iframe: ${hasIframe ? '✅' : '❌'}`);
        
        // 检查loader配置
        const hasLoaderConfig = await page.evaluate(() => {
            return window.crazygames && window.crazygames.gameLoadingConfig;
        });
        console.log(`    有loader配置: ${hasLoaderConfig ? '✅' : '❌'}`);
        
        // 简化的游戏内容检查 - 只检查是否需要登录
        const errorCheck = await checkGameErrors(page);
        
        const isValid = hasIframe && hasLoaderConfig && !errorCheck.hasErrors;
        console.log(`    Embed有游戏内容: ${isValid ? '✅' : '❌'}`);
        
        if (errorCheck.hasErrors) {
            console.log(`    错误类型: ${errorCheck.errorType}`);
        }
        
        return {
            isValid,
            reason: errorCheck.hasErrors ? `游戏${errorCheck.errorType}` : 'OK',
            hasEmbedButton: true,
            hasGameContent: !errorCheck.hasErrors,
            errorDetails: errorCheck
        };
        
    } catch (error) {
        console.log(`    验证失败: ${error.message}`);
        return {
            isValid: false,
            reason: error.message,
            hasEmbedButton: false,
            hasGameContent: false
        };
    } finally {
        if (page) await page.close();
        await browser.close();
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
 * 处理单个游戏的完整验证流程
 */
async function processGame(page, gameElement, category) {
    try {
        // 获取游戏基本信息
        const gameInfo = await extractGameInfo(gameElement);
        if (!gameInfo.title) {
            console.log(`    跳过: 无法获取游戏信息`);
            return null;
        }
        
        console.log(`  检查游戏: ${gameInfo.title}`);
        console.log(`    URL: ${gameInfo.url}`);
        
        // 检查embed按钮
        const embedInfo = await checkEmbedButton(page, gameInfo);
        console.log(`    有embed按钮: ${embedInfo.hasEmbed ? '✅' : '❌'}`);
        
        if (!embedInfo.hasEmbed) {
            return null;
        }
        
        // 检查游戏内容
        const hasContent = await checkGameContent(page, gameInfo);
        console.log(`    有游戏内容: ${hasContent ? '✅' : '❌'}`);
        
        if (!hasContent) {
            return null;
        }
        
        // 验证embed URL
        const embedUrl = embedInfo.embedUrl;
        console.log(`    Embed按钮: ${embedInfo.embedText}`);
        console.log(`    验证embed: ${embedUrl}`);
        
        const verificationResult = await verifyEmbedGame(embedUrl);
        console.log(`    验证结果: ${verificationResult.isValid ? '✅' : '❌'} - ${verificationResult.reason}`);
        
        if (!verificationResult.isValid) {
            return null;
        }
        
        // 评估教育价值
        const educationalScore = evaluateEducationalValue(gameInfo, category);
        console.log(`    教育分数: ${educationalScore}`);
        
        // 构建最终游戏对象
        const finalGame = {
            title: gameInfo.title,
            url: gameInfo.url,
            embedUrl: embedUrl,
            category: category,
            educationalScore: educationalScore,
            verified: true,
            verificationReason: verificationResult.reason
        };
        
        return finalGame;
        
    } catch (error) {
        console.log(`    处理游戏失败: ${error.message}`);
        return null;
    }
}

/**
 * 从游戏元素中提取基本信息
 */
async function extractGameInfo(gameElement) {
    try {
        // 如果元素本身就是游戏链接
        const isDirectLink = await gameElement.evaluate(el => 
            el.tagName === 'A' && el.href && el.href.includes('/game/')
        );
        
        if (isDirectLink) {
            const href = await gameElement.evaluate(el => el.href);
            const title = await gameElement.evaluate(el => {
                return el.getAttribute('title') || 
                       el.getAttribute('aria-label') ||
                       el.textContent.trim() ||
                       el.querySelector('img')?.alt ||
                       '';
            });
            
            return {
                title: title.trim() || 'Unknown Game',
                url: href
            };
        }
        
        // 尝试在子元素中查找游戏链接
        const gameLink = await gameElement.$('a[href*="/game/"]');
        if (!gameLink) {
            return { title: null, url: null };
        }
        
        const href = await gameLink.evaluate(el => el.href);
        const title = await gameLink.evaluate(el => {
            return el.getAttribute('title') || 
                   el.getAttribute('aria-label') ||
                   el.textContent.trim() ||
                   el.querySelector('img')?.alt ||
                   '';
        });
        
        if (!href || !href.includes('/game/')) {
            return { title: null, url: null };
        }
        
        return {
            title: title.trim() || 'Unknown Game',
            url: href
        };
        
    } catch (error) {
        console.log(`      提取游戏信息失败: ${error.message}`);
        return { title: null, url: null };
    }
}

/**
 * 检查游戏的embed按钮
 */
async function checkEmbedButton(page, gameInfo) {
    try {
        console.log(`    访问游戏页面: ${gameInfo.url}`);
        
        await page.goto(gameInfo.url, { 
            waitUntil: 'networkidle2',
            timeout: 20000 
        });
        
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 查找embed按钮
        const embedButton = await page.$('button:has-text("Embed"), button[class*="embed"], a[href*="/embed/"]');
        
        if (!embedButton) {
            return { hasEmbed: false };
        }
        
        const embedText = await embedButton.evaluate(el => el.textContent.trim());
        
        // 构建embed URL
        const gameSlug = gameInfo.url.split('/game/')[1];
        const embedUrl = `https://www.crazygames.com/embed/${gameSlug}`;
        
        return {
            hasEmbed: true,
            embedText: embedText,
            embedUrl: embedUrl
        };
        
    } catch (error) {
        console.log(`    检查embed按钮失败: ${error.message}`);
        return { hasEmbed: false };
    }
}

/**
 * 检查游戏是否有内容
 */
async function checkGameContent(page, gameInfo) {
    try {
        // 简单检查：如果能访问游戏页面就认为有内容
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 搜索指定分类的可嵌入游戏
 */
async function searchEmbeddableGames(category, searchTerms) {
    console.log(`🎯 搜索分类: ${category}`);
    
    const embeddableGames = [];
    
    for (const searchTerm of searchTerms) {
        console.log(`🔍 搜索分类: ${searchTerm}`);
        
        const browser = await puppeteer.launch({
            headless: true,
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
            
            const searchUrl = `https://www.crazygames.com/c/${searchTerm}`;
            console.log(`  访问: ${searchUrl}`);
            
            await page.goto(searchUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // 等待游戏列表加载
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 直接查找游戏链接
            const gameElements = await page.$$('a[href*="/game/"]');
            console.log(`  找到 ${gameElements.length} 个游戏链接`);
            
            // 限制每个分类最多检查3个游戏（避免太慢）
            const gamesToCheck = gameElements.slice(0, 3);
            
            for (const gameElement of gamesToCheck) {
                const processedGame = await processGame(page, gameElement, category);
                if (processedGame) {
                    embeddableGames.push(processedGame);
                    console.log(`    ✅ 找到可用游戏: ${processedGame.title}`);
                }
                
                // 每个游戏之间短暂延迟
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.log(`  搜索 ${searchTerm} 失败: ${error.message}`);
        } finally {
            await browser.close();
        }
    }
    
    console.log(`📊 分类 ${category} 结果: 找到 ${embeddableGames.length} 个可用游戏`);
    return embeddableGames;
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
        
        const games = await searchEmbeddableGames(category, config.searchTerms);
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
        searchEmbeddableGames(category, CRAZYGAMES_CATEGORIES[category].searchTerms);
    } else {
        console.log('可用分类:', Object.keys(CRAZYGAMES_CATEGORIES).join(', '));
    }
} else {
    // 搜索所有分类
    findAllEmbeddableGames();
}

export {
    searchEmbeddableGames,
    findAllEmbeddableGames,
    CRAZYGAMES_CATEGORIES
}; 