#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import http from 'http';
import { chromium } from 'playwright';

const projectRoot = process.cwd();
const gamesRepoRoot = path.resolve(projectRoot, '..', 'EduGameHQ-Games');
const hostedGamesDir = path.join(gamesRepoRoot, 'games');
const catalogPath = path.join(projectRoot, 'src', 'data', 'games.json');
const reportPath = path.join(projectRoot, 'tmp', 'original-game-pack-report.json');
const today = new Date().toISOString().slice(0, 10);

const categoryNames = {
  math: 'Math',
  language: 'Language',
  memory: 'Memory',
  puzzle: 'Puzzle',
  science: 'Science',
  geography: 'Geography',
  coding: 'Coding',
};

const packs = [
  {
    type: 'math',
    count: 20,
    category: 'math',
    prefix: 'edu-math-quest',
    title: 'Math Quest',
    nouns: ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Number Sense'],
  },
  {
    type: 'language',
    count: 15,
    category: 'language',
    prefix: 'edu-word-builder',
    title: 'Word Builder',
    nouns: ['Vocabulary', 'Spelling', 'Synonyms', 'Reading', 'Grammar'],
  },
  {
    type: 'memory',
    count: 15,
    category: 'memory',
    prefix: 'edu-memory-grid',
    title: 'Memory Grid',
    nouns: ['Shapes', 'Colors', 'Icons', 'Pairs', 'Focus'],
  },
  {
    type: 'puzzle',
    count: 15,
    category: 'puzzle',
    prefix: 'edu-pattern-sprint',
    title: 'Pattern Sprint',
    nouns: ['Sequences', 'Logic', 'Tiles', 'Order', 'Patterns'],
  },
  {
    type: 'science',
    count: 15,
    category: 'science',
    prefix: 'edu-science-sort',
    title: 'Science Sort',
    nouns: ['Animals', 'Planets', 'Forces', 'Matter', 'Energy'],
  },
  {
    type: 'geography',
    count: 10,
    category: 'geography',
    prefix: 'edu-map-master',
    title: 'Map Master',
    nouns: ['Capitals', 'Continents', 'Landmarks', 'Oceans', 'Countries'],
  },
  {
    type: 'coding',
    count: 10,
    category: 'coding',
    prefix: 'edu-code-logic',
    title: 'Code Logic',
    nouns: ['Loops', 'Conditions', 'Debugging', 'Variables', 'Algorithms'],
  },
];

const wordBank = [
  ['planet', 'A large body orbiting a star'],
  ['fraction', 'A part of a whole'],
  ['energy', 'The ability to do work'],
  ['capital', 'A city where a government is based'],
  ['pattern', 'A repeated order or rule'],
  ['syntax', 'Rules for writing code'],
  ['habitat', 'A natural home for living things'],
  ['equation', 'A statement that two values are equal'],
  ['observe', 'To watch carefully'],
  ['compare', 'To find similarities and differences'],
];

const scienceItems = [
  ['Mercury', 'planet'],
  ['Oxygen', 'element'],
  ['Gravity', 'force'],
  ['Evaporation', 'process'],
  ['Mammal', 'animal'],
  ['Mars', 'planet'],
  ['Carbon', 'element'],
  ['Friction', 'force'],
  ['Condensation', 'process'],
  ['Reptile', 'animal'],
];

const geoQuestions = [
  ['France', 'Paris', ['Paris', 'Rome', 'Berlin']],
  ['Japan', 'Tokyo', ['Seoul', 'Tokyo', 'Beijing']],
  ['Brazil', 'Brasilia', ['Brasilia', 'Lima', 'Quito']],
  ['Canada', 'Ottawa', ['Toronto', 'Vancouver', 'Ottawa']],
  ['Egypt', 'Cairo', ['Cairo', 'Rabat', 'Nairobi']],
  ['Australia', 'Canberra', ['Sydney', 'Canberra', 'Melbourne']],
  ['Kenya', 'Nairobi', ['Accra', 'Nairobi', 'Lagos']],
  ['India', 'New Delhi', ['Mumbai', 'New Delhi', 'Jaipur']],
  ['Spain', 'Madrid', ['Madrid', 'Lisbon', 'Valencia']],
  ['Mexico', 'Mexico City', ['Puebla', 'Mexico City', 'Guadalajara']],
];

const codingQuestions = [
  ['Which keyword repeats code while a condition is true?', 'while', ['while', 'paint', 'score']],
  ['Which value means yes/on in logic?', 'true', ['true', 'maybe', 'none']],
  ['Which symbol usually assigns a value in JavaScript?', '=', ['=', '#', '@']],
  ['What stores a reusable value?', 'variable', ['variable', 'window', 'pixel']],
  ['What is a mistake in code called?', 'bug', ['bug', 'loop', 'tile']],
  ['Which keyword creates a constant?', 'const', ['const', 'draw', 'move']],
  ['Which structure chooses between paths?', 'condition', ['condition', 'canvas', 'sound']],
  ['Which list type stores ordered items?', 'array', ['array', 'brush', 'timer']],
  ['What do we call step-by-step instructions?', 'algorithm', ['algorithm', 'texture', 'badge']],
  ['What checks if code works as expected?', 'test', ['test', 'spark', 'sprite']],
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function pad(num) {
  return String(num).padStart(2, '0');
}

function buildSpecs() {
  const specs = [];
  for (const pack of packs) {
    for (let i = 1; i <= pack.count; i += 1) {
      const noun = pack.nouns[(i - 1) % pack.nouns.length];
      const level = Math.ceil(i / pack.nouns.length);
      const title = `${pack.title}: ${noun} ${level}`;
      specs.push({
        ...pack,
        index: i,
        slug: `${pack.prefix}-${pad(i)}`,
        title,
        theme: noun,
        level,
      });
    }
  }
  return specs;
}

function gameScript(spec) {
  const seed = spec.index + spec.level * 7;
  if (spec.type === 'math') {
    return `
const questions = Array.from({ length: 10 }, (_, index) => {
  const a = ${seed} + index + 2;
  const b = (${seed} * 2 + index) % 12 + 1;
  const mode = index % 4;
  if (mode === 0) return { q: a + " + " + b, a: String(a + b) };
  if (mode === 1) return { q: (a + b) + " - " + b, a: String(a) };
  if (mode === 2) return { q: a + " x " + b, a: String(a * b) };
  return { q: (a * b) + " / " + b, a: String(a) };
});
`;
  }
  if (spec.type === 'language') {
    const words = wordBank.map(([word, hint], idx) => ({ word, hint, scrambled: word.split('').reverse().join(''), idx }));
    return `const questions = ${JSON.stringify(words)}.map((item, index) => ({ q: item.hint + " | Unscramble: " + item.scrambled, a: item.word }));`;
  }
  if (spec.type === 'memory') {
    return `
const icons = ["star", "moon", "sun", "leaf", "bolt", "wave"];
const questions = icons.map((icon, index) => ({ q: "Remember item #" + (index + 1) + ": " + icon.toUpperCase(), a: icon }));
`;
  }
  if (spec.type === 'puzzle') {
    return `
const questions = [
  { q: "2, 4, 6, 8, ?", a: "10" },
  { q: "A, C, E, G, ?", a: "I" },
  { q: "1, 1, 2, 3, 5, ?", a: "8" },
  { q: "red, blue, red, blue, ?", a: "red" },
  { q: "3, 6, 12, 24, ?", a: "48" }
];
`;
  }
  if (spec.type === 'science') {
    return `const questions = ${JSON.stringify(scienceItems)}.map(([item, group]) => ({ q: "Classify: " + item, a: group }));`;
  }
  if (spec.type === 'geography') {
    return `const questions = ${JSON.stringify(geoQuestions)}.map(([country, capital, choices]) => ({ q: "Capital of " + country + "?", a: capital, choices }));`;
  }
  return `const questions = ${JSON.stringify(codingQuestions)}.map(([q, a, choices]) => ({ q, a, choices }));`;
}

function htmlFor(spec) {
  const accent = {
    math: '#2563eb',
    language: '#be185d',
    memory: '#7c3aed',
    puzzle: '#d97706',
    science: '#059669',
    geography: '#0284c7',
    coding: '#4f46e5',
  }[spec.category];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${spec.title}</title>
  <style>
    :root { color-scheme: light; --accent: ${accent}; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; min-height: 100vh; background: #f8fafc; color: #111827; display: grid; place-items: center; padding: 20px; }
    .game { width: min(920px, 100%); background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; box-shadow: 0 20px 50px rgba(15, 23, 42, .12); overflow: hidden; }
    header { background: linear-gradient(135deg, var(--accent), #111827); color: #fff; padding: 28px; }
    h1 { margin: 0 0 8px; font-size: clamp(28px, 5vw, 48px); letter-spacing: 0; }
    header p { margin: 0; max-width: 640px; line-height: 1.5; opacity: .92; }
    .panel { padding: 24px; display: grid; gap: 18px; }
    .stats { display: flex; flex-wrap: wrap; gap: 12px; }
    .stat { padding: 10px 14px; background: #f1f5f9; border-radius: 10px; font-weight: 700; }
    .surface { min-height: 220px; border: 2px solid #e5e7eb; border-radius: 16px; display: grid; place-items: center; text-align: center; padding: 24px; background: radial-gradient(circle at top left, rgba(37,99,235,.10), transparent 32%), #fff; }
    .question { font-size: clamp(24px, 4vw, 42px); font-weight: 800; margin: 0 0 10px; }
    .hint { color: #475569; font-size: 16px; line-height: 1.5; }
    .controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
    button, input { min-height: 44px; border-radius: 10px; border: 1px solid #cbd5e1; font: inherit; }
    button { cursor: pointer; background: var(--accent); color: white; border: 0; padding: 0 18px; font-weight: 800; }
    button.secondary { background: #0f172a; }
    input { padding: 0 14px; min-width: min(280px, 100%); }
    .status { min-height: 28px; font-weight: 800; color: var(--accent); text-align: center; }
    .choices { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 16px; }
    @media (max-width: 640px) { body { padding: 10px; } header, .panel { padding: 18px; } .surface { min-height: 190px; } }
  </style>
</head>
<body>
  <main class="game" data-game-type="${spec.type}">
    <header>
      <h1>${spec.title}</h1>
      <p>Practice ${spec.theme.toLowerCase()} skills in a quick, safe browser game. Answer prompts, build a streak, and replay to improve.</p>
    </header>
    <section class="panel">
      <div class="stats">
        <div class="stat">Score: <span id="score">0</span></div>
        <div class="stat">Round: <span id="round">0</span>/<span id="total">0</span></div>
        <div class="stat">Streak: <span id="streak">0</span></div>
      </div>
      <div class="surface" id="surface">
        <div>
          <p class="question" id="question">Ready?</p>
          <p class="hint" id="hint">Press Start Game to begin.</p>
          <div class="choices" id="choices"></div>
        </div>
      </div>
      <div class="controls">
        <input id="answer" aria-label="Answer" placeholder="Type your answer">
        <button id="start">Start Game</button>
        <button id="submit" class="secondary">Submit</button>
      </div>
      <div class="status" id="status">Waiting to start</div>
    </section>
  </main>
  <script>
    ${gameScript(spec)}
    const total = Math.min(questions.length, 10);
    let round = 0;
    let score = 0;
    let streak = 0;
    const $ = (id) => document.getElementById(id);
    $('total').textContent = total;

    function current() {
      return questions[round % questions.length];
    }

    function renderQuestion() {
      const item = current();
      $('round').textContent = Math.min(round + 1, total);
      $('question').textContent = item.q;
      $('hint').textContent = 'Answer the prompt, then press Submit.';
      $('answer').value = '';
      $('answer').focus();
      const choices = $('choices');
      choices.innerHTML = '';
      if (item.choices) {
        item.choices.forEach(choice => {
          const button = document.createElement('button');
          button.textContent = choice;
          button.type = 'button';
          button.addEventListener('click', () => { $('answer').value = choice; checkAnswer(); });
          choices.appendChild(button);
        });
      }
    }

    function startGame() {
      round = 0;
      score = 0;
      streak = 0;
      $('score').textContent = score;
      $('streak').textContent = streak;
      $('status').textContent = 'Game started';
      renderQuestion();
    }

    function checkAnswer() {
      if (round >= total) return;
      const item = current();
      const given = $('answer').value.trim().toLowerCase();
      const expected = String(item.a).trim().toLowerCase();
      if (given === expected) {
        score += 10 + streak;
        streak += 1;
        $('status').textContent = 'Correct! Keep going.';
      } else {
        streak = 0;
        $('status').textContent = 'Try this one again: answer is ' + item.a + '.';
      }
      $('score').textContent = score;
      $('streak').textContent = streak;
      round += 1;
      if (round >= total) {
        $('round').textContent = total;
        $('question').textContent = 'Finished!';
        $('hint').textContent = 'Final score: ' + score + '. Press Start Game to replay.';
        $('choices').innerHTML = '';
      } else {
        setTimeout(renderQuestion, 350);
      }
    }

    $('start').addEventListener('click', startGame);
    $('submit').addEventListener('click', checkAnswer);
    $('answer').addEventListener('keydown', event => {
      if (event.key === 'Enter') checkAnswer();
    });
  </script>
</body>
</html>
`;
}

function metadataFor(spec) {
  const categoryName = categoryNames[spec.category];
  const textHeavy = ['language', 'science', 'geography', 'coding'].includes(spec.category);
  const difficulty = spec.level >= 3 ? 'Medium' : 'Easy';
  const minAge = spec.category === 'coding' ? 9 : spec.category === 'science' ? 8 : 6;
  const maxAge = spec.category === 'coding' ? 16 : 14;
  return {
    slug: spec.slug,
    title: spec.title,
    category: spec.category,
    categoryName,
    iframeUrl: `https://games.edugamehq.com/games/${spec.slug}/`,
    description: `${spec.title} is a free EduGameHQ original ${categoryName.toLowerCase()} game for practicing ${spec.theme.toLowerCase()} skills through quick browser challenges.`,
    gameGuide: {
      howToPlay: [
        'Press Start Game to begin the challenge.',
        'Read each prompt and type or choose the best answer.',
        'Submit answers to build your score and streak.',
        'Replay to improve speed, accuracy, and confidence.',
      ],
      controls: {
        mouse: 'Click Start, choices, and Submit.',
        keyboard: 'Type answers and press Enter to submit.',
        touch: 'Tap buttons and use the on-screen keyboard.',
      },
      tips: [
        'Read the full prompt before answering.',
        'Use the feedback after each round to learn faster.',
        'Replay once after finishing to strengthen recall.',
      ],
    },
    thumbnailUrl: `https://games.edugamehq.com/games/${spec.slug}/screenshot.png`,
    image: `https://games.edugamehq.com/games/${spec.slug}/screenshot.png`,
    difficulty,
    ageRange: `${minAge}-${maxAge}`,
    minAge,
    maxAge,
    tags: [spec.category, spec.theme.toLowerCase().replace(/\s+/g, '-'), 'educational', 'original', 'html5'],
    source: 'EduGameHQ Original',
    iframeCompatible: true,
    verified: true,
    technology: 'HTML5',
    mobileSupport: true,
    responsive: true,
    sourceUrl: `https://games.edugamehq.com/games/${spec.slug}/`,
    lastUpdated: today,
    lastChecked: today,
    playCount: 0,
    featured: spec.index <= 2,
    trending: false,
    isNew: true,
    developer: 'EduGameHQ',
    original: true,
    uiLanguages: ['en'],
    languageSupportLevel: textHeavy ? 'english-only' : 'language-light',
    textHeavy,
    localizationEffort: textHeavy ? 'medium' : 'low',
    nonEnglishFriendly: !textHeavy,
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeGames(specs) {
  ensureDir(hostedGamesDir);
  for (const spec of specs) {
    const dir = path.join(hostedGamesDir, spec.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), htmlFor(spec));
    fs.writeFileSync(path.join(dir, 'README.md'), `# ${spec.title}\n\nEduGameHQ original ${spec.category} browser game.\n`);
    fs.writeFileSync(path.join(dir, 'LICENSE'), 'Copyright (c) EduGameHQ. All rights reserved.\n');
  }
}

function startStaticServer(root) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let filePath = path.join(root, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === '.html' ? 'text/html' : ext === '.png' ? 'image/png' : ext === '.css' ? 'text/css' : 'text/plain';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function verifyGames(specs) {
  const server = await startStaticServer(gamesRepoRoot);
  const port = server.address().port;
  const browser = await chromium.launch();
  const passed = [];
  const failed = [];

  try {
    for (const spec of specs) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      try {
        await page.goto(`http://127.0.0.1:${port}/games/${spec.slug}/`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.click('#start', { timeout: 3000 });
        await page.fill('#answer', 'wrong');
        await page.click('#submit');
        await page.waitForTimeout(200);
        const status = await page.locator('#status').innerText();
        const title = await page.locator('h1').innerText();
        const hasSurface = await page.locator('.surface').count();
        const screenshotPath = path.join(hostedGamesDir, spec.slug, 'screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        const screenshotOk = fs.statSync(screenshotPath).size > 5000;

        if (title === spec.title && hasSurface === 1 && status.length > 0 && screenshotOk && consoleErrors.length === 0) {
          passed.push(spec.slug);
        } else {
          failed.push({ slug: spec.slug, reason: 'Validation assertions failed', consoleErrors });
        }
      } catch (error) {
        failed.push({ slug: spec.slug, reason: error.message, consoleErrors });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  return { passed, failed };
}

function updateCatalog(specs, passedSlugs) {
  const existing = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const bySlug = new Map(existing.map(game => [game.slug, game]));
  const added = [];
  const updated = [];

  for (const spec of specs) {
    if (!passedSlugs.has(spec.slug)) continue;
    const metadata = metadataFor(spec);
    if (bySlug.has(spec.slug)) {
      bySlug.set(spec.slug, { ...bySlug.get(spec.slug), ...metadata });
      updated.push(spec.slug);
    } else {
      bySlug.set(spec.slug, metadata);
      added.push(spec.slug);
    }
  }

  const next = Array.from(bySlug.values()).sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  fs.writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
  return { added, updated, total: next.length };
}

function validateCatalog() {
  const games = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const required = ['slug', 'title', 'category', 'categoryName', 'iframeUrl', 'description', 'thumbnailUrl', 'difficulty', 'ageRange', 'minAge', 'maxAge', 'sourceUrl', 'gameGuide', 'developer', 'technology', 'uiLanguages', 'languageSupportLevel'];
  const errors = [];
  const seen = new Set();

  for (const game of games) {
    if (seen.has(game.slug)) errors.push(`Duplicate slug: ${game.slug}`);
    seen.add(game.slug);
    for (const field of required) {
      const value = game[field];
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        errors.push(`${game.slug} missing ${field}`);
      }
    }
    if (!game.iframeUrl?.startsWith('https://')) errors.push(`${game.slug} iframeUrl must be https`);
    if (!['Easy', 'Medium', 'Hard'].includes(game.difficulty)) errors.push(`${game.slug} invalid difficulty`);
  }

  return errors;
}

async function main() {
  const specs = buildSpecs();
  writeGames(specs);
  const verification = await verifyGames(specs);
  if (verification.failed.length > 0) {
    ensureDir(path.dirname(reportPath));
    fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), verification }, null, 2)}\n`);
    throw new Error(`${verification.failed.length} generated games failed verification. See ${reportPath}`);
  }

  const catalogUpdate = updateCatalog(specs, new Set(verification.passed));
  const catalogErrors = validateCatalog().filter(error => error.includes('edu-'));
  const report = {
    generatedAt: new Date().toISOString(),
    generated: specs.length,
    verifiedPlayable: verification.passed.length,
    failed: verification.failed,
    catalogUpdate,
    catalogErrors,
  };
  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (catalogErrors.length > 0) {
    throw new Error(`Generated catalog validation failed with ${catalogErrors.length} errors. See ${reportPath}`);
  }

  console.log(`Generated ${specs.length} original games.`);
  console.log(`Verified playable: ${verification.passed.length}`);
  console.log(`Catalog added: ${catalogUpdate.added.length}, updated: ${catalogUpdate.updated.length}, total: ${catalogUpdate.total}`);
  console.log(`Report: ${path.relative(projectRoot, reportPath)}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
