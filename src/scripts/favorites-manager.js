/**
 * 全局收藏管理器 - 生产版
 * 用于管理用户的收藏游戏列表，支持事件委托和动态内容
 */
class GlobalFavoritesManager {
  constructor() {
    this.storageKey = 'favoriteGames';
    this.favoriteGameIds = new Set();
    this.isInitialized = false;
    this.init();
  }

  // 初始化
  init() {
    if (this.isInitialized) {
      return;
    }
    
    this.loadFavorites();
    this.setupEventDelegation();
    this.isInitialized = true;
  }

  // 从localStorage加载收藏
  loadFavorites() {
    try {
      const favorites = localStorage.getItem(this.storageKey);
      if (favorites) {
        this.favoriteGameIds = new Set(JSON.parse(favorites));
      }
    } catch (error) {
      this.favoriteGameIds = new Set();
    }
  }

  // 保存收藏到localStorage
  saveFavorites() {
    try {
      const favoritesArray = Array.from(this.favoriteGameIds);
      localStorage.setItem(this.storageKey, JSON.stringify(favoritesArray));
    } catch (error) {
      // 静默处理错误
    }
  }

  // 检查是否已收藏
  isFavorited(gameSlug) {
    return this.favoriteGameIds.has(gameSlug);
  }

  // 添加到收藏
  addToFavorites(gameSlug) {
    this.favoriteGameIds.add(gameSlug);
    this.saveFavorites();
    this.updateUI(gameSlug, true);
    this.triggerChangeEvent(gameSlug, true);
  }

  // 从收藏中移除
  removeFromFavorites(gameSlug) {
    this.favoriteGameIds.delete(gameSlug);
    this.saveFavorites();
    this.updateUI(gameSlug, false);
    this.triggerChangeEvent(gameSlug, false);
  }

  // 切换收藏状态
  toggleFavorite(gameSlug) {
    if (this.isFavorited(gameSlug)) {
      this.removeFromFavorites(gameSlug);
      this.showNotification('Removed from favorites', 'removed');
      return false;
    } else {
      this.addToFavorites(gameSlug);
      this.showNotification('Added to favorites', 'added');
      return true;
    }
  }

  // 获取收藏的游戏ID列表
  getFavoriteGameIds() {
    return Array.from(this.favoriteGameIds);
  }

  // 获取收藏数量
  getFavoritesCount() {
    return this.favoriteGameIds.size;
  }

  // 清除所有收藏
  clearAllFavorites() {
    this.favoriteGameIds.clear();
    this.saveFavorites();
    this.updateAllUI();
    this.triggerChangeEvent(null, null, 'cleared');
  }

  // 设置事件委托 - 核心优化
  setupEventDelegation() {
    // 使用事件委托，只在document上绑定一个事件监听器
    document.addEventListener('click', (e) => {
      // 检查点击的是否是收藏按钮
      const favoriteBtn = e.target.closest('.favorite-heart-btn');
      if (favoriteBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        // 获取游戏ID，支持两种属性
        const gameSlug = favoriteBtn.getAttribute('data-game-slug') || 
                        favoriteBtn.closest('[data-game-id]')?.getAttribute('data-game-id');
        
        if (gameSlug) {
          this.toggleFavorite(gameSlug);
        }
      }
    });

    // 监听页面内容变化，自动更新新添加的收藏按钮
    const observer = new MutationObserver((mutations) => {
      let hasNewContent = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查是否有新的游戏卡片或收藏按钮
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const hasGameCards = node.matches && node.matches('[data-game-id]') ||
                                 node.querySelector && node.querySelector('[data-game-id]');
              const hasFavoriteButtons = node.matches && node.matches('.favorite-heart-btn') ||
                                       node.querySelector && node.querySelector('.favorite-heart-btn');
              
              if (hasGameCards || hasFavoriteButtons) {
                hasNewContent = true;
              }
            }
          });
  }
      });
      
      if (hasNewContent) {
        // 延迟更新，确保DOM完全渲染
        setTimeout(() => {
          this.updateAllUI();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 页面加载完成后初始化所有收藏按钮状态
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateAllUI();
      });
    } else {
      // DOM已经加载完成
      this.updateAllUI();
    }
  }

  // 更新单个游戏的UI
  updateUI(gameSlug, isFavorited) {
    // 更新游戏卡片上的收藏按钮（支持多种选择器）
    const selectors = [
      `[data-game-id="${gameSlug}"] .favorite-heart-btn`,
      `[data-game-slug="${gameSlug}"]`,
      `.favorite-heart-btn[data-game-slug="${gameSlug}"]`
    ];

    selectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(favoriteBtn => {
        // 只在收藏按钮内直接查找图标，使用 :scope > i 确保是直接子元素
        let heartIcon = null;
        if (favoriteBtn.classList.contains('favorite-heart-btn')) {
          heartIcon = favoriteBtn.querySelector(':scope > i');
        }
        const gameCard = favoriteBtn.closest('[data-game-id]');
        
        if (heartIcon) {
          if (isFavorited) {
            heartIcon.className = 'fas fa-heart';
            favoriteBtn.classList.add('active', 'favorited');
            if (gameCard) gameCard.classList.add('favorited');
          } else {
            heartIcon.className = 'far fa-heart';
            favoriteBtn.classList.remove('active', 'favorited');
            if (gameCard) gameCard.classList.remove('favorited');
          }
        }
      });
    });
  }

  // 更新所有收藏按钮的UI状态
  updateAllUI() {
    // 获取所有收藏按钮
    const favoriteButtons = document.querySelectorAll('.favorite-heart-btn');
    
    favoriteButtons.forEach(favoriteBtn => {
      const gameSlug = favoriteBtn.getAttribute('data-game-slug') || 
                      favoriteBtn.closest('[data-game-id]')?.getAttribute('data-game-id');
      
      if (gameSlug) {
        const isFavorited = this.isFavorited(gameSlug);
        // 只选择收藏按钮的直接子图标元素，使用 :scope > i 确保精确性
        const heartIcon = favoriteBtn.querySelector(':scope > i');
        const gameCard = favoriteBtn.closest('[data-game-id]');
        
        if (heartIcon) {
          if (isFavorited) {
            heartIcon.className = 'fas fa-heart';
            favoriteBtn.classList.add('active', 'favorited');
            if (gameCard) gameCard.classList.add('favorited');
          } else {
            heartIcon.className = 'far fa-heart';
            favoriteBtn.classList.remove('active', 'favorited');
            if (gameCard) gameCard.classList.remove('favorited');
          }
        }
      }
    });
  }

  // 触发自定义事件
  triggerChangeEvent(gameSlug, isFavorited, action = 'toggle') {
    const event = new CustomEvent('favoritesChanged', {
      detail: { gameSlug, isFavorited, action, count: this.getFavoritesCount() }
    });
    document.dispatchEvent(event);
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `favorite-notification ${type}`;
    notification.textContent = message;

    // 添加到页面
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => notification.classList.add('show'), 100);

    // 自动移除
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }
}

// 防止重复初始化的全局标志
if (!window.globalFavoritesManagerInitialized) {
// 创建全局实例
window.globalFavoritesManager = new GlobalFavoritesManager();
  window.globalFavoritesManagerInitialized = true;
}

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalFavoritesManager;
} 