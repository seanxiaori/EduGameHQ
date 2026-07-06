# Agent Team 使用指南

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# .env
OPENAI_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

### 3. 运行 Agent Team

```bash
# 每周游戏更新
node agents/orchestrator.mjs --task weekly-update

# 数据分析
node agents/orchestrator.mjs --task analyze

# 内容优化
node agents/orchestrator.mjs --task optimize-content
```

---

## 📅 自动化调度

### 使用 GitHub Actions

```yaml
# .github/workflows/weekly-update.yml
name: Weekly Game Update

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node agents/orchestrator.mjs --task weekly-update
```

---

## 🎯 下一步行动

**本周**:
1. 创建 agents 目录
2. 实现 Game Curator Agent
3. 测试自动化流程

**下周**:
4. 实现 Content Writer Agent
5. 集成 AI API
6. 设置 GitHub Actions

---

## 📊 预期效果

- 每周自动添加 5-10 个新游戏
- 节省 80% 手动工作时间
- 提升内容质量和一致性
