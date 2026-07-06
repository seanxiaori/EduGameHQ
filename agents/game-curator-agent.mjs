import { Octokit } from '@octokit/rest';
import fs from 'fs';
import { chromium } from 'playwright';

export class GameCuratorAgent {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    this.existingGames = this.loadExistingGames();
  }

  // 加载现有游戏
  loadExistingGames() {
    try {
      const data = fs.readFileSync('src/data/games.json', 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // 完整流程：搜索 -> 去重 -> 验证
  async findNewGames() {
    console.log('🎮 Game Curator Agent 开始工作...\n');

    // 1. 搜索
    const candidates = await this.searchGames();
    console.log(`找到 ${candidates.length} 个候选游戏`);

    // 2. 去重
    const unique = this.removeDuplicates(candidates);
    console.log(`去重后剩余 ${unique.length} 个游戏`);

    // 3. 验证
    const verified = await this.verifyGames(unique.slice(0, 5));
    console.log(`验证通过 ${verified.length} 个游戏`);

    return verified;
  }

  async searchGames() {
    const queries = ['html5 game', 'javascript game', 'educational game'];
    const candidates = [];
    for (const query of queries) {
      const results = await this.searchGitHub(query);
      candidates.push(...results);
    }
    return candidates;
  }

  async searchGitHub(query) {
    const { data } = await this.octokit.search.repos({
      q: query,
      sort: 'stars',
      per_page: 10
    });
    return data.items.map(repo => ({
      name: repo.name,
      url: repo.html_url,
      homepage: repo.homepage,
      stars: repo.stargazers_count
    }));
  }

  removeDuplicates(candidates) {
    return candidates.filter(c => {
      const match = this.existingGames.find(g =>
        g.iframeUrl === c.homepage || g.sourceUrl === c.url
      );
      return !match;
    });
  }

  async verifyGames(games) {
    const verified = [];
    for (const game of games) {
      if (game.homepage && await this.testUrl(game.homepage)) {
        verified.push(game);
      }
    }
    return verified;
  }

  async testUrl(url) {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(url, { timeout: 10000 });
      await browser.close();
      return true;
    } catch {
      return false;
    }
  }
}
