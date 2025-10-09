import { languages, defaultLanguage, supportedLanguages, rtlLanguages, type LanguageCode } from './config';

// 重新导出 LanguageCode 类型
export type { LanguageCode };

// 翻译数据类型
export interface TranslationData {
  [key: string]: string | TranslationData;
}

/**
 * 从URL路径中提取语言代码
 * @param pathname - 当前路径
 * @returns 语言代码
 */
export function getLanguageFromPath(pathname: string): LanguageCode {
  // 移除开头的斜杠
  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  
  // 获取路径的第一段
  const firstSegment = cleanPath.split('/')[0];
  
  // 检查是否是支持的语言代码
  if (supportedLanguages.includes(firstSegment as LanguageCode)) {
    return firstSegment as LanguageCode;
  }
  
  return defaultLanguage;
}

/**
 * 获取当前语言的翻译数据
 * @param lang - 语言代码
 * @returns 翻译数据
 */
export async function getTranslations(lang: LanguageCode): Promise<TranslationData> {
  try {
    // 动态导入翻译文件
    const translations = await import(`./locales/${lang}.json`);
    const data = translations.default || translations;
    

    
    return data;
  } catch (error) {
    console.error(`--- [深度调试] 加载 '${lang}.json' 失败 ---`);
    console.error('根本错误原因:', error);
    console.error(`--- [深度调试] 结束 ---`);
    console.warn(`Failed to load translations for ${lang}, falling back to ${defaultLanguage}`);
    
    // 回退到默认语言
    if (lang !== defaultLanguage) {
      return getTranslations(defaultLanguage);
    }
    
    // 如果默认语言也失败，返回空对象
    return {};
  }
}

/**
 * 翻译函数
 * @param translations - 翻译数据
 * @param key - 翻译键（支持嵌套，如 "nav.home"）
 * @param fallback - 回退文本
 * @returns 翻译后的文本
 */
export function t(translations: TranslationData, key: string, fallback?: string): string {
  const keys = key.split('.');
  let current: any = translations;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // 如果找不到翻译，返回回退文本或键名
      return fallback || key;
    }
  }
  
  return typeof current === 'string' ? current : (fallback || key);
}

/**
 * 获取本地化的URL路径
 * @param path - 原始路径
 * @param lang - 目标语言
 * @returns 本地化的路径
 */
export function getLocalizedPath(path: string, lang: LanguageCode): string {
  // 移除现有的语言前缀
  const cleanPath = removeLanguagePrefix(path);
  
  // 英语使用根路径，其他语言添加语言前缀
  if (lang === 'en') {
    return cleanPath === '/' ? '/' : cleanPath;
  }
  
  // 其他语言添加语言前缀
  const langPrefix = `/${lang}`;
  return cleanPath === '/' ? langPrefix : `${langPrefix}${cleanPath}`;
}

/**
 * 移除路径中的语言前缀
 * @param path - 原始路径
 * @returns 清理后的路径
 */
export function removeLanguagePrefix(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const segments = cleanPath.split('/');
  
  // 如果第一段是语言代码，移除它
  if (segments.length > 0 && supportedLanguages.includes(segments[0] as LanguageCode)) {
    segments.shift();
  }
  
  const result = '/' + segments.join('/');
  return result === '/' ? '/' : result.replace(/\/$/, '');
}

/**
 * 检查语言是否为RTL
 * @param lang - 语言代码
 * @returns 是否为RTL
 */
export function isRTL(lang: LanguageCode): boolean {
  return rtlLanguages.includes(lang);
}

/**
 * 获取语言信息
 * @param lang - 语言代码
 * @returns 语言信息
 */
export function getLanguageInfo(lang: LanguageCode) {
  return languages[lang] || languages[defaultLanguage];
}

/**
 * 获取所有可用语言的切换链接
 * @param currentPath - 当前路径
 * @returns 语言切换链接数组
 */
export function getLanguageSwitchLinks(currentPath: string) {
  const cleanPath = removeLanguagePrefix(currentPath);
  
  return supportedLanguages.map(lang => ({
    code: lang,
    name: languages[lang].name,
    nativeName: languages[lang].nativeName,
    flag: languages[lang].flag,
    url: getLocalizedPath(cleanPath, lang),
    dir: languages[lang].dir
  }));
}

/**
 * 翻译游戏数据
 * @param game - 游戏对象
 * @param translations - 翻译数据
 * @returns 翻译后的游戏对象
 */
export function translateGame(game: any, translations: TranslationData) {
  return {
    ...game,
    title: t(translations, `games.${game.slug}.title`, game.title),
    description: t(translations, `games.${game.slug}.description`, game.description),
    category: t(translations, `categories.${game.category}`, game.category)
  };
}

/**
 * 翻译游戏列表
 * @param games - 游戏列表
 * @param translations - 翻译数据
 * @returns 翻译后的游戏列表
 */
export function translateGames(games: any[], translations: TranslationData) {
  return games.map(game => translateGame(game, translations));
}