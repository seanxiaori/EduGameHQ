#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'src', 'data', 'games.json');
const today = new Date().toISOString().slice(0, 10);
const games = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const categoryNames = {
  math: 'Math',
  science: 'Science',
  coding: 'Coding',
  language: 'Language',
  puzzle: 'Puzzle',
  sports: 'Sports',
  art: 'Art',
  adventure: 'Adventure',
  creative: 'Creative',
  memory: 'Memory',
  geography: 'Geography',
  strategy: 'Strategy',
  arcade: 'Arcade',
};

const guideProfiles = {
  math: ['Solve each math challenge carefully.', 'Use the game controls to choose or enter answers.', 'Complete rounds to build confidence and speed.'],
  science: ['Observe the science prompt or simulation.', 'Apply the concept shown in the game.', 'Use feedback to improve each attempt.'],
  coding: ['Read the programming or logic challenge.', 'Choose actions that match the required logic.', 'Debug mistakes and try again.'],
  language: ['Read the word or language prompt.', 'Choose letters, words, or answers carefully.', 'Use repeated play to improve recall.'],
  puzzle: ['Study the board or puzzle rule.', 'Plan moves before acting.', 'Complete the objective with as few mistakes as possible.'],
  sports: ['Watch timing and position cues.', 'Use precise inputs to control the action.', 'Replay to improve consistency.'],
  art: ['Choose tools, colors, or notes.', 'Experiment with creative combinations.', 'Finish and review your creation.'],
  adventure: ['Explore the scene and read clues.', 'Interact with objects and challenges.', 'Reach the goal to complete the adventure.'],
  creative: ['Start with a simple idea.', 'Use available tools to build or design.', 'Iterate until your creation feels complete.'],
  memory: ['Reveal or observe items carefully.', 'Remember positions and patterns.', 'Match or repeat them accurately.'],
  geography: ['Read the map, flag, country, or capital prompt.', 'Choose the best geographic answer.', 'Review missed answers to learn locations.'],
  strategy: ['Review the current position.', 'Plan several moves ahead.', 'Control key spaces or resources to win.'],
  arcade: ['Start the round and stay focused.', 'React to obstacles and scoring chances.', 'Beat your previous score through practice.'],
};

function sourceUrlFor(game) {
  if (game.sourceUrl) return game.sourceUrl;
  if (game.url) return game.url;
  if (game.source === 'CrazyGames' && game.iframeUrl?.includes('/embed/')) {
    return game.iframeUrl.replace('/embed/', '/game/');
  }
  return game.iframeUrl || `https://www.edugamehq.com/games/${game.slug}/`;
}

function languageProfileFor(game) {
  if (game.source === 'EduGameHQ Original') {
    const textHeavy = ['language', 'science', 'geography', 'coding', 'strategy'].includes(game.category);
    return {
      uiLanguages: ['en'],
      languageSupportLevel: textHeavy ? 'english-only' : 'language-light',
      textHeavy,
      localizationEffort: textHeavy ? 'medium' : 'low',
      nonEnglishFriendly: !textHeavy,
    };
  }

  const textHeavy = ['language', 'coding', 'strategy'].includes(game.category);
  return {
    uiLanguages: ['en'],
    languageSupportLevel: textHeavy ? 'english-only' : 'language-light',
    textHeavy,
    localizationEffort: textHeavy ? 'medium' : 'low',
    nonEnglishFriendly: !textHeavy,
  };
}

function guideFor(game) {
  if (game.gameGuide?.howToPlay?.length && game.gameGuide?.controls && game.gameGuide?.tips?.length) {
    return game.gameGuide;
  }

  const steps = guideProfiles[game.category] || guideProfiles.arcade;
  return {
    howToPlay: game.gameGuide?.howToPlay?.length ? game.gameGuide.howToPlay : steps,
    controls: game.gameGuide?.controls && Object.keys(game.gameGuide.controls).length > 0
      ? game.gameGuide.controls
      : {
          mouse: 'Click or tap game controls to play.',
          keyboard: 'Use keyboard controls when the game supports them.',
          touch: 'Tap on-screen controls on mobile devices.',
        },
    tips: game.gameGuide?.tips?.length
      ? game.gameGuide.tips
      : [
          'Start slowly and learn the rules first.',
          'Replay short rounds to improve accuracy.',
          'Use mistakes as clues for the next attempt.',
        ],
  };
}

let changed = 0;

for (const game of games) {
  const before = JSON.stringify(game);
  const profile = languageProfileFor(game);
  game.categoryName = game.categoryName || categoryNames[game.category] || game.category;
  game.sourceUrl = sourceUrlFor(game);
  game.gameGuide = guideFor(game);
  game.developer = game.developer || (game.source === 'CrazyGames' ? 'CrazyGames Publisher' : 'EduGameHQ');
  game.technology = game.technology || 'HTML5';
  game.lastChecked = game.lastChecked || today;
  game.uiLanguages = game.uiLanguages?.length ? game.uiLanguages : profile.uiLanguages;
  game.languageSupportLevel = game.languageSupportLevel || profile.languageSupportLevel;
  game.textHeavy = typeof game.textHeavy === 'boolean' ? game.textHeavy : profile.textHeavy;
  game.localizationEffort = game.localizationEffort || profile.localizationEffort;
  game.nonEnglishFriendly = typeof game.nonEnglishFriendly === 'boolean' ? game.nonEnglishFriendly : profile.nonEnglishFriendly;

  if (!game.thumbnailUrl && game.image) game.thumbnailUrl = game.image;
  if (!game.image && game.thumbnailUrl) game.image = game.thumbnailUrl;
  if (!game.tags?.length) game.tags = [game.category, 'educational', 'html5'];
  if (JSON.stringify(game) !== before) changed += 1;
}

fs.writeFileSync(catalogPath, `${JSON.stringify(games, null, 2)}\n`);
console.log(`Backfilled metadata for ${changed} games.`);
