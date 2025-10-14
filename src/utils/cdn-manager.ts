/**
 * CDN和静态资源管理器
 * 
 * 为原创游戏和静态资源提供CDN加速和缓存优化
 * 支持多CDN策略和故障转移
 */

export interface CDNConfig {
  primary: string;
  fallback: string[];
  domains: {
    games: string;
    images: string;
    assets: string;
  };
  caching: {
    games: string;
    images: string;
    assets: string;
  };
}

export interface ResourceConfig {
  type: 'game' | 'image' | 'asset';
  path: string;
  version?: string;
  cacheBusting?: boolean;
  preload?: boolean;
}

/**
 * CDN配置预设
 */
export const CDN_CONFIGS = {
  // 生产环境配置
  production: {
    primary: 'https://cdn.edugamehq.com',
    fallback: [
      'https://games.edugamehq.com',
      'https://backup-cdn.edugamehq.com'
    ],
    domains: {
      games: 'https://games.edugamehq.com',
      images: 'https://images.edugamehq.com', 
      assets: 'https://assets.edugamehq.com'
    },
    caching: {
      games: 'public, max-age=86400, s-maxage=31536000', // 1天/1年
      images: 'public, max-age=31536000, immutable',      // 1年不变
      assets: 'public, max-age=31536000, immutable'       // 1年不变
    }
  },

  // 开发环境配置
  development: {
    primary: 'http://localhost:3000',
    fallback: [],
    domains: {
      games: 'http://localhost:3000',
      images: 'http://localhost:3000',
      assets: 'http://localhost:3000'
    },
    caching: {
      games: 'no-cache',
      images: 'no-cache',
      assets: 'no-cache'
    }
  },

  // GitHub Pages配置
  github: {
    primary: 'https://games.edugamehq.com',
    fallback: [
      'https://edugamehq.github.io/EduGameHQ-Games'
    ],
    domains: {
      games: 'https://games.edugamehq.com',
      images: 'https://edugamehq.github.io/EduGameHQ/images',
      assets: 'https://edugamehq.github.io/EduGameHQ/assets'
    },
    caching: {
      games: 'public, max-age=3600, s-maxage=86400',     // 1小时/1天
      images: 'public, max-age=86400, s-maxage=31536000', // 1天/1年
      assets: 'public, max-age=86400, s-maxage=31536000'  // 1天/1年
    }
  }
} as const;

/**
 * CDN和资源管理器
 */
export class CDNManager {
  private config: CDNConfig;
  private environment: 'production' | 'development' | 'github';

  constructor(environment: 'production' | 'development' | 'github' = 'production') {
    this.environment = environment;
    this.config = CDN_CONFIGS[environment];
  }

  /**
   * 获取资源URL
   */
  getResourceUrl(resource: ResourceConfig): string {
    const baseUrl = this.getBaseUrl(resource.type);
    let url = `${baseUrl}${resource.path}`;

    // 添加版本号或缓存破坏参数
    if (resource.version) {
      url += `?v=${resource.version}`;
    } else if (resource.cacheBusting) {
      url += `?t=${Date.now()}`;
    }

    return url;
  }

  /**
   * 获取游戏iframe URL
   */
  getGameUrl(slug: string, version?: string): string {
    return this.getResourceUrl({
      type: 'game',
      path: `/games/${slug}/`,
      version
    });
  }

  /**
   * 获取图片URL
   */
  getImageUrl(path: string, version?: string): string {
    return this.getResourceUrl({
      type: 'image',
      path: path.startsWith('/') ? path : `/${path}`,
      version
    });
  }

  /**
   * 获取资源URL
   */
  getAssetUrl(path: string, version?: string): string {
    return this.getResourceUrl({
      type: 'asset',
      path: path.startsWith('/') ? path : `/${path}`,
      version
    });
  }

  /**
   * 获取基础URL
   */
  private getBaseUrl(type: 'game' | 'image' | 'asset'): string {
    switch (type) {
      case 'game':
        return this.config.domains.games;
      case 'image':
        return this.config.domains.images;
      case 'asset':
        return this.config.domains.assets;
      default:
        return this.config.primary;
    }
  }

  /**
   * 生成预加载链接
   */
  generatePreloadLinks(resources: ResourceConfig[]): string[] {
    return resources
      .filter(resource => resource.preload)
      .map(resource => {
        const url = this.getResourceUrl(resource);
        const as = this.getResourceType(resource.type);
        return `<link rel="preload" href="${url}" as="${as}">`;
      });
  }

  /**
   * 获取资源类型
   */
  private getResourceType(type: string): string {
    switch (type) {
      case 'game':
        return 'document';
      case 'image':
        return 'image';
      case 'asset':
        return 'fetch';
      default:
        return 'fetch';
    }
  }

  /**
   * 生成缓存头
   */
  getCacheHeaders(type: 'game' | 'image' | 'asset'): Record<string, string> {
    const cacheControl = this.config.caching[type];
    
    return {
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': type === 'game' ? 'SAMEORIGIN' : 'DENY'
    };
  }

  /**
   * 检查资源可用性
   */
  async checkResourceAvailability(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取故障转移URL
   */
  async getUrlWithFallback(resource: ResourceConfig): Promise<string> {
    const primaryUrl = this.getResourceUrl(resource);
    
    // 检查主URL是否可用
    if (await this.checkResourceAvailability(primaryUrl)) {
      return primaryUrl;
    }

    // 尝试故障转移URL
    for (const fallbackDomain of this.config.fallback) {
      const fallbackUrl = `${fallbackDomain}${resource.path}`;
      if (await this.checkResourceAvailability(fallbackUrl)) {
        return fallbackUrl;
      }
    }

    // 如果所有URL都不可用，返回主URL
    return primaryUrl;
  }

  /**
   * 生成响应式图片URL
   */
  getResponsiveImageUrls(basePath: string, sizes: number[] = [320, 640, 1024, 1920]): Array<{size: number, url: string}> {
    return sizes.map(size => ({
      size,
      url: this.getImageUrl(`${basePath}-${size}w.webp`)
    }));
  }

  /**
   * 生成图片srcset
   */
  generateImageSrcSet(basePath: string, sizes: number[] = [320, 640, 1024, 1920]): string {
    const urls = this.getResponsiveImageUrls(basePath, sizes);
    return urls.map(({size, url}) => `${url} ${size}w`).join(', ');
  }

  /**
   * 优化游戏加载
   */
  optimizeGameLoading(gameSlug: string): {
    preloadUrl: string;
    iframeUrl: string;
    thumbnailUrl: string;
    preconnectUrls: string[];
  } {
    const gameUrl = this.getGameUrl(gameSlug);
    const thumbnailUrl = this.getImageUrl(`/games/${gameSlug}-thumbnail.webp`);
    
    return {
      preloadUrl: gameUrl,
      iframeUrl: gameUrl,
      thumbnailUrl,
      preconnectUrls: [
        this.config.domains.games,
        this.config.domains.images
      ]
    };
  }

  /**
   * 生成性能优化标签
   */
  generatePerformanceTags(gameSlug: string): string[] {
    const optimization = this.optimizeGameLoading(gameSlug);
    
    return [
      // DNS预连接
      ...optimization.preconnectUrls.map(url => 
        `<link rel="preconnect" href="${url}" crossorigin>`
      ),
      // 游戏预加载
      `<link rel="prefetch" href="${optimization.preloadUrl}">`,
      // 缩略图预加载
      `<link rel="preload" href="${optimization.thumbnailUrl}" as="image">`
    ];
  }
}

/**
 * 静态资源优化器
 */
export class StaticResourceOptimizer {
  private cdnManager: CDNManager;

  constructor(environment: 'production' | 'development' | 'github' = 'production') {
    this.cdnManager = new CDNManager(environment);
  }

  /**
   * 优化图片加载
   */
  optimizeImage(src: string, alt: string, options: {
    sizes?: string;
    loading?: 'lazy' | 'eager';
    priority?: boolean;
  } = {}): {
    src: string;
    srcSet?: string;
    sizes?: string;
    loading: 'lazy' | 'eager';
    alt: string;
    decoding: 'async' | 'sync';
  } {
    const {
      sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
      loading = 'lazy',
      priority = false
    } = options;

    // 生成响应式图片
    const basePath = src.replace(/\.[^/.]+$/, ''); // 移除扩展名
    const srcSet = this.cdnManager.generateImageSrcSet(basePath);

    return {
      src: this.cdnManager.getImageUrl(src),
      srcSet,
      sizes,
      loading: priority ? 'eager' : loading,
      alt,
      decoding: priority ? 'sync' : 'async'
    };
  }

  /**
   * 生成关键资源预加载
   */
  generateCriticalResourcePreloads(): string[] {
    return [
      // 关键CSS
      `<link rel="preload" href="${this.cdnManager.getAssetUrl('/css/critical.css')}" as="style">`,
      // 关键字体
      `<link rel="preload" href="${this.cdnManager.getAssetUrl('/fonts/inter-var.woff2')}" as="font" type="font/woff2" crossorigin>`,
      // 关键JavaScript
      `<link rel="preload" href="${this.cdnManager.getAssetUrl('/js/critical.js')}" as="script">`
    ];
  }

  /**
   * 生成资源提示
   */
  generateResourceHints(): string[] {
    return [
      // DNS预解析
      '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="//www.google-analytics.com">',
      // 预连接到CDN
      `<link rel="preconnect" href="${this.cdnManager.config.domains.games}" crossorigin>`,
      `<link rel="preconnect" href="${this.cdnManager.config.domains.images}" crossorigin>`
    ];
  }
}

/**
 * React Hook for CDN resources
 */
export function useCDN(environment?: 'production' | 'development' | 'github') {
  const cdnManager = new CDNManager(environment);
  const optimizer = new StaticResourceOptimizer(environment);

  return {
    getGameUrl: (slug: string, version?: string) => cdnManager.getGameUrl(slug, version),
    getImageUrl: (path: string, version?: string) => cdnManager.getImageUrl(path, version),
    getAssetUrl: (path: string, version?: string) => cdnManager.getAssetUrl(path, version),
    optimizeImage: (src: string, alt: string, options?: any) => optimizer.optimizeImage(src, alt, options),
    optimizeGameLoading: (gameSlug: string) => cdnManager.optimizeGameLoading(gameSlug),
    generatePerformanceTags: (gameSlug: string) => cdnManager.generatePerformanceTags(gameSlug)
  };
}

/**
 * 环境检测
 */
export function detectEnvironment(): 'production' | 'development' | 'github' {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    if (hostname.includes('github.io') || hostname.includes('pages.dev')) {
      return 'github';
    }
  }
  
  return 'production';
}

/**
 * 默认导出
 */
export default CDNManager;