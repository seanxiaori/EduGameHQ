import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 需要修复的游戏数据
 */
const FIXES = [
    {
        slug: 'world-geography-quiz',
        correctTitle: 'World Geography Quiz',
        gameUrl: 'https://www.crazygames.com/game/world-geography-quiz',
        needsThumbnailFix: true
    }
];

/**
 * 从游戏页面获取正确的缩略图URL
 */
async function getCorrectThumbnail(page, gameUrl) {
    console.log(`🔍 访问游戏页面: ${gameUrl}`);
    
    try {
        await page.goto(gameUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // 尝试多种方式获取游戏缩略图
        const thumbnailUrl = await page.evaluate(() => {
            // 方法1: 查找游戏封面图片
            const gameImage = document.querySelector('.game-cover img') ||
                            document.querySelector('.game-image img') ||
                            document.querySelector('.game-thumbnail img') ||
                            document.querySelector('[data-testid="game-image"] img');
            
            if (gameImage && gameImage.src && !gameImage.src.includes('default')) {
                return gameImage.src;
            }

            // 方法2: 查找meta标签中的图片
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage && ogImage.content && !ogImage.content.includes('default')) {
                return ogImage.content;
            }

            // 方法3: 查找页面中的游戏相关图片
            const allImages = document.querySelectorAll('img');
            for (const img of allImages) {
                if (img.src && 
                    (img.src.includes('cover') || img.src.includes('thumbnail') || img.src.includes('16x9')) &&
                    !img.src.includes('default') &&
                    !img.src.includes('logo') &&
                    !img.src.includes('icon')) {
                    return img.src;
                }
            }

            return null;
        });

        console.log(`  📸 找到缩略图: ${thumbnailUrl || '未找到'}`);
        return thumbnailUrl;

    } catch (error) {
        console.error(`  ❌ 获取缩略图失败: ${error.message}`);
        return null;
    }
}

/**
 * 修复游戏数据
 */
async function fixGameDataIssues() {
    console.log('🔧 开始修复游戏数据问题...');
    console.log('=' .repeat(50));
    
    const gamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(gamesPath)) {
        console.error('❌ 游戏数据文件不存在:', gamesPath);
        return;
    }
    
    // 读取游戏数据
    const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));
    console.log(`📊 总共 ${games.length} 个游戏`);
    
    let fixedCount = 0;
    
    // 启动浏览器（如果需要获取缩略图）
    const needsBrowser = FIXES.some(fix => fix.needsThumbnailFix);
    let browser = null;
    let page = null;
    
    if (needsBrowser) {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }
    
    try {
        // 处理每个需要修复的游戏
        for (const fix of FIXES) {
            console.log(`\n🎮 修复游戏: ${fix.slug}`);
            
            // 找到对应的游戏
            const gameIndex = games.findIndex(game => game.slug === fix.slug);
            if (gameIndex === -1) {
                console.log(`  ⚠️ 未找到游戏: ${fix.slug}`);
                continue;
            }
            
            const game = games[gameIndex];
            let hasChanges = false;
            
            // 修复标题
            if (fix.correctTitle && game.title !== fix.correctTitle) {
                console.log(`  📝 修复标题: "${game.title}" → "${fix.correctTitle}"`);
                game.title = fix.correctTitle;
                hasChanges = true;
            }
            
            // 修复缩略图
            if (fix.needsThumbnailFix && page) {
                const newThumbnail = await getCorrectThumbnail(page, fix.gameUrl);
                if (newThumbnail && newThumbnail !== game.thumbnailUrl) {
                    console.log(`  🖼️ 修复缩略图:`);
                    console.log(`    旧: ${game.thumbnailUrl}`);
                    console.log(`    新: ${newThumbnail}`);
                    game.thumbnailUrl = newThumbnail;
                    hasChanges = true;
                }
            }
            
            // 修复描述（如果是通用描述）
            if (game.description === "An educational geography game that helps develop learning skills.") {
                game.description = "Test your knowledge of world geography with this interactive quiz game. Learn about countries, capitals, landmarks, and geographical features while having fun.";
                console.log(`  📄 修复描述`);
                hasChanges = true;
            }
            
            // 更新游戏指南
            if (fix.slug === 'world-geography-quiz') {
                game.gameGuide = {
                    "howToPlay": [
                        "选择一个地理主题开始游戏",
                        "阅读问题并选择正确答案",
                        "使用地图和提示帮助回答",
                        "完成所有问题获得高分"
                    ],
                    "controls": {
                        "mouse": "点击选择答案",
                        "touch": "触摸屏幕选择选项"
                    },
                    "tips": [
                        "仔细观察地图细节",
                        "利用已知地理知识推理"
                    ]
                };
                console.log(`  🎯 更新游戏指南`);
                hasChanges = true;
            }
            
            if (hasChanges) {
                fixedCount++;
                console.log(`  ✅ 游戏 ${fix.slug} 修复完成`);
            } else {
                console.log(`  ℹ️ 游戏 ${fix.slug} 无需修复`);
            }
        }
        
    } catch (error) {
        console.error('❌ 修复过程中出错:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // 保存修复后的数据
    if (fixedCount > 0) {
        fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2), 'utf-8');
        console.log(`\n💾 已保存修复后的游戏数据`);
        console.log(`✅ 总共修复了 ${fixedCount} 个游戏`);
    } else {
        console.log(`\n✅ 没有需要修复的问题`);
    }
    
    console.log('\n🎉 游戏数据修复完成！');
}

// 运行修复
fixGameDataIssues(); 