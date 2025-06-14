import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 默认内容
const DEFAULTS = {
  description: 'A fun and educational game for students. Enjoy learning while playing!',
  howToPlay: [
    'Use mouse to click and interact',
    'Use keyboard arrow keys to move',
    'Follow in-game instructions'
  ],
  images: ['default-intro.jpg'],
  screenshots: ['default-screenshot.jpg'],
  tags: []
};

// 1. 规范化games.json
async function normalizeGamesJson(gamesData) {
  const normalized = {};
  for (const [id, game] of Object.entries(gamesData)) {
    normalized[id] = {
      title: game.title || id,
      description: game.description || DEFAULTS.description,
      category: game.category || '',
      categoryName: game.categoryName || '',
      ageRange: game.ageRange || '',
      difficulty: game.difficulty || 'Medium',
      tags: Array.isArray(game.tags) ? game.tags : DEFAULTS.tags,
      iframeUrl: game.iframeUrl || game.embedUrl || '',
      howToPlay: Array.isArray(game.howToPlay) ? game.howToPlay : DEFAULTS.howToPlay,
      images: Array.isArray(game.images) && game.images.length > 0 ? game.images : DEFAULTS.images,
      screenshots: Array.isArray(game.screenshots) && game.screenshots.length > 0 ? game.screenshots : DEFAULTS.screenshots
    };
  }
  return normalized;
}

// 2. 清理未被引用的图片和无用JSON
async function cleanUnusedFiles(games, detailsDir) {
  const usedImages = new Set();
  const usedJson = new Set();
  for (const game of Object.values(games)) {
    (game.images || []).forEach(img => usedImages.add(img));
    (game.screenshots || []).forEach(img => usedImages.add(img));
    // 详情JSON文件名约定：gameId-details.json
    usedJson.add(`${game.title.replace(/\s+/g, '-').toLowerCase()}-details.json`);
  }
  const files = await fs.readdir(detailsDir);
  let removed = [];
  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
      if (!usedImages.has(file)) {
        await fs.unlink(path.join(detailsDir, file));
        removed.push(file);
      }
    } else if (file.endsWith('-details.json')) {
      if (!usedJson.has(file)) {
        await fs.unlink(path.join(detailsDir, file));
        removed.push(file);
      }
    }
  }
  return removed;
}

// 3. 自动补充全部新游戏（标准格式）
// 这里只做结构，实际新游戏数据需后续补充
async function addNewGames(games, newGamesList) {
  let count = 0;
  for (const newGame of newGamesList) {
    if (!games[newGame.id]) {
      games[newGame.id] = {
        title: newGame.title,
        description: newGame.description || DEFAULTS.description,
        category: newGame.category,
        categoryName: newGame.categoryName,
        ageRange: newGame.ageRange || '',
        difficulty: newGame.difficulty || 'Medium',
        tags: newGame.tags || DEFAULTS.tags,
        iframeUrl: newGame.iframeUrl,
        howToPlay: newGame.howToPlay || DEFAULTS.howToPlay,
        images: newGame.images || DEFAULTS.images,
        screenshots: newGame.screenshots || DEFAULTS.screenshots
      };
      count++;
    }
  }
  return count;
}

// 4. 自动提取和补充全部新游戏
async function extractNewGamesFromIframeDoc(gamesData) {
  const docPath = path.join(__dirname, '../doc/免费游戏资源iframe文档.md');
  const docContent = await fs.readFile(docPath, 'utf-8');

  // 1. 提取所有iframeUrl
  const iframeRegex = /<iframe[^>]*src=["']([^"'>]+)["'][^>]*>/g;
  const urlSet = new Set();
  let match;
  while ((match = iframeRegex.exec(docContent)) !== null) {
    urlSet.add(match[1]);
  }

  // 2. 已有游戏的iframeUrl集合
  const existingUrls = new Set(Object.values(gamesData).map(g => g.iframeUrl));

  // 3. 仅保留未收录的新游戏
  const newUrls = Array.from(urlSet).filter(url => !existingUrls.has(url));
  if (newUrls.length === 0) {
    console.log('✅ 没有需要补充的新游戏');
    return [];
  }

  // 4. 解析元数据（简单规则：取前一行/前几行的描述、标题、年龄、来源等）
  const lines = docContent.split('\n');
  const newGamesList = [];
  for (let i = 0; i < lines.length; i++) {
    const iframeMatch = lines[i].match(/<iframe[^>]*src=["']([^"'>]+)["'][^>]*>/);
    if (iframeMatch && newUrls.includes(iframeMatch[1])) {
      // 回溯查找元数据
      let title = 'Unknown Game';
      let description = DEFAULTS.description;
      let ageRange = '';
      let category = '';
      let categoryName = '';
      let difficulty = 'Medium';
      let tags = [];
      // 查找标题
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].startsWith('#### ')) {
          title = lines[j].replace('#### ', '').split(' - ')[0].trim();
          break;
        }
      }
      // 查找描述、年龄、来源
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].startsWith('**描述**:')) {
          description = lines[j].replace('**描述**:', '').trim();
        }
        if (lines[j].startsWith('**适合年龄**:')) {
          ageRange = lines[j].replace('**适合年龄**:', '').replace('岁', '').trim();
        }
        if (lines[j].startsWith('**来源**:')) {
          tags.push(lines[j].replace('**来源**:', '').trim());
        }
        if (lines[j].startsWith('## ')) {
          // 分类大标题
          const catLine = lines[j].replace('## ', '').trim();
          if (catLine.includes('数学')) { category = 'math'; categoryName = 'Math'; }
          else if (catLine.includes('科学')) { category = 'science'; categoryName = 'Science'; }
          else if (catLine.includes('编程')) { category = 'coding'; categoryName = 'Programming'; }
          else if (catLine.includes('语言')) { category = 'language'; categoryName = 'Language Arts'; }
          else if (catLine.includes('益智')) { category = 'puzzle'; categoryName = 'Puzzle'; }
          else if (catLine.includes('体育')) { category = 'sports'; categoryName = 'Sports'; }
          else if (catLine.includes('艺术')) { category = 'art'; categoryName = 'Art & Creativity'; }
          else if (catLine.includes('历史') || catLine.includes('地理')) { category = 'history'; categoryName = 'History and Geography'; }
          break;
        }
      }
      // 生成唯一id
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      newGamesList.push({
        id,
        title,
        description,
        category,
        categoryName,
        ageRange,
        difficulty,
        tags,
        iframeUrl: iframeMatch[1],
        howToPlay: DEFAULTS.howToPlay,
        images: DEFAULTS.images,
        screenshots: DEFAULTS.screenshots
      });
    }
  }
  console.log(`✅ 自动提取到${newGamesList.length}个新游戏`);
  return newGamesList;
}

// 入口
async function main() {
  const gamesFile = path.join(__dirname, '../src/data/games/games.json');
  const detailsDir = path.join(__dirname, '../public/images/games/details');

  // 读取games.json
  const raw = await fs.readFile(gamesFile, 'utf-8');
  let gamesData = JSON.parse(raw);

  // 1. 规范化
  gamesData = await normalizeGamesJson(gamesData);
  await fs.writeFile(gamesFile, JSON.stringify(gamesData, null, 2));
  console.log('✅ 已规范化games.json字段和结构');

  // 2. 清理无用图片和JSON
  const removed = await cleanUnusedFiles(gamesData, detailsDir);
  if (removed.length > 0) {
    console.log('🗑️ 已删除未被引用的文件:', removed);
  } else {
    console.log('✅ 没有未被引用的图片或JSON');
  }

  // 3. 自动补充全部新游戏
  const newGamesList = await extractNewGamesFromIframeDoc(gamesData);
  const added = await addNewGames(gamesData, newGamesList);
  if (added > 0) {
    await fs.writeFile(gamesFile, JSON.stringify(gamesData, null, 2));
    console.log(`✅ 已补充${added}个新游戏`);
  } else {
    console.log('✅ 没有需要补充的新游戏');
  }
}

main().catch(console.error); 