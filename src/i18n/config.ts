// 多语言配置文件
export const languages = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    default: true
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文简体',
    flag: '🇨🇳',
    dir: 'ltr'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr'
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    dir: 'ltr'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl'
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    dir: 'rtl'
  }
} as const;

export type LanguageCode = keyof typeof languages;

// 默认语言
export const defaultLanguage: LanguageCode = 'en';

// 支持的语言列表
export const supportedLanguages = Object.keys(languages) as LanguageCode[];

// RTL语言列表
export const rtlLanguages: LanguageCode[] = ['ar', 'he'];

// 语言路径映射
export const languagePathMap = {
  en: '', // 英语使用根路径
  zh: '/zh',
  es: '/es',
  fr: '/fr',
  de: '/de',
  ja: '/ja',
  ru: '/ru',
  hi: '/hi',
  ko: '/ko',
  ar: '/ar',
  he: '/he'
} as const; 