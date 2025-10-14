# 需求对齐文档 (Alignment Document) - 修复缺失的游戏元数据

## 1. 原始需求 (Original Request)

用户指出，通过自动化流程从Git仓库新添加的几款游戏，在网站上展示时缺少“游戏分类”和“游戏预览图”。

**截图分析:**
- 截图中显示了名为 "Princess Coffee Shop" 和 "Princess Castle" 的游戏卡片。
- 游戏卡片上没有预览图，而是显示一个占位符图标。
- 游戏卡片下方没有显示游戏标题和描述之外的其他信息，比如分类。

## 2. 边界确认 (Boundary Confirmation)

- **任务范围 (In Scope):**
    - 为 "Princess Coffee Shop", "Princess Castle" 以及其他可能由同一批次添加的游戏，补充缺失的 `category` (分类) 和 `image` (预览图) 字段。
    - 确保更新后的信息能在网站前端正确展示。
- **任务范围外 (Out of Scope):**
    - 修改自动化游戏发现系统本身（除非作为长期建议提出）。
    - 创建新的游戏分类。
    - 为游戏创建全新的预览图（优先寻找已有的图片资源）。

## 3. 需求理解 (Requirement Understanding)

我理解当前的问题是，`auto-discover-games` 的GitHub Action工作流成功地发现了新的游戏仓库并将其信息添加到了我们的数据库（很可能是 `src/data/games.json`），但这个自动化过程无法智能地判断游戏的**分类**，也无法自动找到或生成**预览图**的正确路径。

因此，导致在前端渲染游戏列表（如首页或分类页）时，`GameCard.astro` 组件因为获取不到这两个关键字段的数据，而显示为当前的样子。

**核心任务**：手动补全这些缺失的元数据。

## 4. 疑问澄清 (Clarifications)

在开始实施前，我将通过以下步骤来明确信息，并做出最优决策：

1.  **定位问题数据**: 我将首先检查 `src/data/games.json` 文件，找到 "Princess Coffee Shop" 和 "Princess Castle" 的条目，确认 `category` 和 `image` 字段确实缺失或为空。
2.  **寻找预览图**: 我会检查这些游戏在 `github-games-repo/games/` 目录下的对应文件夹（例如 `princess-coffee-shop/`），寻找可以作为预览图的图片文件（如 `preview.png`, `thumbnail.jpg` 等）。
3.  **确定游戏分类**:
    - "Princess Coffee Shop": 根据描述 "Help the princess run her magical coffee shop! Serve customers, make delicious...", 推荐分类为 **"Creative Games" (创意游戏)** 或 **"Art Games" (艺术游戏)**。
    - "Princess Castle": 根据描述 "Explore a magical princess castle filled with secrets and adventures! Help the princess...", 推荐分类为 **"Adventure Games" (冒险游戏)**。
    - 我将基于游戏内容提出最合适的分类建议。

**决策点:**
- 我将优先在游戏自己的目录里寻找图片。如果找不到，我会向您请示是否需要一个通用的占位图或者采取其他措施。
- 我会为您推荐最合适的分类，并等待您的确认。

此文档旨在确保我们对任务有共同的理解，并以最高效的方式解决问题。