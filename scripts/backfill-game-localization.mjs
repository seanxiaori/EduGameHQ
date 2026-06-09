#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const catalogPath = path.join(projectRoot, 'src', 'data', 'games.json');
const games = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const phrases = {
  zh: ['在浏览器中免费游玩', '练习专注、观察和解决问题能力', '无需下载即可开始'],
  es: ['Juega gratis en el navegador', 'Practica atención, observación y resolución de problemas', 'Empieza sin descargas'],
  fr: ['Jouez gratuitement dans le navigateur', 'Travaillez attention, observation et résolution de problèmes', 'Commencez sans téléchargement'],
  de: ['Kostenlos im Browser spielen', 'Trainiert Aufmerksamkeit, Beobachtung und Problemlösen', 'Ohne Download starten'],
  ja: ['ブラウザで無料プレイ', '集中力、観察力、問題解決力を練習できます', 'ダウンロード不要です'],
  ko: ['브라우저에서 무료로 플레이', '집중력, 관찰력, 문제 해결력을 연습합니다', '다운로드 없이 시작'],
  ru: ['Играйте бесплатно в браузере', 'Развивает внимание, наблюдение и решение задач', 'Без загрузок'],
  hi: ['ब्राउज़र में मुफ्त खेलें', 'ध्यान, अवलोकन और समस्या समाधान का अभ्यास करें', 'डाउनलोड की जरूरत नहीं'],
  ar: ['العب مجانًا في المتصفح', 'درّب التركيز والملاحظة وحل المشكلات', 'ابدأ دون تنزيل'],
};

function categoryName(game) {
  return game.categoryName || String(game.category || 'Game').replace(/^\w/, (char) => char.toUpperCase());
}

function guideFor(game) {
  return game.gameGuide || {
    howToPlay: [
      `Open ${game.title} and start from the game screen.`,
      'Use the available keyboard, mouse, or touch controls to complete each challenge.',
      'Replay short rounds to improve focus, accuracy, and strategy.',
    ],
    controls: {
      keyboard: 'Use the keyboard controls shown in the game.',
      mouse: 'Click or drag inside the game area when supported.',
      touch: 'Tap and swipe on touch devices when supported.',
    },
    tips: [
      'Start with one practice round.',
      'Watch patterns carefully before moving quickly.',
      'Use feedback from each attempt to improve.',
    ],
  };
}

for (const game of games) {
  const localized = game.localized && typeof game.localized === 'object' ? game.localized : {};
  localized.en = {
    title: game.title,
    description: game.description,
    seoTitle: `${game.title} | Free ${categoryName(game)} Game | EduGameHQ`,
    seoDescription: `${game.description} Play instantly in your browser with no downloads.`,
    gameGuide: guideFor(game),
  };

  for (const [lang, langPhrases] of Object.entries(phrases)) {
    localized[lang] = {
      title: game.title,
      description: `${game.title}: ${langPhrases.join('. ')}.`,
      seoTitle: `${game.title} | ${categoryName(game)} Game | EduGameHQ`,
      seoDescription: `${game.title} is a free ${categoryName(game).toLowerCase()} game for students. ${langPhrases.join('. ')}.`,
      gameGuide: {
        howToPlay: langPhrases,
        controls: {
          keyboard: 'Use keyboard controls when shown in the game.',
          mouse: 'Click or drag inside the game area.',
          touch: 'Tap the game area on touch devices when supported.',
        },
        tips: [
          'Start slowly and learn the pattern.',
          'Replay short rounds to improve accuracy.',
          'Use the game feedback to adjust your strategy.',
        ],
      },
    };
  }

  game.localized = localized;
  game.uiLanguages ||= ['en'];
  game.languageSupportLevel ||= 'localized-metadata';
  game.localizationEffort ||= game.textHeavy ? 'medium' : 'low';
  game.nonEnglishFriendly ??= !game.textHeavy;
}

fs.writeFileSync(catalogPath, `${JSON.stringify(games, null, 2)}\n`);
console.log(`Backfilled localized metadata for ${games.length} games`);
