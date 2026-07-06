# Agent Team 工作流程

## 🔄 工作流程

### 每周游戏更新流程

```
1. PM Agent 分析数据
   ↓
2. Game Curator Agent 搜索新游戏
   ↓
3. QA Tester Agent 测试游戏
   ↓
4. Content Writer Agent 生成内容
   ↓
5. Developer Agent 部署上线
   ↓
6. Data Analyst Agent 监控效果
```

---

## 📋 具体实施方案

### Phase 1: 基础 Agent（1-2周）

**创建 3 个核心 Agent**:

1. **Game Curator Agent**
   - 使用现有的 batch-onboard 脚本
   - 自动化游戏搜索和筛选
   - 每周运行一次

2. **Content Writer Agent**
   - 基于游戏信息生成描述
   - SEO 优化
   - 多语言支持

3. **QA Tester Agent**
   - 自动测试游戏可用性
   - 检查 iframe 兼容性
   - 生成测试报告

