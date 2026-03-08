/**
 * SEO国际化工具函数
 * 用于从翻译文件获取本地化的SEO元数据
 */

import { getTranslations, removeLanguagePrefix, type LanguageCode, type TranslationData } from '../i18n/utils';
import { getPageSEO } from '../data/seo-config';

export interface LocalizedSEOData {
  title: string;
  description: string;
  keywords: string;
}

/**
 * 根据页面路径和语言获取本地化的SEO数据
 * @param path 页面路径
 * @param lang 语言代码
 * @returns 本地化的SEO数据
 */
export async function getLocalizedSEO(path: string, lang: LanguageCode): Promise<LocalizedSEOData> {
  const translations = await getTranslations(lang);

  const normalizedPath = normalizeSEOPath(path);

  // 获取默认的英文SEO配置作为后备
  const defaultSEO = getPageSEO(normalizedPath);

  // 使用翻译文件中实际存在的SEO键映射
  const seoKeyMap: Record<string, string> = {
    '/': 'seo.home_page',
    '/about': 'about_page.seo',
    '/math-games': 'seo.math_games',
    '/science-games': 'seo.science_games',
    '/coding-games': 'seo.coding_games',
    '/trending': 'trending_games.seo',
    '/new-games': 'new_games_page.seo',
    '/recently-played': 'recently_played.seo',
    '/favorites': 'favorites_page.seo',
    '/help': 'help_page.seo',
    '/privacy-policy': 'privacy_policy_page.seo',
    '/terms-of-service': 'terms_page.seo'
  };
  const seoKey = seoKeyMap[normalizedPath] || '';

  // 尝试从翻译文件获取SEO数据
  if (seoKey && translations) {
    try {
      const seoData = getSEOFromTranslations(translations, seoKey);
      if (seoData) {
        return seoData;
      }
    } catch (error) {
      console.warn(`无法获取${lang}语言的SEO翻译 (${seoKey}):`, error);
    }
  }
  
  // 如果没有找到翻译，返回默认的英文SEO配置
  return {
    title: defaultSEO.title,
    description: defaultSEO.description,
    keywords: Array.isArray(defaultSEO.keywords) ? defaultSEO.keywords.join(', ') : defaultSEO.keywords
  };
}

/**
 * 从翻译对象中提取SEO数据
 * @param translations 翻译对象
 * @param seoKey SEO键路径
 * @returns SEO数据或null
 */
function getSEOFromTranslations(translations: TranslationData, seoKey: string): LocalizedSEOData | null {
  const keys = seoKey.split('.');
  let current: any = translations;
  
  // 遍历键路径
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  // 检查是否包含必要的SEO字段
  if (current && typeof current === 'object' && 
      'title' in current && 'description' in current && 'keywords' in current) {
    const seoData = current as any;
    return {
      title: String(seoData.title),
      description: String(seoData.description),
      keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : String(seoData.keywords)
    };
  }
  
  return null;
}

function normalizeSEOPath(path: string): string {
  const pathWithoutHash = path.split('#')[0] || '/';
  const pathWithoutQuery = pathWithoutHash.split('?')[0] || '/';
  const cleanPath = removeLanguagePrefix(pathWithoutQuery);
  if (cleanPath === '/') {
    return '/';
  }
  return cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath;
}

/**
 * 获取本地化的页面标题（包含站点名称）
 * @param baseTitle 基础标题
 * @param lang 语言代码
 * @returns 完整的页面标题
 */
export async function getLocalizedPageTitle(baseTitle: string, lang: LanguageCode): Promise<string> {
  const translations = await getTranslations(lang);
  // 安全地访问嵌套属性
  const general = translations?.general as any;
  const siteName = general?.site_name || 'EduGameHQ';
  
  return `${baseTitle} | ${siteName}`;
}

/**
 * 获取本地化的关键词字符串
 * @param keywords 关键词数组或字符串
 * @returns 关键词字符串
 */
export function getLocalizedKeywords(keywords: string[] | string): string {
  if (Array.isArray(keywords)) {
    return keywords.join(', ');
  }
  return keywords;
}
