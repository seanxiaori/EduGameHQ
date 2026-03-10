#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const gamesPath = path.join(process.cwd(), 'src', 'data', 'games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));

const newGames = [
  {
    slug: "hextris",
    title: "Hextris",
    category: "puzzle",
    categoryName: "Puzzle",
    iframeUrl: "https://hextris.io",
    description: "Fast-paced hexagonal puzzle game inspired by Tetris. Rotate the hexagon to match falling blocks by color. Test your reflexes and strategy!",
    gameGuide: {
      howToPlay: [
        "Colored blocks fall from the edges toward the center hexagon",
        "Rotate the hexagon using arrow keys or A/D keys",
        "Match 3 or more blocks of the same color to clear them",
        "Game ends when blocks reach the center"
      ],
      controls: {
        keyboard: "Left/Right arrows or A/D to rotate hexagon"
      },
      tips: [
        "Plan ahead - watch which colors are coming next",
        "Clear blocks quickly to prevent buildup",
        "Try to create combo chains for higher scores"
      ]
    },
    thumbnailUrl: "/screenshots/hextris.png",
    image: "/screenshots/hextris.png",
    difficulty: "Medium",
    ageRange: "10-16",
    minAge: 10,
    maxAge: 16,
    tags: ["puzzle", "arcade", "brain-training", "classic"],
    source: "EduGameHQ",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://github.com/Hextris/hextris",
    lastUpdated: "2026-03-08",
    lastChecked: "2026-03-08",
    playCount: 0,
    featured: false,
    trending: false,
    isNew: true,
    developer: "Hextris Team"
  },
  {
    slug: "anti-pacman",
    title: "Anti PacMan",
    category: "arcade",
    categoryName: "Arcade",
    iframeUrl: "https://vmikhav.github.io/AntiPacMan/",
    description: "Reverse PacMan game where you play as the ghost! Chase PacMan through the maze and catch him before time runs out.",
    gameGuide: {
      howToPlay: [
        "You control the ghost, not PacMan",
        "Chase PacMan through the maze",
        "Catch PacMan to win the level",
        "Avoid power pellets that make you vulnerable"
      ],
      controls: {
        keyboard: "Arrow keys to move the ghost"
      },
      tips: [
        "Predict PacMan's movement patterns",
        "Use maze corners to cut him off",
        "Stay away when PacMan eats power pellets"
      ]
    },
    thumbnailUrl: "/screenshots/anti-pacman.png",
    image: "/screenshots/anti-pacman.png",
    difficulty: "Medium",
    ageRange: "8-16",
    minAge: 8,
    maxAge: 16,
    tags: ["arcade", "classic", "strategy", "casual"],
    source: "EduGameHQ",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://github.com/vmikhav/AntiPacMan",
    lastUpdated: "2026-03-08",
    lastChecked: "2026-03-08",
    playCount: 0,
    featured: false,
    trending: false,
    isNew: true,
    developer: "vmikhav"
  },
  {
    slug: "hua-rong-dao",
    title: "华容道 (Klotski)",
    category: "puzzle",
    categoryName: "Puzzle",
    iframeUrl: "https://jeantimex.github.io/hua-rong-dao-html/",
    description: "Classic Chinese sliding block puzzle. Move the blocks to help Cao Cao escape through the exit. A traditional brain teaser game.",
    gameGuide: {
      howToPlay: [
        "Move blocks by clicking and dragging",
        "Goal is to move the large red block (Cao Cao) to the exit",
        "Only one block can move at a time",
        "Blocks can only slide into empty spaces"
      ],
      controls: {
        mouse: "Click and drag blocks to move them"
      },
      tips: [
        "Plan several moves ahead",
        "Sometimes you need to move blocks away from the goal first",
        "Try different strategies if you get stuck"
      ]
    },
    thumbnailUrl: "/screenshots/hua-rong-dao.png",
    image: "/screenshots/hua-rong-dao.png",
    difficulty: "Hard",
    ageRange: "10-16",
    minAge: 10,
    maxAge: 16,
    tags: ["puzzle", "brain-training", "strategy", "classic"],
    source: "EduGameHQ",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    sourceUrl: "https://github.com/jeantimex/hua-rong-dao-html",
    lastUpdated: "2026-03-08",
    lastChecked: "2026-03-08",
    playCount: 0,
    featured: false,
    trending: false,
    isNew: true,
    developer: "jeantimex"
  }
];

games.push(...newGames);

fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));
console.log(`✅ 添加了 ${newGames.length} 款游戏，总数: ${games.length}`);
