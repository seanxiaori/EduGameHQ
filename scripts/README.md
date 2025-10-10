# 🤖 自动游戏发现系统脚本目录

本目录包含自动游戏发现系统的所有脚本文件。

## 📂 目录结构

```
scripts/
├── README.md                           # 本文件
├── game-sources-config.json            # 游戏来源配置文件
├── intelligent-game-crawler.mjs        # 智能爬虫主程序
├── game-evaluator.mjs                  # 游戏质量评估系统
└── utils/
    └── game-deduplicator.mjs           # 去重检测工具
```

## 🚀 快速开始

### 手动运行爬虫

```bash
node scripts/intelligent-game-crawler.mjs
```

### 测试评估系统

```bash
node scripts/game-evaluator.mjs
```

### 测试去重功能

```bash
node scripts/utils/game-deduplicator.mjs
```

## 📝 文件说明

### game-sources-config.json

游戏来源配置文件，包含：
- 支持的游戏网站列表
- 每个网站的爬取限制
- 质量筛选规则
- 内容安全黑名单
- 重试策略配置

**修改此文件可以**：
- 启用/禁用游戏来源
- 调整质量阈值
- 添加/删除黑名单词汇
- 修改每次发现的游戏数量

### intelligent-game-crawler.mjs

智能爬虫主程序，负责：
1. 从配置的网站爬取游戏数据
2. 标准化数据格式
3. 调用评估系统进行质量检查
4. 调用去重系统避免重复
5. 更新 `src/data/games.json`
6. 生成PR内容

**工作流程**：
```
读取配置 → 爬取数据 → 质量评估 → 去重检测 → 更新JSON → 生成PR
```

### game-evaluator.mjs

游戏质量评估系统，基于规则的智能打分（总分100分）：

| 评分维度 | 满分 | 说明 |
|---------|------|------|
| 来源评分 | 30分 | 基于来源网站的用户评分 |
| 热度评分 | 25分 | 基于游戏播放次数 |
| 技术评分 | 20分 | HTML5、响应式、移动端支持 |
| 安全评分 | 15分 | 内容安全检测，黑名单过滤 |
| 新鲜度 | 10分 | 游戏更新时间 |

**可独立使用**：
```javascript
import { evaluateGame } from './game-evaluator.mjs';

const result = evaluateGame(gameData);
console.log(result.totalScore); // 85
console.log(result.grade);      // 'A'
console.log(result.passed);     // true
```

### utils/game-deduplicator.mjs

去重检测工具，防止重复收录游戏：

**检测方法**：
1. **URL完全匹配** - 检查iframe URL是否已存在
2. **标题相似度** - 使用Levenshtein距离算法
3. **Slug冲突** - 检查slug是否重复
4. **游戏指纹** - 标题+域名组合识别

**可独立使用**：
```javascript
import { checkDuplicate, deduplicateBatch } from './utils/game-deduplicator.mjs';

// 单个检查
const result = checkDuplicate(newGame, existingGames);

// 批量去重
const batch = deduplicateBatch(newGames, existingGames);
console.log(batch.unique);      // 唯一游戏
console.log(batch.duplicates);  // 重复游戏
```

## ⚙️ 配置说明

### 修改爬取来源

编辑 `game-sources-config.json`:

```json
{
  "sources": {
    "crazygames": {
      "enabled": true,          // 设为false禁用
      "priority": 1,            // 数字越小优先级越高
      "limits": {
        "gamesPerCategory": 20, // 每分类爬取数量
        "maxPages": 3           // 最多爬取页数
      }
    }
  }
}
```

### 修改筛选规则

```json
{
  "filters": {
    "minScore": 70,           // 最低综合评分（0-100）
    "maxGamesPerRun": 10,     // 每次最多发现游戏数
    "requireIframe": true,    // 是否必须支持iframe
    "requireMobile": false,   // 是否必须支持移动端
    "minRating": 3.5,         // 最低来源评分（0-5）
    "minPlayCount": 5000      // 最低播放次数
  }
}
```

### 添加黑名单词汇

```json
{
  "blacklist": [
    "casino",
    "gambling",
    "violence",
    // 添加你的词汇
  ]
}
```

## 🔧 添加新的游戏来源

### 步骤1：在配置文件中添加

编辑 `game-sources-config.json`:

```json
{
  "sources": {
    "newwebsite": {
      "enabled": true,
      "priority": 3,
      "baseUrl": "https://www.newwebsite.com",
      "categories": {
        "math": "/math-games",
        "science": "/science-games"
      },
      "limits": {
        "gamesPerCategory": 15,
        "maxPages": 2
      }
    }
  }
}
```

### 步骤2：实现爬虫函数

在 `intelligent-game-crawler.mjs` 中添加：

```javascript
async function crawlNewWebsite(categoryConfig) {
  console.log('🕷️ 爬取 NewWebsite...');
  
  const games = [];
  
  // 实现你的爬取逻辑
  // 可以使用 puppeteer、cheerio 等工具
  
  return games;
}

// 在主函数中添加调用
if (sourceName === 'newwebsite') {
  sourceGames = await crawlNewWebsite(sourceConfig);
}
```

### 步骤3：测试

```bash
node scripts/intelligent-game-crawler.mjs
```

## 🐛 调试技巧

### 启用详细日志

在爬虫脚本开头添加：

```javascript
const DEBUG = true;

if (DEBUG) {
  console.log('详细调试信息:', data);
}
```

### 测试单个来源

临时修改配置，只启用一个来源：

```json
{
  "sources": {
    "crazygames": { "enabled": true },
    "coolmathgames": { "enabled": false }
  }
}
```

### 限制游戏数量

测试时减少数量：

```json
{
  "filters": {
    "maxGamesPerRun": 2  // 只爬取2个游戏
  }
}
```

## 📚 依赖说明

本系统仅依赖Node.js内置模块：
- `fs` - 文件系统操作
- `path` - 路径处理
- `url` - URL解析

如需添加爬虫功能，可能需要安装：
- `puppeteer` - 浏览器自动化（已在package.json中）
- `cheerio` - HTML解析（需要时安装）
- `axios` - HTTP请求（需要时安装）

## 🔐 安全注意事项

1. **遵守Robots.txt** - 确保爬取行为符合网站规则
2. **请求频率限制** - 使用延迟避免请求过快
3. **User-Agent设置** - 使用合适的User-Agent标识
4. **内容安全** - 严格过滤不适合儿童的内容
5. **数据隐私** - 不收集用户个人信息

## 📞 问题反馈

遇到问题请：
1. 查看脚本运行日志
2. 检查配置文件格式
3. 确认网络连接正常
4. 查看GitHub Issues

## 📄 许可证

MIT License - 详见项目根目录LICENSE文件
