# 批量游戏搜索和上架流程

## 流程概述

自动化搜索GitHub上的HTML5游戏，验证质量，批量生成游戏数据并上架。

---

## 第一步：批量搜索游戏

### 1.1 按分类搜索

针对13个游戏分类，使用GitHub API搜索：

```javascript
const categories = [
  { name: 'math', keywords: ['math game', 'mathematics', 'arithmetic'] },
  { name: 'science', keywords: ['science game', 'physics', 'chemistry'] },
  { name: 'coding', keywords: ['coding game', 'programming', 'algorithm'] },
  { name: 'language', keywords: ['language game', 'vocabulary', 'spelling'] },
  { name: 'geography', keywords: ['geography game', 'map', 'countries'] },
  { name: 'puzzle', keywords: ['puzzle game', 'brain teaser', 'logic'] },
  { name: 'memory', keywords: ['memory game', 'matching', 'cards'] },
  { name: 'strategy', keywords: ['strategy game', 'chess', 'tactics'] },
  { name: 'arcade', keywords: ['arcade game', 'classic game', 'retro'] },
  { name: 'adventure', keywords: ['adventure game', 'platformer', 'exploration'] },
  { name: 'sports', keywords: ['sports game', 'soccer', 'basketball'] },
  { name: 'art', keywords: ['art game', 'drawing', 'painting'] },
  { name: 'creative', keywords: ['creative game', 'sandbox', 'building'] }
];

// 搜索条件
const searchQuery = `${keyword} html5 language:JavaScript stars:>20`;
```

### 1.2 搜索参数

- **最低星数**: >20 stars（确保质量）
- **语言**: JavaScript
- **关键词**: html5 game
- **每个分类**: 搜索前15个结果
- **总预期**: 约150-200个候选游戏

---

## 第二步：初步筛选

### 2.1 自动筛选条件

对每个搜索结果，检查：

```javascript
// 必须满足
- 有 homepage 或 demo URL
- 仓库有 README
- 最近2年内有更新
- 不是游戏引擎/框架
- 不是教程/示例代码

// 排除关键词
const excludeKeywords = [
  'engine', 'framework', 'tutorial', 'example',
  'template', 'boilerplate', 'starter'
];
```

### 2.2 输出候选列表

生成 JSON 文件：

```json
{
  "category": "puzzle",
  "candidates": [
    {
      "name": "game-name",
      "stars": 150,
      "url": "https://github.com/user/repo",
      "homepage": "https://user.github.io/game",
      "description": "Game description"
    }
  ]
}
```

---

## 第三步：URL验证（关键步骤）

### 3.1 验证游戏URL

对每个候选游戏：

```bash
# 1. 检查HTTP状态
curl -I <homepage_url> | grep "HTTP/2 200"

# 2. 检查是否是HTML页面
curl -I <homepage_url> | grep "text/html"

# 3. 检查页面大小（排除重定向/空页面）
curl -s <homepage_url> | wc -c  # 应该 > 1000 bytes
```

### 3.2 验证iframe兼容性

```javascript
// 使用Playwright测试
const browser = await chromium.launch();
const page = await browser.newPage();

// 创建测试iframe
await page.setContent(`
  <iframe src="${gameUrl}" width="800" height="600"></iframe>
`);

await page.waitForTimeout(5000);

// 检查是否加载成功
const iframeContent = await page.frameLocator('iframe').locator('body');
const hasContent = await iframeContent.count() > 0;
```

### 3.3 验证结果分类

- ✅ **通过**: URL返回200，iframe可加载
- ⚠️ **警告**: URL正常但iframe可能有问题
- ❌ **失败**: URL 404或无法访问

---

## 第四步：游戏质量评估

### 4.1 自动评估指标

```javascript
const qualityScore = {
  stars: repo.stargazers_count,        // GitHub星数
  hasDemo: !!repo.homepage,            // 是否有演示
  recentUpdate: isWithin2Years,        // 最近更新
  hasScreenshot: hasImageInReadme,     // README有截图
  hasLicense: !!repo.license,          // 有开源协议

  // 计算总分
  total: (stars/10) + (hasDemo?20:0) + (recentUpdate?10:0) + ...
};

// 分级
if (score >= 50) return 'excellent';
if (score >= 30) return 'good';
if (score >= 15) return 'acceptable';
return 'skip';
```

### 4.2 人工审核清单

对于 'excellent' 和 'good' 级别的游戏：

- [ ] 打开游戏URL，确认可玩
- [ ] 检查游戏类型是否符合分类
- [ ] 确认适合16岁以下用户
- [ ] 检查是否有过多广告
- [ ] 确认不是游戏集合/平台

---

## 第五步：截取游戏封面

### 5.1 自动截图

```javascript
// 使用Playwright自动截图
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 }
});

await page.goto(gameUrl);

// 等待游戏加载
await page.waitForTimeout(3000);

// 尝试点击"开始游戏"按钮
const startButton = await page.$('button:has-text("Start"), button:has-text("Play")');
if (startButton) {
  await startButton.click();
  await page.waitForTimeout(3000);
}

// 截取游戏画面
await page.screenshot({
  path: `public/screenshots/${slug}.png`
});
```

### 5.2 截图验证

- 检查截图文件大小 > 10KB
- 不是纯黑/纯白屏幕
- 包含游戏元素（不是加载界面）

---

## 第六步：生成游戏数据

### 6.1 自动填充字段

```javascript
const gameData = {
  slug: generateSlug(repo.name),
  title: formatTitle(repo.name),
  category: detectedCategory,
  categoryName: capitalize(detectedCategory),
  iframeUrl: repo.homepage,
  description: generateDescription(repo.description),
  thumbnailUrl: `/screenshots/${slug}.png`,
  image: `/screenshots/${slug}.png`,
  difficulty: estimateDifficulty(repo.description),
  ageRange: estimateAgeRange(category),
  minAge: 6,
  maxAge: 16,
  tags: generateTags(category, repo.topics),
  source: "EduGameHQ",
  sourceUrl: repo.html_url,
  developer: repo.owner.login,
  lastUpdated: new Date().toISOString().split('T')[0],
  isNew: true,
  verified: false  // 需要人工验证后改为true
};
```

### 6.2 需要人工补充的字段

- `gameGuide.howToPlay` - 游戏玩法说明
- `gameGuide.controls` - 操作方式
- `gameGuide.tips` - 游戏技巧
- `verified` - 验证后设为true

---

## 第七步：批量上架

### 7.1 添加到games.json

```javascript
const existingGames = JSON.parse(fs.readFileSync('src/data/games.json'));

// 检查重复
const newGames = generatedGames.filter(game =>
  !existingGames.some(g =>
    g.slug === game.slug ||
    g.iframeUrl === game.iframeUrl
  )
);

// 合并
const allGames = [...existingGames, ...newGames];
fs.writeFileSync('src/data/games.json', JSON.stringify(allGames, null, 2));
```

### 7.2 提交到git

```bash
git add src/data/games.json public/screenshots/*.png
git commit -m "feat: batch add ${newGames.length} games from GitHub

Categories: ${categories.join(', ')}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push
```

---

## 第八步：后续验证

### 8.1 上架后检查

- 访问本地服务器验证游戏显示
- 测试游戏是否可正常加载
- 检查截图是否正确显示
- 确认分类和标签准确

### 8.2 标记为已验证

```javascript
// 验证通过后
game.verified = true;
game.featured = isExcellentQuality;  // 高质量游戏设为精选
```

---

## 执行时间估算

| 步骤 | 预计时间 | 说明 |
|------|---------|------|
| 搜索游戏 | 5分钟 | GitHub API搜索 |
| 初步筛选 | 10分钟 | 自动过滤 |
| URL验证 | 20分钟 | 验证150个URL |
| 质量评估 | 5分钟 | 自动评分 |
| 人工审核 | 30分钟 | 审核30-50个候选 |
| 截图 | 15分钟 | 自动截图 |
| 生成数据 | 5分钟 | 自动生成JSON |
| 上架 | 5分钟 | 提交git |
| **总计** | **约1.5小时** | 可添加30-50款游戏 |

---

## 脚本文件结构

```
scripts/
├── batch-search-games.mjs       # 步骤1-2: 搜索和筛选
├── batch-verify-urls.mjs        # 步骤3: URL验证
├── batch-quality-check.mjs      # 步骤4: 质量评估
├── batch-capture-screenshots.mjs # 步骤5: 截图
├── batch-generate-data.mjs      # 步骤6: 生成数据
└── batch-onboard-games.mjs      # 步骤7: 批量上架
```

---

## 注意事项

### ⚠️ 必须遵守的规则

1. **URL验证是强制的** - 不验证不上架
2. **截图必须是游戏画面** - 不是开始界面
3. **source字段统一为"EduGameHQ"** - 不用"GitHub"
4. **检查重复** - 避免添加已存在的游戏
5. **人工审核** - 自动化只是辅助，最终需要人工确认

### 💡 优化建议

1. 分批次上架（每次10-20款）
2. 优先高质量游戏（excellent级别）
3. 保持分类平衡（每个分类至少5款）
4. 定期更新游戏状态（检查URL是否失效）
