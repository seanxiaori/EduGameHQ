#!/usr/bin/env node

// 竞品网站的优质教育游戏列表
const competitorGames = [
  // CoolMathGames风格
  { name: "Run 3", category: "skill", url: "https://www.coolmathgames.com/0-run-3" },
  { name: "Papa's Freezeria", category: "strategy", url: "https://www.coolmathgames.com/0-papas-freezeria" },
  { name: "Fireboy and Watergirl", category: "puzzle", url: "https://www.coolmathgames.com/0-fireboy-and-watergirl-in-the-forest-temple" },
  
  // 数学/逻辑游戏
  { name: "Prodigy Math", category: "math", url: "https://www.prodigygame.com/" },
  { name: "Math Playground", category: "math", url: "https://www.mathplayground.com/" },
  
  // 打字游戏
  { name: "TypeRacer", category: "typing", url: "https://play.typeracer.com/" },
  { name: "Nitro Type", category: "typing", url: "https://www.nitrotype.com/" },
  
  // 地理游戏
  { name: "GeoGuessr", category: "geography", url: "https://www.geoguessr.com/" },
  { name: "Seterra", category: "geography", url: "https://www.geoguessr.com/seterra" }
];

console.log('📋 竞品网站教育游戏列表\n');
console.log(`找到 ${competitorGames.length} 个候选游戏\n`);

competitorGames.forEach(game => {
  console.log(`- ${game.name} (${game.category})`);
});

console.log('\n💡 建议：这些游戏需要手动评估是否可嵌入');
