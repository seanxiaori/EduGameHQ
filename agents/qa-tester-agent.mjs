import { chromium } from 'playwright';

export class QATesterAgent {
  async testGame(gameUrl) {
    console.log(`🧪 测试游戏: ${gameUrl}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // 测试游戏加载
      await page.goto(gameUrl, { timeout: 10000 });

      // 检查iframe
      const iframeCount = await page.locator('iframe').count();

      await browser.close();

      return {
        url: gameUrl,
        passed: iframeCount > 0,
        loadTime: Date.now()
      };
    } catch (error) {
      await browser.close();
      return {
        url: gameUrl,
        passed: false,
        error: error.message
      };
    }
  }
}
