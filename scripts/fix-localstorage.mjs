#!/usr/bin/env node
import fs from 'fs';

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

const patterns = [
  {
    old: /const favorites = JSON\.parse\(localStorage\.getItem\('favoriteGames'\) \|\| '\[\]'\);/g,
    new: `const favorites = (() => {
        try {
          return JSON.parse(localStorage.getItem('favoriteGames') || '[]');
        } catch (e) {
          return [];
        }
      })();`
  },
  {
    old: /localStorage\.setItem\('favoriteGames', JSON\.stringify\(favorites\)\);/g,
    new: `try {
        localStorage.setItem('favoriteGames', JSON.stringify(favorites));
      } catch (e) {
        console.warn('localStorage not available');
      }`
  }
];

let fixed = 0;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    for (const pattern of patterns) {
      if (pattern.old.test(content)) {
        content = content.replace(pattern.old, pattern.new);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`✅ ${file}`);
      fixed++;
    }
  } catch (e) {
    console.log(`⚠️ ${file} - ${e.message}`);
  }
}

console.log(`\n修复了 ${fixed} 个文件`);
