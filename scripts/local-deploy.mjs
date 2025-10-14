#!/usr/bin/env node

/**
 * 本地部署脚本 - 生成GitHub Pages游戏仓库结构
 * 这个脚本会在本地创建完整的GitHub仓库结构，你可以直接上传到GitHub
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalGamesDeployer {
    constructor() {
        this.sourceDir = '';
        this.outputDir = path.join(__dirname, '..', 'github-games-repo');
        this.gamesData = [];
    }

    async deploy(sourceDir) {
        this.sourceDir = sourceDir;
        
        console.log('🚀 开始本地部署准备');
        console.log(`📁 源路径: ${sourceDir}`);
        console.log(`📁 输出路径: ${this.outputDir}`);
        
        try {
            // 1. 分析游戏
            await this.analyzeGames();
            
            // 2. 创建输出目录
            await this.createOutputStructure();
            
            // 3. 复制游戏文件
            await this.copyGames();
            
            // 4. 生成配置文件
            await this.generateConfigFiles();
            
            // 5. 生成说明文档
            await this.generateDocumentation();
            
            console.log('✅ 本地部署准备完成！');
            console.log(`📁 请查看: ${this.outputDir}`);
            console.log('');
            console.log('🔄 下一步操作:');
            console.log('1. 在GitHub创建新仓库 "EduGameHQ-Games"');
            console.log('2. 将生成的文件上传到仓库');
            console.log('3. 在仓库设置中启用GitHub Pages');
            console.log('4. 配置自定义域名 games.edugamehq.com');
            
        } catch (error) {
            console.error('❌ 部署失败:', error.message);
            throw error;
        }
    }

    async analyzeGames() {
        console.log('🔍 分析游戏...');
        
        const items = await fs.readdir(this.sourceDir);
        
        for (const item of items) {
            const itemPath = path.join(this.sourceDir, item);
            const stat = await fs.stat(itemPath);
            
            if (stat.isDirectory() && !item.startsWith('.')) {
                const indexPath = path.join(itemPath, 'index.html');
                
                try {
                    await fs.access(indexPath);
                    const size = await this.calculateDirectorySize(itemPath);
                    
                    const gameData = {
                        name: this.formatTitle(item),
                        slug: item,
                        size: size,
                        sizeFormatted: this.formatBytes(size),
                        path: itemPath,
                        url: `https://games.edugamehq.com/games/${item}/`,
                        category: this.inferCategory(item),
                        description: this.generateDescription(item)
                    };
                    
                    this.gamesData.push(gameData);
                    console.log(`  ✅ ${gameData.name} (${gameData.sizeFormatted})`);
                } catch {
                    console.log(`  ⚠️  跳过 ${item} (没有index.html)`);
                }
            }
        }
        
        const totalSize = this.gamesData.reduce((sum, game) => sum + game.size, 0);
        console.log(`🎮 发现 ${this.gamesData.length} 个游戏，总大小: ${this.formatBytes(totalSize)}`);
    }

    async createOutputStructure() {
        console.log('📁 创建目录结构...');
        
        // 清理并创建输出目录
        try {
            await fs.rm(this.outputDir, { recursive: true, force: true });
        } catch {}
        
        await fs.mkdir(this.outputDir, { recursive: true });
        await fs.mkdir(path.join(this.outputDir, 'games'), { recursive: true });
        await fs.mkdir(path.join(this.outputDir, 'images'), { recursive: true });
        
        console.log('  ✅ 目录结构创建完成');
    }

    async copyGames() {
        console.log('📋 复制游戏文件...');
        
        for (const game of this.gamesData) {
            const targetDir = path.join(this.outputDir, 'games', game.slug);
            await this.copyDirectory(game.path, targetDir);
            console.log(`  ✅ ${game.name}`);
        }
    }

    async generateConfigFiles() {
        console.log('⚙️  生成配置文件...');
        
        // 生成CNAME文件
        await fs.writeFile(
            path.join(this.outputDir, 'CNAME'),
            'games.edugamehq.com'
        );
        
        // 生成games-manifest.json
        const manifest = {
            version: '1.0.0',
            generated: new Date().toISOString(),
            totalGames: this.gamesData.length,
            totalSize: this.gamesData.reduce((sum, game) => sum + game.size, 0),
            games: this.gamesData.map(game => ({
                slug: game.slug,
                name: game.name,
                category: game.category,
                description: game.description,
                url: game.url,
                size: game.size,
                sizeFormatted: game.sizeFormatted
            }))
        };
        
        await fs.writeFile(
            path.join(this.outputDir, 'games-manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // 生成主页index.html
        const indexHtml = this.generateIndexHtml(manifest);
        await fs.writeFile(
            path.join(this.outputDir, 'index.html'),
            indexHtml
        );
        
        console.log('  ✅ 配置文件生成完成');
    }

    async generateDocumentation() {
        console.log('📝 生成文档...');
        
        const readme = `# EduGameHQ Games Repository

这是EduGameHQ.com的原创游戏托管仓库。

## 游戏列表

${this.gamesData.map(game => `- **${game.name}** (${game.sizeFormatted}) - [在线游玩](${game.url})`).join('\n')}

## 统计信息

- 总游戏数: ${this.gamesData.length}
- 总大小: ${this.formatBytes(this.gamesData.reduce((sum, game) => sum + game.size, 0))}
- 最后更新: ${new Date().toLocaleDateString('zh-CN')}

## 技术信息

- 托管平台: GitHub Pages
- 自定义域名: games.edugamehq.com
- CDN: GitHub全球CDN
- SSL: 自动HTTPS

## 目录结构

\`\`\`
/
├── index.html              # 游戏索引页面
├── games-manifest.json     # 游戏清单文件
├── CNAME                   # 自定义域名配置
├── README.md              # 本文件
├── games/                 # 游戏目录
${this.gamesData.map(game => `│   ├── ${game.slug}/`).join('\n')}
└── images/                # 图片资源
\`\`\`

---
Generated by EduGameHQ Games Deployer
`;
        
        await fs.writeFile(
            path.join(this.outputDir, 'README.md'),
            readme
        );
        
        console.log('  ✅ 文档生成完成');
    }

    generateIndexHtml(manifest) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduGameHQ Games</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #2563eb;
        }
        .games-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .game-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .game-card:hover {
            transform: translateY(-2px);
        }
        .game-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
        }
        .game-meta {
            color: #6b7280;
            font-size: 0.9em;
            margin-bottom: 15px;
        }
        .play-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
        }
        .play-button:hover {
            background: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 EduGameHQ Games</h1>
        <p>Educational HTML5 Games Collection</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${manifest.totalGames}</div>
            <div>Total Games</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${this.formatBytes(manifest.totalSize)}</div>
            <div>Total Size</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">100%</div>
            <div>Free to Play</div>
        </div>
    </div>
    
    <div class="games-grid">
        ${manifest.games.map(game => `
        <div class="game-card">
            <div class="game-title">${game.name}</div>
            <div class="game-meta">
                Category: ${game.category} • Size: ${game.sizeFormatted}
            </div>
            <p>${game.description}</p>
            <a href="./games/${game.slug}/" class="play-button">Play Now</a>
        </div>
        `).join('')}
    </div>
    
    <footer style="text-align: center; margin-top: 60px; color: #6b7280;">
        <p>Powered by <a href="https://edugamehq.com" style="color: #2563eb;">EduGameHQ.com</a></p>
        <p>Last updated: ${new Date().toLocaleDateString()}</p>
    </footer>
</body>
</html>`;
    }

    // 工具函数
    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = await fs.stat(itemPath);
            
            if (stat.isDirectory()) {
                totalSize += await this.calculateDirectorySize(itemPath);
            } else {
                totalSize += stat.size;
            }
        }
        
        return totalSize;
    }

    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const items = await fs.readdir(src);
        
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = await fs.stat(srcPath);
            
            if (stat.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatTitle(slug) {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    inferCategory(slug) {
        const categoryMap = {
            'animal': 'science',
            'princess': 'art',
            'coloring': 'art',
            'matching': 'puzzle',
            'adventure': 'science',
            'castle': 'art',
            'coffee': 'math'
        };
        
        for (const [keyword, category] of Object.entries(categoryMap)) {
            if (slug.includes(keyword)) {
                return category;
            }
        }
        
        return 'puzzle';
    }

    generateDescription(slug) {
        const descriptions = {
            'animal-adventure': 'Explore the fascinating world of animals in this educational adventure game.',
            'animal-matching': 'Match different animals and learn about their characteristics.',
            'coloring-studio': 'Express your creativity with this digital coloring experience.',
            'princess-castle': 'Build and decorate your own magical princess castle.',
            'princess-coffee-shop': 'Run your own coffee shop and learn basic math skills.'
        };
        
        return descriptions[slug] || `An engaging educational game that makes learning fun and interactive.`;
    }
}

// 主执行逻辑
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1])) {
    const args = process.argv.slice(2);
    const sourceArg = args.find(arg => arg.startsWith('--source='));
    
    if (!sourceArg) {
        console.log('使用方法: node local-deploy.mjs --source=<游戏目录>');
        console.log('示例: node local-deploy.mjs --source=./temp-games/ellie');
        process.exit(1);
    }
    
    const source = sourceArg.split('=')[1];
    const deployer = new LocalGamesDeployer();
    
    deployer.deploy(source).catch(error => {
        console.error('部署失败:', error);
        process.exit(1);
    });
}

export default LocalGamesDeployer;