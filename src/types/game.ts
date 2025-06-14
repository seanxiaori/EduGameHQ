export interface Game {
  title: string;
  description: string;
  category: string;
  categoryName: string;
  ageRange: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  iframeUrl: string;
  howToPlay: string[];
  images: string[];
  screenshots: string[];
  playCount?: number;
  learningObjectives?: string[];
  gameFeatures?: string[];
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
  }
} 