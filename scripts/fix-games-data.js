import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 默认描述
const DEFAULT_DESCRIPTIONS = {
  sports: {
    "basketball-stars": "A fast-paced basketball game where players can challenge friends or AI opponents in quick matches. Perfect for developing teamwork and basketball strategy skills.",
    "soccer-skills": "Practice essential soccer skills in this engaging game featuring realistic physics and controls. Challenge yourself with increasing difficulty levels.",
    "penalty-kicks": "Test your precision and timing in this penalty shootout game. Take turns as both shooter and goalkeeper in this exciting sports challenge.",
    "tennis": "Experience tennis gameplay with intuitive controls. Master different court surfaces and compete against challenging AI opponents.",
    "golf": "A relaxing yet challenging golf game that teaches physics concepts through realistic ball movement and course obstacles.",
    "archery": "Improve focus and precision in this archery simulator that accounts for wind, distance, and timing.",
    "bowling": "Learn about momentum and angles in this realistic bowling game. Adjust your position, power, and spin to get that perfect strike.",
    "volleyball": "A fun volleyball game that teaches teamwork, timing, and positioning on the court.",
    "baseball": "America's favorite pastime brought to life in this educational baseball game focused on hitting, pitching and fielding mechanics.",
    "hockey": "Fast-paced hockey action focusing on team strategy, shooting accuracy, and goaltending.",
    "football": "Experience American football with simplified controls that still capture the strategy and excitement of the real sport.",
    "wrestling": "Learn about balance, leverage, and timing in this physics-based wrestling game."
  },
  history: {
    "geography": "Explore world geography through interactive maps and challenges. Test your knowledge of countries, capitals, and landmarks.",
    "map-quiz": "Sharpen your geographic knowledge with this interactive quiz covering countries, capitals, and major landmarks.",
    "history-timeline": "Journey through key historical events in this interactive timeline. Learn about important moments that shaped our world.",
    "landmarks": "Discover famous landmarks and monuments from around the world. Learn about their history and cultural significance.",
    "capitals": "Test your knowledge of world capitals in this educational geography quiz with increasing difficulty levels.",
    "us-history": "Explore American history through interactive challenges covering major events, figures, and developments.",
    "uk-history": "Learn about British history and its global impact through engaging quizzes and interactive content.",
    "world-war": "Understand the complexities of World War II through this educational quiz covering major events, figures, and impacts.",
    "continents": "Learn about Earth's continents, their geography, countries, and unique features in this educational game."
  }
};

// 生成适当的英文描述
function generateProperDescription(id, category, title) {
  if (category === 'sports') {
    // 基于id或title关键词匹配
    for (const [key, desc] of Object.entries(DEFAULT_DESCRIPTIONS.sports)) {
      if (id.includes(key) || title.toLowerCase().includes(key)) {
        return desc;
      }
    }
    return "An engaging sports game that helps develop coordination, strategy, and understanding of rules while having fun.";
  }
  
  if (category === 'history') {
    // 基于id或title关键词匹配
    for (const [key, desc] of Object.entries(DEFAULT_DESCRIPTIONS.history)) {
      if (id.includes(key) || title.toLowerCase().includes(key)) {
        return desc;
      }
    }
    return "An educational geography and history game that helps students learn about world cultures, landmarks, and historical events.";
  }
  
  return "A fun and educational game for students. Enjoy learning while playing!";
}

// 主函数
async function fixGamesData() {
  try {
    console.log('🔧 开始修复游戏数据...');
    
    // 读取games.json
    const gamesFile = path.join(__dirname, '../src/data/games/games.json');
    const data = await fs.readFile(gamesFile, 'utf-8');
    const gamesData = JSON.parse(data);
    
    // 记录修复情况
    let fixedDescriptions = 0;
    let fixedTags = 0;
    
    // 遍历每个游戏
    for (const [id, game] of Object.entries(gamesData)) {
      // 1. 修复体育游戏和历史地理游戏描述错误
      if (game.category === 'sports' && game.description.includes('篮球对战') || 
          game.description === '篮球对战游戏，支持双人对战。') {
        game.description = generateProperDescription(id, 'sports', game.title);
        fixedDescriptions++;
      }
      
      if (game.category === 'history' && game.description.includes('街景猜地理') || 
          game.description === '街景猜地理，锻炼世界与英语国家地理知识。') {
        game.description = generateProperDescription(id, 'history', game.title);
        fixedDescriptions++;
      }
      
      // 2. 清理重复的tags
      if (Array.isArray(game.tags)) {
        const uniqueTags = [...new Set(game.tags)];
        if (uniqueTags.length !== game.tags.length) {
          game.tags = uniqueTags;
          fixedTags++;
        }
      }
      
      // 3. 确保所有游戏都有标准英文内容
      if (!game.title || game.title.includes('GAME')) {
        // 提取数字序号后的实际标题
        const titleMatch = id.match(/\d+-(.+)/);
        if (titleMatch) {
          game.title = titleMatch[1].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
      
      // 统一游戏难度评级
      if (!game.difficulty) {
        game.difficulty = "Medium";
      }
      
      // 统一年龄范围
      if (!game.ageRange) {
        if (game.category === 'sports') game.ageRange = "8-16";
        else if (game.category === 'history') game.ageRange = "10-18";
        else game.ageRange = "8-16";
      }
    }
    
    // 保存修改后的文件
    await fs.writeFile(gamesFile, JSON.stringify(gamesData, null, 2));
    
    console.log(`✅ 修复完成!`);
    console.log(`📊 修复了${fixedDescriptions}个游戏描述`);
    console.log(`📊 修复了${fixedTags}个游戏标签`);
    console.log(`💡 建议:`);
    console.log(`   1. 检查游戏描述是否符合英文语法规范`);
    console.log(`   2. 确认游戏分类是否正确`);
    console.log(`   3. 验证游戏iframe是否能正常加载`);
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

// 执行主函数
fixGamesData(); 