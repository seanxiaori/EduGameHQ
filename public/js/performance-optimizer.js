// 性能优化脚本 - 移动端专用优化
(function() {
  'use strict';

  // 1. 延迟加载非关键CSS的polyfill
  const loadDeferredStyles = () => {
    const addStylesNode = document.getElementById("deferred-styles");
    if (addStylesNode) {
      const replacement = document.createElement("div");
      replacement.innerHTML = addStylesNode.textContent;
      document.body.appendChild(replacement);
      addStylesNode.parentElement.removeChild(addStylesNode);
    }
  };

  // 2. 图片懒加载增强 - IntersectionObserver
  const lazyLoadImages = () => {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  };

  // 3. 预连接到关键第三方域
  const preconnectToOrigins = () => {
    const origins = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdnjs.cloudflare.com',
      'https://www.google-analytics.com'
    ];

    origins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // 4. 资源提示 - 预加载下一页可能需要的资源
  const prefetchNextPage = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const links = document.querySelectorAll('a[href^="/"]');
        links.forEach(link => {
          if (link.href && !link.hasAttribute('data-prefetched')) {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = link.href;
            document.head.appendChild(prefetchLink);
            link.setAttribute('data-prefetched', 'true');
          }
        });
      });
    }
  };

  // 5. 减少重绘和回流 - 使用DocumentFragment
  const optimizeDOMManipulation = () => {
    // 这个函数可以在特定的DOM操作场景中使用
    window.createOptimizedFragment = () => {
      return document.createDocumentFragment();
    };
  };

  // 6. 移动端专用优化 - 触摸事件优化
  const optimizeTouchEvents = () => {
    if ('ontouchstart' in window) {
      // 使用passive事件监听器提升滚动性能
      document.addEventListener('touchstart', () => {}, { passive: true });
      document.addEventListener('touchmove', () => {}, { passive: true });
    }
  };

  // 7. 字体加载优化 - Font Loading API
  const optimizeFontLoading = () => {
    if ('fonts' in document) {
      // 预加载关键字体
      const fonts = [
        new FontFace('Inter', 'url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2)', {
          weight: '400',
          style: 'normal',
          display: 'swap'
        }),
        new FontFace('Space Grotesk', 'url(https://fonts.gstatic.com/s/spacegrotesk/v13/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7oUXsjNsFjTDJK.woff2)', {
          weight: '500',
          style: 'normal',
          display: 'swap'
        })
      ];

      Promise.all(fonts.map(font => font.load())).then(loadedFonts => {
        loadedFonts.forEach(font => document.fonts.add(font));
      }).catch(err => {
        console.warn('Font loading failed:', err);
      });
    }
  };

  // 8. 性能监控 - Web Vitals
  const monitorPerformance = () => {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP不可用
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            console.log('FID:', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID不可用
      }
    }
  };

  // 初始化所有优化
  const init = () => {
    // DOM加载完成后执行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        loadDeferredStyles();
        lazyLoadImages();
        optimizeDOMManipulation();
        optimizeTouchEvents();
      });
    } else {
      loadDeferredStyles();
      lazyLoadImages();
      optimizeDOMManipulation();
      optimizeTouchEvents();
    }

    // 页面加载完成后执行
    window.addEventListener('load', () => {
      optimizeFontLoading();
      prefetchNextPage();
      // 在开发环境中启用性能监控（通过检查hostname判断）
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        monitorPerformance();
      }
    });

    // 空闲时预连接
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preconnectToOrigins);
    } else {
      setTimeout(preconnectToOrigins, 1);
    }
  };

  init();
})();
