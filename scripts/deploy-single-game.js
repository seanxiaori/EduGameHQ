import fs from 'fs/promises';
import path from 'path';

/**
 * 部署单个验证通过的游戏到数据库
 */
async function deploySingleGame(gameData) {
    try {
        // 读取当前游戏数据
        const gamesFilePath = 'src/data/games.json';
        let gamesData = [];
        
        try {
            const existingData = await fs.readFile(gamesFilePath, 'utf8');
            gamesData = JSON.parse(existingData);
        } catch (error) {
            console.log('创建新的游戏数据文件');
            gamesData = [];
        }
        
        // 检查游戏是否已存在
        const existingGame = gamesData.find(game => game.slug === gameData.slug);
        if (existingGame) {
            console.log(`游戏 ${gameData.title} 已存在，跳过添加`);
            return false;
        }
        
        // 添加新游戏
        gamesData.push(gameData);
        
        // 保存到文件
        await fs.writeFile(gamesFilePath, JSON.stringify(gamesData, null, 2));
        
        console.log(`✅ 成功添加游戏: ${gameData.title}`);
        console.log(`   分类: ${gameData.categoryName}`);
        console.log(`   URL: ${gameData.iframeUrl}`);
        
        return true;
        
    } catch (error) {
        console.error(`❌ 部署游戏失败: ${error.message}`);
        return false;
    }
}

/**
 * 创建游戏占位符图片
 */
async function createGamePlaceholder(gameSlug, category, title) {
    try {
        // 确保目录存在
        const imageDir = path.join('public', 'images', 'games', category);
        await fs.mkdir(imageDir, { recursive: true });
        
        // 创建SVG占位符
        const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)" rx="12"/>
  <text x="200" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        text-anchor="middle" fill="white">${title}</text>
  <text x="200" y="170" font-family="Arial, sans-serif" font-size="14" 
        text-anchor="middle" fill="#E5E7EB">Educational Game</text>
  <circle cx="200" cy="220" r="30" fill="rgba(255,255,255,0.2)"/>
  <polygon points="190,210 190,230 210,220" fill="white"/>
</svg>`;
        
        const svgPath = path.join(imageDir, `${gameSlug}-placeholder.svg`);
        await fs.writeFile(svgPath, svgContent);
        
        console.log(`📷 创建占位符图片: ${svgPath}`);
        return `/images/games/${category}/${gameSlug}-placeholder.svg`;
        
    } catch (error) {
        console.error(`创建占位符失败: ${error.message}`);
        return null;
    }
}

// Words of Wonders 游戏数据
const wordsOfWondersGame = {
    slug: "words-of-wonders",
    title: "Words of Wonders",
    category: "language",
    categoryName: "Language",
    iframeUrl: "https://www.crazygames.com/embed/words-of-wonders",
    description: "Explore world wonders while building words from letters. Perfect for vocabulary building and spelling practice.",
    gameGuide: {
        howToPlay: [
            "Connect letters to form words by dragging your finger or mouse",
            "Find all hidden words to complete each level",
            "Discover bonus words for extra points",
            "Progress through different world landmarks and monuments",
            "Use hints if you get stuck on difficult words"
        ],
        controls: {
            mouse: "Click and drag to connect letters and form words",
            touch: "Tap and swipe to connect letters on mobile devices",
            keyboard: "Use mouse to select letters, no keyboard input needed"
        },
        tips: [
            "Start with shorter words to get familiar with available letters",
            "Look for common prefixes and suffixes",
            "Try different letter combinations systematically",
            "Use the shuffle button to rearrange letters for new perspectives",
            "Save hints for the most challenging levels"
        ]
    },
    introduction: "Words of Wonders combines word puzzle gameplay with educational content about world landmarks. Players build vocabulary while learning about famous monuments and cultural sites from around the globe.",
    features: [
        "Beautiful graphics featuring world landmarks",
        "Progressive difficulty with increasing word complexity",
        "Hint system for challenging puzzles",
        "Bonus words for extra points and learning",
        "Educational content about world monuments",
        "Smooth touch and mouse controls",
        "Multiple levels with varied themes",
        "Vocabulary building through gameplay"
    ],
    learningObjectives: [
        "Expand English vocabulary and word recognition",
        "Improve spelling and letter pattern recognition",
        "Learn about world landmarks and cultural heritage",
        "Develop problem-solving and analytical thinking",
        "Enhance visual-spatial processing skills"
    ],
    thumbnailUrl: "/images/games/language/words-of-wonders-placeholder.svg",
    difficulty: "Medium",
    ageRange: "8-18",
    minAge: 8,
    maxAge: 18,
    tags: [
        "vocabulary",
        "spelling",
        "words",
        "landmarks",
        "geography",
        "education",
        "puzzle",
        "language-learning"
    ],
    gradeLevel: "3rd-12th Grade",
    subjects: [
        "English Language Arts",
        "Vocabulary",
        "Geography",
        "Cultural Studies"
    ],
    skills: [
        "Vocabulary building",
        "Spelling accuracy",
        "Pattern recognition",
        "Cultural awareness",
        "Problem solving"
    ],
    source: "CrazyGames",
    iframeCompatible: true,
    verified: true,
    responsive: true,
    mobileSupport: true,
    technology: "HTML5",
    browserSupport: ["Chrome", "Firefox", "Safari", "Edge"],
    lastUpdated: "2024-12-15",
    lastChecked: "2024-12-15"
};

// 执行部署
async function main() {
    console.log('🚀 开始部署 Words of Wonders 游戏...');
    
    // 创建占位符图片
    const thumbnailUrl = await createGamePlaceholder(
        wordsOfWondersGame.slug,
        wordsOfWondersGame.category,
        wordsOfWondersGame.title
    );
    
    if (thumbnailUrl) {
        wordsOfWondersGame.thumbnailUrl = thumbnailUrl;
    }
    
    // 部署游戏
    const success = await deploySingleGame(wordsOfWondersGame);
    
    if (success) {
        console.log('\n✅ Words of Wonders 部署完成！');
        console.log('🌐 现在可以在网站上测试这款游戏了');
        console.log(`📱 游戏页面: http://localhost:3000/games/${wordsOfWondersGame.slug}`);
    } else {
        console.log('\n❌ 部署失败');
    }
}

// 运行脚本
main().catch(console.error);

export { deploySingleGame, createGamePlaceholder }; 