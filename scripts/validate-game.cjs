/**
 * 游戏验证脚本
 * 检查游戏是否符合上架标准
 */

const fs = require('fs');
const path = require('path');

// 加载现有游戏数据
function loadExistingGames() {
  const gamesPath = path.join(__dirname, '../src/data/games.json');
  return JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
}

// 检查游戏是否重复
function checkDuplicate(newGame, existingGames) {
  const duplicates = existingGames.filter(g =>
    g.slug === newGame.slug ||
    g.title.toLowerCase() === newGame.title.toLowerCase() ||
    g.iframeUrl === newGame.iframeUrl ||
    (g.sourceUrl && g.sourceUrl === newGame.sourceUrl)
  );
  return duplicates;
}

// 验证游戏数据完整性
function validateGameData(game) {
  const errors = [];
  const warnings = [];

  // 必填字段检查
  const requiredFields = [
    'slug', 'title', 'category', 'categoryName',
    'iframeUrl', 'description', 'thumbnailUrl', 'difficulty'
  ];

  requiredFields.forEach(field => {
    if (!game[field]) {
      errors.push(`缺少必填字段: ${field}`);
    }
  });

  // slug 格式检查
  if (game.slug && !/^[a-z0-9-]+$/.test(game.slug)) {
    errors.push('slug 格式错误，只能包含小写字母、数字和连字符');
  }

  // 分类检查
  const validCategories = [
    'math', 'science', 'coding', 'language', 'puzzle',
    'logic', 'memory', 'strategy', 'arcade', 'sports',
    'art', 'adventure', 'creative', 'educational', 'geography'
  ];
  if (game.category && !validCategories.includes(game.category)) {
    errors.push(`无效分类: ${game.category}`);
  }

  // 难度检查
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (game.difficulty && !validDifficulties.includes(game.difficulty)) {
    warnings.push(`难度值不标准: ${game.difficulty}`);
  }

  // 年龄范围检查
  if (game.minAge && game.minAge < 3) {
    warnings.push('最小年龄设置过低');
  }
  if (game.maxAge && game.maxAge > 16) {
    warnings.push('最大年龄超过16岁限制');
  }

  // URL 格式检查
  if (game.iframeUrl && !game.iframeUrl.startsWith('http')) {
    errors.push('iframeUrl 必须是完整的 URL');
  }
  if (game.thumbnailUrl && !game.thumbnailUrl.startsWith('http')) {
    errors.push('thumbnailUrl 必须是完整的 URL');
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

// 生成游戏数据模板
function generateGameTemplate(options = {}) {
  const today = new Date().toISOString().split('T')[0];

  return {
    slug: options.slug || 'game-slug',
    title: options.title || 'Game Title',
    category: options.category || 'puzzle',
    categoryName: options.categoryName || 'Puzzle',
    iframeUrl: options.iframeUrl || '',
    description: options.description || '',
    gameGuide: {
      howToPlay: options.howToPlay || ['游戏说明'],
      controls: {
        mouse: options.mouseControls || '点击交互',
        keyboard: options.keyboardControls || '方向键移动'
      },
      tips: options.tips || ['游戏技巧']
    },
    thumbnailUrl: options.thumbnailUrl || '',
    difficulty: options.difficulty || 'Medium',
    ageRange: options.ageRange || '8-16',
    minAge: options.minAge || 8,
    maxAge: options.maxAge || 16,
    tags: options.tags || ['puzzle'],
    source: options.source || 'github',
    iframeCompatible: true,
    verified: true,
    technology: 'HTML5',
    mobileSupport: options.mobileSupport !== false,
    responsive: options.responsive !== false,
    language: options.language || 'en',
    rating: 4.5,
    playCount: 0,
    sourceUrl: options.sourceUrl || '',
    lastUpdated: today,
    lastChecked: today,
    featured: false,
    trending: false,
    isNew: true,
    developer: options.developer || ''
  };
}

module.exports = {
  loadExistingGames,
  checkDuplicate,
  validateGameData,
  generateGameTemplate
};

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'check-duplicate') {
    const slug = args[1];
    if (!slug) {
      console.log('用法: node validate-game.cjs check-duplicate <slug>');
      process.exit(1);
    }
    const games = loadExistingGames();
    const exists = games.find(g => g.slug === slug);
    if (exists) {
      console.log(`❌ 游戏已存在: ${exists.title}`);
    } else {
      console.log(`✅ slug "${slug}" 可用`);
    }
  } else if (args[0] === 'template') {
    console.log(JSON.stringify(generateGameTemplate(), null, 2));
  } else {
    console.log('EduGameHQ 游戏验证工具');
    console.log('用法:');
    console.log('  node validate-game.cjs check-duplicate <slug>');
    console.log('  node validate-game.cjs template');
  }
}
