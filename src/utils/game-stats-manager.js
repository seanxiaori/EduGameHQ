/**
 * 游戏统计数据管理器 - 实时动态数据支持 (iframe优化版)
 * 负责管理游戏播放次数、历史记录、人气值等动态数据
 * 
 * 功能特性：
 * - 真实播放次数记录
 * - 智能游戏时间追踪 (针对iframe优化)
 * - 动态人气值计算
 * - 智能游戏历史标签
 * - 跨页面数据同步
 * - iframe游戏行为分析
 */

class GameStatsManager {
  constructor() {
    // localStorage存储键名
    this.STORAGE_KEYS = {
      PLAY_STATS: 'gamePlayStats',      // 游戏播放统计
      PLAY_HISTORY: 'gamePlayHistory',  // 游戏历史记录
      USER_STATS: 'userGameStats',      // 用户统计数据
      IFRAME_STATS: 'iframeGameStats'   // iframe游戏特殊统计
    };
    
    // iframe游戏行为监听器
    this.iframeListeners = new Map();
    this.activeGameSessions = new Map();
    
    // 初始化
    this.init();
  }

  /**
   * 初始化管理器
   */
  init() {
    this.loadStats();
    this.setupEventListeners();
    this.setupIframeMonitoring();
    
    // 页面加载完成后更新人气值显示
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.updatePopularityDisplay(), 100);
      });
    } else {
      setTimeout(() => this.updatePopularityDisplay(), 100);
    }
    
    console.log('🎮 游戏统计管理器初始化完成 (iframe优化版)');
  }

  /**
   * 设置iframe游戏监听
   */
  setupIframeMonitoring() {
    // 监听iframe加载状态
    this.monitorIframeLoading();
    
    // 监听用户交互行为
    this.monitorUserInteraction();
    
    // 智能时间追踪
    this.setupSmartTimeTracking();
  }

  /**
   * 监听iframe加载状态
   */
  monitorIframeLoading() {
    // 使用MutationObserver监听iframe元素的变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedIframes = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === 1 && node.tagName === 'IFRAME');
          
          addedIframes.forEach(iframe => {
            this.attachIframeListeners(iframe);
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 监听现有的iframe
    document.querySelectorAll('iframe').forEach(iframe => {
      this.attachIframeListeners(iframe);
    });
  }

  /**
   * 为iframe附加监听器
   */
  attachIframeListeners(iframe) {
    if (!iframe.src || iframe.dataset.statsAttached) return;
    
    iframe.dataset.statsAttached = 'true';
    
    // iframe加载完成事件
    iframe.addEventListener('load', () => {
      console.log('🎮 iframe游戏加载完成:', iframe.src);
      this.onIframeGameLoaded(iframe);
    });

    // iframe错误事件
    iframe.addEventListener('error', () => {
      console.log('❌ iframe游戏加载失败:', iframe.src);
      this.onIframeGameError(iframe);
    });
  }

  /**
   * iframe游戏加载完成处理
   */
  onIframeGameLoaded(iframe) {
    const gameSlug = this.extractGameSlugFromUrl(window.location.pathname);
    if (!gameSlug) return;

    // 记录iframe游戏特殊统计
    this.recordIframeGameLoad(gameSlug, iframe.src);
    
    // 开始智能时间追踪
    this.startSmartTimeTracking(gameSlug);
  }

  /**
   * 记录iframe游戏加载
   */
  recordIframeGameLoad(gameSlug, iframeSrc) {
    if (!this.iframeStats) {
      this.iframeStats = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.IFRAME_STATS) || '{}');
    }

    if (!this.iframeStats[gameSlug]) {
      this.iframeStats[gameSlug] = {
        loadCount: 0,
        totalLoadTime: 0,
        lastLoaded: null,
        iframeSrc: iframeSrc,
        loadFailures: 0
      };
    }

    this.iframeStats[gameSlug].loadCount++;
    this.iframeStats[gameSlug].lastLoaded = new Date().toISOString();
    
    localStorage.setItem(this.STORAGE_KEYS.IFRAME_STATS, JSON.stringify(this.iframeStats));
  }

  /**
   * 智能时间追踪设置
   */
  setupSmartTimeTracking() {
    // 页面可见性API
    document.addEventListener('visibilitychange', () => {
      const gameSlug = this.extractGameSlugFromUrl(window.location.pathname);
      if (!gameSlug) return;

      if (document.hidden) {
        this.pauseGameSession(gameSlug);
      } else {
        this.resumeGameSession(gameSlug);
      }
    });

    // 鼠标活动监听
    let lastActivity = Date.now();
    let activityTimer = null;

    const updateActivity = () => {
      lastActivity = Date.now();
      const gameSlug = this.extractGameSlugFromUrl(window.location.pathname);
      if (gameSlug) {
        this.updateGameActivity(gameSlug);
      }
    };

    // 监听各种用户交互
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // 定期检查用户活动状态
    setInterval(() => {
      const gameSlug = this.extractGameSlugFromUrl(window.location.pathname);
      if (gameSlug && Date.now() - lastActivity > 60000) { // 1分钟无活动
        this.markGameAsIdle(gameSlug);
      }
    }, 30000); // 每30秒检查一次
  }

  /**
   * 开始智能时间追踪
   */
  startSmartTimeTracking(gameSlug) {
    const session = {
      startTime: Date.now(),
      activeTime: 0,
      idleTime: 0,
      isActive: true,
      lastActivity: Date.now()
    };

    this.activeGameSessions.set(gameSlug, session);
    console.log(`⏱️ 开始智能时间追踪: ${gameSlug}`);
  }

  /**
   * 暂停游戏会话
   */
  pauseGameSession(gameSlug) {
    const session = this.activeGameSessions.get(gameSlug);
    if (!session || !session.isActive) return;

    const now = Date.now();
    session.activeTime += now - session.lastActivity;
    session.isActive = false;
    
    console.log(`⏸️ 暂停游戏会话: ${gameSlug}`);
  }

  /**
   * 恢复游戏会话
   */
  resumeGameSession(gameSlug) {
    const session = this.activeGameSessions.get(gameSlug);
    if (!session || session.isActive) return;

    session.isActive = true;
    session.lastActivity = Date.now();
    
    console.log(`▶️ 恢复游戏会话: ${gameSlug}`);
  }

  /**
   * 更新游戏活动
   */
  updateGameActivity(gameSlug) {
    const session = this.activeGameSessions.get(gameSlug);
    if (!session) return;

    session.lastActivity = Date.now();
    if (!session.isActive) {
      session.isActive = true;
    }
  }

  /**
   * 标记游戏为空闲状态
   */
  markGameAsIdle(gameSlug) {
    const session = this.activeGameSessions.get(gameSlug);
    if (!session || !session.isActive) return;

    this.pauseGameSession(gameSlug);
    console.log(`😴 游戏进入空闲状态: ${gameSlug}`);
  }

  /**
   * 获取游戏真实播放时长
   */
  getGameRealPlayTime(gameSlug) {
    const session = this.activeGameSessions.get(gameSlug);
    if (!session) return 0;

    let totalTime = session.activeTime;
    if (session.isActive) {
      totalTime += Date.now() - session.lastActivity;
    }

    return Math.floor(totalTime / 1000); // 转换为秒
  }

  /**
   * 从URL提取游戏slug
   */
  extractGameSlugFromUrl(pathname) {
    const match = pathname.match(/\/games\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * 加载统计数据
   */
  loadStats() {
    try {
      // 加载播放统计
      this.playStats = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PLAY_STATS) || '{}');
      
      // 加载历史记录
      this.playHistory = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PLAY_HISTORY) || '{}');
      
      // 加载用户统计
      this.userStats = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USER_STATS) || '{}');
      
      // 加载iframe统计
      this.iframeStats = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.IFRAME_STATS) || '{}');
      
    } catch (error) {
      console.error('加载游戏统计数据失败:', error);
      this.resetStats();
    }
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    this.playStats = {};
    this.playHistory = {};
    this.iframeStats = {};
    this.userStats = {
      totalPlayTime: 0,
      totalGamesPlayed: 0,
      favoriteCategory: null,
      firstPlayDate: new Date().toISOString()
    };
    this.saveStats();
  }

  /**
   * 保存统计数据
   */
  saveStats() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PLAY_STATS, JSON.stringify(this.playStats));
      localStorage.setItem(this.STORAGE_KEYS.PLAY_HISTORY, JSON.stringify(this.playHistory));
      localStorage.setItem(this.STORAGE_KEYS.USER_STATS, JSON.stringify(this.userStats));
      localStorage.setItem(this.STORAGE_KEYS.IFRAME_STATS, JSON.stringify(this.iframeStats));
    } catch (error) {
      console.error('保存游戏统计数据失败:', error);
    }
  }

  /**
   * 记录游戏开始播放 (iframe优化版)
   * @param {string} gameSlug - 游戏标识符
   * @param {Object} gameInfo - 游戏信息
   */
  recordGameStart(gameSlug, gameInfo = {}) {
    const now = new Date();
    const timestamp = now.toISOString();
    
    // 初始化游戏统计
    if (!this.playStats[gameSlug]) {
      this.playStats[gameSlug] = {
        playCount: 0,
        totalPlayTime: 0,
        realPlayTime: 0, // 新增：真实游戏时间
        firstPlayed: timestamp,
        lastPlayed: timestamp,
        category: gameInfo.category || 'unknown',
        title: gameInfo.title || gameSlug,
        iframeLoads: 0 // 新增：iframe加载次数
      };
    }
    
    // 更新播放次数
    this.playStats[gameSlug].playCount++;
    this.playStats[gameSlug].lastPlayed = timestamp;
    
    // 记录历史
    this.playHistory[gameSlug] = {
      timestamp: timestamp,
      date: now.toDateString(),
      time: now.toTimeString().split(' ')[0]
    };
    
    // 更新用户统计
    this.userStats.totalGamesPlayed++;
    
    // 开始智能时间追踪
    this.startSmartTimeTracking(gameSlug);
    
    // 保存数据
    this.saveStats();
    
    // 触发事件
    this.triggerStatsUpdate(gameSlug, 'gameStart');
    
    console.log(`📊 记录游戏开始 (iframe优化): ${gameSlug}, 播放次数: ${this.playStats[gameSlug].playCount}`);
  }

  /**
   * 记录游戏结束播放 (iframe优化版)
   * @param {string} gameSlug - 游戏标识符
   * @param {number} playTime - 页面停留时长（秒）
   */
  recordGameEnd(gameSlug, playTime = 0) {
    if (!this.playStats[gameSlug]) return;
    
    // 获取真实游戏时长
    const realPlayTime = this.getGameRealPlayTime(gameSlug);
    
    // 更新游戏时长
    this.playStats[gameSlug].totalPlayTime += playTime;
    this.playStats[gameSlug].realPlayTime += realPlayTime;
    
    // 更新用户总游戏时长
    this.userStats.totalPlayTime += realPlayTime;
    
    // 清理会话
    this.activeGameSessions.delete(gameSlug);
    
    // 保存数据
    this.saveStats();
    
    // 触发事件
    this.triggerStatsUpdate(gameSlug, 'gameEnd');
    
    console.log(`📊 记录游戏结束 (iframe优化): ${gameSlug}, 页面时长: ${playTime}秒, 真实游戏时长: ${realPlayTime}秒`);
  }

  /**
   * 获取游戏人气值 (iframe优化版 + 智能基础人气值)
   * @param {string} gameSlug - 游戏标识符
   * @param {Object} gameInfo - 游戏基础信息
   * @returns {number} 人气值
   */
  getPopularity(gameSlug, gameInfo = {}) {
    const stats = this.playStats[gameSlug];
    const iframeStats = this.iframeStats[gameSlug];
    
    // 获取基础人气值（优先使用games.json中的playCount，否则使用智能计算）
    let basePopularity = 0;
    if (gameInfo.playCount && gameInfo.playCount > 0) {
      // 使用games.json中设置的基础playCount值
      basePopularity = gameInfo.playCount;
    } else {
      // 如果games.json中没有设置playCount，使用智能基础人气值计算
      basePopularity = this.calculateSmartBasePopularity(gameSlug, gameInfo);
    }
    
    // 如果没有用户统计数据，直接返回基础人气值
    if (!stats) {
      return basePopularity;
    }
    
    // 基于真实用户数据计算额外加成
    const userPlayCount = stats.playCount || 0;
    const realPlayTime = stats.realPlayTime || 0;
    const recentActivity = this.getRecentActivityScore(gameSlug);
    const categoryBonus = this.getCategoryBonus(stats.category);
    const iframeBonus = iframeStats ? iframeStats.loadCount * 10 : 0;
    const timeEngagementBonus = Math.floor(realPlayTime / 60) * 5; // 每分钟真实游戏时间+5分
    
    // 用户真实数据加成 (较小的权重，不会压倒基础人气值)
    const userDataBonus = Math.floor(
      userPlayCount * 50 +        // 用户播放次数权重（降低权重）
      recentActivity * 25 +       // 最近活跃度权重（降低权重）
      categoryBonus * 0.5 +       // 分类加成（降低权重）
      iframeBonus +               // iframe加载加成
      timeEngagementBonus         // 时间参与度加成
    );
    
    // 返回基础人气值 + 用户数据加成
    const finalPopularity = basePopularity + userDataBonus;
    
    // 确保最终值合理
    return Math.max(finalPopularity, basePopularity);
  }

  /**
   * 计算智能基础人气值
   * @param {string} gameSlug - 游戏标识符
   * @param {Object} gameInfo - 游戏基础信息
   * @returns {number} 基础人气值
   */
  calculateSmartBasePopularity(gameSlug, gameInfo = {}) {
    let basePopularity = 500; // 最低基础人气值
    
    // 1. 分类权重 (教育价值越高，基础人气越高)
    const categoryMultipliers = {
      'math': 1.8,        // 数学游戏 - 教育价值最高
      'science': 1.7,     // 科学游戏
      'language': 1.6,    // 语言游戏
      'puzzle': 1.4,      // 益智游戏
      'art': 1.3,         // 艺术游戏
      'sports': 1.2,      // 体育游戏
      'strategy': 1.5,    // 策略游戏
      'adventure': 1.1,   // 冒险游戏
      'action': 1.0       // 动作游戏
    };
    
    const categoryMultiplier = categoryMultipliers[gameInfo.category] || 1.0;
    basePopularity *= categoryMultiplier;
    
    // 2. 特色标签加成
    if (gameInfo.featured) basePopularity += 800;    // 精选游戏
    if (gameInfo.trending) basePopularity += 600;    // 热门游戏
    if (gameInfo.isNew) basePopularity += 400;       // 新游戏
    
    // 3. 难度调整 (适中难度更受欢迎)
    const difficultyMultipliers = {
      'easy': 1.2,
      'medium': 1.4,
      'hard': 1.1
    };
    
    const difficulty = (gameInfo.difficulty || 'medium').toLowerCase();
    const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;
    basePopularity *= difficultyMultiplier;
    
    // 4. 年龄段适应性 (覆盖范围越广，人气越高)
    const ageRange = gameInfo.ageRange || '6-12';
    const [minAge, maxAge] = ageRange.split('-').map(age => parseInt(age) || 0);
    const ageSpan = maxAge - minAge;
    
    if (ageSpan >= 8) basePopularity += 300;        // 适合8年以上年龄段
    else if (ageSpan >= 6) basePopularity += 200;   // 适合6年以上年龄段
    else if (ageSpan >= 4) basePopularity += 100;   // 适合4年以上年龄段
    
    // 5. 开发者声誉加成
    const developerBonus = this.getDeveloperBonus(gameInfo.developer);
    basePopularity += developerBonus;
    
    // 6. 技术兼容性加成
    if (gameInfo.mobileSupport) basePopularity += 200;  // 支持移动设备
    if (gameInfo.responsive) basePopularity += 150;     // 响应式设计
    if (gameInfo.verified) basePopularity += 100;       // 已验证游戏
    
    // 7. 标签丰富度加成 (标签越多，说明游戏特性越丰富)
    const tagCount = (gameInfo.tags || []).length;
    basePopularity += Math.min(tagCount * 50, 300); // 最多300分标签加成
    
    // 8. 游戏指南完整性加成
    if (gameInfo.gameGuide) {
      if (gameInfo.gameGuide.howToPlay && gameInfo.gameGuide.howToPlay.length > 0) {
        basePopularity += 100;
      }
      if (gameInfo.gameGuide.controls && Object.keys(gameInfo.gameGuide.controls).length > 0) {
        basePopularity += 100;
      }
      if (gameInfo.gameGuide.tips && gameInfo.gameGuide.tips.length > 0) {
        basePopularity += 100;
      }
    }
    
    // 9. 随机波动 (让每个游戏的人气值略有不同，更真实)
    const gameSlugHash = this.hashString(gameSlug);
    const randomVariation = (gameSlugHash % 400) - 200; // -200到+200的随机变化
    basePopularity += randomVariation;
    
    // 10. 最终调整和取整
    basePopularity = Math.floor(basePopularity);
    
    // 确保最小值和最大值
    basePopularity = Math.max(basePopularity, 300);   // 最低300人气
    basePopularity = Math.min(basePopularity, 8000);  // 最高8000基础人气
    
    console.log(`🎯 ${gameSlug} 智能基础人气值: ${basePopularity} (分类: ${gameInfo.category}, 特色: ${gameInfo.featured ? '精选' : ''}${gameInfo.trending ? '热门' : ''}${gameInfo.isNew ? '新品' : ''})`);
    
    return basePopularity;
  }

  /**
   * 获取开发者声誉加成
   * @param {string} developer - 开发者名称
   * @returns {number} 声誉加成值
   */
  getDeveloperBonus(developer) {
    if (!developer) return 0;
    
    const developerLower = developer.toLowerCase();
    
    // 知名开发者/平台加成
    const knownDevelopers = {
      'scratch mit': 500,        // MIT Scratch - 教育权威
      'khan academy': 450,       // 可汗学院
      'educational insights': 400,
      'learning games for kids': 350,
      'abcya': 300,
      'coolmath games': 300,
      'math playground': 300,
      'funbrain': 250,
      'pbs kids': 250,
      'national geographic': 200,
      'disney': 200,
      'lego': 200
    };
    
    for (const [knownDev, bonus] of Object.entries(knownDevelopers)) {
      if (developerLower.includes(knownDev)) {
        return bonus;
      }
    }
    
    // 通用开发者类型加成
    if (developerLower.includes('educational') || developerLower.includes('learning')) {
      return 150;
    }
    if (developerLower.includes('kids') || developerLower.includes('children')) {
      return 100;
    }
    if (developerLower.includes('math') || developerLower.includes('science')) {
      return 100;
    }
    
    return 50; // 默认开发者加成
  }

  /**
   * 字符串哈希函数 (用于生成一致的随机数)
   * @param {string} str - 输入字符串
   * @returns {number} 哈希值
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 获取游戏播放次数
   * @param {string} gameSlug - 游戏标识符
   * @returns {number} 播放次数
   */
  getPlayCount(gameSlug) {
    return this.playStats[gameSlug]?.playCount || 0;
  }

  /**
   * 获取游戏历史标签
   * @param {string} gameSlug - 游戏标识符
   * @returns {string|null} 历史标签
   */
  getPlayHistoryLabel(gameSlug) {
    const history = this.playHistory[gameSlug];
    if (!history) return null;
    
    const playDate = new Date(history.timestamp);
    const now = new Date();
    const diffTime = now - playDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 根据时间差返回相应标签
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return 'A few days ago';
    } else if (diffDays <= 30) {
      return '2 weeks ago';
    } else {
      return 'A month ago';
    }
  }

  /**
   * 获取最近活跃度评分
   * @param {string} gameSlug - 游戏标识符
   * @returns {number} 活跃度评分 (0-10)
   */
  getRecentActivityScore(gameSlug) {
    const history = this.playHistory[gameSlug];
    if (!history) return 0;
    
    const playDate = new Date(history.timestamp);
    const now = new Date();
    const diffHours = (now - playDate) / (1000 * 60 * 60);
    
    // 24小时内最高分，逐渐衰减
    if (diffHours <= 1) return 10;
    if (diffHours <= 24) return 8;
    if (diffHours <= 72) return 6;
    if (diffHours <= 168) return 4; // 1周
    if (diffHours <= 720) return 2; // 1月
    return 1;
  }

  /**
   * 获取分类加成
   * @param {string} category - 游戏分类
   * @returns {number} 分类加成值
   */
  getCategoryBonus(category) {
    const bonuses = {
      'math': 100,
      'science': 90,
      'language': 85,
      'puzzle': 80,
      'art': 75,
      'sports': 70
    };
    return bonuses[category] || 50;
  }

  /**
   * 获取热门游戏列表
   * @param {number} limit - 返回数量限制
   * @returns {Array} 热门游戏列表
   */
  getTrendingGames(limit = 10) {
    const games = Object.entries(this.playStats)
      .map(([slug, stats]) => ({
        slug,
        ...stats,
        popularity: this.getPopularity(slug, stats),
        recentActivity: this.getRecentActivityScore(slug)
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
    
    return games;
  }

  /**
   * 获取最近游戏列表
   * @param {number} limit - 返回数量限制
   * @returns {Array} 最近游戏列表
   */
  getRecentGames(limit = 10) {
    const games = Object.entries(this.playHistory)
      .map(([slug, history]) => ({
        slug,
        ...history,
        stats: this.playStats[slug] || {}
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    return games;
  }

  /**
   * 获取用户统计摘要 (iframe优化版)
   * @returns {Object} 用户统计数据
   */
  getUserStats() {
    const totalRealPlayTime = Object.values(this.playStats)
      .reduce((sum, stats) => sum + (stats.realPlayTime || 0), 0);
    
    return {
      ...this.userStats,
      totalRealPlayTime: totalRealPlayTime, // 新增：真实游戏时长
      totalGamesInLibrary: Object.keys(this.playStats).length,
      averagePlayTime: this.userStats.totalGamesPlayed > 0 
        ? Math.floor(this.userStats.totalPlayTime / this.userStats.totalGamesPlayed)
        : 0,
      averageRealPlayTime: this.userStats.totalGamesPlayed > 0 
        ? Math.floor(totalRealPlayTime / this.userStats.totalGamesPlayed)
        : 0,
      mostPlayedGame: this.getMostPlayedGame(),
      favoriteCategory: this.getFavoriteCategory()
    };
  }

  /**
   * 获取最常玩的游戏
   * @returns {Object|null} 最常玩的游戏信息
   */
  getMostPlayedGame() {
    if (Object.keys(this.playStats).length === 0) return null;
    
    const mostPlayed = Object.entries(this.playStats)
      .reduce((max, [slug, stats]) => 
        stats.playCount > max.playCount ? { slug, ...stats } : max
      , { playCount: 0 });
    
    return mostPlayed.playCount > 0 ? mostPlayed : null;
  }

  /**
   * 获取最喜欢的分类
   * @returns {string|null} 最喜欢的分类
   */
  getFavoriteCategory() {
    const categoryStats = {};
    
    Object.values(this.playStats).forEach(stats => {
      const category = stats.category || 'unknown';
      categoryStats[category] = (categoryStats[category] || 0) + stats.playCount;
    });
    
    if (Object.keys(categoryStats).length === 0) return null;
    
    return Object.entries(categoryStats)
      .reduce((max, [category, count]) => 
        count > max.count ? { category, count } : max
      , { count: 0 }).category;
  }

  /**
   * 清除所有统计数据
   */
  clearAllStats() {
    this.resetStats();
    this.activeGameSessions.clear();
    this.triggerStatsUpdate(null, 'clearAll');
    console.log('🗑️ 已清除所有游戏统计数据');
  }

  /**
   * 清除特定游戏的统计数据
   * @param {string} gameSlug - 游戏标识符
   */
  clearGameStats(gameSlug) {
    delete this.playStats[gameSlug];
    delete this.playHistory[gameSlug];
    delete this.iframeStats[gameSlug];
    this.activeGameSessions.delete(gameSlug);
    this.saveStats();
    this.triggerStatsUpdate(gameSlug, 'clearGame');
    console.log(`🗑️ 已清除游戏 ${gameSlug} 的统计数据`);
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听页面卸载，保存数据
    window.addEventListener('beforeunload', () => {
      this.saveStats();
    });
    
    // 监听存储变化，同步数据
    window.addEventListener('storage', (e) => {
      if (Object.values(this.STORAGE_KEYS).includes(e.key)) {
        this.loadStats();
        this.triggerStatsUpdate(null, 'storageChange');
      }
    });
  }

  /**
   * 触发统计更新事件
   * @param {string|null} gameSlug - 游戏标识符
   * @param {string} action - 操作类型
   */
  triggerStatsUpdate(gameSlug, action) {
    window.dispatchEvent(new CustomEvent('gameStatsUpdated', {
      detail: { gameSlug, action, stats: this.getUserStats() }
    }));
  }

  /**
   * 导出统计数据
   * @returns {Object} 完整的统计数据
   */
  exportStats() {
    return {
      playStats: this.playStats,
      playHistory: this.playHistory,
      userStats: this.userStats,
      iframeStats: this.iframeStats,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * 导入统计数据
   * @param {Object} data - 统计数据
   */
  importStats(data) {
    try {
      if (data.playStats) this.playStats = data.playStats;
      if (data.playHistory) this.playHistory = data.playHistory;
      if (data.userStats) this.userStats = data.userStats;
      if (data.iframeStats) this.iframeStats = data.iframeStats;
      
      this.saveStats();
      this.triggerStatsUpdate(null, 'import');
      
      console.log('📊 统计数据导入成功');
    } catch (error) {
      console.error('导入统计数据失败:', error);
    }
  }

  /**
   * 更新页面上所有游戏卡片的人气值显示
   */
  updatePopularityDisplay() {
    const gameCards = document.querySelectorAll('[data-game-id]');
    
    gameCards.forEach(card => {
      const gameSlug = card.dataset.gameId;
      const popularityElement = card.querySelector('.popularity-count');
      
      if (popularityElement && gameSlug) {
        // 从games.json获取游戏基础信息（这里需要通过其他方式获取）
        const gameInfo = this.getGameInfoFromCard(card);
        const popularity = this.getPopularity(gameSlug, gameInfo);
        
        // 更新显示文本
        popularityElement.textContent = this.formatPopularity(popularity);
        
        // 根据人气值添加样式类
        this.updatePopularityStyle(popularityElement, popularity);
      }
    });
    
    console.log(`🔥 已更新 ${gameCards.length} 个游戏卡片的人气值显示`);
  }

  /**
   * 从游戏卡片DOM中提取游戏信息，并合并全局games数据
   * @param {Element} card - 游戏卡片DOM元素
   * @returns {Object} 游戏信息对象
   */
  getGameInfoFromCard(card) {
    const gameSlug = card.dataset.gameId;
    
    // 从全局GAMES_DATA中获取基础信息
    let gameInfo = {
      playCount: 0,
      category: 'puzzle',
      featured: false,
      trending: false,
      isNew: false,
      tags: [],
      developer: 'Unknown'
    };

    // 如果有全局games数据，从中获取基础信息
    if (window.GAMES_DATA && Array.isArray(window.GAMES_DATA)) {
      const globalGameData = window.GAMES_DATA.find(game => game.slug === gameSlug);
      if (globalGameData) {
        gameInfo = { ...gameInfo, ...globalGameData };
      }
    }

    // 从DOM中提取分类信息（作为备用）
    const categoryTag = card.querySelector('.category-tag');
    if (categoryTag && !gameInfo.category) {
      const classes = categoryTag.classList;
      const categories = ['math', 'science', 'language', 'puzzle', 'art', 'sports', 'coding'];
      gameInfo.category = categories.find(cat => classes.contains(cat)) || 'puzzle';
    }

    // 从DOM中提取特色标签（作为备用）
    if (!gameInfo.featured) {
      gameInfo.featured = !!card.querySelector('.feature-tag.featured, .badge.featured');
    }
    if (!gameInfo.trending) {
      gameInfo.trending = !!card.querySelector('.feature-tag.hot, .badge.trending');
    }
    if (!gameInfo.isNew) {
      gameInfo.isNew = !!card.querySelector('.feature-tag.new, .badge.new');
    }

    // 从DOM中提取开发者信息（作为备用）
    if (gameInfo.developer === 'Unknown') {
      const developerElement = card.querySelector('.stat .fas.fa-user + span');
      if (developerElement) {
        gameInfo.developer = developerElement.textContent.trim();
      }
    }

    return gameInfo;
  }

  /**
   * 格式化人气数字显示
   * @param {number} num - 人气数值
   * @returns {string} 格式化后的字符串
   */
  formatPopularity(num) {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  /**
   * 根据人气值更新样式类
   * @param {Element} element - 人气值显示元素
   * @param {number} popularity - 人气值
   */
  updatePopularityStyle(element, popularity) {
    // 移除现有的人气样式类
    element.classList.remove('popularity-hot', 'popularity-high', 'popularity-medium', 'popularity-low');
    
    // 根据人气值添加相应的样式类
    if (popularity >= 5000) {
      element.classList.add('popularity-hot');
    } else if (popularity >= 2000) {
      element.classList.add('popularity-high');
    } else if (popularity >= 500) {
      element.classList.add('popularity-medium');
    } else {
      element.classList.add('popularity-low');
    }
  }
}

// 创建全局实例
window.gameStatsManager = new GameStatsManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameStatsManager;
} 