#!/usr/bin/env node

/**
 * 简化版游戏管理器测试脚本
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🎮 游戏管理器测试启动');
console.log(`📁 项目根目录: ${projectRoot}`);

// 分析 ellie 游戏集合
async function analyzeEllieGames() {
  const ellieDir = path.join(projectRoot, 'temp-games', 'ellie');
  
  console.log(`🔍 分析目录: ${ellieDir}`);
  
  try {
    const entries = await fs.readdir(ellieDir, { withFileTypes: true });
    console.log(`📂 发现 ${entries.length} 个条目`);
    
    const games = [];
    let totalSize = 0;
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const gamePath = path.join(ellieDir, entry.name);
        const indexPath = path.join(gamePath, 'index.html');
        
        try {
          await fs.access(indexPath);
          const size = await calculateDirectorySize(gamePath);
          
          console.log(`🎮 发现游戏: ${entry.name} (${formatFileSize(size)})`);
          
          games.push({
            name: entry.name,
            path: gamePath,
            size: size
          });
          
          totalSize += size;
        } catch (error) {
          console.log(`⚠️ 跳过目录: ${entry.name} (没有 index.html)`);
        }
      }
    }
    
    console.log(`\n📊 分析结果:`);
    console.log(`🎮 总游戏数: ${games.length}`);
    console.log(`📦 总大小: ${formatFileSize(totalSize)}`);
    console.log(`🎯 推荐策略: ${recommendStrategy(totalSize)}`);
    
    return { games, totalSize };
    
  } catch (error) {
    console.error(`❌ 分析失败: ${error.message}`);
    return null;
  }
}

// 计算目录大小
async function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
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
  } catch (error) {
    console.warn(`⚠️ 计算大小失败: ${dirPath}`);
  }
  
  return totalSize;
}

// 格式化文件大小
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

// 推荐托管策略
function recommendStrategy(totalSize) {
  const sizeMB = totalSize / (1024 * 1024);
  
  if (sizeMB < 10) {
    return 'local (本地托管 - 适合小型游戏)';
  } else if (sizeMB < 100) {
    return 'github (GitHub Pages - 适合中型游戏)';
  } else {
    return 'cloudflare (Cloudflare R2 - 适合大型游戏)';
  }
}

// 运行分析
analyzeEllieGames().then(result => {
  if (result) {
    console.log('\n✅ 分析完成！');
  } else {
    console.log('\n❌ 分析失败！');
  }
}).catch(error => {
  console.error('❌ 运行错误:', error.message);
});