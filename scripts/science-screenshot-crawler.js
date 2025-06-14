import { ScreenshotFocusedCrawler } from './screenshot-focused-crawler.js';
import gamesData from '../src/data/games/games.json' assert { type: 'json' };

async function main() {
  console.log('🔬 EduGameHQ 科学游戏截图专项爬虫启动');
  console.log('==================================================');

  const crawler = new ScreenshotFocusedCrawler();
  
  try {
    await crawler.init();
    
    // 获取所有科学游戏
    const allGames = Object.entries(gamesData).map(([id, game]) => ({
      id,
      ...game
    }));
    
    const scienceGames = allGames.filter(game => game.category === 'science');
    
    console.log(`🔍 发现 ${scienceGames.length} 个科学游戏`);
    console.log('🎯 将按播放次数优先级处理');
    
    // 按播放次数排序，优先处理热门游戏
    const sortedGames = scienceGames.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    
    console.log('🚀 开始科学游戏截图专项爬取任务...');
    console.log(`📋 待处理游戏: ${sortedGames.length}`);
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < sortedGames.length; i++) {
      const game = sortedGames[i];
      
      console.log(`📋 [${i + 1}/${sortedGames.length}] 正在处理: ${game.title}`);
      console.log(`📊 进度: ${i + 1}/${sortedGames.length} (${Math.round((i + 1) / sortedGames.length * 100)}%)`);
      console.log(`✅ 成功: ${successCount} | ⏭️ 跳过: ${skipCount} | ❌ 失败: ${failCount}`);
      
      try {
        const result = await crawler.crawlGameScreenshots(game.id, {
          title: game.title,
          url: game.iframeUrl,
          category: game.category
        });
        
        if (result.success) {
          successCount++;
          console.log(`✅ ${game.title} 截图获取成功`);
        } else if (result.skipped) {
          skipCount++;
          console.log(`⏭️ ${game.title} 已有截图，跳过`);
        } else {
          failCount++;
          console.log(`❌ ${game.title} 截图获取失败: ${result.error}`);
        }
        
        // 每10个游戏显示一次进度报告
        if ((i + 1) % 10 === 0) {
          console.log('📊 阶段性报告:');
          console.log(`   处理进度: ${i + 1}/${sortedGames.length}`);
          console.log(`   成功率: ${Math.round(successCount / (i + 1) * 100)}%`);
          console.log(`   剩余: ${sortedGames.length - i - 1} 个游戏`);
        }
        
        // 等待3秒避免过于频繁的请求
        console.log('⏳ 等待3秒后处理下一个游戏...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        failCount++;
        console.error(`❌ 处理 ${game.title} 时出错:`, error.message);
      }
    }
    
    console.log('🎉 科学游戏截图爬取任务完成！');
    console.log(`📊 最终统计: 成功 ${successCount} | 跳过 ${skipCount} | 失败 ${failCount}`);
    
  } catch (error) {
    console.error('❌ 爬虫启动失败:', error);
  } finally {
    await crawler.close();
    console.log('🔚 科学游戏截图爬虫已停止');
  }
}

main().catch(console.error); 