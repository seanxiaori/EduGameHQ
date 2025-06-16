export interface Game {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  iframeUrl: string;
  thumbnailUrl?: string;
  url?: string;
  image?: string;
  imageFallback?: string;
  ageRange: string;
  minAge: number;
  maxAge: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating?: number;
  playCount?: number;
  tags: string[];
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
  learningObjectives?: string[];
  gameFeatures?: string[];
  duration?: string;
  howToPlay?: string[];
  screenshots?: string[];
  gameGuide?: {
    howToPlay: string[];
    controls?: {
      keyboard?: string;
      mouse?: string;
      touch?: string;
    };
    tips?: string[];
  };
  source: string;
  iframeCompatible: boolean;
  verified: boolean;
  technology?: string;
  mobileSupport?: boolean;
  responsive?: boolean;
  sourceUrl?: string;
  lastUpdated?: string;
  lastChecked?: string;
  developer?: string;
  releaseDate?: string;
}

export interface GameData {
  [key: string]: Game;
}

export interface GamesByCategory {
  [category: string]: number;
}

export interface GameHistory {
  slug: string;
  title: string;
  timestamp: number;
}

// 扩展Window接口以支持自定义属性
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    playRandomGame: () => void;
    performSearch?: (query: string) => void;
  }
} 