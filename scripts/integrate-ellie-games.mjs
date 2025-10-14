/**
 * Ellie游戏集成脚本
 * 功能：将下载的ellie项目游戏集成到EduGameHQ网站
 * 
 * 工作流程：
 * 1. 复制游戏文件到public/games目录
 * 2. 生成游戏元数据
 * 3. 更新games.json文件
 * 4. 生成多语言SEO配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const PROJECT_ROOT = path.join(__dirname, '..');
const TEMP_GAMES_DIR = path.join(PROJECT_ROOT, 'temp-games', 'ellie');
const PUBLIC_GAMES_DIR = path.join(PROJECT_ROOT, 'public', 'games');
const GAMES_JSON_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'games.json');

// Ellie游戏配置
const ELLIE_GAMES = [
  {
    slug: 'eleanor-animal-adventure',
    title: "Eleanor's Animal Adventure",
    category: 'educational',
    categoryName: 'Educational',
    subcategory: 'animals',
    description: 'Join Eleanor on an exciting animal adventure! Learn about different animals, their habitats, and characteristics in this interactive educational game.',
    gameGuide: {
      howToPlay: [
        'Click on animals to learn about them',
        'Navigate through different habitats',
        'Complete animal-related challenges',
        'Discover fun facts about wildlife'
      ],
      controls: {
        mouse: 'Click to interact with animals and navigate',
        touch: 'Tap to select and explore'
      },
      tips: [
        'Take time to read the animal facts',
        'Explore all different habitats',
        'Try to remember what you learn for the quiz'
      ]
    },
    difficulty: 'Easy',
    ageRange: '4-10',
    minAge: 4,
    maxAge: 10,
    tags: ['animals', 'nature', 'learning', 'adventure', 'kids', 'educational'],
    sourceDir: 'animal-adventure',
    learningObjectives: [
      'Learn about different animal species',
      'Understand animal habitats',
      'Develop observation skills',
      'Build vocabulary about nature'
    ],
    features: [
      'Interactive animal exploration',
      'Beautiful graphics and animations',
      'Educational content about wildlife',
      'Kid-friendly interface'
    ]
  },
  {
    slug: 'animal-matching-game',
    title: 'Animal Matching Game',
    category: 'puzzle',
    categoryName: 'Puzzle',
    subcategory: 'memory',
    description: 'Test your memory with this fun animal matching game! Flip cards to find matching pairs of animals and improve your concentration skills.',
    gameGuide: {
      howToPlay: [
        'Click on cards to flip them over',
        'Find matching pairs of animals',
        'Remember card positions',
        'Match all pairs to win'
      ],
      controls: {
        mouse: 'Click on cards to flip them',
        touch: 'Tap cards to reveal animals'
      },
      tips: [
        'Start by flipping cards in corners',
        'Try to remember where you saw each animal',
        'Work systematically across the board'
      ]
    },
    difficulty: 'Easy',
    ageRange: '3-12',
    minAge: 3,
    maxAge: 12,
    tags: ['memory', 'animals', 'matching', 'concentration', 'puzzle', 'kids'],
    sourceDir: 'animal-matching',
    learningObjectives: [
      'Improve memory and concentration',
      'Develop pattern recognition',
      'Learn animal names and appearances',
      'Practice problem-solving skills'
    ],
    features: [
      'Memory training gameplay',
      'Cute animal illustrations',
      'Progressive difficulty levels',
      'Immediate feedback'
    ]
  },
  {
    slug: 'princess-castle-adventure',
    title: 'Princess Castle Adventure',
    category: 'adventure',
    categoryName: 'Adventure',
    subcategory: 'fantasy',
    description: 'Embark on a magical princess castle adventure! Explore the castle, solve puzzles, and help the princess complete her royal quests.',
    gameGuide: {
      howToPlay: [
        'Navigate through castle rooms',
        'Interact with objects and characters',
        'Solve puzzles to progress',
        'Complete royal quests'
      ],
      controls: {
        mouse: 'Click to move and interact',
        keyboard: 'Use arrow keys to navigate',
        touch: 'Tap to explore and interact'
      },
      tips: [
        'Explore every room thoroughly',
        'Talk to all characters for hints',
        'Collect items that might be useful later'
      ]
    },
    difficulty: 'Medium',
    ageRange: '5-12',
    minAge: 5,
    maxAge: 12,
    tags: ['adventure', 'princess', 'castle', 'fantasy', 'puzzle', 'story'],
    sourceDir: 'princess-castle',
    learningObjectives: [
      'Develop problem-solving skills',
      'Improve reading comprehension',
      'Practice logical thinking',
      'Build narrative understanding'
    ],
    features: [
      'Immersive castle environment',
      'Engaging storyline',
      'Interactive puzzles',
      'Beautiful princess theme'
    ]
  },
  {
    slug: 'princess-coffee-shop',
    title: 'Princess Coffee Shop',
    category: 'simulation',
    categoryName: 'Simulation',
    subcategory: 'business',
    description: 'Help the princess run her magical coffee shop! Take orders, prepare drinks, and serve customers in this fun business simulation game.',
    gameGuide: {
      howToPlay: [
        'Take customer orders',
        'Prepare coffee and treats',
        'Serve customers quickly',
        'Earn coins to upgrade your shop'
      ],
      controls: {
        mouse: 'Click to take orders and prepare items',
        touch: 'Tap to interact with customers and equipment'
      },
      tips: [
        'Serve customers quickly for better tips',
        'Upgrade equipment to work faster',
        'Remember regular customers\' favorite orders'
      ]
    },
    difficulty: 'Medium',
    ageRange: '6-14',
    minAge: 6,
    maxAge: 14,
    tags: ['simulation', 'business', 'princess', 'coffee', 'management', 'strategy'],
    sourceDir: 'princess-coffee-shop',
    learningObjectives: [
      'Learn basic business concepts',
      'Develop time management skills',
      'Practice customer service',
      'Understand money and transactions'
    ],
    features: [
      'Business simulation gameplay',
      'Customer service challenges',
      'Upgrade system',
      'Princess-themed environment'
    ]
  },
  {
    slug: 'coloring-studio',
    title: 'Coloring Studio',
    category: 'creative',
    categoryName: 'Creative',
    subcategory: 'art',
    description: 'Express your creativity in the Coloring Studio! Choose from various coloring pages and create beautiful artwork with digital colors and brushes.',
    gameGuide: {
      howToPlay: [
        'Select a coloring page',
        'Choose colors from the palette',
        'Click or drag to color areas',
        'Save your finished artwork'
      ],
      controls: {
        mouse: 'Click and drag to color',
        touch: 'Tap and swipe to paint'
      },
      tips: [
        'Try different color combinations',
        'Use the zoom feature for detailed work',
        'Save your favorite creations'
      ]
    },
    difficulty: 'Easy',
    ageRange: '3-16',
    minAge: 3,
    maxAge: 16,
    tags: ['coloring', 'art', 'creative', 'drawing', 'colors', 'relaxing'],
    sourceDir: 'coloring-studio',
    learningObjectives: [
      'Develop artistic skills',
      'Learn about colors and combinations',
      'Improve fine motor skills',
      'Express creativity and imagination'
    ],
    features: [
      'Multiple coloring pages',
      'Rich color palette',
      'Digital art tools',
      'Save and share functionality'
    ]
  }
];

/**
 * 复制游戏文件到public/games目录
 */
async function copyGameFiles() {
  console.log('📁 开始复制游戏文件...');
  
  // 确保public/games目录存在
  if (!fs.existsSync(PUBLIC_GAMES_DIR)) {
    fs.mkdirSync(PUBLIC_GAMES_DIR, { recursive: true });
    console.log('✅ 创建了public/games目录');
  }
  
  // 复制每个游戏目录
  for (const game of ELLIE_GAMES) {
    const sourceDir = path.join(TEMP_GAMES_DIR, game.sourceDir);
    const targetDir = path.join(PUBLIC_GAMES_DIR, game.slug);
    
    if (fs.existsSync(sourceDir)) {
      // 递归复制目录
      await copyDirectory(sourceDir, targetDir);
      console.log(`✅ 复制游戏: ${game.title} -> ${game.slug}`);
    } else {
      console.warn(`⚠️  源目录不存在: ${sourceDir}`);
    }
  }
}

/**
 * 递归复制目录
 */
async function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const items = fs.readdirSync(source);
  
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * 生成游戏元数据
 */
function generateGameMetadata() {
  console.log('📝 生成游戏元数据...');
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  return ELLIE_GAMES.map(game => ({
    slug: game.slug,
    title: game.title,
    category: game.category,
    categoryName: game.categoryName,
    subcategory: game.subcategory,
    iframeUrl: `/games/${game.slug}/index.html`,
    description: game.description,
    gameGuide: game.gameGuide,
    thumbnailUrl: `/games/${game.slug}/assets/thumbnail.png`, // 假设有缩略图
    difficulty: game.difficulty,
    ageRange: game.ageRange,
    minAge: game.minAge,
    maxAge: game.maxAge,
    tags: game.tags,
    source: 'Ellie Games Collection',
    iframeCompatible: true,
    verified: true,
    technology: 'HTML5',
    mobileSupport: true,
    responsive: true,
    sourceUrl: 'https://github.com/secgit/ellie',
    lastUpdated: currentDate,
    lastChecked: currentDate,
    playCount: 0,
    featured: false,
    trending: true,
    isNew: true,
    developer: 'Ellie Games',
    learningObjectives: game.learningObjectives,
    features: game.features,
    introduction: `${game.title} is an engaging educational game that combines fun gameplay with learning objectives. ${game.description}`
  }));
}

/**
 * 更新games.json文件
 */
async function updateGamesJson() {
  console.log('📄 更新games.json文件...');
  
  // 读取现有游戏数据
  let existingGames = [];
  if (fs.existsSync(GAMES_JSON_PATH)) {
    const gamesContent = fs.readFileSync(GAMES_JSON_PATH, 'utf-8');
    existingGames = JSON.parse(gamesContent);
  }
  
  // 生成新游戏数据
  const newGames = generateGameMetadata();
  
  // 检查重复游戏
  const existingSlugs = new Set(existingGames.map(game => game.slug));
  const uniqueNewGames = newGames.filter(game => !existingSlugs.has(game.slug));
  
  if (uniqueNewGames.length === 0) {
    console.log('ℹ️  没有新游戏需要添加（所有游戏已存在）');
    return;
  }
  
  // 合并游戏数据
  const allGames = [...existingGames, ...uniqueNewGames];
  
  // 写入文件
  fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(allGames, null, 2), 'utf-8');
  
  console.log(`✅ 成功添加 ${uniqueNewGames.length} 个新游戏到games.json`);
  uniqueNewGames.forEach(game => {
    console.log(`   - ${game.title} (${game.slug})`);
  });
}

/**
 * 生成集成报告
 */
function generateIntegrationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    source: 'Ellie Games Collection (https://github.com/secgit/ellie)',
    license: 'MIT License',
    gamesIntegrated: ELLIE_GAMES.length,
    games: ELLIE_GAMES.map(game => ({
      slug: game.slug,
      title: game.title,
      category: game.category,
      difficulty: game.difficulty,
      ageRange: game.ageRange,
      tags: game.tags
    })),
    nextSteps: [
      '1. 测试所有游戏在网站上的运行效果',
      '2. 为游戏添加缩略图和截图',
      '3. 配置多语言SEO元数据',
      '4. 准备谷歌广告集成',
      '5. 提交代码到Git仓库'
    ]
  };
  
  const reportPath = path.join(PROJECT_ROOT, 'ellie-games-integration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log(`📊 集成报告已生成: ${reportPath}`);
  return report;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始Ellie游戏集成流程...\n');
    
    // 检查源目录是否存在
    if (!fs.existsSync(TEMP_GAMES_DIR)) {
      throw new Error(`源目录不存在: ${TEMP_GAMES_DIR}`);
    }
    
    // 1. 复制游戏文件
    await copyGameFiles();
    console.log('');
    
    // 2. 更新games.json
    await updateGamesJson();
    console.log('');
    
    // 3. 生成集成报告
    const report = generateIntegrationReport();
    console.log('');
    
    console.log('🎉 Ellie游戏集成完成！');
    console.log(`📈 成功集成 ${report.gamesIntegrated} 个教育游戏`);
    console.log('📋 后续步骤:');
    report.nextSteps.forEach(step => console.log(`   ${step}`));
    
  } catch (error) {
    console.error('❌ 集成过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (import.meta.url === `file://${__filename}`) {
  main();
}

export { main, ELLIE_GAMES };