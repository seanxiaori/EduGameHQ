import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.edugamehq.com',
  output: 'static',
  
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          zh: 'zh',
          es: 'es',
          fr: 'fr',
          de: 'de',
          ja: 'ja',
          ru: 'ru',
          hi: 'hi',
          ko: 'ko',
          ar: 'ar',
          he: 'he',
        },
      },
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