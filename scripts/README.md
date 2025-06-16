# CrazyGames缩略图获取脚本

## 📋 功能说明

这个脚本可以自动获取CrazyGames游戏的真实缩略图URL，并更新到`src/data/games.json`文件中。

## 🚀 使用方法

### 1. 安装依赖
```bash
cd scripts
npm install
```

### 2. 运行脚本
```bash
npm run fetch
```

或者直接运行：
```bash
node fetch-crazygames-thumbnails.js
```

## 🔧 脚本功能

- ✅ 自动访问CrazyGames游戏页面
- ✅ 智能识别游戏缩略图
- ✅ 获取真实的图片URL
- ✅ 自动更新games.json文件
- ✅ 详细的执行日志
- ✅ 错误处理和重试机制

## 📊 支持的游戏

脚本会自动获取以下16个游戏的缩略图：

1. number-line-match
2. stack-it
3. math-push
4. number-digger
5. gravity-crowd
6. math-duck
7. bff-math-class
8. 100-doors-puzzle-box
9. aritmazetic
10. super-number-defense
11. puzzle-survivor
12. nullify
13. number-masters
14. math-expressions
15. snake-blockade
16. xor

## 🛠 技术实现

- **Puppeteer**: 自动化浏览器操作
- **多选择器策略**: 智能识别缩略图元素
- **错误处理**: 完善的异常处理机制
- **延迟控制**: 避免被网站限制访问

## 📝 输出示例

```
🚀 开始获取CrazyGames缩略图...

🔍 正在获取 stack-it 的缩略图...
✅ 通过选择器 img[src*="_16x9"] 找到: https://imgs.crazygames.com/stack-it_16x9/20241201/stack-it_16x9-cover?metadata=none&quality=70

📊 获取结果摘要:
==================================================
✅ 成功获取: 15 个
❌ 获取失败: 1 个

🎉 任务完成！成功更新了 15 个游戏的缩略图！
```

## ⚠ 注意事项

1. 脚本需要网络连接访问CrazyGames网站
2. 首次运行会下载Chromium浏览器（约100MB）
3. 建议在网络稳定的环境下运行
4. 脚本会自动备份原始数据

## 🔄 自定义配置

如需添加更多游戏，请修改脚本中的`GAMES_TO_UPDATE`数组：

```javascript
const GAMES_TO_UPDATE = [
  'your-game-slug-1',
  'your-game-slug-2',
  // ... 更多游戏
];
``` 