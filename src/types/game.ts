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
  popularity?: number;
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
    howToPlay?: string[];
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
  id?: string;
  embedUrl?: string;
  thumbnail?: string;
  subcategory?: string;
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

export interface GameStatsManager {
  recordGameStart: (slug: string, gameInfo: any) => void;
  recordGameEnd: (slug: string, playTime: number) => void;
  recordGameRestart: (slug: string) => void;
  recordGameFullscreen: (slug: string, isFullscreen: boolean) => void;
  recordIframeLoadTime: (slug: string, loadTime: number) => void;
  updateGameActivity: (slug: string) => void;
  iframeStats?: {
    [slug: string]: {
      interactionCount: number;
      interactionDensity: number;
      lastInteraction: any;
    };
  };
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    playRandomGame: () => void;
    performSearch?: (query: string) => void;
    gameStatsManager?: GameStatsManager;
    openShareModal?: (title: string, url: string, description: string, image: string) => void;
    toggleFullscreen?: () => void;
    restartGame?: () => void;
    loadGameIframe?: () => void;
    GAMES_DATA?: any[];
    initImageLazyLoading?: () => void;
  }
} 