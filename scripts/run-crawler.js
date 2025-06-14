import { IntelligentGameCrawler } from './intelligent-game-crawler.js';

async function main() {
  const crawler = new IntelligentGameCrawler();
  
  try {
    console.log('🚀 启动EduGameHQ游戏爬虫...');
    console.log('📊 目标：爬取240+个教育游戏');
    console.log('🎯 分类：数学、科学、编程、语言、益智等');
    console.log('');

    // 初始化爬虫
    await crawler.init();

    // 开始爬取所有游戏
    const results = await crawler.crawlAllGames();

    console.log('\n🎉 爬取完成！');
    console.log(`✅ 成功爬取 ${results.length} 个游戏`);
    console.log('📁 游戏数据已保存到 src/data/games/games.json');
    console.log('🖼️ 游戏截图已保存到 public/images/games/details/');

  } catch (error) {
    console.error('❌ 爬取过程中出错:', error);
  } finally {
    // 关闭浏览器
    await crawler.close();
    console.log('🔚 爬虫已停止');
  }
}

// 运行主函数
main().catch(console.error); 