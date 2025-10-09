// Sitemap索引文件 - 管理所有11种语言的sitemap
export async function GET() {
  const baseUrl = 'https://www.edugamehq.com';
  const lastmod = new Date().toISOString().split('T')[0];
  
  // 11种语言的sitemap URL
  const languages = [
    'en',   // 英语（根路径）
    'zh',   // 中文
    'es',   // 西班牙语
    'fr',   // 法语
    'de',   // 德语
    'ja',   // 日语
    'ru',   // 俄语
    'hi',   // 印地语
    'ko',   // 韩语
    'ar',   // 阿拉伯语
    'he'    // 希伯来语
  ];
  
  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${languages.map(lang => {
  const sitemapUrl = lang === 'en' 
    ? `${baseUrl}/sitemap.xml`
    : `${baseUrl}/${lang}/sitemap.xml`;
  
  return `  <sitemap>
    <loc>${sitemapUrl}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;
}).join('\n')}
</sitemapindex>`;

  return new Response(sitemapIndexXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

