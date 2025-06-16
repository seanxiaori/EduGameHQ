import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 将数学游戏数据集成到主游戏数据库中
 */

/**
 * 读取数学游戏数据
 */
function readMathGamesData() {
    const mathGamesPath = path.join(path.dirname(__dirname), 'src/data/math-games.json');
    
    if (!fs.existsSync(mathGamesPath)) {
        console.error('❌ 数学游戏数据文件不存在:', mathGamesPath);
        return [];
    }
    
    try {
        const data = fs.readFileSync(mathGamesPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ 读取数学游戏数据失败:', error);
        return [];
    }
}

/**
 * 读取主游戏数据库
 */
function readMainGamesData() {
    const mainGamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(mainGamesPath)) {
        console.log('📝 主游戏数据库不存在，将创建新文件');
        return [];
    }
    
    try {
        const data = fs.readFileSync(mainGamesPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ 读取主游戏数据库失败:', error);
        return [];
    }
}

/**
 * 合并游戏数据
 */
function mergeGamesData(mainGames, mathGames) {
    console.log('🔄 合并游戏数据...');
    
    const mergedGames = [...mainGames];
    let addedCount = 0;
    let updatedCount = 0;
    
    for (const mathGame of mathGames) {
        // 检查是否已存在相同slug的游戏
        const existingIndex = mergedGames.findIndex(game => game.slug === mathGame.slug);
        
        if (existingIndex !== -1) {
            // 更新现有游戏
            mergedGames[existingIndex] = mathGame;
            updatedCount++;
            console.log(`  🔄 更新游戏: ${mathGame.title}`);
        } else {
            // 添加新游戏
            mergedGames.push(mathGame);
            addedCount++;
            console.log(`  ➕ 添加游戏: ${mathGame.title}`);
        }
    }
    
    console.log(`✅ 合并完成: 添加 ${addedCount} 个新游戏, 更新 ${updatedCount} 个现有游戏`);
    return mergedGames;
}

/**
 * 保存合并后的游戏数据
 */
function saveMainGamesData(gamesData) {
    const mainGamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    try {
        // 确保目录存在
        const dataDir = path.dirname(mainGamesPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // 保存数据
        fs.writeFileSync(mainGamesPath, JSON.stringify(gamesData, null, 2), 'utf-8');
        console.log(`✅ 主游戏数据库已更新: ${mainGamesPath}`);
        console.log(`📊 总游戏数量: ${gamesData.length}`);
        
        return true;
    } catch (error) {
        console.error('❌ 保存主游戏数据库失败:', error);
        return false;
    }
}

/**
 * 创建数学游戏页面数据
 */
function createMathGamesPageData(mathGames) {
    console.log('📄 创建数学游戏页面数据...');
    
    const pageData = {
        title: "Math Games for Kids | Free Online Educational Math Games | EduGameHQ",
        description: "Play free math games for kids aged 6-18. Learn numbers, counting, logic, and problem-solving through fun interactive games from CrazyGames.",
        keywords: ["math games", "numbers games", "counting games", "logic games", "educational math", "kids math games", "free math games", "online math games"],
        category: "math",
        categoryName: "Math",
        totalGames: mathGames.length,
        games: mathGames.map(game => ({
            id: game.slug,
            title: game.title,
            description: game.description,
            image: game.thumbnailUrl,
            difficulty: game.difficulty,
            age: `Ages ${game.ageRange}`,
            url: `/games/${game.slug}`,
            playCount: game.playCount || Math.floor(Math.random() * 15000) + 500,
            category: 'math',
            categoryName: 'Math',
            tags: game.tags,
            featured: game.featured || false
        })),
        gamesByDifficulty: {
            'Featured': mathGames
                .filter(game => game.featured)
                .map(game => ({
                    id: game.slug,
                    title: game.title,
                    description: game.description,
                    image: game.thumbnailUrl,
                    difficulty: game.difficulty,
                    age: `Ages ${game.ageRange}`,
                    url: `/games/${game.slug}`,
                    playCount: game.playCount || Math.floor(Math.random() * 15000) + 500,
                    category: 'math',
                    categoryName: 'Math'
                })),
            'Easy': mathGames
                .filter(game => game.difficulty === 'Easy')
                .map(game => ({
                    id: game.slug,
                    title: game.title,
                    description: game.description,
                    image: game.thumbnailUrl,
                    difficulty: game.difficulty,
                    age: `Ages ${game.ageRange}`,
                    url: `/games/${game.slug}`,
                    playCount: game.playCount || Math.floor(Math.random() * 15000) + 500,
                    category: 'math',
                    categoryName: 'Math'
                })),
            'Medium': mathGames
                .filter(game => game.difficulty === 'Medium')
                .map(game => ({
                    id: game.slug,
                    title: game.title,
                    description: game.description,
                    image: game.thumbnailUrl,
                    difficulty: game.difficulty,
                    age: `Ages ${game.ageRange}`,
                    url: `/games/${game.slug}`,
                    playCount: game.playCount || Math.floor(Math.random() * 15000) + 500,
                    category: 'math',
                    categoryName: 'Math'
                })),
            'Hard': mathGames
                .filter(game => game.difficulty === 'Hard')
                .map(game => ({
                    id: game.slug,
                    title: game.title,
                    description: game.description,
                    image: game.thumbnailUrl,
                    difficulty: game.difficulty,
                    age: `Ages ${game.ageRange}`,
                    url: `/games/${game.slug}`,
                    playCount: game.playCount || Math.floor(Math.random() * 15000) + 500,
                    category: 'math',
                    categoryName: 'Math'
                }))
        }
    };
    
    // 保存页面数据
    const pageDataPath = path.join(path.dirname(__dirname), 'src/data/math-games-page.json');
    fs.writeFileSync(pageDataPath, JSON.stringify(pageData, null, 2), 'utf-8');
    console.log(`✅ 数学游戏页面数据已保存: ${pageDataPath}`);
    
    return pageData;
}

/**
 * 生成统计报告
 */
function generateStatistics(allGames, mathGames) {
    console.log('\n📊 生成统计报告...');
    
    const stats = {
        timestamp: new Date().toISOString(),
        totalGames: allGames.length,
        mathGames: mathGames.length,
        categories: {},
        difficulties: {},
        ageRanges: {},
        sources: {}
    };
    
    // 统计各分类游戏数量
    allGames.forEach(game => {
        stats.categories[game.category] = (stats.categories[game.category] || 0) + 1;
        stats.difficulties[game.difficulty] = (stats.difficulties[game.difficulty] || 0) + 1;
        stats.ageRanges[game.ageRange] = (stats.ageRanges[game.ageRange] || 0) + 1;
        stats.sources[game.source] = (stats.sources[game.source] || 0) + 1;
    });
    
    console.log('📈 统计结果:');
    console.log(`  总游戏数: ${stats.totalGames}`);
    console.log(`  数学游戏: ${stats.mathGames}`);
    console.log('  分类分布:', stats.categories);
    console.log('  难度分布:', stats.difficulties);
    console.log('  年龄分布:', stats.ageRanges);
    console.log('  来源分布:', stats.sources);
    
    // 保存统计报告
    const statsPath = path.join(__dirname, 'integration-stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    console.log(`📋 统计报告已保存: ${statsPath}`);
    
    return stats;
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('🚀 开始集成数学游戏数据到主数据库');
        console.log('=' .repeat(60));
        
        // 1. 读取数学游戏数据
        console.log('📖 读取数学游戏数据...');
        const mathGames = readMathGamesData();
        if (mathGames.length === 0) {
            console.error('❌ 没有找到数学游戏数据');
            return;
        }
        console.log(`✅ 成功读取 ${mathGames.length} 个数学游戏`);
        
        // 2. 读取主游戏数据库
        console.log('\n📖 读取主游戏数据库...');
        const mainGames = readMainGamesData();
        console.log(`✅ 主数据库当前有 ${mainGames.length} 个游戏`);
        
        // 3. 合并游戏数据
        console.log('\n🔄 合并游戏数据...');
        const mergedGames = mergeGamesData(mainGames, mathGames);
        
        // 4. 保存合并后的数据
        console.log('\n💾 保存合并后的数据...');
        const saveSuccess = saveMainGamesData(mergedGames);
        if (!saveSuccess) {
            console.error('❌ 保存失败');
            return;
        }
        
        // 5. 创建数学游戏页面数据
        console.log('\n📄 创建数学游戏页面数据...');
        createMathGamesPageData(mathGames);
        
        // 6. 生成统计报告
        const stats = generateStatistics(mergedGames, mathGames);
        
        console.log('\n🎉 数学游戏数据集成完成！');
        console.log('=' .repeat(60));
        console.log('📊 集成结果:');
        console.log(`  - 总游戏数: ${mergedGames.length}`);
        console.log(`  - 数学游戏: ${mathGames.length}`);
        console.log(`  - 主数据库: src/data/games.json`);
        console.log(`  - 页面数据: src/data/math-games-page.json`);
        console.log(`  - 统计报告: scripts/integration-stats.json`);
        
        console.log('\n🎮 数学游戏列表:');
        mathGames.forEach((game, index) => {
            console.log(`  ${index + 1}. ${game.title} (${game.difficulty}, ${game.ageRange})`);
        });
        
        console.log('\n✅ 现在可以在网站上使用这些数学游戏了！');
        
    } catch (error) {
        console.error('💥 集成过程中出错:', error);
        process.exit(1);
    }
}

// 运行主程序
main(); 