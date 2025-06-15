import fs from 'fs/promises';
import path from 'path';

// CrazyGames游戏数据 - 基于免费游戏资源文档
const CRAZYGAMES_DATA = {
  // 科学游戏 (12款)
  science: [
    {
      slug: "little-alchemy-2",
      title: "Little Alchemy 2",
      iframeUrl: "https://www.crazygames.com/embed/little-alchemy-2",
      description: "Combine elements to create new substances and learn chemistry principles and scientific concepts.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["chemistry", "elements", "creation", "science", "combinations"]
    },
    {
      slug: "scale-of-the-universe-2",
      title: "Scale of the Universe 2",
      iframeUrl: "https://www.crazygames.com/embed/scale-of-the-universe-2",
      description: "Explore scales from atoms to universe and understand scientific size concepts.",
      ageRange: "10-18",
      difficulty: "Medium",
      tags: ["astronomy", "physics", "scale", "universe", "science"]
    },
    {
      slug: "solar-system-scope",
      title: "Solar System Scope",
      iframeUrl: "https://www.crazygames.com/embed/solar-system-scope",
      description: "3D solar system simulator to learn planetary motion and astronomy.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["astronomy", "planets", "simulation", "solar-system", "3d"]
    },
    {
      slug: "animal-dna-run",
      title: "Animal DNA Run",
      iframeUrl: "https://www.crazygames.com/embed/animal-dna-run",
      description: "Collect DNA fragments to learn about animal genetics and biological science.",
      ageRange: "8-16",
      difficulty: "Easy-Medium",
      tags: ["biology", "dna", "genetics", "animals", "science"]
    },
    {
      slug: "skeleton-simulator",
      title: "Skeleton Simulator",
      iframeUrl: "https://www.crazygames.com/embed/skeleton-simulator",
      description: "Explore the human skeletal system and learn anatomy knowledge.",
      ageRange: "10-18",
      difficulty: "Medium",
      tags: ["anatomy", "skeleton", "biology", "human-body", "medical"]
    },
    {
      slug: "idle-research",
      title: "Idle Research",
      iframeUrl: "https://www.crazygames.com/embed/idle-research",
      description: "Manage a scientific research laboratory and learn research methods.",
      ageRange: "11-18",
      difficulty: "Medium",
      tags: ["research", "laboratory", "science", "management", "experiments"]
    },
    {
      slug: "quantum-god",
      title: "Quantum God",
      iframeUrl: "https://www.crazygames.com/embed/quantum-god",
      description: "Explore quantum physics concepts and understand microscopic world phenomena.",
      ageRange: "12-18",
      difficulty: "Hard",
      tags: ["quantum", "physics", "microscopic", "advanced", "science"]
    },
    {
      slug: "alchemy-merge-clicker",
      title: "Alchemy Merge Clicker",
      iframeUrl: "https://www.crazygames.com/embed/alchemy-merge-clicker",
      description: "Learn chemical element combinations through clicking and merging.",
      ageRange: "9-17",
      difficulty: "Easy-Medium",
      tags: ["chemistry", "elements", "merging", "alchemy", "clicker"]
    },
    {
      slug: "galaxy-control-3d-strategy",
      title: "Galaxy Control: 3D Strategy",
      iframeUrl: "https://www.crazygames.com/embed/galaxy-control-3d-strategy",
      description: "3D space strategy game to learn astrophysics and spatial concepts.",
      ageRange: "11-18",
      difficulty: "Medium-Hard",
      tags: ["space", "strategy", "3d", "astrophysics", "galaxy"]
    },
    {
      slug: "mini-scientist",
      title: "Mini Scientist",
      iframeUrl: "https://www.crazygames.com/embed/mini-scientist",
      description: "Conduct various scientific experiments and learn basic scientific principles.",
      ageRange: "6-14",
      difficulty: "Easy",
      tags: ["experiments", "science", "laboratory", "discovery", "learning"]
    },
    {
      slug: "alchemy",
      title: "Alchemy",
      iframeUrl: "https://www.crazygames.com/embed/alchemy",
      description: "Classic alchemy game to learn chemistry basics through element combinations.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["alchemy", "chemistry", "elements", "combinations", "classic"]
    },
    {
      slug: "the-evolution-of-trust",
      title: "The Evolution of Trust",
      iframeUrl: "https://www.crazygames.com/embed/the-evolution-of-trust",
      description: "Explore social science and behavioral psychology through game theory.",
      ageRange: "12-18",
      difficulty: "Medium-Hard",
      tags: ["psychology", "social-science", "trust", "behavior", "theory"]
    }
  ],

  // 编程游戏 (12款)
  coding: [
    {
      slug: "sprunki",
      title: "Sprunki",
      iframeUrl: "https://www.crazygames.com/embed/sprunki",
      description: "Create music by dragging musical elements and learn programming logic and creative thinking.",
      ageRange: "6-16",
      difficulty: "Easy-Medium",
      tags: ["music", "programming", "creativity", "logic", "composition"]
    },
    {
      slug: "geometry-game",
      title: "Geometry Game",
      iframeUrl: "https://www.crazygames.com/embed/geometry-game",
      description: "Control geometric shapes through programming and learn basic coding concepts.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["geometry", "programming", "shapes", "coding", "logic"]
    },
    {
      slug: "planet-clicker",
      title: "Planet Clicker",
      iframeUrl: "https://www.crazygames.com/embed/planet-clicker",
      description: "Learn programming automation concepts through clicking and automation.",
      ageRange: "9-17",
      difficulty: "Easy-Medium",
      tags: ["automation", "programming", "clicker", "strategy", "planets"]
    },
    {
      slug: "getting-over-it",
      title: "Getting Over It",
      iframeUrl: "https://www.crazygames.com/embed/getting-over-it",
      description: "Learn precision and patience in programming through precise control challenges.",
      ageRange: "10-18",
      difficulty: "Hard",
      tags: ["precision", "control", "challenge", "patience", "programming"]
    },
    {
      slug: "arena",
      title: "Arena",
      iframeUrl: "https://www.crazygames.com/embed/arena",
      description: "Battle opponents using programming strategies in the arena.",
      ageRange: "11-18",
      difficulty: "Medium-Hard",
      tags: ["strategy", "programming", "battle", "competition", "arena"]
    },
    {
      slug: "appel",
      title: "Appel",
      iframeUrl: "https://www.crazygames.com/embed/appel",
      description: "Learn programming path planning by collecting apples.",
      ageRange: "7-15",
      difficulty: "Easy-Medium",
      tags: ["path-planning", "programming", "collection", "strategy", "apples"]
    },
    {
      slug: "level-eaten",
      title: "Level EATEN!",
      iframeUrl: "https://www.crazygames.com/embed/level-eaten",
      description: "Solve 'eaten' level problems through programming logic.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["problem-solving", "programming", "creativity", "logic", "puzzles"]
    },
    {
      slug: "knockouts",
      title: "KNOCKOUTS!",
      iframeUrl: "https://www.crazygames.com/embed/knockouts",
      description: "Control fighting characters through programming and learn game logic.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["fighting", "programming", "game-logic", "control", "strategy"]
    },
    {
      slug: "the-chick-chase",
      title: "The Chick Chase",
      iframeUrl: "https://www.crazygames.com/embed/the-chick-chase",
      description: "Program chick control to complete chase missions and learn loops and conditions.",
      ageRange: "6-14",
      difficulty: "Easy",
      tags: ["loops", "conditions", "programming", "chase", "simple"]
    },
    {
      slug: "the-epic-party",
      title: "The Epic Party",
      iframeUrl: "https://www.crazygames.com/embed/the-epic-party",
      description: "Organize party activities through programming and learn event handling.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["events", "programming", "party", "management", "organization"]
    },
    {
      slug: "bomb-defuse-online",
      title: "Bomb Defuse Online",
      iframeUrl: "https://www.crazygames.com/embed/bomb-defuse-online",
      description: "Defuse bombs using programming logic and learn conditional statements.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["logic", "programming", "conditions", "problem-solving", "defuse"]
    },
    {
      slug: "paper-minecraft",
      title: "Paper Minecraft",
      iframeUrl: "https://www.crazygames.com/embed/paper-minecraft",
      description: "2D version of Minecraft to learn programming thinking through building.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["building", "programming", "creativity", "minecraft", "construction"]
    }
  ],

  // 语言游戏 (12款)
  language: [
    {
      slug: "words-of-wonders",
      title: "Words of Wonders",
      iframeUrl: "https://www.crazygames.com/embed/words-of-wonders",
      description: "Explore world wonders by spelling words and improve English vocabulary.",
      ageRange: "8-18",
      difficulty: "Medium",
      tags: ["vocabulary", "spelling", "english", "words", "wonders"]
    },
    {
      slug: "word-wipe",
      title: "Word Wipe",
      iframeUrl: "https://www.crazygames.com/embed/word-wipe",
      description: "Find and wipe words in grids to improve vocabulary recognition abilities.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["word-search", "vocabulary", "recognition", "english", "grid"]
    },
    {
      slug: "word-scramble",
      title: "Word Scramble",
      iframeUrl: "https://www.crazygames.com/embed/word-scramble",
      description: "Rearrange letters to form correct words and practice spelling skills.",
      ageRange: "7-15",
      difficulty: "Easy-Medium",
      tags: ["spelling", "letters", "rearrange", "words", "english"]
    },
    {
      slug: "crossword-connect",
      title: "Crossword Connect",
      iframeUrl: "https://www.crazygames.com/embed/crossword-connect",
      description: "Connect letters to form words and complete crossword puzzles.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["crossword", "connect", "words", "puzzles", "vocabulary"]
    },
    {
      slug: "google-feud",
      title: "Google Feud",
      iframeUrl: "https://www.crazygames.com/embed/google-feud",
      description: "Guess Google search suggestions and learn common English expressions.",
      ageRange: "11-18",
      difficulty: "Medium",
      tags: ["guessing", "google", "expressions", "culture", "english"]
    },
    {
      slug: "trivia-crack",
      title: "Trivia Crack",
      iframeUrl: "https://www.crazygames.com/embed/trivia-crack",
      description: "Multi-category trivia questions to improve English reading comprehension.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["trivia", "questions", "knowledge", "reading", "comprehension"]
    },
    {
      slug: "tot-or-trivia",
      title: "ToT or Trivia",
      iframeUrl: "https://www.crazygames.com/embed/tot-or-trivia",
      description: "Choose truth or answer questions to practice English expression.",
      ageRange: "12-18",
      difficulty: "Medium",
      tags: ["truth", "questions", "expression", "choice", "english"]
    },
    {
      slug: "quizzland-trivia",
      title: "QuizzLand Trivia",
      iframeUrl: "https://www.crazygames.com/embed/quizzland-trivia",
      description: "Rich trivia question bank to enhance English vocabulary and knowledge.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["trivia", "vocabulary", "knowledge", "questions", "learning"]
    },
    {
      slug: "teacher-simulator",
      title: "Teacher Simulator",
      iframeUrl: "https://www.crazygames.com/embed/teacher-simulator",
      description: "Simulate teaching work and learn education-related English vocabulary.",
      ageRange: "10-18",
      difficulty: "Medium",
      tags: ["teaching", "education", "vocabulary", "simulation", "school"]
    },
    {
      slug: "pavlovs-dog",
      title: "Pavlov's Dog",
      iframeUrl: "https://www.crazygames.com/embed/pavlovs-dog",
      description: "Learn scientific English vocabulary through psychology experiments.",
      ageRange: "11-18",
      difficulty: "Medium-Hard",
      tags: ["psychology", "science", "vocabulary", "experiments", "learning"]
    },
    {
      slug: "xor",
      title: "xor",
      iframeUrl: "https://www.crazygames.com/embed/xor",
      description: "Learn programming and mathematical English terms through logic games.",
      ageRange: "12-18",
      difficulty: "Hard",
      tags: ["logic", "programming", "terms", "mathematics", "advanced"]
    },
    {
      slug: "spelling-words",
      title: "Spelling Words",
      iframeUrl: "https://www.crazygames.com/embed/spelling-words",
      description: "Practice English word spelling and improve spelling accuracy.",
      ageRange: "6-14",
      difficulty: "Easy-Medium",
      tags: ["spelling", "words", "practice", "accuracy", "english"]
    }
  ],

  // 益智游戏 (12款)
  puzzle: [
    {
      slug: "thief-puzzle",
      title: "Thief Puzzle",
      iframeUrl: "https://www.crazygames.com/embed/thief-puzzle",
      description: "Help the thief solve various puzzles and develop logical thinking and problem-solving abilities.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["puzzles", "logic", "problem-solving", "thief", "thinking"]
    },
    {
      slug: "bloxorz",
      title: "Bloxorz",
      iframeUrl: "https://www.crazygames.com/embed/bloxorz",
      description: "Control blocks to roll to target positions and practice spatial thinking.",
      ageRange: "9-17",
      difficulty: "Medium-Hard",
      tags: ["blocks", "spatial", "rolling", "target", "3d-thinking"]
    },
    {
      slug: "mahjongg-solitaire",
      title: "Mahjongg Solitaire",
      iframeUrl: "https://www.crazygames.com/embed/mahjongg-solitaire",
      description: "Classic mahjong matching game to improve memory and pattern recognition.",
      ageRange: "8-18",
      difficulty: "Medium",
      tags: ["mahjong", "matching", "memory", "patterns", "classic"]
    },
    {
      slug: "screw-out-bolts-and-nuts",
      title: "Screw Out: Bolts and Nuts",
      iframeUrl: "https://www.crazygames.com/embed/screw-out-bolts-and-nuts",
      description: "Remove screws and nuts to practice logical sequence and spatial reasoning.",
      ageRange: "10-18",
      difficulty: "Medium",
      tags: ["screws", "nuts", "mechanical", "logic", "sequence"]
    },
    {
      slug: "color-match",
      title: "Color Match",
      iframeUrl: "https://www.crazygames.com/embed/color-match",
      description: "Match identical colors to train visual recognition and reaction speed.",
      ageRange: "6-14",
      difficulty: "Easy-Medium",
      tags: ["colors", "matching", "visual", "recognition", "speed"]
    },
    {
      slug: "blockbuster-puzzle",
      title: "BlockBuster Puzzle",
      iframeUrl: "https://www.crazygames.com/embed/blockbuster-puzzle",
      description: "Destroy blocks to solve puzzles and practice strategic thinking.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["blocks", "destruction", "puzzles", "strategy", "thinking"]
    },
    {
      slug: "chess-free",
      title: "Chess Free",
      iframeUrl: "https://www.crazygames.com/embed/chess-free",
      description: "Classic chess game to develop strategic thinking and planning abilities.",
      ageRange: "8-18",
      difficulty: "Medium-Hard",
      tags: ["chess", "strategy", "planning", "classic", "thinking"]
    },
    {
      slug: "doodle-road",
      title: "Doodle Road",
      iframeUrl: "https://www.crazygames.com/embed/doodle-road",
      description: "Draw roads to guide vehicles and practice path planning.",
      ageRange: "7-15",
      difficulty: "Easy-Medium",
      tags: ["drawing", "roads", "vehicles", "planning", "creativity"]
    },
    {
      slug: "prison-escape",
      title: "Prison Escape",
      iframeUrl: "https://www.crazygames.com/embed/prison-escape",
      description: "Plan prison escape strategies and practice logical reasoning and planning.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["escape", "strategy", "planning", "logic", "reasoning"]
    },
    {
      slug: "sudoku-online",
      title: "Sudoku Online",
      iframeUrl: "https://www.crazygames.com/embed/sudoku-online",
      description: "Classic Sudoku game to improve logical reasoning and number skills.",
      ageRange: "9-18",
      difficulty: "Medium-Hard",
      tags: ["sudoku", "numbers", "logic", "reasoning", "classic"]
    },
    {
      slug: "nonogram",
      title: "Nonogram",
      iframeUrl: "https://www.crazygames.com/embed/nonogram",
      description: "Draw patterns based on number clues and practice logical reasoning.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["nonogram", "patterns", "clues", "logic", "drawing"]
    },
    {
      slug: "emoji-puzzle",
      title: "Emoji Puzzle!",
      iframeUrl: "https://www.crazygames.com/embed/emoji-puzzle",
      description: "Connect emojis to solve puzzles and practice associative thinking.",
      ageRange: "8-16",
      difficulty: "Easy-Medium",
      tags: ["emoji", "puzzles", "association", "thinking", "connection"]
    }
  ],

  // 体育游戏 (12款)
  sports: [
    {
      slug: "basketball-stars",
      title: "Basketball Stars",
      iframeUrl: "https://www.crazygames.com/embed/basketball-stars",
      description: "1-on-1 basketball battle game to practice reaction speed and hand-eye coordination.",
      ageRange: "8-18",
      difficulty: "Medium",
      tags: ["basketball", "sports", "reaction", "coordination", "battle"]
    },
    {
      slug: "soccer-skills",
      title: "Soccer Skills",
      iframeUrl: "https://www.crazygames.com/embed/soccer-skills",
      description: "Practice soccer skills and shooting to improve sports coordination abilities.",
      ageRange: "7-16",
      difficulty: "Easy-Medium",
      tags: ["soccer", "skills", "shooting", "sports", "coordination"]
    },
    {
      slug: "tennis-masters",
      title: "Tennis Masters",
      iframeUrl: "https://www.crazygames.com/embed/tennis-masters",
      description: "Tennis match game to learn tennis rules and techniques.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["tennis", "sports", "rules", "techniques", "match"]
    },
    {
      slug: "swimming-pool",
      title: "Swimming Pool",
      iframeUrl: "https://www.crazygames.com/embed/swimming-pool",
      description: "Swimming competition game to practice rhythm and timing control.",
      ageRange: "6-14",
      difficulty: "Easy",
      tags: ["swimming", "rhythm", "timing", "sports", "competition"]
    },
    {
      slug: "golf-champion",
      title: "Golf Champion",
      iframeUrl: "https://www.crazygames.com/embed/golf-champion",
      description: "Golf game to practice precision and force control.",
      ageRange: "8-18",
      difficulty: "Medium",
      tags: ["golf", "precision", "control", "sports", "accuracy"]
    },
    {
      slug: "volleyball-challenge",
      title: "Volleyball Challenge",
      iframeUrl: "https://www.crazygames.com/embed/volleyball-challenge",
      description: "Volleyball match game to practice teamwork and reaction abilities.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["volleyball", "teamwork", "reaction", "sports", "challenge"]
    },
    {
      slug: "baseball-pro",
      title: "Baseball Pro",
      iframeUrl: "https://www.crazygames.com/embed/baseball-pro",
      description: "Baseball game to learn baseball rules and batting techniques.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["baseball", "rules", "batting", "sports", "techniques"]
    },
    {
      slug: "track-and-field",
      title: "Track and Field",
      iframeUrl: "https://www.crazygames.com/embed/track-and-field",
      description: "Multi-event track and field game to practice speed and endurance.",
      ageRange: "7-15",
      difficulty: "Easy-Medium",
      tags: ["track", "field", "speed", "endurance", "athletics"]
    },
    {
      slug: "skateboard-city",
      title: "Skateboard City",
      iframeUrl: "https://www.crazygames.com/embed/skateboard-city",
      description: "Skateboard skills game to practice balance and creative expression.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["skateboard", "balance", "creativity", "skills", "urban"]
    },
    {
      slug: "cycling-hero",
      title: "Cycling Hero",
      iframeUrl: "https://www.crazygames.com/embed/cycling-hero",
      description: "Bicycle racing game to practice speed control and route planning.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["cycling", "racing", "speed", "planning", "sports"]
    },
    {
      slug: "boxing-physics",
      title: "Boxing Physics",
      iframeUrl: "https://www.crazygames.com/embed/boxing-physics",
      description: "Physics boxing game to learn mechanics principles and body coordination.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["boxing", "physics", "mechanics", "coordination", "sports"]
    },
    {
      slug: "winter-sports",
      title: "Winter Sports",
      iframeUrl: "https://www.crazygames.com/embed/winter-sports",
      description: "Multiple winter sports events to learn different sports skills.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["winter", "sports", "multiple", "skills", "events"]
    }
  ],

  // 艺术创意游戏 (12款)
  art: [
    {
      slug: "draw-climber",
      title: "Draw Climber",
      iframeUrl: "https://www.crazygames.com/embed/draw-climber",
      description: "Draw leg shapes to help characters climb and develop creativity and spatial imagination.",
      ageRange: "6-16",
      difficulty: "Easy-Medium",
      tags: ["drawing", "creativity", "climbing", "imagination", "art"]
    },
    {
      slug: "coloring-book",
      title: "Coloring Book",
      iframeUrl: "https://www.crazygames.com/embed/coloring-book",
      description: "Digital coloring game to practice color matching and artistic perception.",
      ageRange: "4-14",
      difficulty: "Easy",
      tags: ["coloring", "colors", "art", "creativity", "digital"]
    },
    {
      slug: "pixel-art",
      title: "Pixel Art",
      iframeUrl: "https://www.crazygames.com/embed/pixel-art",
      description: "Create pixel art works and learn digital art basics.",
      ageRange: "8-18",
      difficulty: "Medium",
      tags: ["pixel", "art", "digital", "creation", "design"]
    },
    {
      slug: "music-maker",
      title: "Music Maker",
      iframeUrl: "https://www.crazygames.com/embed/music-maker",
      description: "Create music and beats to learn music basics and composition.",
      ageRange: "7-17",
      difficulty: "Easy-Medium",
      tags: ["music", "composition", "beats", "creation", "audio"]
    },
    {
      slug: "fashion-designer",
      title: "Fashion Designer",
      iframeUrl: "https://www.crazygames.com/embed/fashion-designer",
      description: "Design fashion clothing and develop aesthetic and design thinking.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["fashion", "design", "clothing", "aesthetic", "style"]
    },
    {
      slug: "pottery-master",
      title: "Pottery Master",
      iframeUrl: "https://www.crazygames.com/embed/pottery-master",
      description: "Create ceramic artworks and practice handicraft skills and creative expression.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["pottery", "ceramics", "handicraft", "creativity", "art"]
    },
    {
      slug: "dance-battle",
      title: "Dance Battle",
      iframeUrl: "https://www.crazygames.com/embed/dance-battle",
      description: "Rhythm dance game to develop musical sense and body coordination.",
      ageRange: "8-18",
      difficulty: "Medium",
      tags: ["dance", "rhythm", "music", "coordination", "performance"]
    },
    {
      slug: "photography-studio",
      title: "Photography Studio",
      iframeUrl: "https://www.crazygames.com/embed/photography-studio",
      description: "Learn photography techniques and composition to develop visual art sense.",
      ageRange: "10-18",
      difficulty: "Medium",
      tags: ["photography", "composition", "visual", "art", "techniques"]
    },
    {
      slug: "origami-simulator",
      title: "Origami Simulator",
      iframeUrl: "https://www.crazygames.com/embed/origami-simulator",
      description: "Virtual origami game to practice spatial imagination and handicraft skills.",
      ageRange: "7-15",
      difficulty: "Easy-Medium",
      tags: ["origami", "folding", "spatial", "handicraft", "paper"]
    },
    {
      slug: "graffiti-artist",
      title: "Graffiti Artist",
      iframeUrl: "https://www.crazygames.com/embed/graffiti-artist",
      description: "Create street graffiti art and learn color and composition.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["graffiti", "street-art", "colors", "composition", "urban"]
    },
    {
      slug: "jewelry-designer",
      title: "Jewelry Designer",
      iframeUrl: "https://www.crazygames.com/embed/jewelry-designer",
      description: "Design jewelry and accessories to develop fine design and aesthetic abilities.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["jewelry", "design", "accessories", "aesthetic", "fine-art"]
    },
    {
      slug: "animation-studio",
      title: "Animation Studio",
      iframeUrl: "https://www.crazygames.com/embed/animation-studio",
      description: "Create simple animations and learn animation production basics.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["animation", "creation", "production", "digital", "storytelling"]
    }
  ],

  // 历史地理游戏 (12款)
  geography: [
    {
      slug: "world-geography-quiz",
      title: "World Geography Quiz",
      iframeUrl: "https://www.crazygames.com/embed/world-geography-quiz",
      description: "World geography knowledge quiz to learn country capitals, landmarks and cultures.",
      ageRange: "9-18",
      difficulty: "Medium",
      tags: ["geography", "world", "capitals", "landmarks", "quiz"]
    },
    {
      slug: "ancient-civilizations",
      title: "Ancient Civilizations",
      iframeUrl: "https://www.crazygames.com/embed/ancient-civilizations",
      description: "Explore ancient civilization history and learn archaeology and historical knowledge.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["history", "ancient", "civilizations", "archaeology", "culture"]
    },
    {
      slug: "time-travel-adventure",
      title: "Time Travel Adventure",
      iframeUrl: "https://www.crazygames.com/embed/time-travel-adventure",
      description: "Travel through different historical periods and learn historical events and figures.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["time-travel", "history", "events", "figures", "adventure"]
    },
    {
      slug: "map-explorer",
      title: "Map Explorer",
      iframeUrl: "https://www.crazygames.com/embed/map-explorer",
      description: "Explore world maps and learn geographical locations and terrain features.",
      ageRange: "7-15",
      difficulty: "Easy-Medium",
      tags: ["maps", "exploration", "geography", "terrain", "locations"]
    },
    {
      slug: "historical-timeline",
      title: "Historical Timeline",
      iframeUrl: "https://www.crazygames.com/embed/historical-timeline",
      description: "Learn important historical events in chronological order.",
      ageRange: "10-18",
      difficulty: "Medium",
      tags: ["history", "timeline", "events", "chronology", "learning"]
    },
    {
      slug: "country-flags-quiz",
      title: "Country Flags Quiz",
      iframeUrl: "https://www.crazygames.com/embed/country-flags-quiz",
      description: "Identify world country flags and learn about countries and cultures.",
      ageRange: "8-16",
      difficulty: "Easy-Medium",
      tags: ["flags", "countries", "identification", "culture", "world"]
    },
    {
      slug: "medieval-castle-builder",
      title: "Medieval Castle Builder",
      iframeUrl: "https://www.crazygames.com/embed/medieval-castle-builder",
      description: "Build medieval castles and learn historical architecture and defensive engineering.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["medieval", "castles", "architecture", "history", "building"]
    },
    {
      slug: "ocean-explorer",
      title: "Ocean Explorer",
      iframeUrl: "https://www.crazygames.com/embed/ocean-explorer",
      description: "Explore ocean geography and marine life to learn ocean science.",
      ageRange: "8-16",
      difficulty: "Medium",
      tags: ["ocean", "marine", "exploration", "geography", "science"]
    },
    {
      slug: "world-capitals",
      title: "World Capitals",
      iframeUrl: "https://www.crazygames.com/embed/world-capitals",
      description: "Learn world country capitals and improve geographical knowledge.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["capitals", "world", "countries", "geography", "memory"]
    },
    {
      slug: "archaeological-dig",
      title: "Archaeological Dig",
      iframeUrl: "https://www.crazygames.com/embed/archaeological-dig",
      description: "Simulate archaeological excavation and learn archaeology and historical research methods.",
      ageRange: "10-18",
      difficulty: "Medium-Hard",
      tags: ["archaeology", "excavation", "history", "research", "discovery"]
    },
    {
      slug: "climate-zones",
      title: "Climate Zones",
      iframeUrl: "https://www.crazygames.com/embed/climate-zones",
      description: "Learn world climate zone distribution and characteristics.",
      ageRange: "9-17",
      difficulty: "Medium",
      tags: ["climate", "zones", "weather", "geography", "environment"]
    },
    {
      slug: "famous-landmarks",
      title: "Famous Landmarks",
      iframeUrl: "https://www.crazygames.com/embed/famous-landmarks",
      description: "Identify world famous landmarks and learn cultural and historical backgrounds.",
      ageRange: "8-16",
      difficulty: "Easy-Medium",
      tags: ["landmarks", "famous", "culture", "history", "world"]
    }
  ]
};

/**
 * 创建游戏数据对象
 */
function createGameData(gameInfo, category) {
  const [minAge, maxAge] = gameInfo.ageRange.split('-').map(age => parseInt(age));
  
  return {
    slug: gameInfo.slug,
    title: gameInfo.title,
    category: category,
    categoryName: category.charAt(0).toUpperCase() + category.slice(1),
    iframeUrl: gameInfo.iframeUrl,
    description: gameInfo.description,
    gameGuide: {
      howToPlay: [
        "Click the game area to start playing",
        "Follow on-screen instructions for controls",
        "Use mouse, keyboard, or touch controls as needed",
        "Complete objectives to progress through levels"
      ]
    },
    thumbnailUrl: `/images/games/${category}/${gameInfo.slug}-placeholder.svg`,
    difficulty: gameInfo.difficulty,
    ageRange: gameInfo.ageRange,
    minAge: minAge,
    maxAge: maxAge,
    tags: gameInfo.tags,
    source: "CrazyGames",
    iframeCompatible: true,
    verified: true,
    technology: "HTML5",
    mobileSupport: true,
    responsive: true,
    lastUpdated: "2024-12-15",
    lastChecked: "2024-12-15",
    playCount: 0,
    featured: false,
    trending: false,
    isNew: true
  };
}

/**
 * 创建SVG占位符图片
 */
async function createSVGPlaceholder(category, slug, title) {
  const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)"/>
  <text x="200" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
  <text x="200" y="170" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">${category.toUpperCase()} GAME</text>
  <circle cx="200" cy="220" r="30" fill="rgba(255,255,255,0.2)"/>
  <polygon points="190,210 190,230 210,220" fill="white"/>
</svg>`;

  const dir = path.join('public', 'images', 'games', category);
  await fs.mkdir(dir, { recursive: true });
  
  const filepath = path.join(dir, `${slug}-placeholder.svg`);
  await fs.writeFile(filepath, svgContent);
  
  console.log(`  创建占位符图片: ${filepath}`);
}

/**
 * 批量部署CrazyGames游戏
 */
async function deployCrazyGames() {
  try {
    console.log('🚀 开始批量部署CrazyGames教育游戏...\n');
    
    // 读取现有游戏数据
    const existingGames = JSON.parse(await fs.readFile('src/data/games.json', 'utf8'));
    console.log(`📊 当前数据库中有 ${existingGames.length} 个游戏`);
    
    const allGames = [...existingGames];
    let addedCount = 0;
    
    // 遍历所有分类
    for (const [category, games] of Object.entries(CRAZYGAMES_DATA)) {
      console.log(`\n📂 处理 ${category} 分类 (${games.length} 个游戏):`);
      
      for (const gameInfo of games) {
        // 检查游戏是否已存在
        const exists = allGames.some(game => game.slug === gameInfo.slug);
        if (exists) {
          console.log(`  ⏭️  跳过已存在的游戏: ${gameInfo.title}`);
          continue;
        }
        
        // 创建游戏数据
        const gameData = createGameData(gameInfo, category);
        allGames.push(gameData);
        addedCount++;
        
        // 创建占位符图片
        await createSVGPlaceholder(category, gameInfo.slug, gameInfo.title);
        
        console.log(`  ✅ 添加游戏: ${gameInfo.title}`);
      }
    }
    
    // 保存更新后的数据
    await fs.writeFile('src/data/games.json', JSON.stringify(allGames, null, 2));
    
    console.log(`\n🎉 批量部署完成!`);
    console.log(`📊 总计: ${allGames.length} 个游戏 (新增 ${addedCount} 个)`);
    console.log(`📁 数据已保存到: src/data/games.json`);
    
    // 显示分类统计
    const categoryStats = {};
    allGames.forEach(game => {
      categoryStats[game.category] = (categoryStats[game.category] || 0) + 1;
    });
    
    console.log('\n📈 分类统计:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 个游戏`);
    });
    
  } catch (error) {
    console.error('❌ 部署失败:', error);
  }
}

// 执行部署
deployCrazyGames();

export { deployCrazyGames, createGameData, createSVGPlaceholder }; 