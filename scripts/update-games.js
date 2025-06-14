import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要删除的itch.io游戏ID列表（根据测试结果，这些URL返回404）
const ITCH_GAMES_TO_REMOVE = [
  'trigo-chick',
  'number-drop',
  'conways-life',
  'attractor-explorer',
  'net-attack',
  'relaxing-typing-game',
  '20-words',
  'alphabet-typing',
  'supernode',
  'coming-home',
  'jeopardy-science'
];

// 可以保留的itch.io游戏（测试正常访问）
const VALID_ITCH_GAMES = [
  'make-ten',
  'factor-crafter',
  'math-push',
  'karate-math-dojo',
  'planetary-defense',
  'learn-gdscript'
];

async function updateGamesData() {
  console.log('🔄 开始更新游戏数据...');
  
  try {
    // 读取现有游戏数据
    const gameDataFile = path.join(__dirname, '../src/data/games/games.json');
    const data = await fs.readFile(gameDataFile, 'utf-8');
    const gamesData = JSON.parse(data);
    
    // 统计初始游戏数量
    const initialCount = Object.keys(gamesData).length;
    console.log(`📊 当前游戏数量: ${initialCount}`);
    
    // 统计itch.io游戏数量
    const itchGames = Object.entries(gamesData)
      .filter(([_, game]) => game.iframeUrl && game.iframeUrl.includes('itch.io'));
    console.log(`📊 itch.io游戏数量: ${itchGames.length}`);
    
    // 删除不可用的itch.io游戏
    let removedCount = 0;
    for (const gameId of ITCH_GAMES_TO_REMOVE) {
      if (gamesData[gameId]) {
        console.log(`❌ 删除游戏: ${gameId} (${gamesData[gameId].title})`);
        delete gamesData[gameId];
        removedCount++;
      }
    }
    
    // 更新JSON文件
    await fs.writeFile(gameDataFile, JSON.stringify(gamesData, null, 2));
    
    // 输出结果
    console.log(`\n✅ 更新完成!`);
    console.log(`📊 删除了 ${removedCount} 个不可用的itch.io游戏`);
    console.log(`📊 剩余游戏数量: ${Object.keys(gamesData).length}`);
    
    // 找出仍然保留的itch.io游戏
    const remainingItchGames = Object.entries(gamesData)
      .filter(([_, game]) => game.iframeUrl && game.iframeUrl.includes('itch.io'))
      .map(([id, game]) => `${id} (${game.title})`);
    
    if (remainingItchGames.length > 0) {
      console.log(`\n📋 以下itch.io游戏检测可用，已保留:`);
      remainingItchGames.forEach((game, index) => {
        console.log(`   ${index + 1}. ${game}`);
      });
    }
    
    console.log(`\n💡 建议:`);
    console.log(`   1. 检查剩余itch.io游戏的iframe是否可用`);
    console.log(`   2. 专注使用以下可靠来源的游戏:`);
    console.log(`      - CrazyGames`);
    console.log(`      - Miniplay`);
    console.log(`      - GameDistribution`);
    console.log(`      - Scratch MIT`);
    
  } catch (error) {
    console.error('❌ 更新游戏数据时出错:', error);
  }
}

updateGamesData().catch(console.error); 