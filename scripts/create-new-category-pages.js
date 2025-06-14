import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎮 创建新游戏分类页面...');

// 新分类配置
const newCategories = [
  {
    id: 'language',
    name: 'Language Games',
    chineseName: '语言游戏',
    description: 'Improve your language skills with interactive vocabulary, grammar, and communication games.',
    icon: 'fas fa-language',
    color: '#C026D3'
  },
  {
    id: 'puzzle',
    name: 'Puzzle Games', 
    chineseName: '益智游戏',
    description: 'Challenge your mind with logic puzzles, brain teasers, and problem-solving games.',
    icon: 'fas fa-puzzle-piece',
    color: '#7C3AED'
  },
  {
    id: 'art',
    name: 'Art & Creativity Games',
    chineseName: '艺术创意游戏', 
    description: 'Express your creativity through digital art, music composition, and design challenges.',
    icon: 'fas fa-palette',
    color: '#EC4899'
  }
];

// 读取现有的数学游戏页面作为模板
const mathGamesPath = path.join(__dirname, '../src/pages/math-games.astro');
const mathGamesTemplate = fs.readFileSync(mathGamesPath, 'utf8');

// 为每个新分类创建页面
newCategories.forEach(category => {
  const fileName = `${category.id}-games.astro`;
  const filePath = path.join(__dirname, '../src/pages', fileName);
  
  // 替换模板内容
  let pageContent = mathGamesTemplate
    .replace(/math-games/g, `${category.id}-games`)
    .replace(/Math Games/g, category.name)
    .replace(/数学游戏/g, category.chineseName)
    .replace(/math games/g, `${category.id} games`)
    .replace(/mathematics/g, category.id)
    .replace(/Math/g, category.name.split(' ')[0])
    .replace(/category === 'math'/g, `category === '${category.id}'`)
    .replace(/fas fa-calculator/g, category.icon)
    .replace(/#EA580C/g, category.color)
    .replace(/Practice arithmetic, algebra, geometry and problem-solving skills through fun educational games\./g, category.description);

  // 写入新页面文件
  fs.writeFileSync(filePath, pageContent, 'utf8');
  console.log(`✅ 创建页面: ${fileName}`);
});

console.log('\n🎉 所有新分类页面创建完成！');
console.log('📝 请检查以下文件:');
newCategories.forEach(category => {
  console.log(`   - src/pages/${category.id}-games.astro`);
}); 