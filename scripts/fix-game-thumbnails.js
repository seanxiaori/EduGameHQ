import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 修复游戏缩略图URL
 */

const GAMES_TO_FIX = [
    {
        slug: 'five-o',
        url: 'https://www.crazygames.com/game/five-o'
    },
    {
        slug: 'merge-the-numbers', 
        url: 'https://www.crazygames.com/game/merge-the-numbers'
    }
];

/**
 * 从游戏页面获取真实的缩略图URL
 */
async function getThumbnailFromGamePage(page, gameUrl) {
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
            
            if (gameImage && gameImage.src && !gameImage.src.includes('sudokugame.png')) {
                return gameImage.src;
            }

            // 方法2: 查找meta标签中的图片
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage && ogImage.content && !ogImage.content.includes('sudokugame.png')) {
                return ogImage.content;
            }

            // 方法3: 查找页面中的游戏相关图片
            const allImages = document.querySelectorAll('img');
            for (const img of allImages) {
                if (img.src && 
                    (img.src.includes('cover') || img.src.includes('thumbnail') || img.src.includes('16x9')) &&
                    !img.src.includes('sudokugame.png') &&
                    !img.src.includes('logo') &&
                    !img.src.includes('icon')) {
                    return img.src;
                }
            }

            // 方法4: 查找JSON-LD结构化数据中的图片
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of jsonLdScripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data.image && typeof data.image === 'string' && !data.image.includes('sudokugame.png')) {
                        return data.image;
                    }
                    if (data.image && Array.isArray(data.image) && data.image.length > 0) {
                        return data.image[0];
                    }
                } catch (e) {
                    // 忽略JSON解析错误
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
 * 更新游戏数据文件中的缩略图URL
 */
function updateGameThumbnails(thumbnailUpdates) {
    const mathGamesPath = path.join(path.dirname(__dirname), 'src/data/math-games.json');
    
    try {
        // 读取现有数据
        const gamesData = JSON.parse(fs.readFileSync(mathGamesPath, 'utf-8'));
        
        let updatedCount = 0;
        
        // 更新缩略图URL
        for (const game of gamesData) {
            if (thumbnailUpdates[game.slug]) {
                const oldUrl = game.thumbnailUrl;
                game.thumbnailUrl = thumbnailUpdates[game.slug];
                console.log(`✅ 更新 ${game.title}:`);
                console.log(`  旧图片: ${oldUrl}`);
                console.log(`  新图片: ${game.thumbnailUrl}`);
                updatedCount++;
            }
        }
        
        // 保存更新后的数据
        fs.writeFileSync(mathGamesPath, JSON.stringify(gamesData, null, 2), 'utf-8');
        console.log(`\n💾 已更新 ${updatedCount} 个游戏的缩略图`);
        
        return updatedCount;
        
    } catch (error) {
        console.error('❌ 更新游戏数据失败:', error);
        return 0;
    }
}

/**
 * 同时更新主游戏数据库
 */
function updateMainGameDatabase(thumbnailUpdates) {
    const mainGamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(mainGamesPath)) {
        console.log('⚠️ 主游戏数据库不存在，跳过更新');
        return 0;
    }
    
    try {
        const gamesData = JSON.parse(fs.readFileSync(mainGamesPath, 'utf-8'));
        let updatedCount = 0;
        
        for (const game of gamesData) {
            if (thumbnailUpdates[game.slug]) {
                game.thumbnailUrl = thumbnailUpdates[game.slug];
                updatedCount++;
            }
        }
        
        fs.writeFileSync(mainGamesPath, JSON.stringify(gamesData, null, 2), 'utf-8');
        console.log(`💾 主数据库已更新 ${updatedCount} 个游戏的缩略图`);
        
        return updatedCount;
        
    } catch (error) {
        console.error('❌ 更新主数据库失败:', error);
        return 0;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🔧 开始修复游戏缩略图...');
    console.log('=' .repeat(50));
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const thumbnailUpdates = {};

    try {
        for (const gameData of GAMES_TO_FIX) {
            console.log(`\n🎮 处理游戏: ${gameData.slug}`);
            
            const thumbnailUrl = await getThumbnailFromGamePage(page, gameData.url);
            
            if (thumbnailUrl) {
                thumbnailUpdates[gameData.slug] = thumbnailUrl;
            } else {
                console.log(`  ⚠️ 未找到 ${gameData.slug} 的专用缩略图，保持原样`);
            }

            // 延迟避免请求过快
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.error('❌ 处理过程中出错:', error);
    } finally {
        await browser.close();
    }

    // 更新游戏数据
    if (Object.keys(thumbnailUpdates).length > 0) {
        console.log('\n📝 更新游戏数据文件...');
        const mathUpdated = updateGameThumbnails(thumbnailUpdates);
        const mainUpdated = updateMainGameDatabase(thumbnailUpdates);
        
        console.log('\n🎉 缩略图修复完成！');
        console.log(`✅ 数学游戏数据库: 更新了 ${mathUpdated} 个游戏`);
        console.log(`✅ 主游戏数据库: 更新了 ${mainUpdated} 个游戏`);
        
        console.log('\n📸 更新的缩略图:');
        for (const [slug, url] of Object.entries(thumbnailUpdates)) {
            console.log(`  ${slug}: ${url}`);
        }
    } else {
        console.log('\n⚠️ 没有找到需要更新的缩略图');
    }
}

// 运行主程序
main(); 