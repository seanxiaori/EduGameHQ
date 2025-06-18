/**
 * 全局收藏管理器
 * 用于管理用户的收藏游戏列表
 */
class GlobalFavoritesManager {
  constructor() {
    this.storageKey = 'favoriteGames';
    this.favoriteGameIds = new Set();
    this.init();
  }

  // 初始化
  init() {
    this.loadFavorites();
    this.addEventListeners();
    console.log('Global Favorites Manager initialized');
  }

  // 从localStorage加载收藏
  loadFavorites() {
    try {
      const favorites = localStorage.getItem(this.storageKey);
      if (favorites) {
        this.favoriteGameIds = new Set(JSON.parse(favorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoriteGameIds = new Set();
    }
  }

  // 保存收藏到localStorage
  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.favoriteGameIds)));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  // 检查游戏是否已收藏
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
      return false;
    } else {
      this.addToFavorites(gameSlug);
      return true;
    }
  }

  // 获取所有收藏的游戏ID
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

  // 更新UI
  updateUI(gameSlug, isFavorited) {
    // 更新游戏卡片上的收藏按钮
    const gameCards = document.querySelectorAll(`[data-game-id="${gameSlug}"]`);
    gameCards.forEach(card => {
      const favoriteBtn = card.querySelector('.favorite-heart-btn');
      const heartIcon = favoriteBtn?.querySelector('i');
      
      if (favoriteBtn && heartIcon) {
        if (isFavorited) {
          heartIcon.className = 'fas fa-heart';
          favoriteBtn.classList.add('active');
          card.classList.add('favorited');
        } else {
          heartIcon.className = 'far fa-heart';
          favoriteBtn.classList.remove('active');
          card.classList.remove('favorited');
        }
      }
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
    // 更新所有游戏卡片
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
  }

  // 触发变化事件
  triggerChangeEvent(gameSlug, isFavorited, action = 'toggle') {
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { gameSlug, isFavorited, action, totalCount: this.getFavoritesCount() }
    }));
  }

  // 添加事件监听器
  addEventListeners() {
    // 监听页面变化，初始化游戏卡片状态
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeGameCards();
    });

    // 监听动态内容变化
    const observer = new MutationObserver(() => {
      this.initializeGameCards();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 初始化游戏卡片
  initializeGameCards() {
    const gameCards = document.querySelectorAll('[data-game-id]:not([data-favorites-initialized])');
    
    gameCards.forEach(card => {
      const gameSlug = card.dataset.gameId;
      if (!gameSlug) return;

      // 标记为已初始化
      card.setAttribute('data-favorites-initialized', 'true');

      // 创建收藏按钮（如果不存在）
      let favoriteBtn = card.querySelector('.favorite-heart-btn');
      if (!favoriteBtn) {
        const imageContainer = card.querySelector('.game-image-container');
        if (imageContainer) {
          favoriteBtn = document.createElement('button');
          favoriteBtn.className = 'favorite-heart-btn';
          favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
          favoriteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFavorite(gameSlug);
          };
          imageContainer.appendChild(favoriteBtn);
        }
      }

      // 更新初始状态
      this.updateUI(gameSlug, this.isFavorited(gameSlug));
    });
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

// 创建全局实例
window.globalFavoritesManager = new GlobalFavoritesManager();

// 导出到全局作用域，方便其他脚本使用
window.toggleGameFavorite = (gameSlug) => {
  const isNowFavorited = window.globalFavoritesManager.toggleFavorite(gameSlug);
  window.globalFavoritesManager.showNotification(
    isNowFavorited ? 'Added to favorites' : 'Removed from favorites',
    isNowFavorited ? 'added' : 'removed'
  );
  return isNowFavorited;
}; 