#!/usr/bin/env node
import fs from 'fs';

const games = JSON.parse(fs.readFileSync('src/data/games.json', 'utf-8'));
const filtered = games.filter(g => g.slug !== 'hua-rong-dao');
fs.writeFileSync('src/data/games.json', JSON.stringify(filtered, null, 2));
console.log(`✅ 删除华容道，剩余: ${filtered.length} 款游戏`);
