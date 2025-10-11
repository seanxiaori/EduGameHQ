/**
 * SEO国际化工具函数
 * 用于从翻译文件获取本地化的SEO元数据
 */

import { getTranslations, type LanguageCode, type TranslationData } from '../i18n/utils';
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
  console.log('🔍 SEO国际化调试 - 路径:', path, '语言:', lang);
  
  const translations = await getTranslations(lang);
  console.log('📝 翻译数据获取状态:', translations ? '成功' : '失败');
  
  // 获取默认的英文SEO配置作为后备
  const defaultSEO = getPageSEO(path);
  console.log('🔧 默认SEO配置:', defaultSEO);
  
  // 根据路径确定翻译键
  let seoKey = '';
  
  if (path.includes('/about')) {
    seoKey = 'about_page.seo';
    console.log('📍 匹配到about页面，SEO键:', seoKey);
  } else if (path === '/' || path.includes('/index')) {
    seoKey = 'seo.home_page';
  } else if (path.includes('/math-games')) {
    seoKey = 'seo.math_games';
  } else if (path.includes('/science-games')) {
    seoKey = 'seo.science_games';
  } else if (path.includes('/coding-games')) {
    seoKey = 'seo.coding_games';
  } else if (path.includes('/language-games')) {
    seoKey = 'seo.language_games';
  } else if (path.includes('/puzzle-games')) {
    seoKey = 'seo.puzzle_games';
  } else if (path.includes('/sports-games')) {
    seoKey = 'seo.sports_games';
  } else if (path.includes('/art-games')) {
    seoKey = 'categories.art_games.seo';
  } else if (path.includes('/trending')) {
    seoKey = 'special_pages.trending.seo';
  } else if (path.includes('/new-games')) {
    seoKey = 'special_pages.new_games.seo';
  } else if (path.includes('/recently-played')) {
    seoKey = 'special_pages.recently_played.seo';
  } else if (path.includes('/favorites')) {
    seoKey = 'special_pages.favorites.seo';
  } else if (path.includes('/search')) {
    seoKey = 'special_pages.search.seo';
  } else if (path.includes('/help')) {
    seoKey = 'support_pages.help.seo';
  } else if (path.includes('/privacy')) {
    seoKey = 'support_pages.privacy.seo';
  } else if (path.includes('/terms')) {
    seoKey = 'support_pages.terms.seo';
  }
  
  // 尝试从翻译文件获取SEO数据
  console.log('🔑 SEO键:', seoKey);
  if (seoKey && translations) {
    try {
      const seoData = getSEOFromTranslations(translations, seoKey);
      console.log('📊 获取到的SEO数据:', seoData);
      if (seoData) {
        console.log('✅ 返回本地化SEO数据');
        return seoData;
      }
    } catch (error) {
      console.warn(`无法获取${lang}语言的SEO翻译 (${seoKey}):`, error);
    }
  }
  
  // 如果没有找到翻译，返回默认的英文SEO配置
  console.log('⚠️ 使用默认英文SEO配置');
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
      keywords: String(seoData.keywords)
    };
  }
  
  return null;
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