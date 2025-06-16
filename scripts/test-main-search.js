import { searchEmbeddableGames } from './find-embeddable-crazygames.js';

/**
 * 测试修复后的主搜索功能
 */
async function testMainSearch() {
    console.log('🎯 测试修复后的主搜索功能');
    console.log('只搜索language分类，验证Words of Wonders是否被正确过滤');
    
    try {
        // 只搜索language分类，限制游戏数量
        const results = await searchEmbeddableGames('language', ['word', 'vocabulary', 'spelling'], 5);
        
        console.log('\n📊 搜索结果:');
        if (results && results.length > 0) {
            results.forEach((game, index) => {
                console.log(`${index + 1}. ${game.title}`);
                console.log(`   URL: ${game.iframeUrl}`);
                console.log(`   描述: ${game.description}`);
                console.log('');
            });
            
            // 检查是否包含Words of Wonders
            const hasWordsOfWonders = results.some(game => 
                game.title.toLowerCase().includes('words of wonders') ||
                game.slug.includes('words-of-wonders')
            );
            
            console.log('🎯 验证结果:');
            if (hasWordsOfWonders) {
                console.log('❌ Words of Wonders仍然在结果中，过滤失败');
            } else {
                console.log('✅ Words of Wonders已被正确过滤掉');
            }
        } else {
            console.log('❌ 没有找到任何游戏');
        }
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 运行测试
testMainSearch(); 