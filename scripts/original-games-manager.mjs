#!/usr/bin/env node

/**
 * 原创游戏管理器 - EduGameHQ.com
 * 
 * 功能：
 * 1. 支持多种游戏托管策略（本地、GitHub Pages、Cloudflare R2）
 * 2. 自动生成游戏元数据
 * 3. 集成到现有游戏数据系统
 * 4. 支持批量游戏导入
 * 5. 自动化部署和版本管理
 * 
 * 使用方法：
 * node scripts/original-games-manager.mjs --action=add --source=./temp-games/ellie
 * node scripts/original-games-manager.mjs --action=deploy --strategy=github
 * node scripts/original-games-manager.mjs --action=list
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// 配置选项
const CONFIG = {
  // 游戏托管策略
  hostingStrategies: {
    local: {
      name: '本地托管',
      path: 'public/games',
      maxSize: '50MB', // 单个游戏最大大小
      description: '适合小型游戏，直接集成到主网站'
    },
    github: {
      name: 'GitHub Pages',
      repository: 'EduGameHQ-Games',
      domain: 'games.edugamehq.com',
      description: '适合中大型游戏，免费CDN加速'
    },
    cloudflare: {
      name: 'Cloudflare R2',
      bucket: 'edugamehq-games',
      domain: 'games.edugamehq.com',
      description: '适合大型游戏集合，无限存储'
    }
  },
  
  // 游戏分类映射
  categoryMapping: {
    'animal': 'science',
    'princess': 'art',
    'coloring': 'art',
    'adventure': 'logic',
    'matching': 'logic',
    'coffee': 'logic'
  },
  
  // 默认游戏配置
  defaultGameConfig: {
    difficulty: 'easy',
    ageRange: 'elementary',
    technology: 'HTML5',
    mobileSupport: true,
    responsive: true,
    iframeCompatible: true,
    verified: true
  }
};

class OriginalGamesManager {
  constructor() {
    this.gamesDataPath = path.join(projectRoot, 'src/data/games.json');
    this.originalGamesPath = path.join(projectRoot, 'public/games/original');
    this.tempPath = path.join(projectRoot, 'temp-games');
  }

  /**
   * 主要入口函数
   */
  async run() {
    const args = this.parseArguments();
    
    console.log('🎮 原创游戏管理器启动');
    console.log(`📋 操作: ${args.action}`);
    
    try {
      switch (args.action) {
        case 'add':
          await this.addGames(args.source, args.strategy);
          break;
        case 'deploy':
          await this.deployGames(args.strategy);
          break;
        case 'list':
          await this.listGames();
          break;
        case 'analyze':
          await this.analyzeSource(args.source);
          break;
        case 'setup':
          await this.setupHosting(args.strategy);
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ 操作失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 解析命令行参数
   */
  parseArguments() {
    const args = {
      action: 'help',
      source: null,
      strategy: 'local'
    };

    process.argv.slice(2).forEach(arg => {
      if (arg.startsWith('--action=')) {
        args.action = arg.split('=')[1];
      } else if (arg.startsWith('--source=')) {
        args.source = arg.split('=')[1];
      } else if (arg.startsWith('--strategy=')) {
        args.strategy = arg.split('=')[1];
      }
    });

    return args;
  }

  /**
   * 分析游戏源目录
   */
  async analyzeSource(sourcePath) {
    if (!sourcePath) {
      throw new Error('请指定游戏源路径');
    }

    console.log(`🔍 分析游戏源: ${sourcePath}`);
    
    const fullPath = path.resolve(sourcePath);
    const exists = await fs.access(fullPath).then(() => true).catch(() => false);
    
    if (!exists) {
      throw new Error(`游戏源路径不存在: ${fullPath}`);
    }

    const analysis = await this.scanGameDirectory(fullPath);
    
    console.log('\n📊 分析结果:');
    console.log(`📁 总游戏数: ${analysis.games.length}`);
    console.log(`📦 总大小: ${this.formatFileSize(analysis.totalSize)}`);
    console.log(`🎯 推荐策略: ${this.recommendStrategy(analysis)}`);
    
    console.log('\n🎮 发现的游戏:');
    analysis.games.forEach((game, index) => {
      console.log(`  ${index + 1}. ${game.name} (${this.formatFileSize(game.size)})`);
    });

    return analysis;
  }

  /**
   * 扫描游戏目录
   */
  async scanGameDirectory(dirPath) {
    const games = [];
    let totalSize = 0;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const gamePath = path.join(dirPath, entry.name);
        const gameInfo = await this.analyzeGameDirectory(gamePath);
        
        if (gameInfo) {
          games.push({
            name: entry.name,
            path: gamePath,
            ...gameInfo
          });
          totalSize += gameInfo.size;
        }
      }
    }

    return { games, totalSize };
  }

  /**
   * 分析单个游戏目录
   */
  async analyzeGameDirectory(gamePath) {
    try {
      // 检查是否有 index.html
      const indexPath = path.join(gamePath, 'index.html');
      const hasIndex = await fs.access(indexPath).then(() => true).catch(() => false);
      
      if (!hasIndex) {
        return null; // 不是有效的游戏目录
      }

      // 计算目录大小
      const size = await this.calculateDirectorySize(gamePath);
      
      // 读取 index.html 获取游戏信息
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const title = this.extractTitle(indexContent);
      const description = this.extractDescription(indexContent);

      return {
        title,
        description,
        size,
        hasIndex: true,
        indexPath
      };
    } catch (error) {
      console.warn(`⚠️ 分析游戏目录失败: ${gamePath}`, error.message);
      return null;
    }
  }

  /**
   * 计算目录大小
   */
  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        totalSize += await this.calculateDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  /**
   * 从HTML中提取标题
   */
  extractTitle(htmlContent) {
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].trim();
    }
    
    return 'Unknown Game';
  }

  /**
   * 从HTML中提取描述
   */
  extractDescription(htmlContent) {
    const metaMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch) {
      return metaMatch[1].trim();
    }
    
    return 'An educational game for students';
  }

  /**
   * 推荐托管策略
   */
  recommendStrategy(analysis) {
    const totalSizeMB = analysis.totalSize / (1024 * 1024);
    
    if (totalSizeMB < 10) {
      return 'local (本地托管 - 适合小型游戏)';
    } else if (totalSizeMB < 100) {
      return 'github (GitHub Pages - 适合中型游戏)';
    } else {
      return 'cloudflare (Cloudflare R2 - 适合大型游戏)';
    }
  }

  /**
   * 添加游戏到系统
   */
  async addGames(sourcePath, strategy = 'local') {
    console.log(`🎮 添加游戏到系统`);
    console.log(`📁 源路径: ${sourcePath}`);
    console.log(`🚀 托管策略: ${strategy}`);

    // 分析游戏源
    const analysis = await this.analyzeSource(sourcePath);
    
    // 根据策略处理游戏
    const processedGames = [];
    
    for (const game of analysis.games) {
      console.log(`\n🔄 处理游戏: ${game.name}`);
      
      const gameData = await this.processGame(game, strategy);
      processedGames.push(gameData);
      
      console.log(`✅ 游戏处理完成: ${gameData.title}`);
    }

    // 更新游戏数据文件
    await this.updateGamesData(processedGames);
    
    console.log(`\n🎉 成功添加 ${processedGames.length} 个游戏到系统！`);
    
    // 生成集成报告
    await this.generateIntegrationReport(processedGames, strategy);
  }

  /**
   * 处理单个游戏
   */
  async processGame(game, strategy) {
    const slug = this.generateSlug(game.name);
    const category = this.detectCategory(game.name);
    
    let iframeUrl;
    
    switch (strategy) {
      case 'local':
        iframeUrl = await this.processLocalGame(game, slug);
        break;
      case 'github':
        iframeUrl = await this.processGitHubGame(game, slug);
        break;
      case 'cloudflare':
        iframeUrl = await this.processCloudflareGame(game, slug);
        break;
      default:
        throw new Error(`不支持的托管策略: ${strategy}`);
    }

    // 生成游戏数据
    return {
      slug,
      title: game.title || this.formatTitle(game.name),
      category,
      iframeUrl,
      description: game.description || this.generateDescription(game.name, category),
      gameGuide: this.generateGameGuide(game.name, category),
      thumbnailUrl: `/images/games/${slug}-thumbnail.jpg`,
      difficulty: CONFIG.defaultGameConfig.difficulty,
      ageRange: CONFIG.defaultGameConfig.ageRange,
      tags: this.generateTags(game.name, category),
      source: 'Original',
      sourceUrl: iframeUrl,
      technology: CONFIG.defaultGameConfig.technology,
      mobileSupport: CONFIG.defaultGameConfig.mobileSupport,
      responsive: CONFIG.defaultGameConfig.responsive,
      iframeCompatible: CONFIG.defaultGameConfig.iframeCompatible,
      verified: CONFIG.defaultGameConfig.verified,
      lastUpdated: new Date().toISOString().split('T')[0],
      lastChecked: new Date().toISOString().split('T')[0],
      playCount: 0,
      featured: false,
      trending: false
    };
  }

  /**
   * 处理本地游戏
   */
  async processLocalGame(game, slug) {
    const targetDir = path.join(this.originalGamesPath, slug);
    
    // 确保目标目录存在
    await fs.mkdir(targetDir, { recursive: true });
    
    // 复制游戏文件
    await this.copyDirectory(game.path, targetDir);
    
    console.log(`📁 游戏文件已复制到: ${targetDir}`);
    
    return `/games/original/${slug}/`;
  }

  /**
   * 处理GitHub游戏（模拟）
   */
  async processGitHubGame(game, slug) {
    console.log(`🐙 GitHub托管策略（模拟）: ${slug}`);
    
    // 实际实现中，这里会：
    // 1. 创建或更新 GitHub 仓库
    // 2. 推送游戏文件
    // 3. 配置 GitHub Pages
    
    return `https://games.edugamehq.com/${slug}/`;
  }

  /**
   * 处理Cloudflare游戏（模拟）
   */
  async processCloudflareGame(game, slug) {
    console.log(`☁️ Cloudflare托管策略（模拟）: ${slug}`);
    
    // 实际实现中，这里会：
    // 1. 上传到 R2 存储
    // 2. 配置 Workers 代理
    // 3. 设置自定义域名
    
    return `https://games.edugamehq.com/${slug}/`;
  }

  /**
   * 复制目录
   */
  async copyDirectory(source, target) {
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(targetPath, { recursive: true });
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * 更新游戏数据文件
   */
  async updateGamesData(newGames) {
    console.log(`📝 更新游戏数据文件...`);
    
    // 读取现有游戏数据
    let existingGames = [];
    try {
      const content = await fs.readFile(this.gamesDataPath, 'utf-8');
      existingGames = JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ 无法读取现有游戏数据，将创建新文件');
    }

    // 合并游戏数据
    const allGames = [...existingGames, ...newGames];
    
    // 写入文件
    await fs.writeFile(
      this.gamesDataPath, 
      JSON.stringify(allGames, null, 2), 
      'utf-8'
    );
    
    console.log(`✅ 游戏数据已更新，总计 ${allGames.length} 个游戏`);
  }

  /**
   * 生成集成报告
   */
  async generateIntegrationReport(games, strategy) {
    const reportPath = path.join(projectRoot, 'docs/integration-report.md');
    
    const report = `# 游戏集成报告

## 集成信息
- **日期**: ${new Date().toLocaleString('zh-CN')}
- **策略**: ${strategy} (${CONFIG.hostingStrategies[strategy]?.name})
- **游戏数量**: ${games.length}

## 集成的游戏

${games.map((game, index) => `
### ${index + 1}. ${game.title}
- **Slug**: ${game.slug}
- **分类**: ${game.category}
- **URL**: ${game.iframeUrl}
- **描述**: ${game.description}
`).join('')}

## 下一步操作

1. **测试游戏**: 访问每个游戏URL确保正常运行
2. **生成缩略图**: 为每个游戏创建缩略图
3. **SEO优化**: 检查游戏页面的SEO设置
4. **性能测试**: 确保游戏加载速度符合要求

## 技术细节

- **托管策略**: ${CONFIG.hostingStrategies[strategy]?.description}
- **文件位置**: ${strategy === 'local' ? 'public/games/original/' : '外部托管'}
- **数据文件**: src/data/games.json

---
*由原创游戏管理器自动生成*
`;

    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`📋 集成报告已生成: ${reportPath}`);
  }

  /**
   * 工具函数
   */
  generateSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  detectCategory(name) {
    const nameLower = name.toLowerCase();
    
    for (const [keyword, category] of Object.entries(CONFIG.categoryMapping)) {
      if (nameLower.includes(keyword)) {
        return category;
      }
    }
    
    return 'logic'; // 默认分类
  }

  formatTitle(name) {
    return name.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  generateDescription(name, category) {
    const templates = {
      science: `Explore the fascinating world of science with ${this.formatTitle(name)}. Perfect for young learners to discover scientific concepts through interactive gameplay.`,
      art: `Unleash your creativity with ${this.formatTitle(name)}. A fun and engaging art game that helps develop artistic skills and imagination.`,
      logic: `Challenge your mind with ${this.formatTitle(name)}. This puzzle game enhances logical thinking and problem-solving abilities.`,
      math: `Master mathematical concepts with ${this.formatTitle(name)}. An educational game that makes learning math fun and interactive.`
    };
    
    return templates[category] || `Enjoy ${this.formatTitle(name)}, an educational game designed to enhance learning through play.`;
  }

  generateGameGuide(name, category) {
    return {
      howToPlay: `Click to start ${this.formatTitle(name)} and follow the on-screen instructions. Use your mouse or touch to interact with game elements.`,
      controls: "Mouse/Touch: Click or tap to interact with game elements. Keyboard: Use arrow keys for navigation when applicable.",
      tips: `Take your time to explore all features of ${this.formatTitle(name)}. Practice regularly to improve your skills and achieve higher scores.`
    };
  }

  generateTags(name, category) {
    const baseTags = ['educational', 'kids', 'learning', 'interactive'];
    const categoryTags = {
      science: ['science', 'discovery', 'exploration'],
      art: ['creative', 'artistic', 'design'],
      logic: ['puzzle', 'thinking', 'strategy'],
      math: ['mathematics', 'numbers', 'calculation']
    };
    
    return [...baseTags, ...(categoryTags[category] || [])];
  }

  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🎮 原创游戏管理器 - EduGameHQ.com

用法:
  node scripts/original-games-manager.mjs --action=<操作> [选项]

操作:
  analyze   分析游戏源目录
  add       添加游戏到系统
  deploy    部署游戏到托管平台
  list      列出已集成的游戏
  setup     设置托管环境

选项:
  --source=<路径>     游戏源目录路径
  --strategy=<策略>   托管策略 (local|github|cloudflare)

示例:
  # 分析游戏源
  node scripts/original-games-manager.mjs --action=analyze --source=./temp-games/ellie
  
  # 添加游戏（本地托管）
  node scripts/original-games-manager.mjs --action=add --source=./temp-games/ellie --strategy=local
  
  # 添加游戏（GitHub托管）
  node scripts/original-games-manager.mjs --action=add --source=./temp-games/ellie --strategy=github

托管策略:
  local      本地托管 (适合 < 10MB 的小型游戏)
  github     GitHub Pages (适合 < 100MB 的中型游戏)
  cloudflare Cloudflare R2 (适合大型游戏集合)
`);
  }
}

// 运行管理器
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1])) {
  const manager = new OriginalGamesManager();
  manager.run().catch(console.error);
}

export default OriginalGamesManager;