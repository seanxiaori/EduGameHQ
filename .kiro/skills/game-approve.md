---
name: game-approve
description: Approve reviewed games and publish to main site with git sync
version: 1.0.0
---

# Game Approval and Publishing

## 场景（Scenario）
你已经在审核环境中测试了游戏，确认它们符合质量标准。现在需要将这些游戏正式发布到主站，让用户可以访问。

## 目标（Goal）
批准已审核的游戏，添加到主站games.json，并自动提交到GitHub触发部署。

## 规则（Rules）
1. 只能批准pending-review.json中的游戏
2. 必须指定游戏slug或使用--all
3. 游戏状态更新为`approved`和`published: true`
4. 自动添加到src/data/games.json
5. 自动创建git commit并push
6. 批准后从pending-review.json中移除

## 使用示例（Examples）

```bash
# 查看待审核游戏列表
/game-approve --list

# 批准指定游戏
/game-approve tetris-game snake-classic

# 批准所有待审核游戏
/game-approve --all
```

## 边界（Boundaries）

**会做：**
- ✅ 添加游戏到games.json
- ✅ 创建git commit
- ✅ 推送到GitHub
- ✅ 触发Vercel自动部署
- ✅ 清理pending-review.json

**不会做：**
- ❌ 不会验证游戏质量（假设已人工审核）
- ❌ 不会重新截图
- ❌ 不会修改游戏元数据
- ❌ 不会回滚已发布的游戏

## 输出（Output）
- 更新`src/data/games.json`
- Git commit hash
- 部署状态（Vercel）
- 批准游戏数量

## 实现步骤（Implementation）

当调用此skill时，执行以下操作：

```bash
# 1. 列出待审核游戏（如果使用--list）
cat output/pending-review.json | jq '.[] | {slug, title, category}'

# 2. 批准游戏
node scripts/batch-onboard/7-onboard.mjs --from-review [slugs]
# 从pending-review.json读取指定游戏
# 添加到src/data/games.json

# 3. 提交到git
git add src/data/games.json public/screenshots/
git commit -m "feat: approve and publish N games"
git push

# 4. 清理pending-review.json
# 移除已批准的游戏
```

