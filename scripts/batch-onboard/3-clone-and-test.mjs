#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const games = JSON.parse(fs.readFileSync('output/filtered-games.json')).unique;
const cloneDir = '../../temp-games';

console.log('📦 克隆并测试GitHub游戏...\n');

// 确保目录存在
if (!fs.existsSync(cloneDir)) {
  fs.mkdirSync(cloneDir, { recursive: true });
}

const results = { success: [], failed: [] };

for (const game of games.slice(0, 5)) {  // 先测试前5个
  console.log(`\n处理: ${game.name}`);
  const gameDir = path.join(cloneDir, game.name);

  try {
    // 克隆仓库
    console.log('  克隆仓库...');
    if (fs.existsSync(gameDir)) {
      execSync(`rm -rf ${gameDir}`);
    }
    execSync(`git clone ${game.sourceUrl} ${gameDir}`, {
      stdio: 'pipe',
      timeout: 120000  // 增加到120秒
    });

    // 检查是否有可玩的构建
    const hasIndex = fs.existsSync(path.join(gameDir, 'index.html'));
    const hasDist = fs.existsSync(path.join(gameDir, 'dist'));
    const hasBuild = fs.existsSync(path.join(gameDir, 'build'));
    const hasPublic = fs.existsSync(path.join(gameDir, 'public'));

    if (hasIndex || hasDist || hasBuild || hasPublic) {
      console.log('  ✅ 找到可部署文件');
      results.success.push({
        ...game,
        localPath: gameDir,
        entryPoint: hasIndex ? 'index.html' : hasDist ? 'dist/' : hasBuild ? 'build/' : 'public/'
      });
    } else {
      console.log('  ❌ 未找到可部署文件');
      results.failed.push({ ...game, reason: 'No deployable files' });
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}`);
    results.failed.push({ ...game, reason: error.message });
  }
}

fs.writeFileSync('output/clone-results.json', JSON.stringify(results, null, 2));

console.log(`\n📊 克隆结果:`);
console.log(`  成功: ${results.success.length}`);
console.log(`  失败: ${results.failed.length}`);
console.log(`\n📄 结果: output/clone-results.json`);
