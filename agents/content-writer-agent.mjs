export class ContentWriterAgent {
  constructor() {
    this.templates = {
      gameDescription: `为教育游戏生成50-100字描述，突出教育价值`,
      categoryPage: `为游戏分类页面生成吸引人的介绍文字`
    };
  }

  // 生成游戏描述
  async generateGameDescription(game) {
    console.log(`📝 生成游戏描述: ${game.name}`);

    const description = `${game.name} 是一款适合6-18岁学生的${game.category}游戏。通过有趣的游戏方式，帮助学生提升${this.getSkills(game.category)}能力。`;

    return description;
  }

  // 根据类别获取技能
  getSkills(category) {
    const skillMap = {
      math: '数学计算和逻辑思维',
      science: '科学探索和实验',
      coding: '编程思维和问题解决',
      language: '语言表达和阅读理解'
    };

    return skillMap[category] || '学习';
  }

  // 生成SEO标题
  generateSEOTitle(game) {
    return `${game.name} - Free ${game.category} Game | EduGameHQ`;
  }
}
