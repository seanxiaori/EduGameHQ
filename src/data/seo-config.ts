// SEO配置文件 - 基于需求文档的关键词策略
export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  structuredData?: any;
  canonicalUrl?: string;
}

export const seoConfig: Record<string, SEOConfig> = {
  // 首页 - 核心关键词策略
  '/': {
    title: "EduGameHQ - Free Educational Games for Kids | Learning Games Online",
    description: "Discover 100+ free educational games for kids aged 6-18. Play math, science, coding, language, sports, art and geography games online. Safe, fun learning platform with no downloads required.",
    keywords: [
      "educational games",
      "learning games", 
      "kids games",
      "free educational games for kids",
      "online learning games for children",
      "educational games for students",
      "interactive learning platform",
      "HTML5 educational games",
      "brain games",
      "math games",
      "science games",
      "coding games",
      "language learning games",
      "sports games for kids",
      "art games for children",
      "geography games online"
    ],
    ogImage: "/images/logo.svg",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "EduGameHQ",
      "alternateName": "Educational Games Headquarters",
      "description": "Free educational games platform for kids aged 6-18. Learn through play with 100+ HTML5 games covering math, science, coding, language arts, sports, art, and geography.",
      "url": "https://www.edugamehq.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.edugamehq.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "EduGameHQ",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.edugamehq.com/images/logo.svg"
        }
      }
    }
  },

  // 数学游戏页面
  '/math-games': {
    title: "Math Games for Kids | Free Online Math Learning Games | EduGameHQ",
    description: "Play 27+ free math games for kids aged 6-18. Master arithmetic, algebra, geometry, and problem-solving skills through fun educational games. Perfect for homework help and math practice.",
    keywords: [
      "math games for kids",
      "free math games",
      "arithmetic games",
      "algebra games",
      "geometry games",
      "math games for children",
      "educational math games",
      "online math practice",
      "math homework help",
      "interactive math games",
      "math learning games",
      "numbers games",
      "calculation games",
      "math puzzle games"
    ],
    ogImage: "/images/logo.svg",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Math Games for Kids",
      "description": "Collection of free educational math games for children aged 6-18",
      "url": "https://www.edugamehq.com/math-games",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Math Educational Games",
        "description": "Interactive math games covering arithmetic, algebra, geometry, and problem-solving"
      }
    }
  },

  // 科学游戏页面
  '/science-games': {
    title: "Science Games for Students | Interactive Learning | EduGameHQ",
    description: "Explore 12+ free science games covering physics, chemistry, biology, and earth sciences. Perfect for curious minds and future scientists aged 8-18.",
    keywords: [
      "science games for students",
      "physics games",
      "chemistry games", 
      "biology games",
      "earth science games",
      "science games for kids",
      "interactive science learning",
      "STEM games",
      "science education games",
      "laboratory games",
      "experiment games",
      "nature games"
    ],
    ogImage: "/images/logo.svg",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Science Games for Students",
      "description": "Interactive science games covering physics, chemistry, biology, and earth sciences",
      "url": "https://www.edugamehq.com/science-games"
    }
  },

  // 编程游戏页面
  '/coding-games': {
    title: "Coding Games for Children | Learn Programming | EduGameHQ",
    description: "Learn programming fundamentals with 8+ free coding games. From basic logic to advanced coding concepts, start your computer science journey today for ages 8-18.",
    keywords: [
      "coding games for children",
      "programming games",
      "learn coding games",
      "computer science games",
      "coding for kids",
      "programming for beginners",
      "scratch programming games",
      "coding education",
      "logic games",
      "algorithm games",
      "computational thinking"
    ],
    ogImage: "/images/logo.svg"
  },

  // 语言游戏页面
  '/language-games': {
    title: "Language Learning Games | English Skills | EduGameHQ",
    description: "Improve reading, writing, vocabulary, and communication skills with 13+ engaging language games designed for English learners worldwide aged 8-16.",
    keywords: [
      "language learning games",
      "English games for kids",
      "vocabulary games",
      "reading games",
      "writing games",
      "grammar games",
      "word games",
      "spelling games",
      "communication skills games",
      "ESL games",
      "English practice games"
    ],
    ogImage: "/images/logo.svg"
  },

  // 益智游戏页面
  '/puzzle-games': {
    title: "Educational Puzzle Games | Brain Training | EduGameHQ",
    description: "Challenge your mind with 14+ educational puzzle games. Develop critical thinking, logic, and problem-solving skills through engaging brain teasers for ages 6-16.",
    keywords: [
      "educational puzzle games",
      "brain training games",
      "logic games",
      "critical thinking games",
      "problem solving games",
      "brain teasers",
      "mind games",
      "strategy games",
      "puzzle games for kids",
      "cognitive games"
    ],
    ogImage: "/images/logo.svg"
  },

  // 体育游戏页面
  '/sports-games': {
    title: "Sports Games for Kids | Physical Education | EduGameHQ",
    description: "Get active and learn through 12+ sports games! Combine physical education concepts with fun gameplay, teaching teamwork, strategy, and healthy competition for ages 8-16.",
    keywords: [
      "sports games for kids",
      "physical education games",
      "PE games",
      "sports learning games",
      "fitness games",
      "team sports games",
      "Olympic games",
      "soccer games",
      "basketball games",
      "athletics games"
    ],
    ogImage: "/images/logo.svg"
  },

  // 艺术创意游戏页面
  '/art-games': {
    title: "Art Games for Children | Creative Expression | EduGameHQ",
    description: "Unleash creativity with 13+ art and creativity games! Explore visual arts, music, design, and creative expression through interactive games for ages 4-16.",
    keywords: [
      "art games for children",
      "creative games",
      "drawing games",
      "painting games",
      "music games",
      "design games",
      "creativity games",
      "artistic expression games",
      "visual arts games",
      "craft games"
    ],
    ogImage: "/images/logo.svg"
  },

  // 趋势游戏页面
  '/trending': {
    title: "Trending Educational Games | Popular Learning Games | EduGameHQ",
    description: "Discover the most popular educational games right now! Play trending math, science, coding, and puzzle games loved by students worldwide.",
    keywords: [
      "trending educational games",
      "popular learning games",
      "hot games",
      "most played games",
      "trending games for kids",
      "viral educational games",
      "top rated games"
    ],
    ogImage: "/images/logo.svg"
  },

  // 新游戏页面
  '/new-games': {
    title: "New Educational Games | Latest Learning Games | EduGameHQ",
    description: "Explore the newest educational games added to our platform! Fresh content updated regularly with the latest learning games for all subjects.",
    keywords: [
      "new educational games",
      "latest learning games",
      "recently added games",
      "fresh educational content",
      "new games for kids",
      "updated learning games"
    ],
    ogImage: "/images/logo.svg"
  },

  // 最近游玩页面
  '/recently-played': {
    title: "Recently Played Games | Continue Learning | EduGameHQ",
    description: "Continue your learning journey! Access your recently played educational games and pick up where you left off in your educational adventure.",
    keywords: [
      "recently played games",
      "continue learning",
      "game history",
      "learning progress",
      "educational game history"
    ],
    ogImage: "/images/logo.svg"
  },

  // 收藏页面
  '/favorites': {
    title: "Favorite Educational Games | My Learning Collection | EduGameHQ",
    description: "Access your favorite educational games in one place! Build your personal collection of the best learning games you love to play.",
    keywords: [
      "favorite educational games",
      "saved games",
      "bookmarked games",
      "my games collection",
      "preferred learning games"
    ],
    ogImage: "/images/logo.svg"
  },

  // 搜索页面
  '/search': {
    title: "Search Educational Games | Find Learning Games | EduGameHQ",
    description: "Find the perfect educational game for your learning needs! Search through 100+ games by subject, difficulty, age, or keywords.",
    keywords: [
      "search educational games",
      "find learning games",
      "game search",
      "educational game finder",
      "learning game search"
    ],
    ogImage: "/images/logo.svg"
  },

  // 关于我们页面
  '/about': {
    title: "About EduGameHQ | Educational Gaming Platform | Our Mission",
    description: "Learn about EduGameHQ's mission to make education fun and accessible. Discover our story, values, and commitment to providing quality educational games for children worldwide.",
    keywords: [
      "about EduGameHQ",
      "educational gaming platform",
      "our mission",
      "educational technology",
      "learning platform",
      "kids education"
    ],
    ogImage: "/images/logo.svg"
  },

  // 帮助中心页面
  '/help': {
    title: "Help Center | EduGameHQ Support | FAQs and Guides",
    description: "Get help with EduGameHQ! Find answers to frequently asked questions, user guides, and contact support for the best educational gaming experience.",
    keywords: [
      "EduGameHQ help",
      "support center",
      "user guide",
      "FAQ",
      "educational games help",
      "technical support"
    ],
    ogImage: "/images/logo.svg"
  },

  // 隐私政策页面
  '/privacy-policy': {
    title: "Privacy Policy | EduGameHQ | Child Safety & Data Protection",
    description: "Read EduGameHQ's privacy policy. Learn how we protect children's privacy, comply with COPPA, and ensure a safe educational gaming environment.",
    keywords: [
      "privacy policy",
      "child safety",
      "COPPA compliance",
      "data protection",
      "educational games privacy",
      "kids online safety"
    ],
    ogImage: "/images/logo.svg"
  },

  // 服务条款页面
  '/terms-of-service': {
    title: "Terms of Service | EduGameHQ | Usage Guidelines",
    description: "Read EduGameHQ's terms of service and usage guidelines. Understand the rules and policies for using our educational gaming platform safely.",
    keywords: [
      "terms of service",
      "usage guidelines",
      "platform rules",
      "educational games terms",
      "user agreement"
    ],
    ogImage: "/images/logo.svg"
  },

  // 游戏详情页面（动态）
  '/games/[slug]': {
    title: "Educational Game | Learning Games | EduGameHQ",
    description: "Play this educational game and enhance your learning experience. Free, safe, and fun learning games for students.",
    keywords: [
      "educational game",
      "learning game",
      "free online game",
      "student game",
      "educational activity"
    ],
    ogImage: "/images/logo.svg"
  }
};

// 获取页面SEO配置的工具函数
export function getPageSEO(path: string): SEOConfig {
  // 处理游戏详情页面的动态路由
  if (path.startsWith('/games/')) {
    return seoConfig['/games/[slug]'] || seoConfig['/'] || {
      title: 'EduGameHQ - Educational Games',
      description: 'Free educational games for kids',
      keywords: ['educational games', 'kids games'],
      ogImage: '/images/logo.svg'
    };
  }

  return seoConfig[path] || seoConfig['/'] || {
    title: 'EduGameHQ - Educational Games',
    description: 'Free educational games for kids',
    keywords: ['educational games', 'kids games'],
    ogImage: '/images/logo.svg'
  };
}

// 生成结构化数据的工具函数
export function generateStructuredData(path: string, gameData?: any) {
  const config = getPageSEO(path);
  const currentDate = new Date().toISOString();
  
  if (path.startsWith('/games/') && gameData) {
    // 游戏页面的结构化数据（增强GEO优化）
    return {
      "@context": "https://schema.org",
      "@type": "Game",
      "name": gameData.title,
      "description": gameData.description,
      "url": `https://www.edugamehq.com/games/${gameData.slug}`,
      "image": gameData.thumbnailUrl || "/images/logo.svg",
      "genre": gameData.categoryName,
      "educationalLevel": gameData.ageRange,
      "learningResourceType": "Educational Game",
      "interactivityType": "active",
      "educationalUse": "instruction",
      "datePublished": gameData.datePublished || "2025-01-01",
      "dateModified": gameData.lastUpdated || currentDate,
      "inLanguage": "en",
      "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "student"
      },
      "publisher": {
        "@type": "Organization",
        "name": "EduGameHQ",
        "url": "https://www.edugamehq.com"
      }
    };
  }

  // 为其他页面添加dateModified（GEO优化）
  if (config.structuredData) {
    return {
      ...config.structuredData,
      "dateModified": currentDate,
      "inLanguage": "en"
    };
  }

  return config.structuredData;
}

// 生成页面关键词字符串
export function getKeywordsString(path: string): string {
  const config = getPageSEO(path);
  return config.keywords.join(', ');
}

// 生成Open Graph URL
export function getOGImageUrl(path: string): string {
  const config = getPageSEO(path);
  return config.ogImage || '/images/logo.svg';
} 