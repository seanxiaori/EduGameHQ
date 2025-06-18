/**
 * 全局收藏管理器 - 优化版
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
      console.log('⚠️ 收藏管理器已初始化，跳过重复初始化');
      return;
    }
    
    this.loadFavorites();
    this.setupEventDelegation();
    this.isInitialized = true;
    console.log('✅ 全局收藏管理器初始化完成');
  }

  // 从localStorage加载收藏
  loadFavorites() {
    try {
      const favorites = localStorage.getItem(this.storageKey);
      if (favorites) {
        this.favoriteGameIds = new Set(JSON.parse(favorites));
      }
      console.log('📋 加载收藏列表:', Array.from(this.favoriteGameIds));
    } catch (error) {
      console.error('❌ 加载收藏列表失败:', error);
      this.favoriteGameIds = new Set();
    }
  }

  // 保存收藏到localStorage
  saveFavorites() {
    try {
      const favoritesArray = Array.from(this.favoriteGameIds);
      localStorage.setItem(this.storageKey, JSON.stringify(favoritesArray));
      console.log('💾 保存收藏列表:', favoritesArray);
    } catch (error) {
      console.error('❌ 保存收藏列表失败:', error);
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
    console.log('➕ 添加收藏:', gameSlug);
  }

  // 从收藏中移除
  removeFromFavorites(gameSlug) {
    this.favoriteGameIds.delete(gameSlug);
    this.saveFavorites();
    this.updateUI(gameSlug, false);
    this.triggerChangeEvent(gameSlug, false);
    console.log('➖ 移除收藏:', gameSlug);
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
          console.log('💖 点击收藏按钮:', gameSlug);
          this.toggleFavorite(gameSlug);
        } else {
          console.error('❌ 收藏按钮缺少游戏ID');
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
        console.log('🔄 检测到新内容，更新收藏按钮状态');
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

    console.log('🎯 事件委托设置完成');
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
        const heartIcon = favoriteBtn.querySelector('i');
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

    // 更新游戏详情页的收藏按钮
    const detailFavoriteBtn = document.querySelector('.favorite-btn');
    const detailHeartIcon = detailFavoriteBtn?.querySelector('i');
    
    if (detailFavoriteBtn && detailHeartIcon) {
      if (isFavorited) {
        detailHeartIcon.className = 'fas fa-heart';
        detailFavoriteBtn.style.background = '#EC4899';
        detailFavoriteBtn.style.color = 'white';
      } else {
        detailHeartIcon.className = 'far fa-heart';
        detailFavoriteBtn.style.background = '#6B7280';
        detailFavoriteBtn.style.color = 'white';
      }
    }
  }

  // 更新所有UI
  updateAllUI() {
    // 更新所有游戏卡片的收藏状态
    const allGameCards = document.querySelectorAll('[data-game-id]');
    allGameCards.forEach(card => {
      const gameSlug = card.dataset.gameId;
      if (gameSlug) {
        this.updateUI(gameSlug, this.isFavorited(gameSlug));
      }
    });

    // 更新收藏计数器（如果存在）
    const favoritesCountElements = document.querySelectorAll('.favorites-count');
    favoritesCountElements.forEach(element => {
      element.textContent = this.getFavoritesCount();
    });

    console.log('🔄 更新所有UI完成');
  }

  // 触发变化事件
  triggerChangeEvent(gameSlug, isFavorited, action = 'toggle') {
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { gameSlug, isFavorited, action, totalCount: this.getFavoritesCount() }
    }));
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.favorite-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `favorite-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'added' ? 'fa-heart' : type === 'removed' ? 'fa-heart-broken' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    // 添加样式
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '9999',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      background: type === 'added' ? '#10B981' : type === 'removed' ? '#EF4444' : '#3B82F6',
      color: 'white',
      fontWeight: '600',
      fontSize: '0.9rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    });

    // 添加到页面
    document.body.appendChild(notification);

    // 动画显示
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // 3秒后自动隐藏
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// 防止重复初始化
if (!window.globalFavoritesManager) {
  // 创建全局实例
  window.globalFavoritesManager = new GlobalFavoritesManager();

  // 导出到全局作用域，方便其他脚本使用
  window.toggleGameFavorite = (gameSlug) => {
    const isNowFavorited = window.globalFavoritesManager.toggleFavorite(gameSlug);
    return isNowFavorited;
  };

  console.log('🎉 全局收藏管理器已创建并可用');
} else {
  console.log('ℹ️ 全局收藏管理器已存在，跳过重复创建');
} 