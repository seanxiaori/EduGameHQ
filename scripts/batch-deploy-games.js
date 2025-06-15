#!/usr/bin/env node

/**
 * EduGameHQ 批量游戏部署脚本
 * 
 * 功能：
 * 1. 从GitHub克隆游戏仓库
 * 2. 自动构建游戏（如果需要）
 * 3. 部署到public/games/目录
 * 4. 生成预览图片
 * 5. 更新games.json数据库
 * 6. 清理临时文件
 * 
 * 使用方法：
 * node scripts/batch-deploy-games.js --config games-to-deploy.json
 * node scripts/batch-deploy-games.js --single "owner/repo" --category math
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import https from 'https';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（ES模块中的__dirname替代）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置常量
const CONFIG = {
  // 项目根目录
  ROOT_DIR: process.cwd(),
  
  // 游戏部署目录
  GAMES_DIR: path.join(process.cwd(), 'public', 'games'),
  
  // 图片目录
  IMAGES_DIR: path.join(process.cwd(), 'public', 'images', 'games'),
  
  // 数据库文件
  GAMES_DB: path.join(process.cwd(), 'src', 'data', 'games.json'),
  
  // 临时目录
  TEMP_DIR: path.join(process.cwd(), 'temp-deploy'),
  
  // 支持的构建工具
  BUILD_TOOLS: ['npm', 'yarn', 'pnpm'],
  
  // 默认年龄范围
  DEFAULT_AGE_RANGES: {
    'math': { min: 8, max: 16, range: '8-16' },
    'science': { min: 10, max: 16, range: '10-16' },
    'coding': { min: 12, max: 18, range: '12-18' },
    'language': { min: 6, max: 14, range: '6-14' },
    'puzzle': { min: 8, max: 16, range: '8-16' },
    'sports': { min: 8, max: 16, range: '8-16' },
    'art': { min: 6, max: 16, range: '6-16' },
    'geography': { min: 10, max: 18, range: '10-18' }
  }
};

// 分类映射
const CATEGORY_NAMES = {
  'math': 'Math',
  'science': 'Science',
  'coding': 'Programming',
  'language': 'Language Arts',
  'puzzle': 'Puzzle',
  'sports': 'Sports',
  'art': 'Art & Creativity',
  'geography': 'Geography & History'
};

/**
 * 日志工具类
 */
class Logger {
  static info(message) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
  }
  
  static success(message) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
  }
  
  static warning(message) {
    console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`);
  }
  
  static error(message) {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  }
  
  static step(step, total, message) {
    console.log(`\x1b[35m[${step}/${total}]\x1b[0m ${message}`);
  }
}

/**
 * 文件系统工具类
 */
class FileUtils {
  // 确保目录存在
  static ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      Logger.info(`创建目录: ${dirPath}`);
    }
  }
  
  // 复制目录
  static copyDir(src, dest) {
    this.ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  // 删除目录
  static removeDir(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      Logger.info(`删除目录: ${dirPath}`);
    }
  }
  
  // 生成slug（URL友好的标识符）
  static generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

/**
 * Git工具类
 */
class GitUtils {
  // 克隆仓库
  static cloneRepo(repoUrl, targetDir) {
    try {
      Logger.info(`克隆仓库: ${repoUrl}`);
      execSync(`git clone ${repoUrl} "${targetDir}"`, { 
        stdio: 'pipe',
        cwd: CONFIG.ROOT_DIR 
      });
      Logger.success(`克隆完成: ${targetDir}`);
      return true;
    } catch (error) {
      Logger.error(`克隆失败: ${error.message}`);
      return false;
    }
  }
  
  // 获取仓库信息
  static getRepoInfo(repoPath) {
    try {
      const packageJsonPath = path.join(repoPath, 'package.json');
      const readmePath = path.join(repoPath, 'README.md');
      
      let info = {
        hasPackageJson: fs.existsSync(packageJsonPath),
        hasReadme: fs.existsSync(readmePath),
        buildTool: null,
        buildScript: null,
        title: null,
        description: null
      };
      
      // 读取package.json信息
      if (info.hasPackageJson) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        info.title = packageJson.name;
        info.description = packageJson.description;
        
        // 检测构建脚本
        if (packageJson.scripts) {
          if (packageJson.scripts.build) {
            info.buildScript = 'build';
          } else if (packageJson.scripts.dist) {
            info.buildScript = 'dist';
          }
        }
        
        // 检测包管理器
        if (fs.existsSync(path.join(repoPath, 'yarn.lock'))) {
          info.buildTool = 'yarn';
        } else if (fs.existsSync(path.join(repoPath, 'pnpm-lock.yaml'))) {
          info.buildTool = 'pnpm';
        } else {
          info.buildTool = 'npm';
        }
      }
      
      // 读取README信息
      if (info.hasReadme && !info.title) {
        const readme = fs.readFileSync(readmePath, 'utf8');
        const titleMatch = readme.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          info.title = titleMatch[1].trim();
        }
      }
      
      return info;
    } catch (error) {
      Logger.error(`获取仓库信息失败: ${error.message}`);
      return null;
    }
  }
}

/**
 * 构建工具类
 */
class BuildUtils {
  // 构建项目
  static buildProject(projectPath, buildTool, buildScript) {
    try {
      Logger.info(`开始构建项目: ${projectPath}`);
      
      // 安装依赖
      Logger.info(`安装依赖 (${buildTool})...`);
      execSync(`${buildTool} install`, {
        cwd: projectPath,
        stdio: 'pipe'
      });
      
      // 执行构建
      if (buildScript) {
        Logger.info(`执行构建脚本: ${buildScript}`);
        execSync(`${buildTool} run ${buildScript}`, {
          cwd: projectPath,
          stdio: 'pipe'
        });
      }
      
      Logger.success('构建完成');
      return true;
    } catch (error) {
      Logger.error(`构建失败: ${error.message}`);
      return false;
    }
  }
  
  // 查找构建输出目录
  static findBuildOutput(projectPath) {
    const possibleDirs = ['dist', 'build', 'public', 'out', 'docs'];
    
    for (const dir of possibleDirs) {
      const fullPath = path.join(projectPath, dir);
      if (fs.existsSync(fullPath)) {
        const indexPath = path.join(fullPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          Logger.info(`找到构建输出: ${fullPath}`);
          return fullPath;
        }
      }
    }
    
    // 如果没找到构建输出，检查根目录是否有index.html
    const rootIndexPath = path.join(projectPath, 'index.html');
    if (fs.existsSync(rootIndexPath)) {
      Logger.info('使用根目录作为输出');
      return projectPath;
    }
    
    Logger.warning('未找到有效的构建输出目录');
    return null;
  }
}

/**
 * 图片工具类
 */
class ImageUtils {
  // 生成SVG占位符图片
  static generatePlaceholderSVG(title, category) {
    const colors = {
      'math': '#3B82F6',
      'science': '#10B981', 
      'coding': '#8B5CF6',
      'language': '#F59E0B',
      'puzzle': '#EF4444',
      'sports': '#06B6D4',
      'art': '#EC4899',
      'geography': '#84CC16'
    };
    
    const color = colors[category] || '#6B7280';
    
    return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="${color}"/>
      <text x="200" y="150" font-family="Arial, sans-serif" font-size="24" 
            fill="white" text-anchor="middle" dominant-baseline="middle">
        ${title}
      </text>
      <text x="200" y="180" font-family="Arial, sans-serif" font-size="16" 
            fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
        ${CATEGORY_NAMES[category] || 'Game'}
      </text>
    </svg>`;
  }
  
  // 创建游戏预览图片
  static createGameImage(slug, title, category) {
    const categoryDir = path.join(CONFIG.IMAGES_DIR, category);
    FileUtils.ensureDir(categoryDir);
    
    // 生成SVG占位符
    const svgContent = this.generatePlaceholderSVG(title, category);
    const svgPath = path.join(categoryDir, `${slug}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    
    // 创建JPG备用图片（简单的文本文件，实际项目中可以用图片转换工具）
    const jpgPath = path.join(categoryDir, `${slug}.jpg`);
    fs.writeFileSync(jpgPath, svgContent); // 临时方案
    
    Logger.success(`创建预览图片: ${slug}.svg, ${slug}.jpg`);
    
    return {
      image: `/images/games/${category}/${slug}.svg`,
      imageFallback: `/images/games/${category}/${slug}.jpg`
    };
  }
}

/**
 * 数据库工具类
 */
class DatabaseUtils {
  // 读取游戏数据库
  static readGamesDB() {
    try {
      if (fs.existsSync(CONFIG.GAMES_DB)) {
        const content = fs.readFileSync(CONFIG.GAMES_DB, 'utf8');
        return JSON.parse(content);
      }
      return [];
    } catch (error) {
      Logger.error(`读取数据库失败: ${error.message}`);
      return [];
    }
  }
  
  // 写入游戏数据库
  static writeGamesDB(games) {
    try {
      const content = JSON.stringify(games, null, 2);
      fs.writeFileSync(CONFIG.GAMES_DB, content, 'utf8');
      Logger.success('数据库更新成功');
      return true;
    } catch (error) {
      Logger.error(`写入数据库失败: ${error.message}`);
      return false;
    }
  }
  
  // 添加游戏到数据库
  static addGameToDB(gameData) {
    const games = this.readGamesDB();
    
    // 检查是否已存在
    const existingIndex = games.findIndex(game => game.slug === gameData.slug);
    
    if (existingIndex >= 0) {
      // 更新现有游戏
      games[existingIndex] = { ...games[existingIndex], ...gameData };
      Logger.info(`更新现有游戏: ${gameData.slug}`);
    } else {
      // 添加新游戏
      games.push(gameData);
      Logger.info(`添加新游戏: ${gameData.slug}`);
    }
    
    return this.writeGamesDB(games);
  }
}

/**
 * 游戏部署器类
 */
class GameDeployer {
  constructor() {
    this.deployedGames = [];
    this.failedGames = [];
  }
  
  // 部署单个游戏
  async deploySingleGame(repoUrl, category, customConfig = {}) {
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const tempDir = path.join(CONFIG.TEMP_DIR, repoName);
    
    try {
      Logger.step(1, 6, `开始部署游戏: ${repoUrl}`);
      
      // 1. 克隆仓库
      FileUtils.ensureDir(CONFIG.TEMP_DIR);
      if (!GitUtils.cloneRepo(repoUrl, tempDir)) {
        throw new Error('克隆仓库失败');
      }
      
      // 2. 获取仓库信息
      Logger.step(2, 6, '分析项目结构...');
      const repoInfo = GitUtils.getRepoInfo(tempDir);
      if (!repoInfo) {
        throw new Error('无法获取仓库信息');
      }
      
      // 3. 构建项目（如果需要）
      let buildOutputDir = tempDir;
      if (repoInfo.hasPackageJson && repoInfo.buildScript) {
        Logger.step(3, 6, '构建项目...');
        if (BuildUtils.buildProject(tempDir, repoInfo.buildTool, repoInfo.buildScript)) {
          buildOutputDir = BuildUtils.findBuildOutput(tempDir) || tempDir;
        }
      } else {
        Logger.step(3, 6, '跳过构建（无需构建）');
        buildOutputDir = BuildUtils.findBuildOutput(tempDir) || tempDir;
      }
      
      // 4. 生成游戏数据
      Logger.step(4, 6, '生成游戏数据...');
      const gameData = this.generateGameData(repoInfo, category, customConfig);
      
      // 5. 部署游戏文件
      Logger.step(5, 6, '部署游戏文件...');
      const gameDir = path.join(CONFIG.GAMES_DIR, gameData.slug);
      FileUtils.ensureDir(gameDir);
      FileUtils.copyDir(buildOutputDir, gameDir);
      
      // 6. 创建预览图片和更新数据库
      Logger.step(6, 6, '更新数据库...');
      const imageData = ImageUtils.createGameImage(gameData.slug, gameData.title, category);
      gameData.image = imageData.image;
      gameData.imageFallback = imageData.imageFallback;
      
      DatabaseUtils.addGameToDB(gameData);
      
      // 清理临时文件
      FileUtils.removeDir(tempDir);
      
      this.deployedGames.push(gameData);
      Logger.success(`✅ 游戏部署成功: ${gameData.title} (${gameData.slug})`);
      
      return gameData;
      
    } catch (error) {
      Logger.error(`❌ 游戏部署失败: ${repoUrl} - ${error.message}`);
      this.failedGames.push({ repoUrl, error: error.message });
      
      // 清理临时文件
      FileUtils.removeDir(tempDir);
      
      return null;
    }
  }
  
  // 生成游戏数据
  generateGameData(repoInfo, category, customConfig) {
    const title = customConfig.title || repoInfo.title || 'Untitled Game';
    const slug = customConfig.slug || FileUtils.generateSlug(title);
    const ageRange = CONFIG.DEFAULT_AGE_RANGES[category] || CONFIG.DEFAULT_AGE_RANGES['puzzle'];
    
    return {
      slug,
      title,
      category,
      categoryName: CATEGORY_NAMES[category] || 'Game',
      url: `/games/${slug}/index.html`,
      description: customConfig.description || repoInfo.description || `Play ${title} - An educational ${category} game.`,
      difficulty: customConfig.difficulty || 'Medium',
      ageRange: ageRange.range,
      minAge: ageRange.min,
      maxAge: ageRange.max,
      playCount: 0,
      tags: customConfig.tags || [category, 'educational', 'free'],
      featured: customConfig.featured || false,
      trending: customConfig.trending || true,
      isNew: true,
      developer: customConfig.developer || 'Open Source',
      source: 'GitHub',
      type: 'Free',
      // 预留图片字段，稍后填充
      image: '',
      imageFallback: ''
    };
  }
  
  // 批量部署游戏
  async deployBatch(gamesList) {
    Logger.info(`开始批量部署 ${gamesList.length} 个游戏...`);
    
    for (let i = 0; i < gamesList.length; i++) {
      const game = gamesList[i];
      Logger.info(`\n=== 部署进度: ${i + 1}/${gamesList.length} ===`);
      
      await this.deploySingleGame(game.repoUrl, game.category, game.config || {});
      
      // 添加延迟，避免过快的请求
      if (i < gamesList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    this.printSummary();
  }
  
  // 打印部署摘要
  printSummary() {
    Logger.info('\n=== 部署摘要 ===');
    Logger.success(`✅ 成功部署: ${this.deployedGames.length} 个游戏`);
    
    if (this.deployedGames.length > 0) {
      console.log('\n成功部署的游戏:');
      this.deployedGames.forEach(game => {
        console.log(`  - ${game.title} (${game.slug}) - ${game.categoryName}`);
      });
    }
    
    if (this.failedGames.length > 0) {
      Logger.error(`❌ 部署失败: ${this.failedGames.length} 个游戏`);
      console.log('\n失败的游戏:');
      this.failedGames.forEach(game => {
        console.log(`  - ${game.repoUrl}: ${game.error}`);
      });
    }
  }
}

/**
 * 主程序
 */
async function main() {
  const args = process.argv.slice(2);
  
  // 解析命令行参数
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
EduGameHQ 批量游戏部署脚本

使用方法:
  node scripts/batch-deploy-games.js --config <配置文件>
  node scripts/batch-deploy-games.js --single <仓库URL> --category <分类>

参数:
  --config <file>     指定游戏配置文件 (JSON格式)
  --single <url>      部署单个游戏仓库
  --category <cat>    游戏分类 (math/science/coding/language/puzzle/sports/art/geography)
  --help, -h          显示帮助信息

示例:
  node scripts/batch-deploy-games.js --config games-to-deploy.json
  node scripts/batch-deploy-games.js --single "https://github.com/user/game.git" --category math
    `);
    return;
  }
  
  const deployer = new GameDeployer();
  
  // 单个游戏部署
  if (args.includes('--single')) {
    const repoIndex = args.indexOf('--single') + 1;
    const categoryIndex = args.indexOf('--category') + 1;
    
    if (repoIndex >= args.length || categoryIndex >= args.length) {
      Logger.error('请提供仓库URL和分类');
      return;
    }
    
    const repoUrl = args[repoIndex];
    const category = args[categoryIndex];
    
    if (!CATEGORY_NAMES[category]) {
      Logger.error(`无效的分类: ${category}`);
      Logger.info(`支持的分类: ${Object.keys(CATEGORY_NAMES).join(', ')}`);
      return;
    }
    
    await deployer.deploySingleGame(repoUrl, category);
    return;
  }
  
  // 批量部署
  if (args.includes('--config')) {
    const configIndex = args.indexOf('--config') + 1;
    
    if (configIndex >= args.length) {
      Logger.error('请提供配置文件路径');
      return;
    }
    
    const configFile = args[configIndex];
    
    if (!fs.existsSync(configFile)) {
      Logger.error(`配置文件不存在: ${configFile}`);
      return;
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      await deployer.deployBatch(config.games || []);
    } catch (error) {
      Logger.error(`读取配置文件失败: ${error.message}`);
    }
    
    return;
  }
  
  // 默认行为：显示帮助
  Logger.error('请提供有效的参数，使用 --help 查看帮助');
}

// 运行主程序
main().catch(error => {
  Logger.error(`程序执行失败: ${error.message}`);
  process.exit(1);
});

export {
  GameDeployer,
  Logger,
  FileUtils,
  GitUtils,
  BuildUtils,
  ImageUtils,
  DatabaseUtils
}; 