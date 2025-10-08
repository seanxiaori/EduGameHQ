// 动态生成sitemap.xml文件
import fs from 'fs';
import path from 'path';

export async function GET() {
  // 读取游戏数据
  const gamesPath = path.join(process.cwd(), 'src', 'data', 'games.json');
  const gamesData = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));

  // 基础URL
  const baseUrl = 'https://www.edugamehq.com';
  
  // 静态页面URL
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/math-games', priority: '0.9', changefreq: 'weekly' },
    { url: '/science-games', priority: '0.9', changefreq: 'weekly' },
    { url: '/language-games', priority: '0.9', changefreq: 'weekly' },
    { url: '/puzzle-games', priority: '0.9', changefreq: 'weekly' },
    { url: '/sports-games', priority: '0.9', changefreq: 'weekly' },
    { url: '/art-games', priority: '0.9', changefreq: 'weekly' },
    { url: '/trending', priority: '0.8', changefreq: 'daily' },
    { url: '/new-games', priority: '0.8', changefreq: 'daily' },
    { url: '/recently-played', priority: '0.6', changefreq: 'never' },
    { url: '/favorites', priority: '0.6', changefreq: 'never' },
    { url: '/search', priority: '0.7', changefreq: 'monthly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/help', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy-policy', priority: '0.4', changefreq: 'yearly' },
    { url: '/terms-of-service', priority: '0.4', changefreq: 'yearly' }
  ];

  // 为中文版创建对应的静态页面URL
  const staticPagesZh = staticPages.map(page => ({
    ...page,
    url: `/zh${page.url === '/' ? '' : page.url}`
  }));

  // 游戏页面URL
  const gamePages = gamesData.map((game: any) => ({
    url: `/games/${game.slug}`,
    priority: game.featured ? '0.8' : '0.7',
    changefreq: 'monthly',
    lastmod: game.updatedAt || new Date().toISOString().split('T')[0]
  }));

  // 为中文版创建对应的游戏页面URL
  const gamePagesZh = gamePages.map((page: any) => ({
    ...page,
    url: `/zh${page.url}`
  }));

  // 合并所有URL
  const allPages = [...staticPages, ...gamePages, ...staticPagesZh, ...gamePagesZh];

  // 生成XML内容
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // 缓存1小时
    }
  });
}