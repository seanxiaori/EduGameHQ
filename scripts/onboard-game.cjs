/**
 * 游戏上架脚本
 * 将新游戏添加到平台
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadExistingGames, checkDuplicate, validateGameData } = require('./validate-game.cjs');

const GAMES_JSON_PATH = path.join(__dirname, '../src/data/games.json');
const GAMES_REPO_PATH = '/tmp/EduGameHQ-Games';

// 添加游戏到 games.json
function addGameToJson(gameData) {
  const games = loadExistingGames();

  // 检查重复
  const duplicates = checkDuplicate(gameData, games);
  if (duplicates.length > 0) {
    console.log('❌ 发现重复游戏:');
    duplicates.forEach(d => console.log(`   - ${d.title} (${d.slug})`));
    return false;
  }

  // 验证数据
  const validation = validateGameData(gameData);
  if (!validation.isValid) {
    console.log('❌ 游戏数据验证失败:');
    validation.errors.forEach(e => console.log(`   - ${e}`));
    return false;
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️ 警告:');
    validation.warnings.forEach(w => console.log(`   - ${w}`));
  }

  // 添加游戏
  games.push(gameData);
  fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(games, null, 2));
  console.log(`✅ 游戏已添加: ${gameData.title}`);
  return true;
}

// 部署游戏文件到 GitHub Pages
function deployGameFiles(slug, sourcePath) {
  const targetPath = path.join(GAMES_REPO_PATH, 'games', slug);

  // 检查源目录
  if (!fs.existsSync(sourcePath)) {
    console.log(`❌ 源目录不存在: ${sourcePath}`);
    return false;
  }

  // 检查封面图
  const previewFiles = ['preview.png', 'preview.jpg', 'preview.svg', 'preview.webp'];
  const hasPreview = previewFiles.some(f => fs.existsSync(path.join(sourcePath, f)));
  if (!hasPreview) {
    console.log('❌ 缺少封面图 (preview.png/jpg/svg)');
    return false;
  }

  // 复制文件
  execSync(`cp -r "${sourcePath}" "${targetPath}"`);
  console.log(`✅ 游戏文件已复制到: ${targetPath}`);

  return true;
}

// 推送到远程仓库
function pushToRemote(slug, title) {
  try {
    process.chdir(GAMES_REPO_PATH);
    execSync(`git add games/${slug}`);
    execSync(`git commit -m "Add game: ${title}"`);
    execSync('git push');
    console.log('✅ 已推送到 GitHub Pages');
    return true;
  } catch (error) {
    console.log('❌ 推送失败:', error.message);
    return false;
  }
}

// 完整上架流程
function onboardGame(gameData, sourcePath) {
  console.log(`\n🎮 开始上架游戏: ${gameData.title}\n`);
  console.log('=' .repeat(50));

  // 步骤1: 部署游戏文件
  console.log('\n📁 步骤1: 部署游戏文件...');
  if (!deployGameFiles(gameData.slug, sourcePath)) {
    return false;
  }

  // 步骤2: 推送到远程
  console.log('\n🚀 步骤2: 推送到 GitHub Pages...');
  if (!pushToRemote(gameData.slug, gameData.title)) {
    return false;
  }

  // 步骤3: 添加到 games.json
  console.log('\n📝 步骤3: 添加到游戏列表...');
  if (!addGameToJson(gameData)) {
    return false;
  }

  console.log('\n' + '=' .repeat(50));
  console.log(`🎉 游戏上架成功: ${gameData.title}`);
  console.log(`   URL: https://games.edugamehq.com/games/${gameData.slug}/`);

  return true;
}

module.exports = {
  addGameToJson,
  deployGameFiles,
  pushToRemote,
  onboardGame
};

// 命令行使用
if (require.main === module) {
  console.log('EduGameHQ 游戏上架工具');
  console.log('请通过代码调用 onboardGame() 函数');
}
