import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取游戏的直接缩略图URL
 */
async function getDirectThumbnails() {
    console.log('🔧 获取科学游戏的直接缩略图...');
    console.log('=' .repeat(50));
    
    const gamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));
    
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const scienceGames = [
        { slug: 'little-alchemy-2', url: 'https://www.crazygames.com/game/little-alchemy-2' },
        { slug: 'animal-dna-run', url: 'https://www.crazygames.com/game/animal-dna-run' },
        { slug: 'skeleton-simulator', url: 'https://www.crazygames.com/game/skeleton-simulator' }
    ];
    
    for (const gameInfo of scienceGames) {
        console.log(`\n🎮 处理游戏: ${gameInfo.slug}`);
        
        try {
            await page.goto(gameInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 获取所有可能的图片URL
            const imageUrls = await page.evaluate(() => {
                const images = [];
                
                // 查找所有图片
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && 
                        !img.src.includes('logo') && 
                        !img.src.includes('icon') &&
                        !img.src.includes('avatar') &&
                        (img.width > 200 || img.height > 200)) {
                        images.push({
                            src: img.src,
                            width: img.width,
                            height: img.height,
                            alt: img.alt
                        });
                    }
                });
                
                return images;
            });
            
            console.log(`  找到 ${imageUrls.length} 个可能的图片:`);
            imageUrls.forEach((img, i) => {
                console.log(`    ${i+1}. ${img.src} (${img.width}x${img.height})`);
            });
            
        } catch (error) {
            console.error(`  ❌ 处理失败: ${error.message}`);
        }
    }
    
    await browser.close();
}

// 运行获取
getDirectThumbnails(); 