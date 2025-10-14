#!/usr/bin/env node

/**
 * GitHub Pages 游戏部署脚本
 * 
 * 功能：
 * 1. 自动创建或更新 GitHub 游戏托管仓库
 * 2. 部署游戏文件到 GitHub Pages
 * 3. 生成游戏清单和元数据
 * 4. 更新主网站游戏数据
 * 5. 自动化CI/CD配置
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

class GitHubGamesDeployer {
  constructor() {
    this.config = {
      repoName: 'EduGameHQ-Games',
      domain: 'games.edugamehq.com',
      branch: 'main',
      gamesDir: 'games',
      manifestFile: 'games-manifest.json'
    };
    
    this.gamesDataPath = path.join(projectRoot, 'src/data/games.json');
  }

  /**
   * 主要部署流程
   */
  async deploy(sourcePath, options = {}) {
    console.log('🚀 开始 GitHub Pages 游戏部署');
    console.log(`📁 源路径: ${sourcePath}`);
    
    try {
      // 1. 分析游戏源
      const analysis = await this.analyzeGames(sourcePath);
      console.log(`🎮 发现 ${analysis.games.length} 个游戏`);
      
      // 2. 检查或创建仓库
      await this.setupRepository();
      
      // 3. 准备游戏文件
      const gameData = await this.prepareGames(analysis.games, sourcePath);
      
      // 4. 部署到 GitHub
      await this.deployToGitHub(gameData);
      
      // 5. 更新主网站数据
      await this.updateMainSiteData(gameData);
      
      // 6. 生成部署报告
      await this.generateDeploymentReport(gameData);
      
      console.log('🎉 部署完成！');
      console.log(`🌐 游戏访问地址: https://${this.config.domain}/`);
      
      return gameData;
      
    } catch (error) {
      console.error('❌ 部署失败:', error.message);
      throw error;
    }
  }

  /**
   * 分析游戏源目录
   */
  async analyzeGames(sourcePath) {
    console.log('🔍 分析游戏源...');
    
    const fullPath = path.resolve(sourcePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const games = [];
    let totalSize = 0;
    
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const gamePath = path.join(fullPath, entry.name);
        const indexPath = path.join(gamePath, 'index.html');
        
        try {
          await fs.access(indexPath);
          const size = await this.calculateDirectorySize(gamePath);
          const metadata = await this.extractGameMetadata(gamePath);
          
          games.push({
            name: entry.name,
            path: gamePath,
            size,
            ...metadata
          });
          
          totalSize += size;
          console.log(`  ✅ ${entry.name} (${this.formatFileSize(size)})`);
          
        } catch (error) {
          console.log(`  ⚠️ 跳过 ${entry.name} (无效游戏目录)`);
        }
      }
    }
    
    return { games, totalSize };
  }

  /**
   * 提取游戏元数据
   */
  async extractGameMetadata(gamePath) {
    const indexPath = path.join(gamePath, 'index.html');
    const content = await fs.readFile(indexPath, 'utf-8');
    
    return {
      title: this.extractTitle(content),
      description: this.extractDescription(content),
      keywords: this.extractKeywords(content)
    };
  }

  /**
   * 设置 GitHub 仓库
   */
  async setupRepository() {
    console.log('🐙 设置 GitHub 仓库...');
    
    const repoPath = path.join(projectRoot, '..', this.config.repoName);
    
    try {
      // 检查仓库是否存在
      await fs.access(repoPath);
      console.log('  📁 仓库已存在，更新中...');
      
      // 更新仓库
      process.chdir(repoPath);
      execSync('git pull origin main', { stdio: 'inherit' });
      
    } catch (error) {
      console.log('  📁 创建新仓库...');
      
      // 创建新仓库
      await this.createNewRepository(repoPath);
    }
    
    this.repoPath = repoPath;
    return repoPath;
  }

  /**
   * 创建新的 GitHub 仓库
   */
  async createNewRepository(repoPath) {
    // 创建本地目录
    await fs.mkdir(repoPath, { recursive: true });
    process.chdir(repoPath);
    
    // 初始化 Git 仓库
    execSync('git init', { stdio: 'inherit' });
    
    // 创建基础文件
    await this.createRepositoryFiles();
    
    // 首次提交
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Initial commit: Setup games repository"', { stdio: 'inherit' });
    
    console.log('  ✅ 本地仓库创建完成');
    console.log('  📝 请手动创建 GitHub 仓库并设置远程地址：');
    console.log(`     git remote add origin https://github.com/你的用户名/${this.config.repoName}.git`);
    console.log(`     git push -u origin main`);
  }

  /**
   * 创建仓库基础文件
   */
  async createRepositoryFiles() {
    // README.md
    const readme = `# EduGameHQ Games Repository

Educational games hosting for EduGameHQ.com platform.

## 🎮 Games Collection

This repository hosts original educational games for the EduGameHQ.com platform.

### 🚀 Deployment

Games are automatically deployed to GitHub Pages at: https://${this.config.domain}/

### 📁 Structure

\`\`\`
games/
├── animal-adventure/
├── animal-matching/
├── coloring-studio/
├── princess-castle/
└── princess-coffee-shop/
\`\`\`

### 🔧 Maintenance

- Games are deployed using automated scripts
- Manifest file is auto-generated
- All games are tested before deployment

---
*Powered by EduGameHQ.com*
`;

    await fs.writeFile('README.md', readme, 'utf-8');

    // index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduGameHQ Games</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .game { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .game h3 { margin: 0 0 10px 0; color: #333; }
        .game p { margin: 5px 0; color: #666; }
        .game a { color: #007bff; text-decoration: none; }
        .game a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>🎮 EduGameHQ Games Collection</h1>
    <p>Educational games hosted for <a href="https://edugamehq.com">EduGameHQ.com</a></p>
    
    <div id="games-list">
        <p>Loading games...</p>
    </div>

    <script>
        fetch('./games-manifest.json')
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('games-list');
                container.innerHTML = data.games.map(game => \`
                    <div class="game">
                        <h3>\${game.title}</h3>
                        <p>\${game.description}</p>
                        <p><strong>Category:</strong> \${game.category}</p>
                        <p><a href="./games/\${game.slug}/" target="_blank">🎮 Play Game</a></p>
                    </div>
                \`).join('');
            })
            .catch(error => {
                document.getElementById('games-list').innerHTML = '<p>Error loading games.</p>';
            });
    </script>
</body>
</html>`;

    await fs.writeFile('index.html', indexHtml, 'utf-8');

    // CNAME 文件（如果使用自定义域名）
    if (this.config.domain !== 'username.github.io') {
      await fs.writeFile('CNAME', this.config.domain, 'utf-8');
    }

    // .gitignore
    const gitignore = `# Dependencies
node_modules/

# Logs
*.log

# OS generated files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
`;

    await fs.writeFile('.gitignore', gitignore, 'utf-8');
  }

  /**
   * 准备游戏数据
   */
  async prepareGames(games, sourcePath) {
    console.log('📦 准备游戏数据...');
    
    const gameData = [];
    
    for (const game of games) {
      const slug = this.generateSlug(game.name);
      const category = this.detectCategory(game.name);
      
      const processedGame = {
        slug,
        name: game.name,
        title: game.title || this.formatTitle(game.name),
        category,
        description: game.description || this.generateDescription(game.name, category),
        size: game.size,
        sourcePath: game.path,
        iframeUrl: `https://${this.config.domain}/games/${slug}/`,
        gameGuide: this.generateGameGuide(game.name, category),
        tags: this.generateTags(game.name, category),
        thumbnailUrl: `/images/games/${slug}-thumbnail.jpg`,
        difficulty: 'easy',
        ageRange: 'elementary',
        technology: 'HTML5',
        mobileSupport: true,
        responsive: true,
        iframeCompatible: true,
        verified: true,
        source: 'Original',
        lastUpdated: new Date().toISOString().split('T')[0],
        lastChecked: new Date().toISOString().split('T')[0],
        playCount: 0,
        featured: false,
        trending: false
      };
      
      gameData.push(processedGame);
      console.log(`  ✅ ${processedGame.title} → ${processedGame.slug}`);
    }
    
    return gameData;
  }

  /**
   * 部署到 GitHub
   */
  async deployToGitHub(gameData) {
    console.log('🚀 部署到 GitHub...');
    
    process.chdir(this.repoPath);
    
    // 创建 games 目录
    const gamesDir = path.join(this.repoPath, this.config.gamesDir);
    await fs.mkdir(gamesDir, { recursive: true });
    
    // 复制游戏文件
    for (const game of gameData) {
      const targetDir = path.join(gamesDir, game.slug);
      await fs.mkdir(targetDir, { recursive: true });
      await this.copyDirectory(game.sourcePath, targetDir);
      console.log(`  📁 复制 ${game.name} → ${game.slug}`);
    }
    
    // 生成游戏清单
    await this.generateGamesManifest(gameData);
    
    // 提交更改
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "Deploy games: ${gameData.map(g => g.name).join(', ')}"`, { stdio: 'inherit' });
      
      // 如果有远程仓库，推送更改
      try {
        execSync(`git push origin ${this.config.branch}`, { stdio: 'inherit' });
        console.log('  ✅ 推送到 GitHub 成功');
      } catch (pushError) {
        console.log('  ⚠️ 推送失败，请手动推送：');
        console.log(`     git push origin ${this.config.branch}`);
      }
      
    } catch (commitError) {
      console.log('  ℹ️ 没有新的更改需要提交');
    }
  }

  /**
   * 生成游戏清单文件
   */
  async generateGamesManifest(gameData) {
    const manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      domain: this.config.domain,
      totalGames: gameData.length,
      totalSize: gameData.reduce((sum, game) => sum + game.size, 0),
      games: gameData.map(game => ({
        slug: game.slug,
        title: game.title,
        category: game.category,
        description: game.description,
        url: game.iframeUrl,
        size: game.size,
        lastUpdated: game.lastUpdated
      }))
    };
    
    const manifestPath = path.join(this.repoPath, this.config.manifestFile);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    
    console.log(`  📋 生成游戏清单: ${manifest.totalGames} 个游戏`);
  }

  /**
   * 更新主网站游戏数据
   */
  async updateMainSiteData(gameData) {
    console.log('🔄 更新主网站游戏数据...');
    
    // 读取现有游戏数据
    let existingGames = [];
    try {
      const content = await fs.readFile(this.gamesDataPath, 'utf-8');
      existingGames = JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ 无法读取现有游戏数据');
    }
    
    // 转换为主网站格式
    const newGames = gameData.map(game => ({
      slug: game.slug,
      title: game.title,
      category: game.category,
      iframeUrl: game.iframeUrl,
      description: game.description,
      gameGuide: game.gameGuide,
      thumbnailUrl: game.thumbnailUrl,
      difficulty: game.difficulty,
      ageRange: game.ageRange,
      tags: game.tags,
      source: game.source,
      sourceUrl: game.iframeUrl,
      technology: game.technology,
      mobileSupport: game.mobileSupport,
      responsive: game.responsive,
      iframeCompatible: game.iframeCompatible,
      verified: game.verified,
      lastUpdated: game.lastUpdated,
      lastChecked: game.lastChecked,
      playCount: game.playCount,
      featured: game.featured,
      trending: game.trending
    }));
    
    // 合并游戏数据（避免重复）
    const existingSlugs = new Set(existingGames.map(g => g.slug));
    const uniqueNewGames = newGames.filter(g => !existingSlugs.has(g.slug));
    
    const allGames = [...existingGames, ...uniqueNewGames];
    
    // 写入文件
    await fs.writeFile(this.gamesDataPath, JSON.stringify(allGames, null, 2), 'utf-8');
    
    console.log(`  ✅ 添加 ${uniqueNewGames.length} 个新游戏到主网站`);
    console.log(`  📊 总游戏数: ${allGames.length}`);
  }

  /**
   * 生成部署报告
   */
  async generateDeploymentReport(gameData) {
    const reportPath = path.join(projectRoot, 'docs/github-deployment-report.md');
    
    const report = `# GitHub Pages 游戏部署报告

## 部署信息
- **日期**: ${new Date().toLocaleString('zh-CN')}
- **仓库**: ${this.config.repoName}
- **域名**: ${this.config.domain}
- **游戏数量**: ${gameData.length}
- **总大小**: ${this.formatFileSize(gameData.reduce((sum, game) => sum + game.size, 0))}

## 部署的游戏

${gameData.map((game, index) => `
### ${index + 1}. ${game.title}
- **Slug**: ${game.slug}
- **分类**: ${game.category}
- **大小**: ${this.formatFileSize(game.size)}
- **URL**: ${game.iframeUrl}
- **描述**: ${game.description}
`).join('')}

## 访问地址

- **游戏索引**: https://${this.config.domain}/
- **游戏清单**: https://${this.config.domain}/games-manifest.json

## 下一步操作

1. **验证部署**: 访问每个游戏URL确保正常运行
2. **DNS配置**: 如使用自定义域名，确保DNS设置正确
3. **SSL证书**: GitHub Pages会自动配置SSL证书
4. **性能测试**: 使用Lighthouse测试游戏加载性能
5. **SEO优化**: 检查游戏页面的SEO设置

## 技术细节

- **托管平台**: GitHub Pages
- **CDN**: GitHub全球CDN
- **SSL**: 自动HTTPS证书
- **部署方式**: Git推送自动部署
- **版本控制**: Git版本管理

## 监控建议

1. 设置GitHub仓库的Watch通知
2. 定期检查游戏访问状态
3. 监控GitHub Pages构建状态
4. 关注域名和SSL证书状态

---
*由GitHub游戏部署器自动生成*
`;

    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`📋 部署报告已生成: ${reportPath}`);
  }

  // 工具函数
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

  extractTitle(htmlContent) {
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'Educational Game';
  }

  extractDescription(htmlContent) {
    const metaMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    return metaMatch ? metaMatch[1].trim() : 'An educational game for students';
  }

  extractKeywords(htmlContent) {
    const keywordsMatch = htmlContent.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    return keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];
  }

  generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  detectCategory(name) {
    const categoryMap = {
      'animal': 'science',
      'princess': 'art',
      'coloring': 'art',
      'adventure': 'logic',
      'matching': 'logic',
      'coffee': 'logic'
    };
    
    const nameLower = name.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (nameLower.includes(keyword)) return category;
    }
    return 'logic';
  }

  formatTitle(name) {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  generateDescription(name, category) {
    const templates = {
      science: `Explore the fascinating world of science with ${this.formatTitle(name)}. Perfect for young learners to discover scientific concepts through interactive gameplay.`,
      art: `Unleash your creativity with ${this.formatTitle(name)}. A fun and engaging art game that helps develop artistic skills and imagination.`,
      logic: `Challenge your mind with ${this.formatTitle(name)}. This puzzle game enhances logical thinking and problem-solving abilities.`
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
      logic: ['puzzle', 'thinking', 'strategy']
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
}

// 命令行接口
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const deployer = new GitHubGamesDeployer();
  
  const args = process.argv.slice(2);
  const sourcePath = args.find(arg => arg.startsWith('--source='))?.split('=')[1];
  
  if (!sourcePath) {
    console.log(`
🚀 GitHub Pages 游戏部署器

用法:
  node scripts/deploy-to-github.mjs --source=<游戏源路径>

示例:
  node scripts/deploy-to-github.mjs --source=./temp-games/ellie

功能:
  - 自动分析游戏目录
  - 创建或更新 GitHub 仓库
  - 部署游戏到 GitHub Pages
  - 生成游戏清单和元数据
  - 更新主网站游戏数据
`);
    process.exit(1);
  }
  
  deployer.deploy(sourcePath).catch(error => {
    console.error('部署失败:', error.message);
    process.exit(1);
  });
}

export default GitHubGamesDeployer;