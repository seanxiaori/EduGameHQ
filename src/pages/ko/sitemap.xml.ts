// 韩语版sitemap.xml文件
import { generateSitemapForLanguage } from '../../utils/sitemap-generator';

export async function GET() {
  return generateSitemapForLanguage('ko');
}

