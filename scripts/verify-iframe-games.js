import puppeteer from 'puppeteer';
import fs from 'fs/promises';

// 从文档中提取游戏URL的正则表达式
const IFRAME_REGEX = /<iframe src="([^"]+)"/g;

/**
 * 验证单个游戏的iframe可用性
 */
async function verifyGameIframe(gameUrl, gameName) {
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
        
        console.log(`验证: ${gameName}`);
        console.log(`  URL: ${gameUrl}`);
        
        // 访问游戏页面
        const response = await page.goto(gameUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        const status = response.status();
        console.log(`  状态码: ${status}`);
        
        if (status !== 200) {
            return {
                url: gameUrl,
                name: gameName,
                status: 'FAILED',
                reason: `HTTP ${status}`,
                canEmbed: false
            };
        }
        
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 检查是否有Play按钮（说明游戏需要启动）
        const playButtons = await page.$$('button');
        let hasPlayButton = false;
        
        for (const button of playButtons) {
            try {
                const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
                if (text.includes('play') || text.includes('start')) {
                    hasPlayButton = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // 检查是否有iframe或游戏内容
        const hasIframe = await page.$('iframe');
        const hasCanvas = await page.$('canvas');
        const hasGameContainer = await page.$('#game, .game-container, .unity-container');
        
        let canEmbed = false;
        let reason = '';
        
        if (hasIframe || hasCanvas || hasGameContainer) {
            canEmbed = true;
            reason = 'Has game content';
        } else {
            reason = 'No game content found';
        }
        
        console.log(`  可嵌入: ${canEmbed ? '✅' : '❌'}`);
        console.log(`  原因: ${reason}`);
        
        return {
            url: gameUrl,
            name: gameName,
            status: canEmbed ? 'SUCCESS' : 'FAILED',
            reason: reason,
            canEmbed: canEmbed,
            hasPlayButton: !!hasPlayButton,
            hasIframe: !!hasIframe,
            hasCanvas: !!hasCanvas,
            hasGameContainer: !!hasGameContainer
        };
        
    } catch (error) {
        console.log(`  错误: ${error.message}`);
        return {
            url: gameUrl,
            name: gameName,
            status: 'ERROR',
            reason: error.message,
            canEmbed: false
        };
    } finally {
        await browser.close();
    }
}

/**
 * 从文档中提取所有游戏信息
 */
async function extractGamesFromDoc() {
    try {
        const docContent = await fs.readFile('doc/免费游戏资源iframe文档.md', 'utf8');
        
        const games = [];
        const lines = docContent.split('\n');
        
        let currentGame = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检测游戏标题
            if (line.match(/^### \d+\. .+ - .+/)) {
                if (currentGame && currentGame.iframeUrl) {
                    games.push(currentGame);
                }
                
                const titleMatch = line.match(/^### \d+\. (.+) - (.+)/);
                if (titleMatch) {
                    currentGame = {
                        title: titleMatch[1].trim(),
                        description: titleMatch[2].trim(),
                        iframeUrl: null
                    };
                }
            }
            
            // 检测iframe URL
            if (line.includes('<iframe src=') && currentGame) {
                const match = line.match(/<iframe src="([^"]+)"/);
                if (match) {
                    currentGame.iframeUrl = match[1];
                }
            }
        }
        
        // 添加最后一个游戏
        if (currentGame && currentGame.iframeUrl) {
            games.push(currentGame);
        }
        
        return games;
        
    } catch (error) {
        console.error('读取文档失败:', error);
        return [];
    }
}

/**
 * 批量验证所有游戏
 */
async function verifyAllGames() {
    console.log('🔍 开始验证免费游戏资源文档中的所有游戏...\n');
    
    // 提取游戏信息
    const games = await extractGamesFromDoc();
    console.log(`找到 ${games.length} 个游戏需要验证\n`);
    
    const results = [];
    const successGames = [];
    const failedGames = [];
    
    // 逐个验证游戏
    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        
        console.log(`\n[${i + 1}/${games.length}] 验证游戏...`);
        
        const result = await verifyGameIframe(game.iframeUrl, game.title);
        results.push(result);
        
        if (result.canEmbed) {
            successGames.push(game);
        } else {
            failedGames.push(game);
        }
        
        // 延迟避免被封
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 生成报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 验证结果汇总');
    console.log('='.repeat(60));
    
    console.log(`\n✅ 可用游戏: ${successGames.length}/${games.length}`);
    successGames.forEach(game => {
        console.log(`  ✓ ${game.title}`);
    });
    
    console.log(`\n❌ 不可用游戏: ${failedGames.length}/${games.length}`);
    failedGames.forEach(game => {
        const result = results.find(r => r.name === game.title);
        console.log(`  ✗ ${game.title} - ${result.reason}`);
    });
    
    // 保存详细报告
    const report = {
        timestamp: new Date().toISOString(),
        total: games.length,
        success: successGames.length,
        failed: failedGames.length,
        successRate: Math.round((successGames.length / games.length) * 100),
        results: results
    };
    
    await fs.writeFile('scripts/iframe-verification-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 详细报告已保存到: scripts/iframe-verification-report.json');
    
    return report;
}

/**
 * 查找替代游戏
 */
async function findReplacementGames() {
    console.log('\n🔍 搜索替代游戏...');
    
    // 一些已知可用的CrazyGames embed游戏
    const knownWorkingGames = [
        {
            title: 'Tile Jumper 3D',
            url: 'https://www.crazygames.com/embed/tile-jumper-3d',
            category: 'music',
            description: '音乐节拍跳跃游戏，训练节奏感和反应能力'
        },
        {
            title: 'Wire Beat',
            url: 'https://www.crazygames.com/embed/wire-beat',
            category: 'music',
            description: '节奏解谜游戏，将动作与音乐节拍同步'
        },
        {
            title: 'Space Waves',
            url: 'https://www.crazygames.com/embed/space-waves',
            category: 'arcade',
            description: '太空波浪避障游戏，练习反应速度'
        }
    ];
    
    console.log('验证已知可用游戏...');
    
    for (const game of knownWorkingGames) {
        const result = await verifyGameIframe(game.url, game.title);
        if (result.canEmbed) {
            console.log(`  ✅ ${game.title} - 可用作替代`);
        } else {
            console.log(`  ❌ ${game.title} - 不可用`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return knownWorkingGames.filter(async game => {
        const result = await verifyGameIframe(game.url, game.title);
        return result.canEmbed;
    });
}

// 主函数
async function main() {
    try {
        // 验证现有游戏
        const report = await verifyAllGames();
        
        // 如果成功率低于80%，寻找替代游戏
        if (report.successRate < 80) {
            console.log('\n⚠️  成功率较低，寻找替代游戏...');
            await findReplacementGames();
        }
        
        console.log('\n✅ 验证完成！');
        
    } catch (error) {
        console.error('验证过程出错:', error);
    }
}

// 运行验证
main(); 