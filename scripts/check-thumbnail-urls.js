import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 检查缩略图URL是否可访问
 */
async function checkThumbnailUrls() {
    console.log('🔍 检查缩略图URL可访问性...');
    console.log('=' .repeat(50));
    
    const gamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(gamesPath)) {
        console.error('❌ 游戏数据文件不存在:', gamesPath);
        return;
    }
    
    const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));
    
    // 重点检查科学游戏
    const scienceGames = games.filter(game => game.category === 'science');
    
    console.log(`📊 检查 ${scienceGames.length} 个科学游戏的缩略图`);
    
    for (const game of scienceGames) {
        console.log(`\n🎮 检查游戏: ${game.title}`);
        console.log(`  Slug: ${game.slug}`);
        console.log(`  缩略图URL: ${game.thumbnailUrl}`);
        
        try {
            const response = await fetch(game.thumbnailUrl, { method: 'HEAD' });
            console.log(`  状态码: ${response.status}`);
            console.log(`  Content-Type: ${response.headers.get('content-type')}`);
            
            if (response.ok) {
                console.log(`  ✅ 缩略图可访问`);
            } else {
                console.log(`  ❌ 缩略图不可访问`);
            }
        } catch (error) {
            console.log(`  ❌ 访问失败: ${error.message}`);
        }
    }
}

// 运行检查
checkThumbnailUrls(); 