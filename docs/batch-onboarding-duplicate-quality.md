# 批量上架补充 - 重复检测和质量评估

## 🔍 重复检测（最关键！）

### 问题：同一游戏多次上架
- 不同GitHub仓库（原版/fork）
- 不同URL（GitHub Pages/自定义域名）
- 不同名称（Tetris/Tetris Classic/Tetris Game）

### 多维度检测方案

#### 1. 精确匹配检测
```javascript
// 检查已存在的游戏
const existingGames = JSON.parse(fs.readFileSync('src/data/games.json'));

function checkExactDuplicate(newGame) {
  return existingGames.some(game =>
    // URL完全相同
    game.iframeUrl === newGame.iframeUrl ||
    game.sourceUrl === newGame.sourceUrl ||
    // slug相同
    game.slug === newGame.slug
  );
}
```

#### 2. 标题相似度检测
```javascript
import { levenshtein } from 'fast-levenshtein';

function checkTitleSimilarity(newTitle) {
  const matches = existingGames.filter(game => {
    const distance = levenshtein(
      newTitle.toLowerCase().replace(/[^a-z0-9]/g, ''),
      game.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    // 编辑距离<3认为是相同游戏
    return distance < 3;
  });

  return matches.length > 0 ? matches : null;
}

// 示例：
// "Tetris" vs "Tetris Classic" → 距离8，不同游戏
// "Tetris" vs "Tetriss" → 距离1，可能重复
// "Snake Game" vs "Snake" → 距离4，需要人工确认
```

#### 3. 截图相似度检测（最可靠）
```javascript
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

async function compareScreenshots(newScreenshot, existingScreenshot) {
  const img1 = PNG.sync.read(fs.readFileSync(newScreenshot));
  const img2 = PNG.sync.read(fs.readFileSync(existingScreenshot));

  // 调整到相同尺寸
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  const diff = pixelmatch(
    img1.data, img2.data, null,
    width, height,
    { threshold: 0.1 }
  );

  const similarity = 1 - (diff / (width * height));

  // 相似度>90%认为是同一游戏
  return similarity > 0.9;
}
```

#### 4. 综合判断
```javascript
async function detectDuplicate(newGame) {
  // 1. 精确匹配（100%重复）
  if (checkExactDuplicate(newGame)) {
    return { isDuplicate: true, confidence: 100, reason: 'Exact URL match' };
  }

  // 2. 标题相似度
  const titleMatches = checkTitleSimilarity(newGame.title);
  if (titleMatches) {
    // 3. 对标题相似的游戏，比较截图
    for (const match of titleMatches) {
      const screenshotSimilar = await compareScreenshots(
        newGame.screenshot,
        match.thumbnailUrl
      );

      if (screenshotSimilar) {
        return {
          isDuplicate: true,
          confidence: 95,
          reason: 'Similar title + identical screenshot',
          existingGame: match.slug
        };
      }
    }

    // 标题相似但截图不同，需要人工确认
    return {
      isDuplicate: 'maybe',
      confidence: 60,
      reason: 'Similar title, different screenshot',
      needsReview: true,
      similarGames: titleMatches.map(g => g.slug)
    };
  }

  return { isDuplicate: false };
}
```

---

## ⭐ 精品游戏评估

### 评分标准（总分100分）

#### 1. GitHub指标（40分）
```javascript
const githubScore = {
  stars: Math.min(repo.stargazers_count / 10, 20),  // 最高20分
  forks: Math.min(repo.forks_count / 5, 10),        // 最高10分
  watchers: Math.min(repo.watchers_count / 5, 5),   // 最高5分
  recentUpdate: isWithin6Months ? 5 : 0,            // 5分
};
```

#### 2. 技术质量（30分）
```javascript
const techScore = {
  hasDemo: repo.homepage ? 10 : 0,                  // 10分
  hasReadme: repo.has_readme ? 5 : 0,               // 5分
  hasLicense: repo.license ? 5 : 0,                 // 5分
  noErrors: consoleErrors.length === 0 ? 10 : 0,    // 10分
};
```

#### 3. 游戏体验（30分）
```javascript
const gameplayScore = {
  loadTime: loadTime < 3000 ? 10 : (loadTime < 5000 ? 5 : 0),  // 10分
  responsive: isMobileFriendly ? 10 : 0,                        // 10分
  playable: canActuallyPlay ? 10 : 0,                           // 10分
};
```

### 评级系统
```javascript
function rateGame(totalScore) {
  if (totalScore >= 80) return 'excellent';  // 精品
  if (totalScore >= 60) return 'good';       // 优质
  if (totalScore >= 40) return 'acceptable'; // 合格
  return 'poor';                             // 不推荐
}

// 上架策略
const onboardingStrategy = {
  excellent: { onboard: true, featured: true, priority: 1 },
  good: { onboard: true, featured: false, priority: 2 },
  acceptable: { onboard: true, featured: false, priority: 3 },
  poor: { onboard: false, reason: 'Quality too low' }
};
```

---

## 📝 字段完整性检查

### 必填字段（缺一不可）
```javascript
const requiredFields = {
  // 基本信息
  slug: { type: 'string', pattern: /^[a-z0-9-]+$/ },
  title: { type: 'string', minLength: 2, maxLength: 50 },
  category: { type: 'string', enum: categories },
  categoryName: { type: 'string' },

  // URL
  iframeUrl: { type: 'url', validate: checkUrl200 },
  sourceUrl: { type: 'url' },

  // 图片
  thumbnailUrl: { type: 'string', validate: fileExists },
  image: { type: 'string', validate: fileExists },

  // 分类
  difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
  ageRange: { type: 'string', pattern: /^\d+-\d+$/ },
  minAge: { type: 'number', min: 4, max: 16 },
  maxAge: { type: 'number', min: 6, max: 18 },

  // 标签
  tags: { type: 'array', minLength: 3, maxLength: 8 },

  // 元数据
  source: { type: 'string', default: 'EduGameHQ' },
  developer: { type: 'string' },
  lastUpdated: { type: 'date', format: 'YYYY-MM-DD' },
  isNew: { type: 'boolean', default: true },
  verified: { type: 'boolean', default: false },
};
```

### 推荐字段（提升质量）
```javascript
const recommendedFields = {
  description: { type: 'string', minLength: 50, maxLength: 200 },
  gameGuide: {
    howToPlay: { type: 'array', minLength: 3 },
    controls: { type: 'object' },
    tips: { type: 'array', minLength: 2 }
  },
  technology: { type: 'string', default: 'HTML5' },
  mobileSupport: { type: 'boolean' },
  responsive: { type: 'boolean' },
  rating: { type: 'number', min: 0, max: 10 },
};
```

### 字段验证函数
```javascript
function validateGameData(game) {
  const errors = [];
  const warnings = [];

  // 检查必填字段
  for (const [field, rules] of Object.entries(requiredFields)) {
    if (!game[field]) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    // 类型检查
    if (rules.type === 'string' && typeof game[field] !== 'string') {
      errors.push(`${field} must be a string`);
    }

    // 枚举检查
    if (rules.enum && !rules.enum.includes(game[field])) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // 正则检查
    if (rules.pattern && !rules.pattern.test(game[field])) {
      errors.push(`${field} format invalid`);
    }

    // 自定义验证
    if (rules.validate && !rules.validate(game[field])) {
      errors.push(`${field} validation failed`);
    }
  }

  // 检查推荐字段
  for (const [field, rules] of Object.entries(recommendedFields)) {
    if (!game[field]) {
      warnings.push(`Missing recommended field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

---

## 🎯 分类准确性验证

### 自动分类验证
```javascript
function verifyCategoryMatch(game) {
  const categoryKeywords = {
    math: ['math', 'number', 'arithmetic', 'calculation', 'algebra'],
    puzzle: ['puzzle', 'brain', 'logic', 'solve', 'match'],
    arcade: ['arcade', 'classic', 'retro', 'score', 'level'],
    // ... 其他分类
  };

  const keywords = categoryKeywords[game.category] || [];
  const text = `${game.title} ${game.description}`.toLowerCase();

  const matchCount = keywords.filter(kw => text.includes(kw)).length;

  if (matchCount === 0) {
    return {
      match: false,
      confidence: 0,
      suggestion: 'Category may be incorrect',
      needsReview: true
    };
  }

  return {
    match: true,
    confidence: Math.min(matchCount * 20, 100)
  };
}
```

### 人工分类确认
```javascript
// 生成待审核列表
const needsCategoryReview = games.filter(game => {
  const verification = verifyCategoryMatch(game);
  return !verification.match || verification.confidence < 60;
});

// 输出审核清单
console.log('需要人工确认分类的游戏：');
needsCategoryReview.forEach(game => {
  console.log(`- ${game.title} (当前: ${game.category})`);
  console.log(`  URL: ${game.iframeUrl}`);
  console.log(`  建议: 实际游玩后确认分类\n`);
});
```

---

## 📊 完整的上架前检查流程

```javascript
async function preOnboardingCheck(newGame) {
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    score: 0,
    rating: '',
    actions: []
  };

  // 1. 重复检测
  const duplicateCheck = await detectDuplicate(newGame);
  if (duplicateCheck.isDuplicate === true) {
    results.passed = false;
    results.errors.push(`Duplicate game: ${duplicateCheck.existingGame}`);
    return results;
  }
  if (duplicateCheck.isDuplicate === 'maybe') {
    results.warnings.push('Possible duplicate, needs manual review');
    results.actions.push('MANUAL_REVIEW_DUPLICATE');
  }

  // 2. 质量评估
  const qualityScore = await evaluateGameQuality(newGame);
  results.score = qualityScore.total;
  results.rating = rateGame(qualityScore.total);

  if (results.rating === 'poor') {
    results.passed = false;
    results.errors.push('Quality score too low');
    return results;
  }

  // 3. 字段验证
  const fieldValidation = validateGameData(newGame);
  if (!fieldValidation.valid) {
    results.passed = false;
    results.errors.push(...fieldValidation.errors);
  }
  results.warnings.push(...fieldValidation.warnings);

  // 4. 分类验证
  const categoryCheck = verifyCategoryMatch(newGame);
  if (!categoryCheck.match) {
    results.warnings.push('Category verification failed');
    results.actions.push('MANUAL_REVIEW_CATEGORY');
  }

  // 5. URL验证
  const urlCheck = await verifyGameUrl(newGame.iframeUrl);
  if (!urlCheck.accessible) {
    results.passed = false;
    results.errors.push('Game URL not accessible');
  }
  if (urlCheck.iframeBlocked) {
    results.passed = false;
    results.errors.push('iframe embedding blocked');
  }

  return results;
}
```

---

## 🔄 上架后审核流程

### 1. 立即验证（上架后5分钟内）
```javascript
const immediateChecks = {
  urlAccessible: await fetch(game.iframeUrl).then(r => r.ok),
  screenshotExists: fs.existsSync(game.thumbnailUrl),
  appearsInList: checkGameInHomepage(game.slug),
  categoryCorrect: checkGameInCategory(game.slug, game.category),
};
```

### 2. 24小时监控
```javascript
// 记录游戏访问情况
const monitoring = {
  views: 0,
  playAttempts: 0,
  errors: [],
  userReports: [],
};

// 如果24小时内：
// - 0次播放 → 可能有问题
// - 错误率>50% → 需要检查
// - 用户投诉 → 立即审核
```

### 3. 7天评估
```javascript
const weeklyReview = {
  playCount: game.playCount,
  errorRate: game.errors / game.playAttempts,
  userRating: game.rating,

  // 决策
  action: playCount < 5 && errorRate > 0.3 ? 'REMOVE' : 'KEEP'
};
```

---

## 📋 最终上架决策矩阵

| 检查项 | 权重 | 不通过后果 |
|--------|------|-----------|
| 重复检测 | 🔴 必须 | 拒绝上架 |
| URL可访问 | 🔴 必须 | 拒绝上架 |
| iframe兼容 | 🔴 必须 | 拒绝上架 |
| 质量评分>40 | 🔴 必须 | 拒绝上架 |
| 字段完整 | 🔴 必须 | 拒绝上架 |
| 分类准确 | 🟡 建议 | 标记审核 |
| 移动端兼容 | 🟡 建议 | 标记警告 |
| 游戏说明 | 🟢 可选 | 后续补充 |
