#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * 添加原创游戏到主网站游戏数据
 * 这个脚本会将GitHub Pages托管的原创游戏添加到主网站的games.json中
 */

// 原创游戏数据配置
const originalGames = [
  {
    slug: "animal-adventure",
    title: "Animal Adventure",
    category: "educational",
    categoryName: "Educational",
    iframeUrl: "https://games.edugamehq.com/games/animal-adventure/",
    description: "Join cute animals on an exciting adventure! Learn about different animals while having fun in this educational game designed for young learners.",
    gameGuide: {
      howToPlay: [
        "Click on animals to learn about them",
        "Follow the adventure story",
        "Complete fun activities with each animal",
        "Discover interesting animal facts"
      ],
      controls: {
        mouse: "Click to interact with animals and objects",
        keyboard: "Use arrow keys to navigate"
      },
      tips: [
        "Take your time to explore each scene",
        "Listen to the animal sounds",
        "Try to remember the animal facts you learn"
      ]
    },
    thumbnailUrl: "https://games.edugamehq.com/games/animal-adventure/elephant.png",
    difficulty: "Easy",
    ageRange: "4-8",
    minAge: 4,
    maxAge: 8,
    tags: ["animals", "educational", "adventure", "learning", "kids"],
    source: "EduGameHQ Original",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://games.edugamehq.com/games/animal-adventure/",
    lastUpdated: new Date().toISOString().split('T')[0],
    lastChecked: new Date().toISOString().split('T')[0],
    playCount: 0,
    featured: true,
    trending: false,
    original: true
  },
  {
    slug: "animal-matching",
    title: "Animal Matching",
    category: "memory",
    categoryName: "Memory",
    iframeUrl: "https://games.edugamehq.com/games/animal-matching/",
    description: "Test your memory skills with this fun animal matching game! Find pairs of identical animals and improve your concentration and memory.",
    gameGuide: {
      howToPlay: [
        "Click on cards to flip them over",
        "Find matching pairs of animals",
        "Remember where each animal is located",
        "Match all pairs to win the game"
      ],
      controls: {
        mouse: "Click on cards to flip them",
        keyboard: "Use tab to navigate between cards"
      },
      tips: [
        "Start by flipping cards in corners",
        "Try to remember the positions of animals",
        "Work systematically across the board"
      ]
    },
    thumbnailUrl: "https://games.edugamehq.com/games/animal-matching/assets/card-back.png",
    difficulty: "Medium",
    ageRange: "5-12",
    minAge: 5,
    maxAge: 12,
    tags: ["memory", "matching", "animals", "concentration", "brain-training"],
    source: "EduGameHQ Original",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://games.edugamehq.com/games/animal-matching/",
    lastUpdated: new Date().toISOString().split('T')[0],
    lastChecked: new Date().toISOString().split('T')[0],
    playCount: 0,
    featured: true,
    trending: false,
    original: true
  },
  {
    slug: "coloring-studio",
    title: "Coloring Studio",
    category: "creative",
    categoryName: "Creative",
    iframeUrl: "https://games.edugamehq.com/games/coloring-studio/",
    description: "Unleash your creativity in this digital coloring studio! Choose from various pictures and color them with a wide palette of colors.",
    gameGuide: {
      howToPlay: [
        "Select a coloring page from the gallery",
        "Choose colors from the palette",
        "Click on areas to fill them with color",
        "Save or share your finished artwork"
      ],
      controls: {
        mouse: "Click to select colors and fill areas",
        keyboard: "Use number keys for quick color selection"
      },
      tips: [
        "Experiment with different color combinations",
        "Use light colors first, then add darker details",
        "Take your time and enjoy the creative process"
      ]
    },
    thumbnailUrl: "https://games.edugamehq.com/games/coloring-studio/preview.png",
    difficulty: "Easy",
    ageRange: "3-12",
    minAge: 3,
    maxAge: 12,
    tags: ["coloring", "creative", "art", "drawing", "relaxing"],
    source: "EduGameHQ Original",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://games.edugamehq.com/games/coloring-studio/",
    lastUpdated: new Date().toISOString().split('T')[0],
    lastChecked: new Date().toISOString().split('T')[0],
    playCount: 0,
    featured: true,
    trending: false,
    original: true
  },
  {
    slug: "princess-castle",
    title: "Princess Castle",
    category: "adventure",
    categoryName: "Adventure",
    iframeUrl: "https://games.edugamehq.com/games/princess-castle/",
    description: "Explore a magical princess castle filled with secrets and adventures! Help the princess complete quests and discover hidden treasures.",
    gameGuide: {
      howToPlay: [
        "Navigate through different rooms of the castle",
        "Complete quests and mini-games",
        "Collect treasures and magical items",
        "Help the princess solve puzzles"
      ],
      controls: {
        mouse: "Click to move and interact with objects",
        keyboard: "Use arrow keys to navigate"
      },
      tips: [
        "Explore every room thoroughly",
        "Talk to all characters you meet",
        "Keep track of items you collect"
      ]
    },
    thumbnailUrl: "https://games.edugamehq.com/games/princess-castle/images/castle.png",
    difficulty: "Medium",
    ageRange: "6-12",
    minAge: 6,
    maxAge: 12,
    tags: ["princess", "castle", "adventure", "fantasy", "exploration"],
    source: "EduGameHQ Original",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://games.edugamehq.com/games/princess-castle/",
    lastUpdated: new Date().toISOString().split('T')[0],
    lastChecked: new Date().toISOString().split('T')[0],
    playCount: 0,
    featured: true,
    trending: false,
    original: true
  },
  {
    slug: "princess-coffee-shop",
    title: "Princess Coffee Shop",
    category: "simulation",
    categoryName: "Simulation",
    iframeUrl: "https://games.edugamehq.com/games/princess-coffee-shop/",
    description: "Help the princess run her magical coffee shop! Serve customers, make delicious drinks, and manage your very own café business.",
    gameGuide: {
      howToPlay: [
        "Take orders from customers",
        "Prepare drinks and snacks",
        "Serve customers quickly for better tips",
        "Upgrade your coffee shop with earnings"
      ],
      controls: {
        mouse: "Click to take orders and prepare items",
        keyboard: "Use number keys for quick item selection"
      },
      tips: [
        "Serve customers quickly to earn more tips",
        "Upgrade equipment to work faster",
        "Keep track of popular items"
      ]
    },
    thumbnailUrl: "https://games.edugamehq.com/games/princess-coffee-shop/assets/shop-preview.png",
    difficulty: "Medium",
    ageRange: "7-14",
    minAge: 7,
    maxAge: 14,
    tags: ["princess", "coffee-shop", "simulation", "business", "time-management"],
    source: "EduGameHQ Original",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://games.edugamehq.com/games/princess-coffee-shop/",
    lastUpdated: new Date().toISOString().split('T')[0],
    lastChecked: new Date().toISOString().split('T')[0],
    playCount: 0,
    featured: true,
    trending: false,
    original: true
  }
];

class OriginalGamesIntegrator {
  constructor() {
    this.gamesFilePath = './src/data/games.json';
    this.backupFilePath = './src/data/games.backup.json';
  }

  /**
   * 读取现有游戏数据
   */
  readExistingGames() {
    try {
      const data = fs.readFileSync(this.gamesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ 读取游戏数据失败:', error.message);
      return [];
    }
  }

  /**
   * 创建备份文件
   */
  createBackup(games) {
    try {
      fs.writeFileSync(this.backupFilePath, JSON.stringify(games, null, 2));
      console.log('✅ 已创建备份文件:', this.backupFilePath);
    } catch (error) {
      console.error('❌ 创建备份失败:', error.message);
    }
  }

  /**
   * 检查游戏是否已存在
   */
  gameExists(games, slug) {
    return games.some(game => game.slug === slug);
  }

  /**
   * 添加原创游戏
   */
  addOriginalGames() {
    console.log('🎮 开始添加原创游戏到主网站...\n');

    // 读取现有游戏数据
    const existingGames = this.readExistingGames();
    console.log(`📊 当前游戏数量: ${existingGames.length}`);

    // 创建备份
    this.createBackup(existingGames);

    // 添加原创游戏
    let addedCount = 0;
    const updatedGames = [...existingGames];

    originalGames.forEach(game => {
      if (!this.gameExists(updatedGames, game.slug)) {
        updatedGames.unshift(game); // 添加到开头，让原创游戏优先显示
        addedCount++;
        console.log(`✅ 已添加: ${game.title} (${game.slug})`);
      } else {
        console.log(`⚠️  已存在: ${game.title} (${game.slug})`);
      }
    });

    // 保存更新后的游戏数据
    try {
      fs.writeFileSync(this.gamesFilePath, JSON.stringify(updatedGames, null, 2));
      console.log(`\n🎉 成功添加 ${addedCount} 个原创游戏!`);
      console.log(`📊 更新后游戏总数: ${updatedGames.length}`);
      console.log(`🔗 游戏将通过 https://games.edugamehq.com 域名访问`);
    } catch (error) {
      console.error('❌ 保存游戏数据失败:', error.message);
    }
  }

  /**
   * 显示添加的游戏信息
   */
  showAddedGames() {
    console.log('\n📋 已添加的原创游戏:');
    originalGames.forEach((game, index) => {
      console.log(`${index + 1}. ${game.title}`);
      console.log(`   - 分类: ${game.categoryName}`);
      console.log(`   - 年龄: ${game.ageRange}`);
      console.log(`   - 难度: ${game.difficulty}`);
      console.log(`   - URL: ${game.iframeUrl}`);
      console.log('');
    });
  }
}

// 主执行逻辑
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const integrator = new OriginalGamesIntegrator();
  
  console.log('🎮 EduGameHQ 原创游戏集成工具');
  console.log('================================\n');
  
  integrator.addOriginalGames();
  integrator.showAddedGames();
  
  console.log('🚀 下一步操作:');
  console.log('1. 创建 GitHub 仓库 EduGameHQ-Games');
  console.log('2. 配置域名 games.edugamehq.com 指向 GitHub Pages');
  console.log('3. 上传 github-games-repo 目录内容到 GitHub');
  console.log('4. 启用 GitHub Pages 功能');
  console.log('5. 测试游戏访问和性能');
}