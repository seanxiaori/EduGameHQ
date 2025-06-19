import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://edugamehq.com',
  output: 'static',
  adapter: cloudflare(),
  
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // 我们将使用自定义基础样式
    }),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      entryLimit: 45000,
    }),
  ],

  // Vite配置
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  },

  // 构建配置
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },

  // 开发服务器配置
  server: {
    port: 3000,
    host: true
  },

  // 预览服务器配置
  preview: {
    port: 3001,
    host: true
  },

  // 图片优化
  image: {
    domains: ['edugamehq.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.itch.io',
      },
      {
        protocol: 'https',
        hostname: '**.miniplay.com',
      },
      {
        protocol: 'https',
        hostname: '**.crazygames.com',
      }
    ],
  },

  // Markdown配置
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  },

  // 安全配置
  security: {
    checkOrigin: true
  }
});