#!/usr/bin/env node

/**
 * 简化的GitHub部署测试脚本
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🚀 开始 GitHub Pages 游戏部署测试');

// 获取命令行参数
const args = process.argv.slice(2);
const sourcePath = args.find(arg => arg.startsWith('--source='))?.split('=')[1];

if (!sourcePath) {
  console.log(`
用法: node scripts/test-deploy.mjs --source=<游戏源路径>
示例: node scripts/test-deploy.mjs --source=./temp-games/ellie
`);
  process.exit(1);
}

console.log(`📁 源路径: ${sourcePath}`);

try {
  // 1. 分析游戏源
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
        const size = await calculateDirectorySize(gamePath);
        
        games.push({
          name: entry.name,
          path: gamePath,
          size,
          slug: generateSlug(entry.name),
          title: formatTitle(entry.name)
        });
        
        totalSize += size;
        console.log(`  ✅ ${entry.name} (${formatFileSize(size)})`);
        
      } catch (error) {
        console.log(`  ⚠️ 跳过 ${entry.name} (无效游戏目录)`);
      }
    }
  }
  
  console.log(`\n🎮 发现 ${games.length} 个游戏，总大小: ${formatFileSize(totalSize)}`);
  
  // 2. 生成游戏数据预览
  console.log('\n📋 游戏数据预览:');
  for (const game of games) {
    console.log(`
游戏: ${game.title}
Slug: ${game.slug}
大小: ${formatFileSize(game.size)}
URL: https://games.edugamehq.com/games/${game.slug}/
`);
  }
  
  // 3. 生成部署计划
  console.log('📝 部署计划:');
  console.log('1. 创建或更新 GitHub 仓库: EduGameHQ-Games');
  console.log('2. 复制游戏文件到 games/ 目录');
  console.log('3. 生成游戏清单文件');
  console.log('4. 更新主网站游戏数据');
  console.log('5. 提交并推送到 GitHub');
  
  console.log('\n🎉 分析完成！');
  console.log('💡 运行完整部署脚本: node scripts/deploy-to-github.mjs --source=' + sourcePath);
  
} catch (error) {
  console.error('❌ 分析失败:', error.message);
  process.exit(1);
}

// 工具函数
async function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      totalSize += await calculateDirectorySize(fullPath);
    } else {
      const stats = await fs.stat(fullPath);
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatTitle(name) {
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}