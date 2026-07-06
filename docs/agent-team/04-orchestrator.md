# Agent Team 调度系统

## 🎯 Agent 协调器

### Orchestrator (总协调)

```javascript
// agents/orchestrator.mjs
import { GameCuratorAgent } from './game-curator.mjs';
import { ContentWriterAgent } from './content-writer.mjs';
import { QATesterAgent } from './qa-tester.mjs';
import { DataAnalystAgent } from './data-analyst.mjs';

export class AgentOrchestrator {
  constructor() {
    this.gameCurator = new GameCuratorAgent();
    this.contentWriter = new ContentWriterAgent();
    this.qaTester = new QATesterAgent();
    this.dataAnalyst = new DataAnalystAgent();
  }

  // 每周游戏更新流程
  async weeklyGameUpdate() {
    console.log('🚀 开始每周游戏更新流程...\n');

    // Step 1: 数据分析
    const insights = await this.dataAnalyst.analyzeWeeklyData();
    console.log('📊 数据分析完成');

    // Step 2: 搜索新游戏
    const candidates = await this.gameCurator.searchNewGames();
    console.log(`🎮 找到 ${candidates.length} 个候选游戏`);

    // Step 3: 测试游戏
    const tested = await this.qaTester.testGames(candidates);
    console.log(`✅ 测试通过 ${tested.length} 个游戏`);

    // Step 4: 生成内容
    const withContent = await this.contentWriter.generateContent(tested);
    console.log(`📝 内容生成完成`);

    return withContent;
  }
}
```

