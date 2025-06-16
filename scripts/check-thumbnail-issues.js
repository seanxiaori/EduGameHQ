import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 检查游戏缩略图问题
 */
function checkThumbnailIssues() {
    console.log('🔍 检查游戏缩略图问题...');
    console.log('=' .repeat(50));
    
    const gamesPath = path.join(path.dirname(__dirname), 'src/data/games.json');
    
    if (!fs.existsSync(gamesPath)) {
        console.error('❌ 游戏数据文件不存在:', gamesPath);
        return;
    }
    
    const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));
    console.log(`📊 总共检查 ${games.length} 个游戏`);
    
    const issues = {
        duplicates: {},
        invalid: [],
        placeholder: [],
        missing: []
    };
    
    // 检查每个游戏的缩略图
    games.forEach((game, index) => {
        const { slug, title, thumbnailUrl } = game;
        
        // 检查缺失缩略图
        if (!thumbnailUrl) {
            issues.missing.push({ slug, title, index });
            return;
        }
        
        // 检查占位图
        if (thumbnailUrl.includes('placeholder') || 
            thumbnailUrl.includes('default') ||
            thumbnailUrl.endsWith('.svg')) {
            issues.placeholder.push({ slug, title, thumbnailUrl, index });
        }
        
        // 检查无效URL
        if (!thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('/')) {
            issues.invalid.push({ slug, title, thumbnailUrl, index });
        }
        
        // 检查重复缩略图
        if (issues.duplicates[thumbnailUrl]) {
            issues.duplicates[thumbnailUrl].push({ slug, title, index });
        } else {
            issues.duplicates[thumbnailUrl] = [{ slug, title, index }];
        }
    });
    
    // 过滤出真正重复的缩略图
    const realDuplicates = {};
    Object.entries(issues.duplicates).forEach(([url, games]) => {
        if (games.length > 1) {
            realDuplicates[url] = games;
        }
    });
    issues.duplicates = realDuplicates;
    
    // 输出检查结果
    console.log('\n📋 检查结果:');
    console.log('-' .repeat(30));
    
    // 重复缩略图
    if (Object.keys(issues.duplicates).length > 0) {
        console.log('\n🔄 重复缩略图:');
        Object.entries(issues.duplicates).forEach(([url, games]) => {
            console.log(`\n  URL: ${url}`);
            games.forEach(game => {
                console.log(`    - ${game.title} (${game.slug})`);
            });
        });
    } else {
        console.log('\n✅ 没有发现重复缩略图');
    }
    
    // 缺失缩略图
    if (issues.missing.length > 0) {
        console.log('\n❌ 缺失缩略图:');
        issues.missing.forEach(game => {
            console.log(`  - ${game.title} (${game.slug})`);
        });
    } else {
        console.log('\n✅ 所有游戏都有缩略图');
    }
    
    // 占位图
    if (issues.placeholder.length > 0) {
        console.log('\n🖼️ 使用占位图:');
        issues.placeholder.forEach(game => {
            console.log(`  - ${game.title} (${game.slug})`);
            console.log(`    URL: ${game.thumbnailUrl}`);
        });
    } else {
        console.log('\n✅ 没有使用占位图');
    }
    
    // 无效URL
    if (issues.invalid.length > 0) {
        console.log('\n⚠️ 无效缩略图URL:');
        issues.invalid.forEach(game => {
            console.log(`  - ${game.title} (${game.slug})`);
            console.log(`    URL: ${game.thumbnailUrl}`);
        });
    } else {
        console.log('\n✅ 所有缩略图URL都有效');
    }
    
    // 总结
    const totalIssues = Object.keys(issues.duplicates).length + 
                       issues.missing.length + 
                       issues.placeholder.length + 
                       issues.invalid.length;
    
    console.log('\n📊 问题总结:');
    console.log(`  重复缩略图: ${Object.keys(issues.duplicates).length} 组`);
    console.log(`  缺失缩略图: ${issues.missing.length} 个`);
    console.log(`  占位图: ${issues.placeholder.length} 个`);
    console.log(`  无效URL: ${issues.invalid.length} 个`);
    console.log(`  总问题数: ${totalIssues}`);
    
    if (totalIssues === 0) {
        console.log('\n🎉 所有缩略图都正常！');
    } else {
        console.log('\n🔧 建议运行修复脚本解决这些问题');
    }
    
    return issues;
}

// 运行检查
checkThumbnailIssues(); 