# SEO Optimizer Agent 实现

## 🎯 SEO Agent 职责

专门负责网站的 SEO 优化，包括关键词研究、内容优化、技术 SEO 等。

---

## 💻 代码实现

```javascript
// agents/seo-optimizer.mjs
import fs from 'fs';
import path from 'path';

export class SEOOptimizerAgent {
  constructor() {
    this.searchConsoleData = null;
    this.competitorData = null;
  }

  // 1. 分析当前 SEO 状况
  async analyzeCurrentSEO() {
    console.log('📊 分析当前 SEO 状况...');

    const issues = [];

    // 检查重复标题
    const duplicateTitles = await this.findDuplicateTitles();
    if (duplicateTitles.length > 0) {
      issues.push({
        type: 'duplicate_titles',
        severity: 'high',
        count: duplicateTitles.length,
        pages: duplicateTitles
      });
    }

    // 检查缺失描述
    const missingDescriptions = await this.findMissingDescriptions();
    if (missingDescriptions.length > 0) {
      issues.push({
        type: 'missing_descriptions',
        severity: 'medium',
        count: missingDescriptions.length
      });
    }

    return issues;
  }
