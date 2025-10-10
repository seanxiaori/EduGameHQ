/**
 * 清理Funbrain和Math Playground游戏
 * 因为这些网站的游戏无法正常嵌入
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取游戏数据
const gamesPath = path.join(__dirname, '../src/data/games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));

console.log(`📊 当前游戏总数: ${games.length}`);

// 统计要删除的游戏
const funbrainGames = games.filter(g => g.source === 'funbrain');
const mathplaygroundGames = games.filter(g => g.source === 'mathplayground');

console.log(`\n🗑️ 需要删除的游戏:`);
console.log(`   Funbrain: ${funbrainGames.length} 个`);
console.log(`   Math Playground: ${mathplaygroundGames.length} 个`);
console.log(`   总计: ${funbrainGames.length + mathplaygroundGames.length} 个`);

// 列出要删除的游戏
console.log(`\n📝 Funbrain游戏列表:`);
funbrainGames.forEach((game, index) => {
  console.log(`   ${index + 1}. ${game.title} (${game.slug})`);
});

if (mathplaygroundGames.length > 0) {
  console.log(`\n📝 Math Playground游戏列表:`);
  mathplaygroundGames.forEach((game, index) => {
    console.log(`   ${index + 1}. ${game.title} (${game.slug})`);
  });
}

// 过滤掉这些游戏
const cleanedGames = games.filter(g => 
  g.source !== 'funbrain' && 
  g.source !== 'mathplayground'
);

console.log(`\n✅ 清理后游戏总数: ${cleanedGames.length}`);
console.log(`❌ 已删除: ${games.length - cleanedGames.length} 个游戏\n`);

// 保存清理后的数据
fs.writeFileSync(gamesPath, JSON.stringify(cleanedGames, null, 2), 'utf-8');

console.log('✅ 清理完成！游戏数据已更新。\n');

