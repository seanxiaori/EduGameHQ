import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));

console.log('🖼️ 游戏缩略图URL列表:');
console.log('=' .repeat(80));

games.forEach((game, i) => {
    console.log(`${(i+1).toString().padStart(2, '0')}. ${game.title}`);
    console.log(`    URL: ${game.thumbnailUrl}`);
    console.log(`    分类: ${game.categoryName}`);
    console.log('');
}); 