---
name: game-search-review
description: Search for educational games and publish to review subdomain for manual approval
version: 1.0.0
---

# Game Search and Review

## 场景（Scenario）
你需要为EduGameHQ网站寻找新的教育游戏，但不确定这些游戏是否符合质量标准。你希望先将游戏发布到审核环境，手动测试后再决定是否上线。

## 目标（Goal）
从GitHub搜索HTML5教育游戏，自动验证质量，并发布到审核子域名供人工测试。

## 规则（Rules）
1. 只搜索50+星的GitHub仓库
2. 必须通过URL可访问性检查
3. 必须通过iframe兼容性检查
4. 必须检测到游戏内容（canvas元素）
5. 必须成功截取游戏画面
6. 所有游戏标记为`pending_review`状态
7. 不会自动添加到主站games.json

## 使用示例（Examples）

```bash
# 搜索5个俄罗斯方块游戏
/game-search-review tetris 5

# 搜索10个益智游戏
/game-search-review puzzle 10

# 使用默认设置（所有类型，20个游戏）
/game-search-review
```

## 边界（Boundaries）

**会做：**
- ✅ 搜索GitHub开源游戏
- ✅ 验证URL和iframe兼容性
- ✅ 检测游戏内容真实性
- ✅ 自动截图
- ✅ 生成游戏元数据
- ✅ 保存到pending-review.json

**不会做：**
- ❌ 不会自动上线游戏
- ❌ 不会修改games.json
- ❌ 不会提交到git
- ❌ 不会跳过人工审核

## 输出（Output）
- `output/pending-review.json` - 待审核游戏列表
- `public/screenshots/[slug].png` - 游戏截图
- 审核报告（通过/失败数量）

## 实现步骤（Implementation）

当调用此skill时，按顺序执行以下脚本：

```bash
cd scripts/batch-onboard

# 1. 搜索游戏
node 1-search-games.mjs
# 输出: output/search-results.json

# 2. 检测重复
node 2-detect-duplicate.mjs
# 输出: output/duplicate-check.json

# 3. 验证URL
node 3-verify-url.mjs
# 输出: output/url-verification.json

# 4. 评估质量
node 4-evaluate-quality.mjs
# 输出: output/quality-report.json

# 5. 截取画面
node 5-capture-screenshots.mjs
# 输出: public/screenshots/*.png

# 6. 生成数据
node 6-generate-data.mjs
# 输出: output/ready-to-onboard.json

# 7. 标记为待审核（不执行7-onboard.mjs）
# 将ready-to-onboard.json重命名为pending-review.json
# 所有游戏status设为"pending_review"
```

