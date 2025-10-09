// 通用sitemap生成工具
import fs from 'fs';
import path from 'path';
import type { Game } from '../types/game';

export function generateSitemapForLanguage(languageCode: string) {
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

  // 根据语言代码生成对应的URL
  const localizedStaticPages = languageCode === 'en' 
    ? staticPages 
    : staticPages.map((page: any) => ({
        ...page,
        url: `/${languageCode}${page.url === '/' ? '' : page.url}`
      }));

  // 游戏页面URL
  const localizedGamePages = gamesData.map((game: Game) => ({
    url: languageCode === 'en' 
      ? `/games/${game.slug}` 
      : `/${languageCode}/games/${game.slug}`,
    priority: game.featured ? '0.8' : '0.7',
    changefreq: 'monthly',
    lastmod: game.lastUpdated || new Date().toISOString().split('T')[0]
  }));

  // 合并所有URL
  const allPages = [...localizedStaticPages, ...localizedGamePages];

  // 所有支持的语言
  const allLanguages = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'hi', 'ko', 'ar', 'he'];
  
  // 生成hreflang链接
  const generateHreflang = (pagePath: string) => {
    return allLanguages.map(lang => {
      const hreflangUrl = lang === 'en' 
        ? `${baseUrl}${pagePath.replace(`/${languageCode}`, '')}`
        : `${baseUrl}/${lang}${pagePath.replace(`/${languageCode}`, '').replace(/^\//, '')}`;
      
      return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${hreflangUrl}"/>`;
    }).join('\n');
  };

  // 生成XML内容（带hreflang支持）
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages.map(page => {
  // 提取纯路径（不含语言前缀）
  const purePath = page.url.replace(`/${languageCode}`, '').replace(/^\//, '');
  
  return `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${generateHreflang(`/${purePath}`)}
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // 缓存1小时
    }
  });
}