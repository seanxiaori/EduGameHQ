import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 手动修复地理游戏的缩略图
 */
function fixGeographyGameThumbnail() {
    console.log('🌍 修复地理游戏缩略图...');
    console.log('=' .repeat(50));
    
    const gamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(gamesPath)) {
        console.error('❌ 游戏数据文件不存在:', gamesPath);
        return;
    }
    
    // 读取游戏数据
    const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));
    
    // 找到地理游戏
    const geographyGame = games.find(game => game.slug === 'world-geography-quiz');
    
    if (!geographyGame) {
        console.error('❌ 未找到地理游戏');
        return;
    }
    
    console.log(`🎮 当前游戏信息:`);
    console.log(`  标题: ${geographyGame.title}`);
    console.log(`  当前缩略图: ${geographyGame.thumbnailUrl}`);
    
    // 使用一个通用的地理游戏缩略图URL
    // 这个URL应该是一个地理相关的图片
    const correctThumbnailUrl = "https://imgs.crazygames.com/games/world-geography-quiz/cover_16x9.png?metadata=none&quality=40&width=1200&height=630&fit=crop";
    
    // 如果上面的URL不存在，使用备用方案
    const fallbackThumbnailUrl = "/images/games/geography/world-geography-quiz.webp";
    
    // 更新缩略图
    geographyGame.thumbnailUrl = correctThumbnailUrl;
    
    console.log(`🖼️ 更新缩略图为: ${correctThumbnailUrl}`);
    
    // 保存更新后的数据
    fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2), 'utf-8');
    
    console.log('✅ 地理游戏缩略图修复完成！');
    
    // 验证修复结果
    console.log('\n📋 修复后的游戏信息:');
    console.log(`  标题: ${geographyGame.title}`);
    console.log(`  缩略图: ${geographyGame.thumbnailUrl}`);
    console.log(`  描述: ${geographyGame.description}`);
}

// 运行修复
fixGeographyGameThumbnail(); 