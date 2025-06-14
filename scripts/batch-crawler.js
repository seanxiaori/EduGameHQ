import { IntelligentGameCrawler, GAMES_CONFIG } from './intelligent-game-crawler.js';
import fs from 'fs';
import path from 'path';

class BatchCrawler {
  constructor() {
    this.crawler = new IntelligentGameCrawler();
    this.batchSize = 5; // 每批次爬取5个游戏
    this.delayBetweenBatches = 10000; // 批次间延迟10秒
    this.delayBetweenGames = 3000; // 游戏间延迟3秒
    this.logFile = path.join(process.cwd(), 'scripts', 'crawler-log.txt');
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    await fs.promises.appendFile(this.logFile, logMessage);
  }

  async crawlInBatches() {
    await this.log('🚀 开始批量爬取游戏资源...');
    
    const gameIds = Object.keys(GAMES_CONFIG);
    const totalGames = gameIds.length;
    
    if (totalGames === 0) {
      await this.log('❌ 没有找到需要爬取的游戏配置');
      return;
    }

    await this.log(`📊 总计需要爬取 ${totalGames} 个游戏`);
    await this.log(`⚙️ 批次大小: ${this.batchSize}, 批次间延迟: ${this.delayBetweenBatches}ms`);

    // 初始化爬虫
    await this.crawler.init();

    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    // 分批处理
    for (let i = 0; i < gameIds.length; i += this.batchSize) {
      const batch = gameIds.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(gameIds.length / this.batchSize);

      await this.log(`\n🔄 开始第 ${batchNumber}/${totalBatches} 批次 (${batch.length} 个游戏)`);
      
      for (const gameId of batch) {
        const config = GAMES_CONFIG[gameId];
        await this.log(`\n🎮 爬取游戏: ${config.name} (${gameId})`);
        
        try {
          const result = await this.crawler.crawlGame(gameId, config);
          if (result) {
            successCount++;
            await this.log(`✅ ${config.name} 爬取成功`);
          } else {
            failureCount++;
            failures.push({ gameId, name: config.name, error: '爬取返回null' });
            await this.log(`❌ ${config.name} 爬取失败`);
          }
        } catch (error) {
          failureCount++;
          failures.push({ gameId, name: config.name, error: error.message });
          await this.log(`❌ ${config.name} 爬取异常: ${error.message}`);
        }

        // 游戏间延迟
        if (batch.indexOf(gameId) < batch.length - 1) {
          await this.log(`⏳ 等待 ${this.delayBetweenGames}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenGames));
        }
      }

      await this.log(`\n📊 第 ${batchNumber} 批次完成 - 成功: ${successCount}, 失败: ${failureCount}`);

      // 批次间延迟（除了最后一批）
      if (i + this.batchSize < gameIds.length) {
        await this.log(`⏸️ 批次间休息 ${this.delayBetweenBatches}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }

    // 生成最终报告
    await this.generateReport(successCount, failureCount, failures);
    
    // 关闭爬虫
    await this.crawler.close();
  }

  async generateReport(successCount, failureCount, failures) {
    await this.log('\n' + '='.repeat(50));
    await this.log('📋 爬取任务完成报告');
    await this.log('='.repeat(50));
    await this.log(`✅ 成功爬取: ${successCount} 个游戏`);
    await this.log(`❌ 失败游戏: ${failureCount} 个游戏`);
    await this.log(`📈 成功率: ${((successCount / (successCount + failureCount)) * 100).toFixed(1)}%`);

    if (failures.length > 0) {
      await this.log('\n❌ 失败游戏列表:');
      failures.forEach((failure, index) => {
        this.log(`${index + 1}. ${failure.name} (${failure.gameId}): ${failure.error}`);
      });

      // 保存失败列表到文件
      const failureReport = {
        timestamp: new Date().toISOString(),
        totalAttempted: successCount + failureCount,
        successCount,
        failureCount,
        failures
      };

      const reportPath = path.join(process.cwd(), 'scripts', 'crawler-failures.json');
      await fs.promises.writeFile(reportPath, JSON.stringify(failureReport, null, 2));
      await this.log(`💾 失败报告已保存到: ${reportPath}`);
    }

    await this.log('\n🎉 批量爬取任务完成！');
  }

  // 重试失败的游戏
  async retryFailures() {
    const reportPath = path.join(process.cwd(), 'scripts', 'crawler-failures.json');
    
    if (!fs.existsSync(reportPath)) {
      await this.log('❌ 没有找到失败报告文件');
      return;
    }

    const failureReport = JSON.parse(await fs.promises.readFile(reportPath, 'utf8'));
    const failedGames = failureReport.failures;

    if (failedGames.length === 0) {
      await this.log('✅ 没有需要重试的游戏');
      return;
    }

    await this.log(`🔄 开始重试 ${failedGames.length} 个失败的游戏...`);
    
    await this.crawler.init();

    let retrySuccessCount = 0;
    const stillFailing = [];

    for (const failure of failedGames) {
      const config = GAMES_CONFIG[failure.gameId];
      if (!config) {
        await this.log(`⚠️ 游戏 ${failure.gameId} 配置不存在，跳过`);
        continue;
      }

      await this.log(`\n🔄 重试游戏: ${config.name} (${failure.gameId})`);
      
      try {
        const result = await this.crawler.crawlGame(failure.gameId, config);
        if (result) {
          retrySuccessCount++;
          await this.log(`✅ ${config.name} 重试成功`);
        } else {
          stillFailing.push(failure);
          await this.log(`❌ ${config.name} 重试仍然失败`);
        }
      } catch (error) {
        stillFailing.push({ ...failure, error: error.message });
        await this.log(`❌ ${config.name} 重试异常: ${error.message}`);
      }

      // 重试间延迟
      await new Promise(resolve => setTimeout(resolve, this.delayBetweenGames));
    }

    await this.log(`\n📊 重试完成 - 成功: ${retrySuccessCount}, 仍失败: ${stillFailing.length}`);
    
    await this.crawler.close();
  }
}

// 主函数
async function main() {
  const batchCrawler = new BatchCrawler();
  
  const args = process.argv.slice(2);
  if (args.includes('--retry')) {
    await batchCrawler.retryFailures();
  } else {
    await batchCrawler.crawlInBatches();
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { BatchCrawler }; 