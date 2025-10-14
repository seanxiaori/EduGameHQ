/**
 * iframe 安全配置工具
 * 
 * 为原创游戏和第三方游戏提供安全的iframe配置
 * 确保儿童安全和数据保护
 */

export interface IframeSecurityConfig {
  sandbox: string[];
  allow: string[];
  csp: string;
  referrerPolicy: string;
  loading: 'lazy' | 'eager';
}

export interface GameSecurityProfile {
  source: 'original' | 'third-party';
  trustLevel: 'high' | 'medium' | 'low';
  domain?: string;
  features: string[];
}

/**
 * 安全配置预设
 */
export const SECURITY_PRESETS = {
  // 原创游戏 - 最高信任级别
  original: {
    sandbox: [
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
      'allow-pointer-lock',
      'allow-orientation-lock'
    ],
    allow: [
      'fullscreen',
      'autoplay',
      'encrypted-media',
      'gyroscope',
      'accelerometer'
    ],
    csp: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;",
    referrerPolicy: 'strict-origin-when-cross-origin',
    loading: 'eager' as const
  },

  // 可信第三方 - 中等信任级别
  trustedThirdParty: {
    sandbox: [
      'allow-scripts',
      'allow-same-origin',
      'allow-forms'
    ],
    allow: [
      'fullscreen',
      'autoplay'
    ],
    csp: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;",
    referrerPolicy: 'strict-origin-when-cross-origin',
    loading: 'lazy' as const
  },

  // 未知第三方 - 低信任级别
  untrustedThirdParty: {
    sandbox: [
      'allow-scripts'
    ],
    allow: [],
    csp: "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:;",
    referrerPolicy: 'no-referrer',
    loading: 'lazy' as const
  }
} as const;

/**
 * 域名信任级别配置
 */
export const DOMAIN_TRUST_LEVELS = {
  // 高信任域名
  high: [
    'games.edugamehq.com',  // 我们的原创游戏域名
    'localhost',
    '127.0.0.1'
  ],
  
  // 中等信任域名
  medium: [
    'crazygames.com',
    'abcya.com',
    'pbskids.org',
    'natgeokids.com',
    'educationcom',
    'turtlediary.com',
    'sheppardsoftware.com',
    'mathplayground.com',
    'funbrain.com'
  ],
  
  // 低信任域名（需要严格限制）
  low: []
};

/**
 * 游戏安全配置生成器
 */
export class IframeSecurityManager {
  /**
   * 根据游戏信息生成安全配置
   */
  static generateConfig(gameUrl: string, source?: string): IframeSecurityConfig {
    const profile = this.analyzeGameSecurity(gameUrl, source);
    return this.getConfigForProfile(profile);
  }

  /**
   * 分析游戏安全级别
   */
  private static analyzeGameSecurity(gameUrl: string, source?: string): GameSecurityProfile {
    try {
      const url = new URL(gameUrl);
      const domain = url.hostname;

      // 检查是否为原创游戏
      if (this.isOriginalGame(domain)) {
        return {
          source: 'original',
          trustLevel: 'high',
          domain,
          features: ['fullscreen', 'autoplay', 'orientation-lock']
        };
      }

      // 检查域名信任级别
      const trustLevel = this.getDomainTrustLevel(domain);
      
      return {
        source: 'third-party',
        trustLevel,
        domain,
        features: trustLevel === 'high' ? ['fullscreen', 'autoplay'] : 
                 trustLevel === 'medium' ? ['fullscreen'] : []
      };

    } catch (error) {
      // URL解析失败，使用最严格的安全设置
      return {
        source: 'third-party',
        trustLevel: 'low',
        features: []
      };
    }
  }

  /**
   * 检查是否为原创游戏
   */
  private static isOriginalGame(domain: string): boolean {
    return DOMAIN_TRUST_LEVELS.high.includes(domain) || 
           domain.includes('edugamehq.com');
  }

  /**
   * 获取域名信任级别
   */
  private static getDomainTrustLevel(domain: string): 'high' | 'medium' | 'low' {
    if (DOMAIN_TRUST_LEVELS.high.some(trusted => domain.includes(trusted))) {
      return 'high';
    }
    
    if (DOMAIN_TRUST_LEVELS.medium.some(trusted => domain.includes(trusted))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * 根据安全配置文件获取配置
   */
  private static getConfigForProfile(profile: GameSecurityProfile): IframeSecurityConfig {
    if (profile.source === 'original') {
      return SECURITY_PRESETS.original;
    }

    switch (profile.trustLevel) {
      case 'high':
      case 'medium':
        return SECURITY_PRESETS.trustedThirdParty;
      case 'low':
      default:
        return SECURITY_PRESETS.untrustedThirdParty;
    }
  }

  /**
   * 生成iframe HTML属性
   */
  static generateIframeAttributes(gameUrl: string, source?: string): Record<string, string> {
    const config = this.generateConfig(gameUrl, source);
    
    return {
      src: gameUrl,
      sandbox: config.sandbox.join(' '),
      allow: config.allow.join('; '),
      referrerpolicy: config.referrerPolicy,
      loading: config.loading,
      // 安全相关属性
      'data-security-level': this.analyzeGameSecurity(gameUrl, source).trustLevel,
      'data-source': this.analyzeGameSecurity(gameUrl, source).source
    };
  }

  /**
   * 生成CSP头部
   */
  static generateCSPHeader(gameUrl: string, source?: string): string {
    const config = this.generateConfig(gameUrl, source);
    return config.csp;
  }

  /**
   * 验证游戏URL安全性
   */
  static validateGameUrl(gameUrl: string): { valid: boolean; reason?: string } {
    try {
      const url = new URL(gameUrl);
      
      // 检查协议
      if (!['https:', 'http:'].includes(url.protocol)) {
        return { valid: false, reason: 'Invalid protocol. Only HTTP/HTTPS allowed.' };
      }

      // 检查是否为本地开发环境
      const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
      
      // 生产环境必须使用HTTPS
      if (!isLocal && url.protocol !== 'https:') {
        return { valid: false, reason: 'HTTPS required for external games.' };
      }

      // 检查是否在黑名单中
      if (this.isBlacklisted(url.hostname)) {
        return { valid: false, reason: 'Domain is blacklisted.' };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, reason: 'Invalid URL format.' };
    }
  }

  /**
   * 检查域名是否在黑名单中
   */
  private static isBlacklisted(domain: string): boolean {
    const blacklist = [
      // 添加需要屏蔽的域名
      'malicious-site.com',
      'unsafe-games.net'
    ];
    
    return blacklist.some(blocked => domain.includes(blocked));
  }

  /**
   * 生成安全的iframe HTML
   */
  static generateSecureIframe(gameUrl: string, options: {
    width?: string;
    height?: string;
    title?: string;
    className?: string;
    source?: string;
  } = {}): string {
    const validation = this.validateGameUrl(gameUrl);
    if (!validation.valid) {
      throw new Error(`Invalid game URL: ${validation.reason}`);
    }

    const attributes = this.generateIframeAttributes(gameUrl, options.source);
    const {
      width = '100%',
      height = '600px',
      title = 'Educational Game',
      className = 'game-iframe'
    } = options;

    const attributeString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    return `<iframe 
      ${attributeString}
      width="${width}"
      height="${height}"
      title="${title}"
      class="${className}"
      frameborder="0"
      allowtransparency="true">
      <p>Your browser does not support iframes. Please <a href="${gameUrl}" target="_blank">click here</a> to play the game.</p>
    </iframe>`;
  }
}

/**
 * React Hook for iframe security
 */
export function useIframeSecurity(gameUrl: string, source?: string) {
  const config = IframeSecurityManager.generateConfig(gameUrl, source);
  const attributes = IframeSecurityManager.generateIframeAttributes(gameUrl, source);
  const validation = IframeSecurityManager.validateGameUrl(gameUrl);

  return {
    config,
    attributes,
    validation,
    isSecure: validation.valid,
    securityLevel: IframeSecurityManager.analyzeGameSecurity(gameUrl, source).trustLevel
  };
}

/**
 * 默认导出
 */
export default IframeSecurityManager;