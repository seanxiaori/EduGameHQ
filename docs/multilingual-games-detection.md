# 多语言游戏检测和搜索

## 🌍 游戏语言检测

### 1. 自动语言检测

```javascript
import { franc } from 'franc';

async function detectGameLanguage(game) {
  // 1. 检查仓库语言标签
  const repoLanguages = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/languages`
  ).then(r => r.json());

  // 2. 分析游戏页面文本
  const page = await browser.newPage();
  await page.goto(game.iframeUrl);
  const pageText = await page.evaluate(() => document.body.innerText);

  // 使用franc检测语言
  const detectedLang = franc(pageText);

  // 3. 语言映射
  const languageMap = {
    'eng': 'en',  // 英语
    'cmn': 'zh',  // 中文
    'jpn': 'ja',  // 日语
    'kor': 'ko',  // 韩语
    'spa': 'es',  // 西班牙语
    'fra': 'fr',  // 法语
    'deu': 'de',  // 德语
    'rus': 'ru',  // 俄语
    'por': 'pt',  // 葡萄牙语
    'ara': 'ar',  // 阿拉伯语
  };

  return {
    primary: languageMap[detectedLang] || 'en',
    confidence: franc.all(pageText)[0][1],
    isMultilingual: checkMultilingualSupport(pageText)
  };
}
```

### 2. 多语言支持检测

```javascript
function checkMultilingualSupport(pageText) {
  // 检查是否有语言切换按钮
  const hasLangSwitcher = /language|lang|语言|idioma|langue/i.test(pageText);

  // 检查是否包含多种语言文本
  const languages = {
    en: /[a-zA-Z]{4,}/.test(pageText),
    zh: /[\u4e00-\u9fa5]{4,}/.test(pageText),
    ja: /[\u3040-\u309f\u30a0-\u30ff]{4,}/.test(pageText),
    ko: /[\uac00-\ud7af]{4,}/.test(pageText),
    es: /[áéíóúñ]/i.test(pageText),
    fr: /[àâçéèêëîïôûùüÿ]/i.test(pageText),
  };

  const supportedLangs = Object.entries(languages)
    .filter(([_, supported]) => supported)
    .map(([lang]) => lang);

  return {
    isMultilingual: supportedLangs.length > 1,
    languages: supportedLangs
  };
}
```

---

## 🔍 多语言游戏搜索策略

### 1. GitHub搜索关键词

```javascript
const multilingualSearchQueries = {
  // 中文游戏
  chinese: [
    '中文 游戏 html5 language:JavaScript',
    '汉字 游戏 language:JavaScript',
    'chinese game html5 language:JavaScript',
    '成语 游戏 language:JavaScript',
    '拼音 游戏 language:JavaScript',
  ],

  // 日语游戏
  japanese: [
    '日本語 ゲーム html5 language:JavaScript',
    'japanese game html5 language:JavaScript',
    'ひらがな ゲーム language:JavaScript',
    'カタカナ ゲーム language:JavaScript',
  ],

  // 韩语游戏
  korean: [
    '한국어 게임 html5 language:JavaScript',
    'korean game html5 language:JavaScript',
    '한글 게임 language:JavaScript',
  ],

  // 西班牙语游戏
  spanish: [
    'juego html5 español language:JavaScript',
    'spanish game html5 language:JavaScript',
    'juego educativo language:JavaScript',
  ],

  // 法语游戏
  french: [
    'jeu html5 français language:JavaScript',
    'french game html5 language:JavaScript',
    'jeu éducatif language:JavaScript',
  ],

  // 德语游戏
  german: [
    'spiel html5 deutsch language:JavaScript',
    'german game html5 language:JavaScript',
    'lernspiel language:JavaScript',
  ],

  // 俄语游戏
  russian: [
    'игра html5 русский language:JavaScript',
    'russian game html5 language:JavaScript',
    'обучающая игра language:JavaScript',
  ],

  // 葡萄牙语游戏
  portuguese: [
    'jogo html5 português language:JavaScript',
    'portuguese game html5 language:JavaScript',
    'jogo educativo language:JavaScript',
  ],

  // 阿拉伯语游戏
  arabic: [
    'لعبة html5 language:JavaScript',
    'arabic game html5 language:JavaScript',
  ],
};
```

### 2. 按地区搜索

```javascript
const regionalSearchQueries = {
  china: 'game html5 china language:JavaScript stars:>10',
  japan: 'game html5 japan language:JavaScript stars:>10',
  korea: 'game html5 korea language:JavaScript stars:>10',
  spain: 'game html5 spain language:JavaScript stars:>10',
  france: 'game html5 france language:JavaScript stars:>10',
  germany: 'game html5 germany language:JavaScript stars:>10',
  russia: 'game html5 russia language:JavaScript stars:>10',
  brazil: 'game html5 brazil language:JavaScript stars:>10',
};
```

---

## 📝 游戏数据中的语言字段

### 字段定义

```javascript
const gameLanguageFields = {
  // 主要语言
  language: {
    type: 'string',
    enum: ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'],
    default: 'en'
  },

  // 支持的语言列表
  supportedLanguages: {
    type: 'array',
    items: { type: 'string' },
    example: ['en', 'zh', 'ja']
  },

  // 是否多语言
  isMultilingual: {
    type: 'boolean',
    default: false
  },

  // 语言切换支持
  hasLanguageSwitcher: {
    type: 'boolean',
    default: false
  }
};
```

### 示例数据

```json
{
  "slug": "chinese-chess",
  "title": "中国象棋",
  "language": "zh",
  "supportedLanguages": ["zh", "en"],
  "isMultilingual": true,
  "hasLanguageSwitcher": true,
  "description": "经典中国象棋游戏，支持中英文切换"
}
```

---

## 🎯 多语言游戏优先级

### 评分加成

```javascript
function calculateLanguageBonus(game) {
  let bonus = 0;

  // 非英语游戏 +10分
  if (game.language !== 'en') {
    bonus += 10;
  }

  // 多语言支持 +15分
  if (game.isMultilingual) {
    bonus += 15;
  }

  // 支持中文 +20分（平台重点）
  if (game.supportedLanguages?.includes('zh')) {
    bonus += 20;
  }

  // 支持3种以上语言 +10分
  if (game.supportedLanguages?.length >= 3) {
    bonus += 10;
  }

  return bonus;
}
```

### 上架优先级

```javascript
const languagePriority = {
  // 高优先级（急需）
  high: ['zh', 'ja', 'ko', 'es', 'fr'],

  // 中优先级
  medium: ['de', 'ru', 'pt'],

  // 低优先级（已有很多）
  low: ['en']
};

function getOnboardingPriority(game) {
  const lang = game.language;

  if (languagePriority.high.includes(lang)) {
    return 1; // 优先上架
  }
  if (languagePriority.medium.includes(lang)) {
    return 2;
  }
  return 3;
}
```

---

## 🔄 批量搜索多语言游戏脚本

```javascript
#!/usr/bin/env node
import https from 'https';

async function searchMultilingualGames() {
  const results = {
    chinese: [],
    japanese: [],
    korean: [],
    spanish: [],
    french: [],
    german: [],
    russian: [],
    portuguese: [],
  };

  for (const [lang, queries] of Object.entries(multilingualSearchQueries)) {
    console.log(`🔍 搜索${lang}游戏...`);

    for (const query of queries) {
      const repos = await searchGitHub(query);

      for (const repo of repos) {
        // 验证语言
        const detectedLang = await detectGameLanguage(repo);

        if (detectedLang.primary === getLangCode(lang)) {
          results[lang].push({
            name: repo.name,
            stars: repo.stargazers_count,
            url: repo.html_url,
            homepage: repo.homepage,
            language: detectedLang.primary,
            isMultilingual: detectedLang.isMultilingual
          });
        }
      }

      await sleep(2000); // 避免API限制
    }
  }

  // 输出结果
  console.log('\n📊 搜索结果：');
  for (const [lang, games] of Object.entries(results)) {
    console.log(`${lang}: ${games.length}款游戏`);
  }

  return results;
}
```

---

## 📋 多语言游戏检查清单

### 上架前验证

```markdown
- [ ] 检测游戏主要语言
- [ ] 确认语言字段准确
- [ ] 测试语言切换功能（如果有）
- [ ] 验证非英语文本显示正常
- [ ] 检查是否有乱码
- [ ] 确认字体支持该语言
```

### 特殊注意事项

**中文游戏：**
- 检查简体/繁体支持
- 验证中文输入法兼容性
- 确认字体渲染正常

**日语游戏：**
- 检查平假名/片假名/汉字显示
- 验证日语输入支持

**阿拉伯语游戏：**
- 检查从右到左(RTL)布局
- 验证阿拉伯数字显示

---

## 🎯 目标分布

```javascript
const targetLanguageDistribution = {
  en: '40%',  // 英语（已有很多）
  zh: '20%',  // 中文（重点增加）
  ja: '10%',  // 日语
  ko: '5%',   // 韩语
  es: '10%',  // 西班牙语
  fr: '5%',   // 法语
  de: '5%',   // 德语
  ru: '3%',   // 俄语
  pt: '2%',   // 葡萄牙语
};

// 当前分布
const currentDistribution = calculateCurrentDistribution(games);

// 需要补充的语言
const languagesToAdd = Object.entries(targetLanguageDistribution)
  .filter(([lang, target]) => {
    const current = currentDistribution[lang] || 0;
    return current < parseFloat(target);
  })
  .map(([lang]) => lang);

console.log('需要重点添加的语言：', languagesToAdd);
```
