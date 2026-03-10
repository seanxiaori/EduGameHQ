#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/games/[slug].astro',
  'src/pages/ar/games/[slug].astro',
  'src/pages/de/games/[slug].astro',
  'src/pages/es/games/[slug].astro',
  'src/pages/fr/games/[slug].astro',
  'src/pages/he/games/[slug].astro',
  'src/pages/hi/games/[slug].astro',
  'src/pages/ja/games/[slug].astro',
  'src/pages/ko/games/[slug].astro',
  'src/pages/ru/games/[slug].astro',
  'src/pages/zh/games/[slug].astro',
];

const oldCode = `  function toggleFullscreen() {
    const iframe = document.querySelector('.game-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        iframe.requestFullscreen();
      }
    }
  }`;

const newCode = `  function toggleFullscreen() {
    const iframe = document.querySelector('.game-iframe') as HTMLIFrameElement;
    if (!iframe) return;

    const isFullscreen = document.fullscreenElement ||
                        document.webkitFullscreenElement ||
                        document.mozFullScreenElement;

    if (!isFullscreen) {
      const requestFullscreen = iframe.requestFullscreen ||
                               iframe.webkitRequestFullscreen ||
                               iframe.mozRequestFullScreen ||
                               iframe.msRequestFullscreen;
      if (requestFullscreen) {
        requestFullscreen.call(iframe).catch(err => console.error(err));
      }
    } else {
      const exitFullscreen = document.exitFullscreen ||
                            document.webkitExitFullscreen ||
                            document.mozCancelFullScreen ||
                            document.msExitFullscreen;
      if (exitFullscreen) {
        exitFullscreen.call(document);
      }
    }
  }`;

let fixed = 0;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes(oldCode)) {
      content = content.replace(oldCode, newCode);
      fs.writeFileSync(file, content);
      console.log(`✅ ${file}`);
      fixed++;
    }
  } catch (e) {
    console.log(`⚠️ ${file} - ${e.message}`);
  }
}

console.log(`\n修复了 ${fixed} 个文件`);
