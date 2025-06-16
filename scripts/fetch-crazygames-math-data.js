import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从CrazyGames获取数学游戏的完整信息
 * 包括游戏介绍图、描述、难度等详细数据
 */

// Sean提供的数学游戏列表
const MATH_GAMES = [
    {
        slug: 'count-masters-stickman-games',
        url: 'https://www.crazygames.com/game/count-masters-stickman-games',
        iframeUrl: 'https://www.crazygames.com/embed/count-masters-stickman-games'
    },
    {
        slug: 'five-o',
        url: 'https://www.crazygames.com/game/five-o',
        iframeUrl: 'https://www.crazygames.com/embed/five-o'
    },
    {
        slug: 'merge-the-numbers',
        url: 'https://www.crazygames.com/game/merge-the-numbers',
        iframeUrl: 'https://www.crazygames.com/embed/merge-the-numbers'
    },
    {
        slug: '2048',
        url: 'https://www.crazygames.com/game/2048',
        iframeUrl: 'https://www.crazygames.com/embed/2048'
    },
    {
        slug: 'numbers-arena',
        url: 'https://www.crazygames.com/game/numbers-arena',
        iframeUrl: 'https://www.crazygames.com/embed/numbers-arena'
    },
    {
        slug: 'stone-puzzle-games',
        url: 'https://www.crazygames.com/game/stone-puzzle-games',
        iframeUrl: 'https://www.crazygames.com/embed/stone-puzzle-games'
    },
    {
        slug: 'cypher---code-breaker',
        url: 'https://www.crazygames.com/game/cypher---code-breaker',
        iframeUrl: 'https://www.crazygames.com/embed/cypher---code-breaker'
    },
    {
        slug: 'hero-castle-war-tower-attack',
        url: 'https://www.crazygames.com/game/hero-castle-war-tower-attack',
        iframeUrl: 'https://www.crazygames.com/embed/hero-castle-war-tower-attack'
    }
];

/**
 * 从游戏页面提取详细信息
 */
async function extractGameInfo(page, gameData) {
    console.log(`📋 提取游戏信息: ${gameData.slug}`);
    
    try {
        // 访问游戏页面
        await page.goto(gameData.url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 提取游戏信息
        const gameInfo = await page.evaluate(() => {
            // 获取游戏标题
            const titleElement = document.querySelector('h1') || 
                                document.querySelector('.game-title') ||
                                document.querySelector('[data-testid="game-title"]');
            const title = titleElement ? titleElement.textContent.trim() : '';

            // 获取游戏描述
            const descElement = document.querySelector('.game-description') ||
                              document.querySelector('[data-testid="game-description"]') ||
                              document.querySelector('meta[name="description"]');
            const description = descElement ? 
                (descElement.content || descElement.textContent || '').trim() : '';

            // 获取游戏图片
            const imageElement = document.querySelector('.game-image img') ||
                               document.querySelector('.game-thumbnail img') ||
                               document.querySelector('img[alt*="game"]') ||
                               document.querySelector('meta[property="og:image"]');
            const imageUrl = imageElement ? 
                (imageElement.src || imageElement.content || '') : '';

            // 获取游戏标签/类别
            const tagElements = document.querySelectorAll('.game-tags a, .tags a, [data-testid="game-tags"] a');
            const tags = Array.from(tagElements).map(el => el.textContent.trim().toLowerCase());

            // 获取评分信息
            const ratingElement = document.querySelector('.rating') ||
                                document.querySelector('.game-rating') ||
                                document.querySelector('[data-testid="rating"]');
            const rating = ratingElement ? ratingElement.textContent.trim() : '';

            // 获取播放次数
            const playCountElement = document.querySelector('.play-count') ||
                                   document.querySelector('.plays') ||
                                   document.querySelector('[data-testid="play-count"]');
            const playCount = playCountElement ? playCountElement.textContent.trim() : '';

            return {
                title,
                description,
                imageUrl,
                tags,
                rating,
                playCount,
                pageContent: document.body.innerText.substring(0, 1000) // 获取部分页面内容用于分析
            };
        });

        console.log(`  ✅ 标题: ${gameInfo.title}`);
        console.log(`  📝 描述: ${gameInfo.description.substring(0, 100)}...`);
        console.log(`  🖼️ 图片: ${gameInfo.imageUrl}`);
        console.log(`  🏷️ 标签: ${gameInfo.tags.join(', ')}`);

        return gameInfo;

    } catch (error) {
        console.error(`  ❌ 提取游戏信息失败: ${error.message}`);
        return null;
    }
}

/**
 * 分析游戏难度和年龄范围
 */
function analyzeGameDifficulty(gameInfo, gameSlug) {
    const content = (gameInfo.title + ' ' + gameInfo.description + ' ' + gameInfo.tags.join(' ')).toLowerCase();
    
    // 根据游戏内容分析难度
    let difficulty = 'Medium';
    let ageRange = '8-16';
    let minAge = 8;
    let maxAge = 16;

    // 简单游戏特征
    if (content.includes('easy') || content.includes('simple') || content.includes('basic') ||
        gameSlug.includes('count') || gameSlug.includes('merge')) {
        difficulty = 'Easy';
        ageRange = '6-14';
        minAge = 6;
        maxAge = 14;
    }
    
    // 困难游戏特征
    else if (content.includes('hard') || content.includes('complex') || content.includes('advanced') ||
             content.includes('strategy') || gameSlug.includes('cypher') || gameSlug.includes('code')) {
        difficulty = 'Hard';
        ageRange = '10-18';
        minAge = 10;
        maxAge = 18;
    }

    return { difficulty, ageRange, minAge, maxAge };
}

/**
 * 生成游戏指南
 */
function generateGameGuide(gameInfo, gameSlug) {
    // 根据游戏类型生成操作指南
    const guides = {
        'count-masters': {
            howToPlay: [
                "点击屏幕控制火柴人移动",
                "收集更多火柴人增加队伍数量",
                "避开障碍物和陷阱",
                "到达终点时拥有最多的火柴人"
            ],
            controls: {
                mouse: "点击屏幕控制移动方向",
                touch: "触摸屏幕引导火柴人前进"
            },
            tips: [
                "优先收集数字较大的火柴人",
                "小心避开减少数量的障碍物"
            ]
        },
        'five-o': {
            howToPlay: [
                "将数字方块放置在网格中",
                "创建横向或纵向的数字序列",
                "每行或每列的数字总和必须是5的倍数",
                "完成所有序列获得高分"
            ],
            controls: {
                mouse: "拖拽数字方块到目标位置",
                touch: "触摸并拖动方块"
            },
            tips: [
                "先规划整体布局",
                "注意数字组合的可能性"
            ]
        },
        'merge-numbers': {
            howToPlay: [
                "拖拽相同数字的方块进行合并",
                "合并后数字会翻倍增长",
                "目标是创造更大的数字",
                "空间用完前尽可能合并"
            ],
            controls: {
                mouse: "拖拽方块进行合并",
                touch: "触摸拖动方块"
            },
            tips: [
                "保持一个角落放置最大数字",
                "按顺序排列数字便于合并"
            ]
        },
        '2048': {
            howToPlay: [
                "使用方向键移动所有数字方块",
                "相同数字碰撞时会合并翻倍",
                "目标是创造出2048方块",
                "方块填满且无法移动时游戏结束"
            ],
            controls: {
                keyboard: "方向键控制移动方向",
                touch: "滑动屏幕移动方块"
            },
            tips: [
                "将最大数字保持在角落",
                "沿边缘构建数字序列"
            ]
        },
        'default': {
            howToPlay: [
                "点击游戏区域开始游戏",
                "根据屏幕提示进行操作",
                "使用鼠标或触摸控制游戏",
                "完成目标获得高分"
            ],
            controls: {
                mouse: "点击和拖拽进行交互",
                touch: "触摸屏幕进行操作"
            },
            tips: [
                "仔细阅读游戏说明",
                "多练习提高技能"
            ]
        }
    };

    // 根据游戏slug选择合适的指南
    for (const [key, guide] of Object.entries(guides)) {
        if (gameSlug.includes(key)) {
            return guide;
        }
    }

    return guides.default;
}

/**
 * 创建完整的游戏数据对象
 */
function createGameDataObject(gameData, gameInfo) {
    const { difficulty, ageRange, minAge, maxAge } = analyzeGameDifficulty(gameInfo, gameData.slug);
    const gameGuide = generateGameGuide(gameInfo, gameData.slug);

    // 生成教育相关的标签
    const educationalTags = ['math', 'numbers', 'logic', 'problem-solving'];
    
    // 根据游戏类型添加特定标签
    if (gameData.slug.includes('count')) educationalTags.push('counting');
    if (gameData.slug.includes('merge') || gameData.slug.includes('2048')) educationalTags.push('strategy');
    if (gameData.slug.includes('cypher') || gameData.slug.includes('code')) educationalTags.push('coding', 'encryption');
    if (gameData.slug.includes('puzzle')) educationalTags.push('puzzle');

    return {
        slug: gameData.slug,
        title: gameInfo.title || gameData.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: 'math',
        categoryName: 'Math',
        iframeUrl: gameData.iframeUrl,
        description: gameInfo.description || `An engaging math game that helps develop numerical skills and logical thinking.`,
        gameGuide: gameGuide,
        thumbnailUrl: gameInfo.imageUrl || `/images/games/math/${gameData.slug}.webp`,
        difficulty: difficulty,
        ageRange: ageRange,
        minAge: minAge,
        maxAge: maxAge,
        tags: educationalTags,
        source: 'CrazyGames',
        iframeCompatible: true,
        verified: true,
        technology: 'HTML5',
        mobileSupport: true,
        responsive: true,
        sourceUrl: gameData.url,
        lastUpdated: new Date().toISOString().split('T')[0],
        lastChecked: new Date().toISOString().split('T')[0],
        playCount: 0,
        featured: gameData.slug === '2048', // 2048设为特色游戏
        trending: false,
        isNew: true
    };
}

/**
 * 主函数：获取所有数学游戏数据
 */
async function fetchMathGamesData() {
    console.log('🎯 开始获取CrazyGames数学游戏数据...');
    console.log(`📊 总共需要处理 ${MATH_GAMES.length} 个游戏`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const gamesData = [];

    try {
        for (const gameData of MATH_GAMES) {
            console.log(`\n🎮 处理游戏: ${gameData.slug}`);
            
            const gameInfo = await extractGameInfo(page, gameData);
            
            if (gameInfo) {
                const completeGameData = createGameDataObject(gameData, gameInfo);
                gamesData.push(completeGameData);
                console.log(`  ✅ 游戏数据创建完成`);
            } else {
                console.log(`  ⚠️ 跳过游戏: ${gameData.slug}`);
            }

            // 短暂延迟避免请求过快
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.error('❌ 获取游戏数据时出错:', error);
    } finally {
        await browser.close();
    }

    return gamesData;
}

/**
 * 保存游戏数据到JSON文件
 */
async function saveGamesData(gamesData) {
    console.log('\n💾 保存游戏数据...');

    // 确保目录存在
    const dataDir = path.join(path.dirname(__dirname), 'src/data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // 保存到games.json文件
    const gamesFilePath = path.join(dataDir, 'math-games.json');
    fs.writeFileSync(gamesFilePath, JSON.stringify(gamesData, null, 2), 'utf-8');
    
    console.log(`✅ 数学游戏数据已保存到: ${gamesFilePath}`);
    console.log(`📊 总共保存了 ${gamesData.length} 个游戏`);

    // 同时保存一份详细报告
    const reportPath = path.join(__dirname, 'math-games-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        totalGames: gamesData.length,
        categories: {
            math: gamesData.length
        },
        games: gamesData.map(game => ({
            slug: game.slug,
            title: game.title,
            difficulty: game.difficulty,
            ageRange: game.ageRange,
            tags: game.tags,
            iframeUrl: game.iframeUrl,
            verified: game.verified
        }))
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`📋 详细报告已保存到: ${reportPath}`);
}

/**
 * 运行主程序
 */
async function main() {
    try {
        console.log('🚀 CrazyGames数学游戏数据获取工具启动');
        console.log('=' .repeat(60));

        const gamesData = await fetchMathGamesData();
        
        if (gamesData.length > 0) {
            await saveGamesData(gamesData);
            
            console.log('\n🎉 数据获取完成！');
            console.log('=' .repeat(60));
            console.log('📊 统计信息:');
            console.log(`  - 成功获取: ${gamesData.length} 个数学游戏`);
            console.log(`  - 数据文件: src/data/math-games.json`);
            console.log(`  - 报告文件: scripts/math-games-report.json`);
            
            // 显示游戏列表
            console.log('\n🎮 获取的游戏列表:');
            gamesData.forEach((game, index) => {
                console.log(`  ${index + 1}. ${game.title} (${game.difficulty}, ${game.ageRange})`);
            });
            
        } else {
            console.log('❌ 没有获取到任何游戏数据');
        }

    } catch (error) {
        console.error('💥 程序执行失败:', error);
        process.exit(1);
    }
}

// 运行主程序
main(); 