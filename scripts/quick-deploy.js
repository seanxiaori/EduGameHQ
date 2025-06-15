#!/usr/bin/env node

/**
 * EduGameHQ 快速游戏部署脚本
 * 
 * 简化版本，专门用于快速部署单个游戏
 * 
 * 使用方法：
 * node scripts/quick-deploy.js <GitHub仓库URL> <分类>
 * 
 * 示例：
 * node scripts/quick-deploy.js https://github.com/user/game.git math
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 简化配置
const CATEGORIES = {
  'math': 'Math',
  'science': 'Science',
  'coding': 'Programming',
  'language': 'Language Arts',
  'puzzle': 'Puzzle',
  'sports': 'Sports',
  'art': 'Art & Creativity',
  'geography': 'Geography & History'
};

const AGE_RANGES = {
  'math': { min: 8, max: 16, range: '8-16' },
  'science': { min: 10, max: 16, range: '10-16' },
  'coding': { min: 12, max: 18, range: '12-18' },
  'language': { min: 6, max: 14, range: '6-14' },
  'puzzle': { min: 8, max: 16, range: '8-16' },
  'sports': { min: 8, max: 16, range: '8-16' },
  'art': { min: 6, max: 16, range: '6-16' },
  'geography': { min: 10, max: 18, range: '10-18' }
};

// 彩色日志
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    step: '\x1b[35m'
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]\x1b[0m ${message}`);
}

// 生成slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 复制目录
function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 删除目录
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// 生成SVG图片
function generateSVG(title, category) {
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
      ${CATEGORIES[category] || 'Game'}
    </text>
  </svg>`;
}

// 主要部署函数
async function deployGame(repoUrl, category) {
  const repoName = repoUrl.split('/').pop().replace('.git', '');
  const tempDir = path.join(process.cwd(), 'temp-deploy', repoName);
  
  try {
    log(`开始部署游戏: ${repoUrl}`, 'step');
    
    // 1. 克隆仓库
    log('1/6 克隆仓库...', 'step');
    ensureDir(path.dirname(tempDir));
    execSync(`git clone ${repoUrl} "${tempDir}"`, { stdio: 'pipe' });
    log('克隆完成', 'success');
    
    // 2. 分析项目
    log('2/6 分析项目结构...', 'step');
    const packageJsonPath = path.join(tempDir, 'package.json');
    const readmePath = path.join(tempDir, 'README.md');
    
    let title = repoName;
    let description = `Play ${title} - An educational ${category} game.`;
    
    // 读取项目信息
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      title = packageJson.name || title;
      description = packageJson.description || description;
    }
    
    if (fs.existsSync(readmePath)) {
      const readme = fs.readFileSync(readmePath, 'utf8');
      const titleMatch = readme.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    const slug = generateSlug(title);
    log(`游戏标题: ${title}`, 'info');
    log(`游戏slug: ${slug}`, 'info');
    
    // 3. 构建项目（如果需要）
    log('3/6 检查是否需要构建...', 'step');
    let buildOutputDir = tempDir;
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts.build) {
        log('发现构建脚本，开始构建...', 'info');
        try {
          execSync('npm install', { cwd: tempDir, stdio: 'pipe' });
          execSync('npm run build', { cwd: tempDir, stdio: 'pipe' });
          
          // 查找构建输出
          const possibleDirs = ['dist', 'build', 'public', 'out'];
          for (const dir of possibleDirs) {
            const fullPath = path.join(tempDir, dir);
            if (fs.existsSync(fullPath) && fs.existsSync(path.join(fullPath, 'index.html'))) {
              buildOutputDir = fullPath;
              break;
            }
          }
          log('构建完成', 'success');
        } catch (error) {
          log('构建失败，使用原始文件', 'warning');
        }
      }
    }
    
    // 检查是否有index.html
    if (!fs.existsSync(path.join(buildOutputDir, 'index.html'))) {
      throw new Error('未找到index.html文件');
    }
    
    // 4. 部署游戏文件
    log('4/6 部署游戏文件...', 'step');
    const gameDir = path.join(process.cwd(), 'public', 'games', slug);
    ensureDir(gameDir);
    copyDir(buildOutputDir, gameDir);
    log(`游戏文件已部署到: ${gameDir}`, 'success');
    
    // 5. 创建预览图片
    log('5/6 创建预览图片...', 'step');
    const categoryDir = path.join(process.cwd(), 'public', 'images', 'games', category);
    ensureDir(categoryDir);
    
    const svgContent = generateSVG(title, category);
    fs.writeFileSync(path.join(categoryDir, `${slug}.svg`), svgContent);
    fs.writeFileSync(path.join(categoryDir, `${slug}.jpg`), svgContent); // 临时方案
    log('预览图片已创建', 'success');
    
    // 6. 更新数据库
    log('6/6 更新游戏数据库...', 'step');
    const gamesDbPath = path.join(process.cwd(), 'src', 'data', 'games.json');
    let games = [];
    
    if (fs.existsSync(gamesDbPath)) {
      games = JSON.parse(fs.readFileSync(gamesDbPath, 'utf8'));
    }
    
    const ageRange = AGE_RANGES[category] || AGE_RANGES['puzzle'];
    
    const gameData = {
      slug,
      title,
      category,
      categoryName: CATEGORIES[category] || 'Game',
      url: `/games/${slug}/index.html`,
      image: `/images/games/${category}/${slug}.svg`,
      imageFallback: `/images/games/${category}/${slug}.jpg`,
      description,
      difficulty: 'Medium',
      ageRange: ageRange.range,
      minAge: ageRange.min,
      maxAge: ageRange.max,
      playCount: 0,
      tags: [category, 'educational', 'free'],
      featured: false,
      trending: true,
      isNew: true,
      developer: 'Open Source',
      source: 'GitHub',
      type: 'Free'
    };
    
    // 检查是否已存在
    const existingIndex = games.findIndex(game => game.slug === slug);
    if (existingIndex >= 0) {
      games[existingIndex] = { ...games[existingIndex], ...gameData };
      log('更新现有游戏记录', 'info');
    } else {
      games.push(gameData);
      log('添加新游戏记录', 'info');
    }
    
    fs.writeFileSync(gamesDbPath, JSON.stringify(games, null, 2));
    log('数据库更新完成', 'success');
    
    // 清理临时文件
    removeDir(tempDir);
    
    log(`\n🎉 游戏部署成功！`, 'success');
    log(`游戏名称: ${title}`, 'info');
    log(`访问地址: http://localhost:3000/games/${slug}`, 'info');
    log(`分类页面: http://localhost:3000/${category}-games`, 'info');
    
    return gameData;
    
  } catch (error) {
    log(`部署失败: ${error.message}`, 'error');
    removeDir(tempDir);
    throw error;
  }
}

// 主程序
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
EduGameHQ 快速游戏部署脚本

使用方法:
  node scripts/quick-deploy.js <GitHub仓库URL> <分类>

分类选项:
  ${Object.keys(CATEGORIES).join(', ')}

示例:
  node scripts/quick-deploy.js https://github.com/user/game.git math
  node scripts/quick-deploy.js https://github.com/user/puzzle.git puzzle
    `);
    return;
  }
  
  const repoUrl = args[0];
  const category = args[1];
  
  if (!CATEGORIES[category]) {
    log(`无效的分类: ${category}`, 'error');
    log(`支持的分类: ${Object.keys(CATEGORIES).join(', ')}`, 'info');
    return;
  }
  
  try {
    await deployGame(repoUrl, category);
  } catch (error) {
    log(`部署失败: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 运行主程序
if (require.main === module) {
  main();
}

module.exports = { deployGame }; 