import fs from 'fs/promises';
import path from 'path';

/**
 * 检查截图进度
 */
async function checkScreenshotProgress() {
  try {
    console.log('📊 检查游戏截图进度...\n');
    
    // 读取游戏数据
    const gamesData = JSON.parse(await fs.readFile('src/data/games.json', 'utf8'));
    
    let totalGames = gamesData.length;
    let gamesWithScreenshots = 0;
    let gamesWithPlaceholders = 0;
    
    const categoryStats = {};
    
    for (const game of gamesData) {
      // 初始化分类统计
      if (!categoryStats[game.category]) {
        categoryStats[game.category] = {
          total: 0,
          withScreenshots: 0,
          withPlaceholders: 0
        };
      }
      
      categoryStats[game.category].total++;
      
      // 检查是否有真实截图
      if (game.thumbnailUrl && game.thumbnailUrl.includes('-gameplay.png')) {
        gamesWithScreenshots++;
        categoryStats[game.category].withScreenshots++;
      } else if (game.thumbnailUrl && game.thumbnailUrl.includes('-placeholder.svg')) {
        gamesWithPlaceholders++;
        categoryStats[game.category].withPlaceholders++;
      }
    }
    
    // 显示总体统计
    console.log('🎯 总体进度:');
    console.log(`  总游戏数: ${totalGames}`);
    console.log(`  已有真实截图: ${gamesWithScreenshots} (${(gamesWithScreenshots/totalGames*100).toFixed(1)}%)`);
    console.log(`  使用占位符: ${gamesWithPlaceholders} (${(gamesWithPlaceholders/totalGames*100).toFixed(1)}%)`);
    console.log(`  无图片: ${totalGames - gamesWithScreenshots - gamesWithPlaceholders}`);
    
    // 显示分类统计
    console.log('\n📈 分类进度:');
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const screenshotPercent = (stats.withScreenshots / stats.total * 100).toFixed(1);
      console.log(`  ${category}: ${stats.withScreenshots}/${stats.total} (${screenshotPercent}%) 已截图`);
    });
    
    // 检查实际文件
    console.log('\n📁 文件系统检查:');
    const categories = ['math', 'science', 'coding', 'language', 'puzzle', 'sports', 'art', 'geography'];
    
    for (const category of categories) {
      const dir = path.join('public', 'images', 'games', category);
      try {
        const files = await fs.readdir(dir);
        const pngFiles = files.filter(f => f.endsWith('.png')).length;
        const svgFiles = files.filter(f => f.endsWith('.svg')).length;
        console.log(`  ${category}: ${pngFiles} PNG截图, ${svgFiles} SVG占位符`);
      } catch (error) {
        console.log(`  ${category}: 目录不存在`);
      }
    }
    
    // 进度条
    const progress = gamesWithScreenshots / totalGames;
    const barLength = 30;
    const filledLength = Math.round(barLength * progress);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    console.log(`\n📊 截图进度: [${bar}] ${(progress * 100).toFixed(1)}%`);
    
    if (gamesWithScreenshots === totalGames) {
      console.log('\n🎉 所有游戏截图已完成！');
    } else {
      console.log(`\n⏳ 还需要 ${totalGames - gamesWithScreenshots} 个游戏的截图`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 执行检查
checkScreenshotProgress();

export { checkScreenshotProgress }; 