import fs from 'fs';
import path from 'path';

// 支持的语言列表
const languages = ['en', 'zh', 'es', 'fr', 'de', 'ar', 'he', 'hi', 'ru', 'ja', 'ko'];

// 页面类型
const pageTypes = ['home_page', 'math_games', 'science_games', 'coding_games'];

// 页面名称映射
const pageNames = {
  home_page: '首页',
  math_games: '数学游戏',
  science_games: '科学游戏',
  coding_games: '编程游戏'
};

console.log('🔍 检查所有语言版本的SEO关键词长度...\n');

let totalChecked = 0;
let totalExceeded = 0;
const exceededItems = [];

for (const lang of languages) {
  const filePath = path.join('src', 'i18n', 'locales', `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    continue;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    console.log(`📄 ${lang.toUpperCase()} 语言版本:`);
    
    for (const pageType of pageTypes) {
      if (data.seo && data.seo[pageType] && data.seo[pageType].keywords) {
        const keywords = data.seo[pageType].keywords;
        const length = keywords.length;
        totalChecked++;
        
        if (length > 100) {
          totalExceeded++;
          exceededItems.push({
            lang,
            pageType,
            keywords,
            length
          });
          console.log(`  ❌ ${pageNames[pageType]}: ${length} 字符 (超出100字符限制)`);
        } else {
          console.log(`  ✅ ${pageNames[pageType]}: ${length} 字符 (符合要求)`);
        }
      } else {
        console.log(`  ⚠️  ${pageNames[pageType]}: 关键词缺失`);
      }
    }
    console.log('');
  } catch (error) {
    console.error(`❌ 解析文件失败 ${filePath}:`, error.message);
  }
}

console.log('📊 检查结果汇总:');
console.log('==================================================');
if (totalExceeded === 0) {
  console.log('🎉 所有语言版本的SEO关键词长度都符合100字符要求！');
} else {
  console.log(`❌ 发现 ${totalExceeded} 个关键词超出100字符限制:`);
  console.log('');
  
  exceededItems.forEach(item => {
    console.log(`🔸 ${item.lang.toUpperCase()} - ${pageNames[item.pageType]}: ${item.length} 字符`);
    console.log(`   关键词: "${item.keywords}"`);
    console.log('');
  });
}

console.log(`✅ 符合要求: ${totalChecked - totalExceeded}/${totalChecked}`);
console.log(`❌ 超出限制: ${totalExceeded}/${totalChecked}`);

// 保存详细报告
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalChecked,
    totalExceeded,
    passRate: ((totalChecked - totalExceeded) / totalChecked * 100).toFixed(1) + '%'
  },
  exceededItems
};

fs.writeFileSync('seo-keywords-check-report.json', JSON.stringify(report, null, 2));
console.log('\n📋 详细报告已保存到: seo-keywords-check-report.json');