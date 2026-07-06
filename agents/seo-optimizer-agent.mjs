import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export class SEOOptimizerAgent {
  constructor() {
    this.issues = [];
  }

  async analyze() {
    console.log('🔍 SEO Agent 开始分析...\n');

    await this.checkDuplicateTitles();
    await this.checkMissingDescriptions();

    return this.generateReport();
  }

  async checkDuplicateTitles() {
    const pages = await glob('dist/**/*.html');
    const titles = new Map();

    for (const page of pages) {
      const content = fs.readFileSync(page, 'utf-8');
      const titleMatch = content.match(/<title>(.*?)<\/title>/);

      if (titleMatch) {
        const title = titleMatch[1];
        if (titles.has(title)) {
          titles.get(title).push(page);
        } else {
          titles.set(title, [page]);
        }
      }
    }

    // 找出重复的标题
    for (const [title, pages] of titles) {
      if (pages.length > 1) {
        this.issues.push({
          type: 'duplicate_title',
          title,
          pages,
          severity: 'high'
        });
      }
    }

    console.log(`✓ 检查重复标题: 发现 ${this.issues.length} 个问题`);
  }

  async checkMissingDescriptions() {
    const pages = await glob('dist/**/*.html');
    let missing = 0;

    for (const page of pages) {
      const content = fs.readFileSync(page, 'utf-8');
      const hasDescription = content.includes('<meta name="description"');

      if (!hasDescription) {
        missing++;
        this.issues.push({
          type: 'missing_description',
          page,
          severity: 'medium'
        });
      }
    }

    console.log(`✓ 检查缺失描述: 发现 ${missing} 个问题`);
  }

  generateReport() {
    return {
      totalIssues: this.issues.length,
      issues: this.issues,
      recommendations: this.getRecommendations()
    };
  }

  getRecommendations() {
    const recs = [];
    const duplicates = this.issues.filter(i => i.type === 'duplicate_title');
    const missing = this.issues.filter(i => i.type === 'missing_description');

    if (duplicates.length > 0) {
      recs.push(`修复 ${duplicates.length} 个重复标题`);
    }
    if (missing.length > 0) {
      recs.push(`为 ${missing.length} 个页面添加描述`);
    }

    return recs;
  }
}
