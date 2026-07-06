#!/usr/bin/env node
import fs from 'fs';

// 手动精选的高质量HTML5游戏列表
// 这些游戏都是可以嵌入iframe的，并且是真正的游戏
const curatedGames = [
  // itch.io 精品HTML5游戏
  {
    name: "A Dark Room",
    homepage: "https://adarkroom.doublespeakgames.com/",
    description: "A minimalist text-based adventure game",
    source: "itch.io",
    stars: 0,
    verified: false
  },
  {
    name: "Hextris",
    homepage: "https://hextris.io/",
    description: "Fast paced puzzle game inspired by Tetris",
    source: "github-pages",
    stars: 0,
    verified: false
  },
  {
    name: "Slither.io Clone",
    homepage: "https://slither.io/",
    description: "Multiplayer snake game",
    source: "standalone",
    stars: 0,
    verified: false
  },
  {
    name: "Krunker",
    homepage: "https://krunker.io/",
    description: "Fast-paced pixelated FPS browser game",
    source: "standalone",
    stars: 0,
    verified: false
  },
  {
    name: "Little Alchemy 2",
    homepage: "https://littlealchemy2.com/",
    description: "Combine elements to create new items",
    source: "standalone",
    stars: 0,
    verified: false
  },
  {
    name: "Geoguessr Clone",
    homepage: "https://www.geoguessr.com/",
    description: "Geography guessing game",
    source: "standalone",
    stars: 0,
    verified: false
  },
  {
    name: "Prodigy Math",
    homepage: "https://www.prodigygame.com/",
    description: "Math learning game for kids",
    source: "standalone",
    stars: 0,
    verified: false
  },
  {
    name: "Cookie Clicker",
    homepage: "https://orteil.dashnet.org/cookieclicker/",
    description: "Incremental clicking game",
    source: "standalone",
    stars: 0,
    verified: false
  },
  {
    name: "Agar.io",
    homepage: "https://agar.io/",
    description: "Multiplayer cell eating game",
    source: "standalone",
    stars: 0,
    verified: false
  },
  {
    name: "Diep.io",
    homepage: "https://diep.io/",
    description: "Tank battle game",
    source: "standalone",
    stars: 0,
    verified: false
  }
];

console.log('🎮 搜索可嵌入的HTML5游戏...\n');
console.log(`找到 ${curatedGames.length} 个候选游戏\n`);

fs.writeFileSync('output/search-results.json', JSON.stringify(curatedGames, null, 2));
console.log('✅ 已保存到 output/search-results.json');
