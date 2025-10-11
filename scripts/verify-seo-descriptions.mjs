import fs from 'fs';
import path from 'path';

// 语言文件列表
const languages = ['en', 'zh', 'es', 'fr', 'de', 'ar', 'he', 'hi', 'ru', 'ja', 'ko'];

// 需要检查的页面
const pages = ['home_page', 'math_games', 'science_games', 'coding_games'];

console.log('🔍 验证SEO描述长度 (140-160字符)...\n');

let allValid = true;
const results = [];

for (const lang of languages) {
  const filePath = path.join('src', 'i18n', 'locales', `${lang}.json`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log(`📄 ${lang.toUpperCase()} 语言版本:`);
    
    for (const page of pages) {
      const description = data.seo[page].description;
      const length = description.length;
      const isValid = length >= 140 && length <= 160;
      
      const status = isValid ? '✅' : '❌';
      const pageName = {
        'home_page': '首页',
        'math_games': '数学游戏',
        'science_games': '科学游戏',
        'coding_games': '编程游戏'
      }[page];
      
      console.log(`  ${status} ${pageName}: ${length} 字符 ${isValid ? '(符合要求)' : '(不符合要求)'}`);
      
      if (!isValid) {
        allValid = false;
      }
      
      results.push({
        language: lang,
        page: pageName,
        length: length,
        valid: isValid,
        description: description.substring(0, 50) + '...'
      });
    }
    console.log('');
    
  } catch (error) {
    console.error(`❌ 读取 ${lang}.json 文件失败:`, error.message);
    allValid = false;
  }
}

console.log('📊 验证结果汇总:');
console.log('='.repeat(50));

if (allValid) {
  console.log('🎉 所有语言版本的SEO描述长度都符合140-160字符要求！');
} else {
  console.log('⚠️  发现不符合要求的描述:');
  const invalidResults = results.filter(r => !r.valid);
  invalidResults.forEach(result => {
    console.log(`   - ${result.language.toUpperCase()} ${result.page}: ${result.length} 字符`);
  });
}

console.log(`\n✅ 符合要求: ${results.filter(r => r.valid).length}/${results.length}`);
console.log(`❌ 不符合要求: ${results.filter(r => !r.valid).length}/${results.length}`);

// 生成详细报告
const report = {
  timestamp: new Date().toISOString(),
  totalChecked: results.length,
  validCount: results.filter(r => r.valid).length,
  invalidCount: results.filter(r => !r.valid).length,
  allValid: allValid,
  details: results
};

fs.writeFileSync('seo-description-verification-report.json', JSON.stringify(report, null, 2));
console.log('\n📋 详细报告已保存到: seo-description-verification-report.json');

process.exit(allValid ? 0 : 1);