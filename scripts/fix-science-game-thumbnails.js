import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 需要修复缩略图的科学游戏
 */
const SCIENCE_GAMES = [
    {
        slug: 'little-alchemy-2',
        gameUrl: 'https://www.crazygames.com/game/little-alchemy-2'
    },
    {
        slug: 'animal-dna-run',
        gameUrl: 'https://www.crazygames.com/game/animal-dna-run'
    },
    {
        slug: 'skeleton-simulator',
        gameUrl: 'https://www.crazygames.com/game/skeleton-simulator'
    }
];

/**
 * 从游戏页面获取正确的缩略图URL
 */
async function getGameThumbnail(page, gameUrl) {
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
                            document.querySelector('[data-testid="game-image"] img') ||
                            document.querySelector('.game-header img') ||
                            document.querySelector('.hero-image img');
            
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
                    (img.src.includes('cover') || 
                     img.src.includes('thumbnail') || 
                     img.src.includes('16x9') ||
                     img.src.includes('game-image')) &&
                    !img.src.includes('default') &&
                    !img.src.includes('logo') &&
                    !img.src.includes('icon') &&
                    !img.src.includes('avatar')) {
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
 * 修复科学游戏缩略图
 */
async function fixScienceGameThumbnails() {
    console.log('🔧 开始修复科学游戏缩略图...');
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
    
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    try {
        // 处理每个科学游戏
        for (const gameInfo of SCIENCE_GAMES) {
            console.log(`\n🎮 修复游戏: ${gameInfo.slug}`);
            
            // 找到对应的游戏
            const gameIndex = games.findIndex(game => game.slug === gameInfo.slug);
            if (gameIndex === -1) {
                console.log(`  ⚠️ 未找到游戏: ${gameInfo.slug}`);
                continue;
            }
            
            const game = games[gameIndex];
            
            // 获取新的缩略图
            const newThumbnail = await getGameThumbnail(page, gameInfo.gameUrl);
            if (newThumbnail && newThumbnail !== game.thumbnailUrl) {
                console.log(`  🖼️ 修复缩略图:`);
                console.log(`    旧: ${game.thumbnailUrl}`);
                console.log(`    新: ${newThumbnail}`);
                game.thumbnailUrl = newThumbnail;
                fixedCount++;
                console.log(`  ✅ 游戏 ${gameInfo.slug} 缩略图修复完成`);
            } else if (!newThumbnail) {
                console.log(`  ⚠️ 未能获取到新的缩略图`);
            } else {
                console.log(`  ℹ️ 缩略图无需修复`);
            }
        }
        
    } catch (error) {
        console.error('❌ 修复过程中出错:', error);
    } finally {
        await browser.close();
    }
    
    // 保存修复后的数据
    if (fixedCount > 0) {
        fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2), 'utf-8');
        console.log(`\n💾 已保存修复后的游戏数据`);
        console.log(`✅ 总共修复了 ${fixedCount} 个游戏的缩略图`);
    } else {
        console.log(`\n✅ 没有需要修复的缩略图`);
    }
    
    console.log('\n🎉 科学游戏缩略图修复完成！');
}

// 运行修复
fixScienceGameThumbnails(); 