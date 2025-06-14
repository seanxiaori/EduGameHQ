import fs from 'fs';
import path from 'path';

function monitorProgress() {
  console.log('📊 EduGameHQ 截图爬虫进度监控');
  console.log('='.repeat(50));
  
  // 读取游戏数据
  const gamesData = JSON.parse(fs.readFileSync('src/data/games/games.json', 'utf8'));
  const screenshotDir = 'public/images/games/details';
  
  let totalGames = 0;
  let gamesWithScreenshots = 0;
  let gamesWithRealScreenshots = 0;
  let newScreenshots = 0;
  
  const recentScreenshots = [];
  
  for (const [gameId, gameData] of Object.entries(gamesData)) {
    totalGames++;
    
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      gamesWithScreenshots++;
      
      // 检查是否有真实截图（非默认截图）
      const hasRealScreenshot = gameData.screenshots.some(screenshot => 
        !screenshot.includes('default-screenshot')
      );
      
      if (hasRealScreenshot) {
        gamesWithRealScreenshots++;
      }
      
      // 检查是否有新生成的截图
      for (const screenshot of gameData.screenshots) {
        const screenshotPath = path.join(screenshotDir, screenshot);
        if (fs.existsSync(screenshotPath)) {
          const stats = fs.statSync(screenshotPath);
          const now = new Date();
          const fileTime = new Date(stats.mtime);
          const timeDiff = (now - fileTime) / (1000 * 60); // 分钟
          
          if (timeDiff < 30) { // 30分钟内的文件
            newScreenshots++;
            recentScreenshots.push({
              game: gameData.title,
              screenshot: screenshot,
              time: fileTime.toLocaleTimeString()
            });
          }
        }
      }
    }
  }
  
  console.log(`🎮 总游戏数量: ${totalGames}`);
  console.log(`📸 有截图的游戏: ${gamesWithScreenshots} (${Math.round(gamesWithScreenshots/totalGames*100)}%)`);
  console.log(`🎯 有真实截图的游戏: ${gamesWithRealScreenshots} (${Math.round(gamesWithRealScreenshots/totalGames*100)}%)`);
  console.log(`🆕 最近30分钟新增截图: ${newScreenshots}`);
  console.log(`📋 还需要截图的游戏: ${totalGames - gamesWithRealScreenshots}`);
  
  if (recentScreenshots.length > 0) {
    console.log('\n🕒 最近生成的截图:');
    recentScreenshots.slice(-10).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.game} - ${item.screenshot} (${item.time})`);
    });
  }
  
  // 检查截图目录中的新文件
  const screenshotFiles = fs.readdirSync(screenshotDir);
  const newScreenshotFiles = screenshotFiles.filter(file => {
    if (file.includes('screenshot-')) {
      const filePath = path.join(screenshotDir, file);
      const stats = fs.statSync(filePath);
      const now = new Date();
      const fileTime = new Date(stats.mtime);
      const timeDiff = (now - fileTime) / (1000 * 60);
      return timeDiff < 30;
    }
    return false;
  });
  
  if (newScreenshotFiles.length > 0) {
    console.log(`\n📁 截图目录中的新文件 (${newScreenshotFiles.length}个):`);
    newScreenshotFiles.slice(-5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 提示: 爬虫正在后台运行，每个游戏需要约15-20秒处理时间');
  console.log('📈 预计完成时间: 约45-60分钟');
}

monitorProgress(); 