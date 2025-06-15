# EduGameHQ 批量游戏部署脚本

## 📋 概述

基于Beetle Rush成功部署流程设计的自动化批量部署脚本，支持从GitHub批量部署教育游戏到EduGameHQ平台。

## 🎯 功能特性

### ✅ 核心功能
- **自动克隆** - 从GitHub自动克隆游戏仓库
- **智能构建** - 自动检测并构建项目（支持npm）
- **文件部署** - 自动部署游戏文件到正确位置
- **图片处理** - 自动创建游戏预览图或SVG占位符
- **数据库更新** - 自动更新games.json数据库
- **Git集成** - 自动提交和推送更改

### 🔧 高级特性
- **DryRun模式** - 测试部署流程而不实际修改文件
- **分类筛选** - 只部署指定分类的游戏
- **错误处理** - 完善的错误处理和日志记录
- **进度显示** - 实时显示部署进度和统计
- **临时文件清理** - 自动清理临时文件

## 🚀 快速开始

### 1. 准备配置文件
```powershell
# 复制示例配置文件
Copy-Item scripts/games-to-deploy.json.example scripts/games-to-deploy.json

# 编辑配置文件，添加要部署的游戏
notepad scripts/games-to-deploy.json
```

### 2. 基本使用
```powershell
# 部署所有游戏
.\scripts\batch-deploy-games.ps1

# DryRun模式（测试，不实际部署）
.\scripts\batch-deploy-games.ps1 -DryRun

# 只部署数学游戏
.\scripts\batch-deploy-games.ps1 -Category "math"

# 跳过Git操作
.\scripts\batch-deploy-games.ps1 -SkipGit
```

### 3. 高级用法
```powershell
# 使用自定义配置文件
.\scripts\batch-deploy-games.ps1 -ConfigFile "my-games.json"

# 组合参数
.\scripts\batch-deploy-games.ps1 -Category "science" -DryRun -SkipGit
```

## 📁 文件结构

```
scripts/
├── batch-deploy-games.ps1          # 主部署脚本
├── games-to-deploy.json.example    # 配置文件示例
├── games-to-deploy.json            # 实际配置文件（需要创建）
└── README.md                       # 使用说明

temp-deploy/                        # 临时目录（自动创建）
├── game1/                          # 克隆的游戏仓库
├── game2/
└── ...

public/games/                       # 游戏部署目录
├── beetle-rush/                    # 部署的游戏
├── math-challenge-game/
└── ...

public/images/games/                # 游戏图片目录
├── science/
│   ├── beetle-rush.jpg
│   └── ...
├── math/
└── ...

deploy.log                          # 部署日志文件
```

## ⚙️ 配置文件格式

### 基本结构
```json
{
  "version": "1.0",
  "description": "EduGameHQ 批量游戏部署配置文件",
  "games": [
    {
      "slug": "game-slug",
      "title": "Game Title",
      "repoUrl": "https://github.com/user/repo.git",
      "category": "math",
      "categoryName": "Math",
      "description": "Game description...",
      "difficulty": "Easy",
      "ageRange": "8-14",
      "minAge": 8,
      "maxAge": 14,
      "tags": ["math", "educational"],
      "featured": true,
      "trending": false,
      "developer": "Developer Name",
      "source": "GitHub"
    }
  ]
}
```

### 字段说明

#### 必需字段
- `slug` - 游戏唯一标识符（URL友好）
- `title` - 游戏名称
- `repoUrl` - GitHub仓库地址
- `category` - 游戏分类（系统标识）
- `categoryName` - 分类显示名称
- `description` - 游戏描述
- `difficulty` - 难度等级（Easy/Medium/Hard）
- `ageRange` - 年龄范围（如"8-14"）
- `minAge` - 最小年龄
- `maxAge` - 最大年龄
- `developer` - 开发者名称
- `source` - 来源平台

#### 可选字段
- `tags` - 游戏标签数组
- `featured` - 是否特色游戏
- `trending` - 是否趋势游戏

## 🔍 部署流程详解

### 1. 初始化阶段
- 检查配置文件存在性
- 创建必需的目录结构
- 初始化日志系统

### 2. 游戏处理阶段
对每个游戏执行以下步骤：

#### 2.1 仓库克隆
```powershell
git clone $repoUrl temp-deploy/$gameSlug
```

#### 2.2 项目结构检测
按优先级检查：
1. `dist/index.html` - 构建输出目录
2. `build/index.html` - 构建输出目录
3. `public/index.html` - 公共文件目录
4. `index.html` - 根目录文件

#### 2.3 自动构建（如需要）
如果发现`package.json`，尝试：
1. `npm install` - 安装依赖
2. `npm run build` - 构建项目
3. `npm run dist` - 分发构建
4. `npm run compile` - 编译项目

#### 2.4 文件部署
```powershell
Copy-Item $sourcePath public/games/$gameSlug -Recurse
```

#### 2.5 图片处理
1. 查找游戏截图文件
2. 复制到对应分类目录
3. 如无截图，创建SVG占位符

#### 2.6 数据库更新
更新`src/data/games.json`，添加游戏记录

#### 2.7 Git提交
```powershell
git add .
git commit -m "feat: 添加$gameTitle游戏"
git push origin master
```

#### 2.8 清理
删除临时文件

## 📊 支持的项目类型

### ✅ 完全支持
- **预构建项目** - 已有dist/build目录
- **React项目** - 支持npm构建
- **Vue项目** - 支持npm构建
- **纯HTML项目** - 直接部署
- **Phaser游戏** - 支持各种构建方式

### ⚠️ 部分支持
- **需要特殊构建的项目** - 可能需要手动调整
- **依赖外部资源的项目** - 需要检查资源可用性

### ❌ 不支持
- **需要服务器端的项目** - 如Node.js后端
- **需要数据库的项目** - 如MySQL/MongoDB
- **需要特殊环境的项目** - 如Python/Java

## 🐛 故障排除

### 常见问题

#### 1. 克隆失败
```
错误: 仓库克隆失败
解决: 检查仓库URL是否正确，网络是否正常
```

#### 2. 构建失败
```
错误: npm install失败
解决: 检查Node.js版本，清理npm缓存
```

#### 3. 文件部署失败
```
错误: 游戏文件部署失败
解决: 检查磁盘空间，文件权限
```

#### 4. Git操作失败
```
错误: Git提交失败
解决: 检查Git配置，使用-SkipGit跳过
```

### 调试技巧

#### 1. 使用DryRun模式
```powershell
.\scripts\batch-deploy-games.ps1 -DryRun
```

#### 2. 查看详细日志
```powershell
Get-Content deploy.log -Tail 50
```

#### 3. 单独测试游戏
创建只包含一个游戏的配置文件进行测试

#### 4. 检查临时文件
DryRun模式下检查`temp-deploy`目录中的文件

## 📈 性能优化

### 建议
1. **网络优化** - 使用稳定的网络连接
2. **磁盘空间** - 确保足够的磁盘空间
3. **批量大小** - 一次不要部署太多游戏
4. **错误恢复** - 失败后可以重新运行脚本

### 监控
- 查看`deploy.log`了解详细进度
- 监控磁盘空间使用
- 检查Git仓库状态

## 🔒 安全注意事项

1. **仓库信任** - 只克隆信任的GitHub仓库
2. **代码审查** - 部署前检查游戏代码
3. **权限控制** - 确保脚本有适当的文件权限
4. **备份** - 部署前备份重要数据

## 📝 最佳实践

### 配置管理
1. **版本控制** - 将配置文件加入版本控制
2. **分类组织** - 按分类组织游戏配置
3. **命名规范** - 使用一致的slug命名规范

### 部署策略
1. **分批部署** - 分批次部署游戏
2. **测试优先** - 先用DryRun测试
3. **监控日志** - 密切关注部署日志
4. **回滚准备** - 准备回滚方案

### 质量控制
1. **游戏测试** - 部署后测试游戏功能
2. **图片检查** - 确保预览图正确显示
3. **数据验证** - 验证数据库记录正确性
4. **用户体验** - 从用户角度测试游戏

## 🤝 贡献指南

欢迎提交改进建议和bug报告！

### 报告问题
1. 提供详细的错误信息
2. 包含相关的日志片段
3. 说明复现步骤

### 功能建议
1. 描述期望的功能
2. 说明使用场景
3. 提供实现思路

---

## 📞 支持

如有问题，请查看：
1. 本文档的故障排除部分
2. `deploy.log`日志文件
3. GitHub Issues

**Happy Deploying! 🎮** 