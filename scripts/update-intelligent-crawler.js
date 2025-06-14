import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 更新智能爬虫配置...');

// 读取爬虫配置
const configPath = path.join(__dirname, 'crawler-config.json');
if (!fs.existsSync(configPath)) {
  console.log('❌ 请先运行 prepare-crawler-config.js 生成配置文件');
  process.exit(1);
}

const crawlerConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 读取智能爬虫文件
const crawlerPath = path.join(__dirname, 'intelligent-game-crawler.js');
let crawlerContent = fs.readFileSync(crawlerPath, 'utf8');

// 更新 GAMES_CONFIG
const configString = JSON.stringify(crawlerConfig, null, 2);
const updatedContent = crawlerContent.replace(
  /const GAMES_CONFIG = \{[^}]*\};/s,
  `const GAMES_CONFIG = ${configString};`
);

// 保存更新后的文件
fs.writeFileSync(crawlerPath, updatedContent);

console.log(`✅ 智能爬虫配置已更新`);
console.log(`🎯 配置了 ${Object.keys(crawlerConfig).length} 个游戏待爬取`);

// 显示前10个游戏
console.log('\n🎮 前10个待爬取游戏:');
Object.entries(crawlerConfig).slice(0, 10).forEach(([id, config], index) => {
  console.log(`${index + 1}. ${config.name} (${config.source})`);
});

console.log('\n🚀 现在可以运行爬虫了:');
console.log('npm run crawl-games');
console.log('或者');
console.log('node scripts/run-crawler.js'); 