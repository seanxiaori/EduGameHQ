import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从补充游戏库获取游戏的完整信息
 * 包括游戏介绍图、描述、难度等详细数据
 */

// 补充游戏库 - 分批处理（第一批：推荐游戏）
const SUPPLEMENTARY_GAMES_BATCH_1 = [
    // 科学游戏 - 推荐
    {
        slug: 'little-alchemy-2',
        url: 'https://www.crazygames.com/game/little-alchemy-2',
        iframeUrl: 'https://www.crazygames.com/embed/little-alchemy-2',
        category: 'science',
        categoryName: 'Science'
    },
    {
        slug: 'animal-dna-run',
        url: 'https://www.crazygames.com/game/animal-dna-run',
        iframeUrl: 'https://www.crazygames.com/embed/animal-dna-run',
        category: 'science',
        categoryName: 'Science'
    },
    {
        slug: 'skeleton-simulator',
        url: 'https://www.crazygames.com/game/skeleton-simulator',
        iframeUrl: 'https://www.crazygames.com/embed/skeleton-simulator',
        category: 'science',
        categoryName: 'Science'
    },
    
    // 益智游戏 - 推荐
    {
        slug: 'thief-puzzle',
        url: 'https://www.crazygames.com/game/thief-puzzle',
        iframeUrl: 'https://www.crazygames.com/embed/thief-puzzle',
        category: 'puzzle',
        categoryName: 'Puzzle'
    },
    {
        slug: 'mahjongg-solitaire',
        url: 'https://www.crazygames.com/game/mahjongg-solitaire',
        iframeUrl: 'https://www.crazygames.com/embed/mahjongg-solitaire',
        category: 'puzzle',
        categoryName: 'Puzzle'
    },
    {
        slug: 'nonogram',
        url: 'https://www.crazygames.com/game/nonogram',
        iframeUrl: 'https://www.crazygames.com/embed/nonogram',
        category: 'puzzle',
        categoryName: 'Puzzle'
    },
    
    // 语言游戏 - 推荐
    {
        slug: 'trivia-crack',
        url: 'https://www.crazygames.com/game/trivia-crack',
        iframeUrl: 'https://www.crazygames.com/embed/trivia-crack',
        category: 'language',
        categoryName: 'Language'
    },
    {
        slug: 'google-feud',
        url: 'https://www.crazygames.com/game/google-feud',
        iframeUrl: 'https://www.crazygames.com/embed/google-feud',
        category: 'language',
        categoryName: 'Language'
    },
    
    // 物理游戏 - 推荐
    {
        slug: 'ragdoll-archers',
        url: 'https://www.crazygames.com/game/ragdoll-archers',
        iframeUrl: 'https://www.crazygames.com/embed/ragdoll-archers',
        category: 'physics',
        categoryName: 'Physics'
    },
    {
        slug: 'slice-master',
        url: 'https://www.crazygames.com/game/slice-master',
        iframeUrl: 'https://www.crazygames.com/embed/slice-master',
        category: 'physics',
        categoryName: 'Physics'
    },
    
    // 创意艺术 - 推荐
    {
        slug: 'draw-climber',
        url: 'https://www.crazygames.com/game/draw-climber',
        iframeUrl: 'https://www.crazygames.com/embed/draw-climber',
        category: 'creative',
        categoryName: 'Creative'
    },
    
    // 地理历史 - 推荐
    {
        slug: 'world-geography-quiz',
        url: 'https://www.crazygames.com/game/world-geography-quiz',
        iframeUrl: 'https://www.crazygames.com/embed/world-geography-quiz',
        category: 'geography',
        categoryName: 'Geography'
    }
];

/**
 * 从游戏页面获取详细信息
 */
async function getGameDetailsFromPage(page, gameUrl) {
    console.log(`🔍 访问游戏页面: ${gameUrl}`);
    
    try {
        await page.goto(gameUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // 获取游戏详细信息
        const gameDetails = await page.evaluate(() => {
            // 获取游戏标题
            const title = document.querySelector('h1')?.textContent?.trim() || 
                         document.querySelector('.game-title')?.textContent?.trim() ||
                         document.querySelector('[data-cy="game-title"]')?.textContent?.trim();

            // 获取游戏描述
            const description = document.querySelector('.game-description')?.textContent?.trim() ||
                              document.querySelector('[data-cy="game-description"]')?.textContent?.trim() ||
                              document.querySelector('.description')?.textContent?.trim() ||
                              document.querySelector('meta[name="description"]')?.getAttribute('content');

            // 获取游戏缩略图
            const thumbnail = document.querySelector('.game-thumbnail img')?.src ||
                            document.querySelector('.game-image img')?.src ||
                            document.querySelector('[data-cy="game-image"] img')?.src ||
                            document.querySelector('meta[property="og:image"]')?.getAttribute('content');

            // 获取游戏标签
            const tagElements = document.querySelectorAll('.game-tags .tag, .tags .tag, [data-cy="game-tags"] .tag');
            const tags = Array.from(tagElements).map(tag => tag.textContent.trim()).filter(tag => tag);

            // 获取开发者信息
            const developer = document.querySelector('.developer')?.textContent?.trim() ||
                            document.querySelector('.game-developer')?.textContent?.trim() ||
                            document.querySelector('[data-cy="developer"]')?.textContent?.trim();

            // 获取评分信息
            const ratingElement = document.querySelector('.rating, .game-rating, [data-cy="rating"]');
            const rating = ratingElement?.textContent?.match(/[\d.]+/)?.[0];

            // 获取游戏特征
            const features = [];
            const featureElements = document.querySelectorAll('.features li, .game-features li');
            featureElements.forEach(el => {
                const feature = el.textContent.trim();
                if (feature) features.push(feature);
            });

            return {
                title,
                description,
                thumbnailUrl: thumbnail,
                tags,
                developer,
                rating: rating ? parseFloat(rating) : null,
                features
            };
        });

        console.log(`    ✅ 获取到游戏信息: ${gameDetails.title || '未知标题'}`);
        return gameDetails;

    } catch (error) {
        console.error(`    ❌ 获取游戏信息失败: ${error.message}`);
        return null;
    }
}

/**
 * 生成游戏的完整数据结构
 */
function generateGameData(gameInfo, gameDetails) {
    // 基础信息
    const baseData = {
        slug: gameInfo.slug,
        title: gameDetails?.title || gameInfo.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: gameInfo.category,
        categoryName: gameInfo.categoryName,
        iframeUrl: gameInfo.iframeUrl,
        source: 'CrazyGames',
        iframeCompatible: true,
        verified: true
    };

    // 内容信息
    const contentData = {
        description: gameDetails?.description || `An educational ${gameInfo.category} game that helps develop learning skills.`,
        gameGuide: {
            howToPlay: [
                "Click to start the game",
                "Follow the on-screen instructions",
                "Complete challenges to progress"
            ]
        }
    };

    // 媒体信息
    const mediaData = {
        thumbnailUrl: gameDetails?.thumbnailUrl || `https://imgs.crazygames.com/${gameInfo.slug}.png`
    };

    // 教育信息
    const educationalData = {
        difficulty: "Medium",
        ageRange: "8-16",
        minAge: 8,
        maxAge: 16,
        tags: gameDetails?.tags?.length > 0 ? gameDetails.tags : [gameInfo.category, "educational", "interactive"]
    };

    // 技术信息
    const technicalData = {
        responsive: true,
        mobileSupport: true
    };

    // 统计信息（可选）
    const statsData = {};
    if (gameDetails?.rating) {
        statsData.rating = gameDetails.rating;
    }
    if (gameDetails?.developer) {
        statsData.developer = gameDetails.developer;
    }

    return {
        ...baseData,
        ...contentData,
        ...mediaData,
        ...educationalData,
        ...technicalData,
        ...statsData
    };
}

/**
 * 主函数
 */
async function fetchSupplementaryGames() {
    console.log('🎯 开始获取补充游戏库信息');
    console.log(`📊 第一批处理 ${SUPPLEMENTARY_GAMES_BATCH_1.length} 个游戏`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const games = [];
    const report = {
        totalGames: SUPPLEMENTARY_GAMES_BATCH_1.length,
        successfulGames: 0,
        failedGames: 0,
        gamesByCategory: {},
        timestamp: new Date().toISOString()
    };

    try {
        const page = await browser.newPage();
        
        for (const gameInfo of SUPPLEMENTARY_GAMES_BATCH_1) {
            console.log(`\n🎮 处理游戏: ${gameInfo.slug}`);
            
            try {
                // 获取游戏详细信息
                const gameDetails = await getGameDetailsFromPage(page, gameInfo.url);
                
                // 生成完整的游戏数据
                const gameData = generateGameData(gameInfo, gameDetails);
                games.push(gameData);
                
                // 更新统计
                report.successfulGames++;
                if (!report.gamesByCategory[gameInfo.category]) {
                    report.gamesByCategory[gameInfo.category] = 0;
                }
                report.gamesByCategory[gameInfo.category]++;
                
                console.log(`    ✅ 成功处理: ${gameData.title}`);
                
                // 延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`    ❌ 处理失败: ${error.message}`);
                report.failedGames++;
            }
        }

    } finally {
        await browser.close();
    }

    // 保存游戏数据
    const gamesDataPath = path.join(path.dirname(__dirname), 'src/data/supplementary-games-batch1.json');
    fs.writeFileSync(gamesDataPath, JSON.stringify(games, null, 2));
    console.log(`\n📄 游戏数据已保存到: ${gamesDataPath}`);

    // 保存报告
    const reportPath = path.join(__dirname, 'supplementary-games-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 详细报告已保存到: ${reportPath}`);

    // 输出统计
    console.log('\n📊 处理结果统计:');
    console.log(`✅ 成功: ${report.successfulGames} 个游戏`);
    console.log(`❌ 失败: ${report.failedGames} 个游戏`);
    console.log('\n📋 分类统计:');
    Object.entries(report.gamesByCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} 个游戏`);
    });

    return games;
}

// 运行脚本
fetchSupplementaryGames().catch(console.error);

export { fetchSupplementaryGames }; 