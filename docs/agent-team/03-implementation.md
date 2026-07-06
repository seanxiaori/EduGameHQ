# Agent Team 实施代码

## 🤖 Agent 实现示例

### 1. Game Curator Agent

```javascript
// agents/game-curator.mjs
import { searchGitHubGames } from '../scripts/batch-onboard/1-search-games.mjs';
import { detectDuplicates } from '../scripts/batch-onboard/2-detect-duplicate.mjs';
import { verifyUrls } from '../scripts/batch-onboard/3-verify-url.mjs';

export class GameCuratorAgent {
  async run() {
    console.log('🎮 Game Curator Agent 开始工作...');

    // 1. 搜索新游戏
    const candidates = await searchGitHubGames();
    console.log(`找到 ${candidates.length} 个候选游戏`);

    // 2. 检测重复
    const unique = await detectDuplicates(candidates);
    console.log(`去重后剩余 ${unique.length} 个游戏`);

    // 3. 验证可用性
    const verified = await verifyUrls(unique);
    console.log(`验证通过 ${verified.length} 个游戏`);

    return verified;
  }
}
```

### 2. Content Writer Agent

```javascript
// agents/content-writer.mjs
export class ContentWriterAgent {
  async generateGameDescription(game) {
    const prompt = `
为这个教育游戏生成描述：
- 游戏名称: ${game.name}
- 类别: ${game.category}
- 目标年龄: 6-18岁

要求：
1. 50-100字
2. 突出教育价值
3. 吸引学生和家长
4. SEO友好
`;

    // 调用 AI API 生成内容
    const description = await this.callAI(prompt);
    return description;
  }

  async generateSEOTitle(game) {
    return `${game.name} - Free ${game.category} Game | EduGameHQ`;
  }
}
```

