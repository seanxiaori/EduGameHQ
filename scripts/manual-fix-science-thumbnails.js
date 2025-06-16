import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 手动修复科学游戏缩略图
 */
function manualFixScienceThumbnails() {
    console.log('🔧 手动修复科学游戏缩略图...');
    console.log('=' .repeat(50));
    
    const gamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(gamesPath)) {
        console.error('❌ 游戏数据文件不存在:', gamesPath);
        return;
    }
    
    // 读取游戏数据
    const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));
    console.log(`📊 总共 ${games.length} 个游戏`);
    
    // 手动设置的缩略图URL（使用可访问的替代图片）
    const thumbnailFixes = {
        'little-alchemy-2': 'https://play-lh.googleusercontent.com/JNkJZhd8O8pFhZyPVOv8K8wrVU8YzI9HqhXGVkzjZQoQzQzQzQzQzQzQzQzQzQzQzQ=w240-h480-rw',
        'animal-dna-run': 'https://play-lh.googleusercontent.com/dna-animal-game-icon.png',
        'skeleton-simulator': 'https://play-lh.googleusercontent.com/skeleton-anatomy-icon.png'
    };
    
    // 备用方案：使用简单的占位图
    const fallbackThumbnails = {
        'little-alchemy-2': 'https://via.placeholder.com/400x225/4CAF50/FFFFFF?text=Little+Alchemy+2',
        'animal-dna-run': 'https://via.placeholder.com/400x225/2196F3/FFFFFF?text=Animal+DNA+Run',
        'skeleton-simulator': 'https://via.placeholder.com/400x225/FF9800/FFFFFF?text=Skeleton+Simulator'
    };
    
    let fixedCount = 0;
    
    // 处理每个科学游戏
    ['little-alchemy-2', 'animal-dna-run', 'skeleton-simulator'].forEach(slug => {
        console.log(`\n🎮 修复游戏: ${slug}`);
        
        // 找到对应的游戏
        const gameIndex = games.findIndex(game => game.slug === slug);
        if (gameIndex === -1) {
            console.log(`  ⚠️ 未找到游戏: ${slug}`);
            return;
        }
        
        const game = games[gameIndex];
        const newThumbnail = fallbackThumbnails[slug];
        
        console.log(`  🖼️ 修复缩略图:`);
        console.log(`    旧: ${game.thumbnailUrl}`);
        console.log(`    新: ${newThumbnail}`);
        
        game.thumbnailUrl = newThumbnail;
        fixedCount++;
        console.log(`  ✅ 游戏 ${slug} 缩略图修复完成`);
    });
    
    // 保存修复后的数据
    if (fixedCount > 0) {
        fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2), 'utf-8');
        console.log(`\n💾 已保存修复后的游戏数据`);
        console.log(`✅ 总共修复了 ${fixedCount} 个游戏的缩略图`);
    } else {
        console.log(`\n✅ 没有需要修复的缩略图`);
    }
    
    console.log('\n🎉 科学游戏缩略图修复完成！');
    console.log('📝 注意：使用了占位图片，建议后续替换为真实游戏截图');
}

// 运行修复
manualFixScienceThumbnails(); 