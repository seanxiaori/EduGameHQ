#!/usr/bin/env node
import { Octokit } from '@octokit/rest';
import fs from 'fs';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

console.log('🎮 搜索可自托管的HTML5游戏...\n');

// 搜索策略：找到已经有在线demo的HTML5游戏
// 这些游戏通常可以下载并自托管
const searches = [
  'html5 game demo stars:>100',
  'javascript game playable stars:>100',
  'canvas game online stars:>100',
  'phaser game demo stars:>100',
  'html5 puzzle game stars:>50'
];

const allGames = [];

for (const query of searches) {
  console.log(`搜索: ${query}`);

  try {
    const { data } = await octokit.search.repos({
      q: query,
      sort: 'stars',
      per_page: 20
    });

    for (const repo of data.items) {
      // 必须有homepage且不是框架/引擎
      if (!repo.homepage) continue;

      const name = repo.name.toLowerCase();
      const desc = (repo.description || '').toLowerCase();

      // 排除框架、引擎、教程
