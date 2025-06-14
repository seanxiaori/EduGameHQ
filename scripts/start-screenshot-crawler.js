import { ScreenshotFocusedCrawler } from './screenshot-focused-crawler.js';

async function startScreenshotCrawler() {
  console.log('🎮 启动截图专项爬虫...');
  
  const crawler = new ScreenshotFocusedCrawler();
  
  try {
    await crawler.init();
    await crawler.crawlScreenshots();
  } catch (error) {
    console.error('❌ 爬虫运行出错:', error);
  } finally {
    await crawler.close();
  }
}

startScreenshotCrawler().catch(console.error); 