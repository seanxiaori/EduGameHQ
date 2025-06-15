# GitHub教育游戏自动化部署系统

## 📋 概述

这个系统可以自动化部署GitHub上的开源教育游戏到我们的EduGameHQ平台。支持单个游戏部署和批量部署。

## 🚀 快速开始

### 第一步：部署测试游戏

运行以下命令部署第一个测试游戏：

```powershell
.\scripts\deploy-first-game.ps1
```

这将部署 **Sudoku for Kids** 游戏，这是一个经过验证的儿童数独游戏。

### 第二步：测试游戏

部署完成后：
1. 访问 `http://localhost:3000/games/sudoku-for-kids/`
2. 测试游戏是否正常运行
3. 检查游戏是否在主页显示
4. 验证iframe嵌入功能

## 📁 文件说明

### 核心脚本

- **`deploy-github-game.ps1`** - 主要的部署脚本，支持单个游戏部署
- **`deploy-first-game.ps1`** - 快速部署第一个测试游戏的示例脚本
- **`games-to-deploy.json`** - 批量部署配置文件（为将来使用）

### 配置文件

- **`games-to-deploy.json`** - 包含要部署的游戏列表和配置

## 🛠️ 使用方法

### 单个游戏部署

```powershell
.\scripts\deploy-github-game.ps1 `
  -GitHubUrl "https://github.com/用户名/仓库名.git" `
  -GameSlug "游戏标识符" `
  -GameTitle "游戏名称" `
  -Category "游戏分类"
```

#### 参数说明

| 参数 | 必需 | 说明 | 示例 |
|------|------|------|------|
| `GitHubUrl` | ✅ | GitHub仓库URL | `https://github.com/user/repo.git` |
| `GameSlug` | ✅ | 游戏唯一标识符（URL友好） | `sudoku-for-kids` |
| `GameTitle` | ✅ | 游戏显示名称 | `Sudoku for Kids` |
| `Category` | ✅ | 游戏分类 | `Puzzle`, `Math`, `Science` 等 |
| `BuildCommand` | ❌ | 构建命令（如果需要） | `npm run build` |
| `BuildDir` | ❌ | 构建输出目录 | `dist`, `build` |
| `SkipBuild` | ❌ | 跳过构建过程 | 用于纯HTML项目 |

### 支持的游戏分类

- **Math** - 数学游戏
- **Science** - 科学游戏  
- **Programming** - 编程游戏
- **Language** - 语言艺术游戏
- **Puzzle** - 益智游戏
- **Sports** - 体育游戏
- **Art** - 艺术创意游戏
- **Geography** - 地理游戏

## 🔧 部署流程

脚本会自动执行以下步骤：

1. **环境检查** - 验证Git和Node.js是否可用
2. **仓库克隆** - 从GitHub克隆游戏仓库
3. **依赖安装** - 如果有package.json，自动安装依赖
4. **项目构建** - 如果指定了构建命令，执行构建
5. **文件复制** - 将游戏文件复制到public/games目录
6. **图片生成** - 自动生成游戏预览图片
7. **数据库更新** - 更新games.json数据库
8. **清理工作** - 删除临时文件
9. **报告生成** - 生成部署报告

## 📂 目录结构

部署后的文件结构：

```
public/
├── games/
│   └── [游戏标识符]/
│       ├── index.html
│       ├── css/
│       ├── js/
│       └── images/
└── images/
    └── games/
        └── [分类]/
            └── [游戏标识符].svg

src/
└── data/
    └── games.json (更新)

deployment-report-[游戏标识符].txt (生成)
```

## ⚠️ 注意事项

### 游戏要求

1. **开源许可** - 确保游戏有合适的开源许可证
2. **儿童友好** - 内容必须适合6-18岁用户
3. **iframe兼容** - 游戏必须支持iframe嵌入
4. **无外部依赖** - 避免需要外部API或服务的游戏

### 技术要求

1. **HTML5游戏** - 基于HTML5/CSS/JavaScript
2. **响应式设计** - 支持不同屏幕尺寸
3. **无恶意代码** - 代码经过安全检查
4. **性能良好** - 加载时间合理

## 🐛 故障排除

### 常见问题

#### 1. Git克隆失败
```
❌ 克隆仓库失败: Git clone失败
```
**解决方案：**
- 检查GitHub URL是否正确
- 确保网络连接正常
- 验证仓库是否为公开仓库

#### 2. 构建失败
```
⚠️ 构建失败，尝试使用源文件...
```
**解决方案：**
- 检查Node.js是否安装
- 验证package.json中的脚本
- 尝试使用`-SkipBuild`参数

#### 3. 找不到index.html
```
⚠️ 未找到index.html，检查其他可能的入口文件...
```
**解决方案：**
- 检查游戏的主入口文件
- 可能需要手动重命名主HTML文件
- 确认游戏结构是否正确

#### 4. 游戏无法在iframe中运行
**可能原因：**
- 游戏使用了X-Frame-Options限制
- 存在跨域问题
- 游戏依赖外部资源

**解决方案：**
- 检查游戏的安全策略
- 修改游戏代码移除iframe限制
- 确保所有资源都是相对路径

## 📊 部署报告

每次部署后会生成详细的部署报告：

```
GitHub教育游戏部署报告
===================

游戏信息:
- 名称: Sudoku for Kids
- 标识: sudoku-for-kids  
- 分类: Puzzle
- GitHub: https://github.com/MarynaShavlak/game-sudoku-for-kids.git

部署路径:
- 游戏文件: public/games/sudoku-for-kids
- 预览图片: public/images/games/Puzzle/sudoku-for-kids.svg
- 访问URL: /games/sudoku-for-kids/

部署时间: 2024-12-15 14:30:25
部署状态: 成功
```

## 🔄 批量部署（计划功能）

将来我们会支持批量部署功能，使用`games-to-deploy.json`配置文件：

```powershell
# 计划中的批量部署命令
.\scripts\batch-deploy-games.ps1 -ConfigFile "scripts\games-to-deploy.json"
```

## 📝 最佳实践

1. **先测试单个游戏** - 在批量部署前先测试一个游戏
2. **检查许可证** - 确保游戏有合适的开源许可
3. **验证内容** - 确保游戏内容适合儿童
4. **测试iframe** - 验证游戏在iframe中正常工作
5. **性能检查** - 确保游戏加载速度合理

## 🆘 获取帮助

如果遇到问题：

1. 查看部署报告中的错误信息
2. 检查PowerShell错误输出
3. 验证游戏仓库的结构和内容
4. 确保所有依赖工具已正确安装

## 📈 下一步计划

- [ ] 实现批量部署功能
- [ ] 添加游戏质量检查
- [ ] 支持更多构建工具
- [ ] 自动化测试集成
- [ ] 部署状态监控 