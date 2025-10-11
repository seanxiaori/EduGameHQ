import fs from 'fs';

const lang = process.argv[2] || 'zh';
const filePath = `src/i18n/locales/${lang}.json`;

try {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const seo = data.seo;
  
  console.log(`📄 ${lang.toUpperCase()} 语言版本:`);
  
  const pages = ['home_page', 'math_games', 'science_games', 'coding_games'];
  const pageNames = ['首页', '数学游戏', '科学游戏', '编程游戏'];
  
  pages.forEach((page, index) => {
    if (seo[page] && seo[page].description) {
      const desc = seo[page].description;
      const length = desc.length;
      const status = (length >= 140 && length <= 160) ? '✅' : '❌';
      console.log(`  ${status} ${pageNames[index]}: ${length} 字符`);
      if (length < 140 || length > 160) {
        console.log(`    描述: "${desc}"`);
      }
    }
  });
} catch (error) {
  console.error(`错误: ${error.message}`);
}