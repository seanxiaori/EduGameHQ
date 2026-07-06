import { GameCuratorAgent } from './game-curator-agent.mjs';
import { SEOOptimizerAgent } from './seo-optimizer-agent.mjs';
import { ContentWriterAgent } from './content-writer-agent.mjs';
import { QATesterAgent } from './qa-tester-agent.mjs';
import { DataAnalystAgent } from './data-analyst-agent.mjs';

export class AgentOrchestrator {
  constructor() {
    this.gameCurator = new GameCuratorAgent();
    this.seoOptimizer = new SEOOptimizerAgent();
    this.contentWriter = new ContentWriterAgent();
    this.qaTester = new QATesterAgent();
    this.dataAnalyst = new DataAnalystAgent();
  }

  async weeklyUpdate() {
    console.log('🚀 Agent Team 每周更新流程\n');

    // 1. 数据分析
    const analytics = await this.dataAnalyst.analyzeWeeklyData();
    console.log(`\n📊 MAU: ${analytics.mau}, 留存率: ${analytics.retention}%\n`);

    // 2. SEO 分析
    const seoReport = await this.seoOptimizer.analyze();

    // 3. 搜索新游戏
    const games = await this.gameCurator.findNewGames();

    // 保存游戏数据
    if (games.length > 0) {
      const fs = await import('fs');
      fs.writeFileSync('agents/new-games.json', JSON.stringify(games, null, 2));
      console.log(`\n💾 已保存 ${games.length} 个游戏到 agents/new-games.json`);
    }

    console.log('\n✅ 每周更新完成！');
    return { analytics, seoReport, games };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new AgentOrchestrator();
  orchestrator.weeklyUpdate();
}
