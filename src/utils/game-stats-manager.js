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
   * 获取游戏人气值 (iframe优化版)
   * @param {string} gameSlug - 游戏标识符
   * @param {Object} gameInfo - 游戏基础信息
   * @returns {number} 人气值
   */
  getPopularity(gameSlug, gameInfo = {}) {
    const stats = this.playStats[gameSlug];
    const iframeStats = this.iframeStats[gameSlug];
    
    if (!stats) {
      // 如果没有统计数据，返回基于游戏基础信息的估算值
      return gameInfo.playCount || Math.floor(Math.random() * 5000) + 500;
    }
    
    // 基于真实数据计算人气值 (iframe优化算法)
    const playCount = stats.playCount;
    const realPlayTime = stats.realPlayTime || 0;
    const recentActivity = this.getRecentActivityScore(gameSlug);
    const categoryBonus = this.getCategoryBonus(stats.category);
    const iframeBonus = iframeStats ? iframeStats.loadCount * 10 : 0;
    const timeEngagementBonus = Math.floor(realPlayTime / 60) * 5; // 每分钟真实游戏时间+5分
    
    // 人气值计算公式 (iframe优化版)
    const popularity = Math.floor(
      playCount * 100 +           // 播放次数权重
      recentActivity * 50 +       // 最近活跃度权重
      categoryBonus +             // 分类加成
      iframeBonus +               // iframe加载加成
      timeEngagementBonus         // 时间参与度加成
    );
    
    return Math.max(popularity, 1); // 最小值为1
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
}

// 创建全局实例
window.gameStatsManager = new GameStatsManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameStatsManager;
} 