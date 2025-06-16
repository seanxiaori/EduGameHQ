import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 将补充游戏数据集成到主游戏数据库中
 */

/**
 * 读取补充游戏数据
 */
function readSupplementaryGamesData() {
    const supplementaryGamesPath = path.join(path.dirname(__dirname), 'src/data/supplementary-games-batch1.json');
    
    if (!fs.existsSync(supplementaryGamesPath)) {
        console.error('❌ 补充游戏数据文件不存在:', supplementaryGamesPath);
        return [];
    }
    
    try {
        const data = fs.readFileSync(supplementaryGamesPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ 读取补充游戏数据失败:', error);
        return [];
    }
}

/**
 * 读取主游戏数据库
 */
function readMainGamesData() {
    const mainGamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(mainGamesPath)) {
        console.log('📝 主游戏数据库不存在，将创建新的数据库');
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
 * 检查游戏是否已存在
 */
function isGameExists(games, newGame) {
    return games.some(game => 
        game.slug === newGame.slug || 
        game.iframeUrl === newGame.iframeUrl ||
        game.title === newGame.title
    );
}

/**
 * 生成分类页面数据
 */
function generateCategoryPageData(games) {
    const categories = {};
    
    games.forEach(game => {
        if (!categories[game.category]) {
            categories[game.category] = {
                category: game.category,
                categoryName: game.categoryName,
                description: `Educational ${game.categoryName.toLowerCase()} games for children and students`,
                games: [],
                totalGames: 0
            };
        }
        
        categories[game.category].games.push({
            slug: game.slug,
            title: game.title,
            description: game.description,
            thumbnailUrl: game.thumbnailUrl,
            difficulty: game.difficulty,
            ageRange: game.ageRange,
            tags: game.tags,
            iframeUrl: game.iframeUrl
        });
        
        categories[game.category].totalGames++;
    });
    
    return categories;
}

/**
 * 主集成函数
 */
function integrateSupplementaryGames() {
    console.log('🎯 开始集成补充游戏到主数据库');
    
    // 读取数据
    const supplementaryGames = readSupplementaryGamesData();
    const mainGames = readMainGamesData();
    
    console.log(`📊 补充游戏数量: ${supplementaryGames.length}`);
    console.log(`📊 主数据库现有游戏: ${mainGames.length}`);
    
    if (supplementaryGames.length === 0) {
        console.log('❌ 没有补充游戏数据，退出集成');
        return;
    }
    
    // 合并游戏数据
    let addedGames = 0;
    let skippedGames = 0;
    const newGames = [];
    
    supplementaryGames.forEach(game => {
        if (isGameExists(mainGames, game)) {
            console.log(`⚠️  游戏已存在，跳过: ${game.title}`);
            skippedGames++;
        } else {
            newGames.push(game);
            addedGames++;
            console.log(`✅ 添加新游戏: ${game.title} (${game.category})`);
        }
    });
    
    // 合并到主数据库
    const updatedGames = [...mainGames, ...newGames];
    
    // 保存更新后的主数据库
    const mainGamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    fs.writeFileSync(mainGamesPath, JSON.stringify(updatedGames, null, 2));
    console.log(`\n📄 主游戏数据库已更新: ${mainGamesPath}`);
    
    // 生成分类页面数据
    const categoryData = generateCategoryPageData(newGames);
    
    // 保存各分类页面数据
    Object.entries(categoryData).forEach(([category, data]) => {
        const categoryPath = path.join(path.dirname(__dirname), `src/data/${category}-games-page.json`);
        fs.writeFileSync(categoryPath, JSON.stringify(data, null, 2));
        console.log(`📄 ${data.categoryName}分类页面数据已保存: ${categoryPath}`);
    });
    
    // 生成集成报告
    const report = {
        timestamp: new Date().toISOString(),
        totalSupplementaryGames: supplementaryGames.length,
        addedGames: addedGames,
        skippedGames: skippedGames,
        totalGamesAfterIntegration: updatedGames.length,
        categoriesAdded: Object.keys(categoryData),
        gamesByCategory: {}
    };
    
    // 统计各分类游戏数量
    newGames.forEach(game => {
        if (!report.gamesByCategory[game.category]) {
            report.gamesByCategory[game.category] = 0;
        }
        report.gamesByCategory[game.category]++;
    });
    
    // 保存集成报告
    const reportPath = path.join(__dirname, 'supplementary-integration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 集成报告已保存: ${reportPath}`);
    
    // 输出统计信息
    console.log('\n📊 集成结果统计:');
    console.log(`✅ 新增游戏: ${addedGames} 个`);
    console.log(`⚠️  跳过游戏: ${skippedGames} 个`);
    console.log(`📈 数据库总游戏数: ${updatedGames.length} 个`);
    console.log('\n📋 新增游戏分类统计:');
    Object.entries(report.gamesByCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} 个游戏`);
    });
    
    console.log('\n🎉 补充游戏集成完成！');
    
    return report;
}

// 运行集成
integrateSupplementaryGames(); 