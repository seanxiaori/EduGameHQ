import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GAMES_CONFIG 仅包含未爬取的新游戏
const GAMES_CONFIG = {
  "grid-construction": {
    "name": "Grid Construction Game Introduction",
    "url": "https://gridconstruction.smartgridforall.org/",
    "embedUrl": "https://gridconstruction.smartgridforall.org/",
    "category": "science",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "learn-gdscript": {
    "name": "itch.io",
    "url": "https://gdquest.itch.io/learn-godots-gdscript-from-zero",
    "embedUrl": "https://gdquest.itch.io/learn-godots-gdscript-from-zero",
    "category": "coding",
    "source": "Itch.io",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "make-a-number": {
    "name": "Make a Number",
    "url": "https://www.mathplayground.com/make_a_number.html",
    "embedUrl": "https://www.mathplayground.com/make_a_number.html",
    "category": "math",
    "source": "MathPlayground",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "one-plus-two": {
    "name": "One plus two",
    "url": "https://www.miniplay.com/embed/one-plus-two",
    "embedUrl": "https://www.miniplay.com/embed/one-plus-two",
    "category": "math",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "sum-stacks": {
    "name": "Sum Stacks",
    "url": "https://www.mathplayground.com/sum_stacks.html",
    "embedUrl": "https://www.mathplayground.com/sum_stacks.html",
    "category": "math",
    "source": "MathPlayground",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "chemistry-reactor": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/chemistry-reactor",
    "embedUrl": "https://www.crazygames.com/embed/chemistry-reactor",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "physics-puzzle": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/physics-puzzle",
    "embedUrl": "https://www.crazygames.com/embed/physics-puzzle",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "simple-machines": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/simple-machines",
    "embedUrl": "https://www.crazygames.com/embed/simple-machines",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "photosynthesis": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/photosynthesis",
    "embedUrl": "https://www.crazygames.com/embed/photosynthesis",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "dna-replication": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/dna-replication",
    "embedUrl": "https://www.crazygames.com/embed/dna-replication",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "periodic-table-game": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/periodic-table-game",
    "embedUrl": "https://www.crazygames.com/embed/periodic-table-game",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "solar-system-explorer": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/solar-system-explorer",
    "embedUrl": "https://www.crazygames.com/embed/solar-system-explorer",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "weather-lab": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/weather-lab",
    "embedUrl": "https://www.crazygames.com/embed/weather-lab",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "human-body-explorer": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/human-body-explorer",
    "embedUrl": "https://www.crazygames.com/embed/human-body-explorer",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "earthquake-simulator": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/earthquake-simulator",
    "embedUrl": "https://www.crazygames.com/embed/earthquake-simulator",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "volcano-lab": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/volcano-lab",
    "embedUrl": "https://www.crazygames.com/embed/volcano-lab",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "ocean-explorer": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/ocean-explorer",
    "embedUrl": "https://www.crazygames.com/embed/ocean-explorer",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "food-chain-game": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/food-chain-game",
    "embedUrl": "https://www.crazygames.com/embed/food-chain-game",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "ecosystem-builder": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/ecosystem-builder",
    "embedUrl": "https://www.crazygames.com/embed/ecosystem-builder",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "states-of-matter": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/states-of-matter",
    "embedUrl": "https://www.crazygames.com/embed/states-of-matter",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "genetics-lab": {
    "name": "GAME",
    "url": "https://www.crazygames.com/embed/genetics-lab",
    "embedUrl": "https://www.crazygames.com/embed/genetics-lab",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "1-basketball-stars": {
    "name": "1. Basketball Stars",
    "url": "https://www.crazygames.com/embed/basketball-stars",
    "embedUrl": "https://www.crazygames.com/embed/basketball-stars",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "2-soccer-skills-champions-league": {
    "name": "2. Soccer Skills Champions League",
    "url": "https://www.crazygames.com/embed/soccer-skills-champions-league",
    "embedUrl": "https://www.crazygames.com/embed/soccer-skills-champions-league",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "3-penalty-kicks": {
    "name": "3. Penalty Kicks",
    "url": "https://www.crazygames.com/embed/penalty-kicks",
    "embedUrl": "https://www.crazygames.com/embed/penalty-kicks",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "4-table-tennis-world-tour": {
    "name": "4. Table Tennis World Tour",
    "url": "https://www.crazygames.com/embed/table-tennis-world-tour",
    "embedUrl": "https://www.crazygames.com/embed/table-tennis-world-tour",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "5-tennis-masters": {
    "name": "5. Tennis Masters",
    "url": "https://www.crazygames.com/embed/tennis-masters",
    "embedUrl": "https://www.crazygames.com/embed/tennis-masters",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "6-archery-world-tour": {
    "name": "6. Archery World Tour",
    "url": "https://www.crazygames.com/embed/archery-world-tour",
    "embedUrl": "https://www.crazygames.com/embed/archery-world-tour",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "7-crazy-golf-3d": {
    "name": "7. Crazy Golf 3D",
    "url": "https://www.crazygames.com/embed/crazy-golf-3d",
    "embedUrl": "https://www.crazygames.com/embed/crazy-golf-3d",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "8-bowling-masters": {
    "name": "8. Bowling Masters",
    "url": "https://www.crazygames.com/embed/bowling-masters",
    "embedUrl": "https://www.crazygames.com/embed/bowling-masters",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "9-ragdoll-volleyball": {
    "name": "9. Ragdoll Volleyball",
    "url": "https://www.crazygames.com/embed/ragdoll-volleyball",
    "embedUrl": "https://www.crazygames.com/embed/ragdoll-volleyball",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "10-sports-heads-basketball-championship": {
    "name": "10. Sports Heads Basketball Championship",
    "url": "https://www.crazygames.com/embed/sports-heads-basketball-championship",
    "embedUrl": "https://www.crazygames.com/embed/sports-heads-basketball-championship",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "11-8-ball-pool": {
    "name": "11. 8 Ball Pool",
    "url": "https://www.crazygames.com/embed/8-ball-pool",
    "embedUrl": "https://www.crazygames.com/embed/8-ball-pool",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "12-cricket-world-cup": {
    "name": "12. Cricket World Cup",
    "url": "https://www.crazygames.com/embed/cricket-world-cup",
    "embedUrl": "https://www.crazygames.com/embed/cricket-world-cup",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "13-baseball-heroes": {
    "name": "13. Baseball Heroes",
    "url": "https://www.crazygames.com/embed/baseball-heroes",
    "embedUrl": "https://www.crazygames.com/embed/baseball-heroes",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "14-hockey-stars": {
    "name": "14. Hockey Stars",
    "url": "https://www.crazygames.com/embed/hockey-stars",
    "embedUrl": "https://www.crazygames.com/embed/hockey-stars",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "15-wrestling-physics": {
    "name": "15. Wrestling Physics",
    "url": "https://www.crazygames.com/embed/wrestling-physics",
    "embedUrl": "https://www.crazygames.com/embed/wrestling-physics",
    "category": "sports",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "16-football-masters": {
    "name": "16. Football Masters",
    "url": "https://www.miniplay.com/embed/football-masters",
    "embedUrl": "https://www.miniplay.com/embed/football-masters",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "17-world-cup-penalty": {
    "name": "17. World Cup Penalty",
    "url": "https://www.miniplay.com/embed/world-cup-penalty",
    "embedUrl": "https://www.miniplay.com/embed/world-cup-penalty",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "18-basketball-line": {
    "name": "18. Basketball Line",
    "url": "https://www.miniplay.com/embed/basketball-line",
    "embedUrl": "https://www.miniplay.com/embed/basketball-line",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "19-shot-shot": {
    "name": "19. Shot Shot",
    "url": "https://www.miniplay.com/embed/shot-shot",
    "embedUrl": "https://www.miniplay.com/embed/shot-shot",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "20-stick-tennis": {
    "name": "20. Stick Tennis",
    "url": "https://www.miniplay.com/embed/stick-tennis",
    "embedUrl": "https://www.miniplay.com/embed/stick-tennis",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "21-basketball-stars-online": {
    "name": "21. Basketball Stars Online",
    "url": "https://www.miniplay.com/embed/basketball-stars-online",
    "embedUrl": "https://www.miniplay.com/embed/basketball-stars-online",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "22-soccer-physics": {
    "name": "22. Soccer Physics",
    "url": "https://www.miniplay.com/embed/soccer-physics",
    "embedUrl": "https://www.miniplay.com/embed/soccer-physics",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "23-penalty-shooters": {
    "name": "23. Penalty Shooters",
    "url": "https://www.miniplay.com/embed/penalty-shooters",
    "embedUrl": "https://www.miniplay.com/embed/penalty-shooters",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "24-euro-penalty-2021": {
    "name": "24. Euro Penalty 2021",
    "url": "https://www.miniplay.com/embed/euro-penalty-2021",
    "embedUrl": "https://www.miniplay.com/embed/euro-penalty-2021",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "25-basketball-legends": {
    "name": "25. Basketball Legends",
    "url": "https://www.miniplay.com/embed/basketball-legends",
    "embedUrl": "https://www.miniplay.com/embed/basketball-legends",
    "category": "sports",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "26-speedboat-racing": {
    "name": "26. Speedboat Racing",
    "url": "https://html5.gamedistribution.com/rvvASMiM/917cce8c44c44638a9b8c5a82b4a1b89/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/917cce8c44c44638a9b8c5a82b4a1b89/index.html",
    "category": "sports",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "27-mini-golf-world": {
    "name": "27. Mini Golf World",
    "url": "https://html5.gamedistribution.com/rvvASMiM/f804d079d19f43d98ef4b8d412844055/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/f804d079d19f43d98ef4b8d412844055/index.html",
    "category": "sports",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "28-table-tennis-challenge": {
    "name": "28. Table Tennis Challenge",
    "url": "https://html5.gamedistribution.com/rvvASMiM/cd2a479ac53c4d5d9abc3a04d7a25bea/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/cd2a479ac53c4d5d9abc3a04d7a25bea/index.html",
    "category": "sports",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "29-football-kick-ups": {
    "name": "29. Football Kick Ups",
    "url": "https://html5.gamedistribution.com/rvvASMiM/8c1978c52c824ed38bae2fb9c79d5c10/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/8c1978c52c824ed38bae2fb9c79d5c10/index.html",
    "category": "sports",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "30-soccer-skills-runner": {
    "name": "30. Soccer Skills Runner",
    "url": "https://html5.gamedistribution.com/rvvASMiM/31c8e9d0c3c8446b952e1c950df39d80/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/31c8e9d0c3c8446b952e1c950df39d80/index.html",
    "category": "sports",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "1-geoguessr-classic": {
    "name": "1. GeoGuessr Classic",
    "url": "https://www.crazygames.com/embed/geoguessr-classic",
    "embedUrl": "https://www.crazygames.com/embed/geoguessr-classic",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "2-usa-map-quiz": {
    "name": "2. USA Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/usa-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/usa-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "3-uk-cities-map-quiz": {
    "name": "3. UK Cities Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/uk-cities-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/uk-cities-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "4-world-history-timeline": {
    "name": "4. World History Timeline",
    "url": "https://www.crazygames.com/embed/world-history-timeline",
    "embedUrl": "https://www.crazygames.com/embed/world-history-timeline",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "5-states-of-america": {
    "name": "5. States of America",
    "url": "https://www.miniplay.com/embed/states-of-america",
    "embedUrl": "https://www.miniplay.com/embed/states-of-america",
    "category": "history",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "6-canadian-provinces-quiz": {
    "name": "6. Canadian Provinces Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/canadian-provinces-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/canadian-provinces-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "7-australian-landmarks": {
    "name": "7. Australian Landmarks",
    "url": "https://www.crazygames.com/embed/australian-landmarks",
    "embedUrl": "https://www.crazygames.com/embed/australian-landmarks",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "8-world-capitals-quiz": {
    "name": "8. World Capitals Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/world-capitals-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/world-capitals-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "9-british-history-adventure": {
    "name": "9. British History Adventure",
    "url": "https://www.crazygames.com/embed/british-history-adventure",
    "embedUrl": "https://www.crazygames.com/embed/british-history-adventure",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "10-us-presidents-quiz": {
    "name": "10. US Presidents Quiz",
    "url": "https://www.miniplay.com/embed/us-presidents-quiz",
    "embedUrl": "https://www.miniplay.com/embed/us-presidents-quiz",
    "category": "history",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "11-world-flags-quiz": {
    "name": "11. World Flags Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/world-flags-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/world-flags-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "12-us-state-capitals": {
    "name": "12. US State Capitals",
    "url": "https://www.crazygames.com/embed/us-state-capitals",
    "embedUrl": "https://www.crazygames.com/embed/us-state-capitals",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "13-europe-map-quiz": {
    "name": "13. Europe Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/europe-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/europe-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "14-wonders-of-the-world": {
    "name": "14. Wonders of the World",
    "url": "https://www.crazygames.com/embed/wonders-of-the-world",
    "embedUrl": "https://www.crazygames.com/embed/wonders-of-the-world",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "15-africa-map-quiz": {
    "name": "15. Africa Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/africa-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/africa-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "16-asia-map-quiz": {
    "name": "16. Asia Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/asia-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/asia-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "17-australia-map-quiz": {
    "name": "17. Australia Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/australia-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/australia-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "18-canada-map-quiz": {
    "name": "18. Canada Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/canada-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/canada-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "19-south-america-map-quiz": {
    "name": "19. South America Map Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/south-america-map-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/south-america-map-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "20-world-monuments-quiz": {
    "name": "20. World Monuments Quiz",
    "url": "https://www.crazygames.com/embed/world-monuments-quiz",
    "embedUrl": "https://www.crazygames.com/embed/world-monuments-quiz",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "21-ancient-egypt-adventure": {
    "name": "21. Ancient Egypt Adventure",
    "url": "https://www.crazygames.com/embed/ancient-egypt-adventure",
    "embedUrl": "https://www.crazygames.com/embed/ancient-egypt-adventure",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "22-us-landmarks-quiz": {
    "name": "22. US Landmarks Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/us-landmarks-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/us-landmarks-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "23-uk-landmarks-quiz": {
    "name": "23. UK Landmarks Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/uk-landmarks-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/uk-landmarks-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "24-world-rivers-quiz": {
    "name": "24. World Rivers Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/world-rivers-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/world-rivers-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "25-world-mountains-quiz": {
    "name": "25. World Mountains Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/world-mountains-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/world-mountains-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "26-us-history-timeline": {
    "name": "26. US History Timeline",
    "url": "https://www.crazygames.com/embed/us-history-timeline",
    "embedUrl": "https://www.crazygames.com/embed/us-history-timeline",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "27-world-war-ii-quiz": {
    "name": "27. World War II Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/world-war-ii-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/world-war-ii-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "28-world-continents-quiz": {
    "name": "28. World Continents Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/world-continents-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/world-continents-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "29-us-national-parks-quiz": {
    "name": "29. US National Parks Quiz",
    "url": "https://html5.gamedistribution.com/rvvASMiM/us-national-parks-quiz/index.html",
    "embedUrl": "https://html5.gamedistribution.com/rvvASMiM/us-national-parks-quiz/index.html",
    "category": "history",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "30-world-heritage-sites": {
    "name": "30. World Heritage Sites",
    "url": "https://www.crazygames.com/embed/world-heritage-sites",
    "embedUrl": "https://www.crazygames.com/embed/world-heritage-sites",
    "category": "history",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "typing-master": {
    "name": "Typing Master",
    "url": "https://www.crazygames.com/embed/typing-master",
    "embedUrl": "https://www.crazygames.com/embed/typing-master",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "word-search-puzzle": {
    "name": "Word Search Puzzle",
    "url": "https://www.crazygames.com/embed/word-search-puzzle",
    "embedUrl": "https://www.crazygames.com/embed/word-search-puzzle",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "grammar-quiz": {
    "name": "Grammar Quiz",
    "url": "https://www.miniplay.com/embed/grammar-quiz",
    "embedUrl": "https://www.miniplay.com/embed/grammar-quiz",
    "category": "language",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "sudoku-master": {
    "name": "Sudoku Master",
    "url": "https://www.crazygames.com/embed/sudoku-master",
    "embedUrl": "https://www.crazygames.com/embed/sudoku-master",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "jigsaw-puzzle": {
    "name": "Jigsaw Puzzle",
    "url": "https://www.crazygames.com/embed/jigsaw-puzzle",
    "embedUrl": "https://www.crazygames.com/embed/jigsaw-puzzle",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "memory-match": {
    "name": "Memory Match",
    "url": "https://www.miniplay.com/embed/memory-match",
    "embedUrl": "https://www.miniplay.com/embed/memory-match",
    "category": "puzzle",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "pixel-art-maker": {
    "name": "Pixel Art Maker",
    "url": "https://www.crazygames.com/embed/pixel-art-maker",
    "embedUrl": "https://www.crazygames.com/embed/pixel-art-maker",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "music-maker": {
    "name": "Music Maker",
    "url": "https://www.crazygames.com/embed/music-maker",
    "embedUrl": "https://www.crazygames.com/embed/music-maker",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "drawing-pad": {
    "name": "Drawing Pad",
    "url": "https://www.miniplay.com/embed/drawing-pad",
    "embedUrl": "https://www.miniplay.com/embed/drawing-pad",
    "category": "art",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "code-monkey": {
    "name": "Code Monkey",
    "url": "https://www.crazygames.com/embed/code-monkey",
    "embedUrl": "https://www.crazygames.com/embed/code-monkey",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "robot-programming": {
    "name": "Robot Programming",
    "url": "https://www.miniplay.com/embed/robot-programming",
    "embedUrl": "https://www.miniplay.com/embed/robot-programming",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "algorithm-city": {
    "name": "Algorithm City",
    "url": "https://www.crazygames.com/embed/algorithm-city",
    "embedUrl": "https://www.crazygames.com/embed/algorithm-city",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "fraction-frenzy": {
    "name": "Fraction Frenzy",
    "url": "https://www.crazygames.com/embed/fraction-frenzy",
    "embedUrl": "https://www.crazygames.com/embed/fraction-frenzy",
    "category": "math",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "geometry-dash-math": {
    "name": "Geometry Dash Math",
    "url": "https://www.miniplay.com/embed/geometry-dash-math",
    "embedUrl": "https://www.miniplay.com/embed/geometry-dash-math",
    "category": "math",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "algebra-adventure": {
    "name": "Algebra Adventure",
    "url": "https://www.crazygames.com/embed/algebra-adventure",
    "embedUrl": "https://www.crazygames.com/embed/algebra-adventure",
    "category": "math",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "chemistry-lab-simulator": {
    "name": "Chemistry Lab Simulator",
    "url": "https://www.crazygames.com/embed/chemistry-lab-simulator",
    "embedUrl": "https://www.crazygames.com/embed/chemistry-lab-simulator",
    "category": "science",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "physics-playground": {
    "name": "Physics Playground",
    "url": "https://www.miniplay.com/embed/physics-playground",
    "embedUrl": "https://www.miniplay.com/embed/physics-playground",
    "category": "science",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "scratch-programming": {
    "name": "Scratch Programming",
    "url": "https://scratch.mit.edu/projects/editor/",
    "embedUrl": "https://scratch.mit.edu/projects/editor/",
    "category": "coding",
    "source": "Unknown",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "python-turtle-graphics": {
    "name": "Python Turtle Graphics",
    "url": "https://www.crazygames.com/embed/python-turtle",
    "embedUrl": "https://www.crazygames.com/embed/python-turtle",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "javascript-playground": {
    "name": "JavaScript Playground",
    "url": "https://www.miniplay.com/embed/javascript-playground",
    "embedUrl": "https://www.miniplay.com/embed/javascript-playground",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "html-css-builder": {
    "name": "HTML CSS Builder",
    "url": "https://www.crazygames.com/embed/html-css-builder",
    "embedUrl": "https://www.crazygames.com/embed/html-css-builder",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "logic-circuit-designer": {
    "name": "Logic Circuit Designer",
    "url": "https://www.crazygames.com/embed/logic-circuit-designer",
    "embedUrl": "https://www.crazygames.com/embed/logic-circuit-designer",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "algorithm-visualizer": {
    "name": "Algorithm Visualizer",
    "url": "https://www.miniplay.com/embed/algorithm-visualizer",
    "embedUrl": "https://www.miniplay.com/embed/algorithm-visualizer",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "code-combat-arena": {
    "name": "Code Combat Arena",
    "url": "https://www.crazygames.com/embed/code-combat-arena",
    "embedUrl": "https://www.crazygames.com/embed/code-combat-arena",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "minecraft-code-builder": {
    "name": "Minecraft Code Builder",
    "url": "https://www.miniplay.com/embed/minecraft-code-builder",
    "embedUrl": "https://www.miniplay.com/embed/minecraft-code-builder",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "robot-maze-challenge": {
    "name": "Robot Maze Challenge",
    "url": "https://www.crazygames.com/embed/robot-maze-challenge",
    "embedUrl": "https://www.crazygames.com/embed/robot-maze-challenge",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "binary-number-game": {
    "name": "Binary Number Game",
    "url": "https://www.miniplay.com/embed/binary-number-game",
    "embedUrl": "https://www.miniplay.com/embed/binary-number-game",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "debugging-detective": {
    "name": "Debugging Detective",
    "url": "https://www.crazygames.com/embed/debugging-detective",
    "embedUrl": "https://www.crazygames.com/embed/debugging-detective",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "flowchart-builder": {
    "name": "Flowchart Builder",
    "url": "https://www.miniplay.com/embed/flowchart-builder",
    "embedUrl": "https://www.miniplay.com/embed/flowchart-builder",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "recursion-tower": {
    "name": "Recursion Tower",
    "url": "https://www.crazygames.com/embed/recursion-tower",
    "embedUrl": "https://www.crazygames.com/embed/recursion-tower",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "data-structure-explorer": {
    "name": "Data Structure Explorer",
    "url": "https://www.miniplay.com/embed/data-structure-explorer",
    "embedUrl": "https://www.miniplay.com/embed/data-structure-explorer",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "game-development-studio": {
    "name": "Game Development Studio",
    "url": "https://www.crazygames.com/embed/game-development-studio",
    "embedUrl": "https://www.crazygames.com/embed/game-development-studio",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "api-adventure": {
    "name": "API Adventure",
    "url": "https://www.miniplay.com/embed/api-adventure",
    "embedUrl": "https://www.miniplay.com/embed/api-adventure",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "database-designer": {
    "name": "Database Designer",
    "url": "https://www.crazygames.com/embed/database-designer",
    "embedUrl": "https://www.crazygames.com/embed/database-designer",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "cybersecurity-challenge": {
    "name": "Cybersecurity Challenge",
    "url": "https://www.miniplay.com/embed/cybersecurity-challenge",
    "embedUrl": "https://www.miniplay.com/embed/cybersecurity-challenge",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "machine-learning-lab": {
    "name": "Machine Learning Lab",
    "url": "https://www.crazygames.com/embed/machine-learning-lab",
    "embedUrl": "https://www.crazygames.com/embed/machine-learning-lab",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "version-control-git": {
    "name": "Version Control Git",
    "url": "https://www.miniplay.com/embed/version-control-git",
    "embedUrl": "https://www.miniplay.com/embed/version-control-git",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "mobile-app-builder": {
    "name": "Mobile App Builder",
    "url": "https://www.crazygames.com/embed/mobile-app-builder",
    "embedUrl": "https://www.crazygames.com/embed/mobile-app-builder",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "cloud-computing-sim": {
    "name": "Cloud Computing Sim",
    "url": "https://www.miniplay.com/embed/cloud-computing-sim",
    "embedUrl": "https://www.miniplay.com/embed/cloud-computing-sim",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "blockchain-explorer": {
    "name": "Blockchain Explorer",
    "url": "https://www.crazygames.com/embed/blockchain-explorer",
    "embedUrl": "https://www.crazygames.com/embed/blockchain-explorer",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "iot-device-manager": {
    "name": "IoT Device Manager",
    "url": "https://www.miniplay.com/embed/iot-device-manager",
    "embedUrl": "https://www.miniplay.com/embed/iot-device-manager",
    "category": "coding",
    "source": "Miniplay",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "code-review-master": {
    "name": "Code Review Master",
    "url": "https://www.crazygames.com/embed/code-review-master",
    "embedUrl": "https://www.crazygames.com/embed/code-review-master",
    "category": "coding",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-4": {
    "name": "Language Game 4",
    "url": "https://www.crazygames.com/embed/language-game-4",
    "embedUrl": "https://www.crazygames.com/embed/language-game-4",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-5": {
    "name": "Language Game 5",
    "url": "https://www.crazygames.com/embed/language-game-5",
    "embedUrl": "https://www.crazygames.com/embed/language-game-5",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-6": {
    "name": "Language Game 6",
    "url": "https://www.crazygames.com/embed/language-game-6",
    "embedUrl": "https://www.crazygames.com/embed/language-game-6",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-7": {
    "name": "Language Game 7",
    "url": "https://www.crazygames.com/embed/language-game-7",
    "embedUrl": "https://www.crazygames.com/embed/language-game-7",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-8": {
    "name": "Language Game 8",
    "url": "https://www.crazygames.com/embed/language-game-8",
    "embedUrl": "https://www.crazygames.com/embed/language-game-8",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-9": {
    "name": "Language Game 9",
    "url": "https://www.crazygames.com/embed/language-game-9",
    "embedUrl": "https://www.crazygames.com/embed/language-game-9",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-10": {
    "name": "Language Game 10",
    "url": "https://www.crazygames.com/embed/language-game-10",
    "embedUrl": "https://www.crazygames.com/embed/language-game-10",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-11": {
    "name": "Language Game 11",
    "url": "https://www.crazygames.com/embed/language-game-11",
    "embedUrl": "https://www.crazygames.com/embed/language-game-11",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-12": {
    "name": "Language Game 12",
    "url": "https://www.crazygames.com/embed/language-game-12",
    "embedUrl": "https://www.crazygames.com/embed/language-game-12",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-13": {
    "name": "Language Game 13",
    "url": "https://www.crazygames.com/embed/language-game-13",
    "embedUrl": "https://www.crazygames.com/embed/language-game-13",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-14": {
    "name": "Language Game 14",
    "url": "https://www.crazygames.com/embed/language-game-14",
    "embedUrl": "https://www.crazygames.com/embed/language-game-14",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-15": {
    "name": "Language Game 15",
    "url": "https://www.crazygames.com/embed/language-game-15",
    "embedUrl": "https://www.crazygames.com/embed/language-game-15",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-16": {
    "name": "Language Game 16",
    "url": "https://www.crazygames.com/embed/language-game-16",
    "embedUrl": "https://www.crazygames.com/embed/language-game-16",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-17": {
    "name": "Language Game 17",
    "url": "https://www.crazygames.com/embed/language-game-17",
    "embedUrl": "https://www.crazygames.com/embed/language-game-17",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-18": {
    "name": "Language Game 18",
    "url": "https://www.crazygames.com/embed/language-game-18",
    "embedUrl": "https://www.crazygames.com/embed/language-game-18",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-19": {
    "name": "Language Game 19",
    "url": "https://www.crazygames.com/embed/language-game-19",
    "embedUrl": "https://www.crazygames.com/embed/language-game-19",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-20": {
    "name": "Language Game 20",
    "url": "https://www.crazygames.com/embed/language-game-20",
    "embedUrl": "https://www.crazygames.com/embed/language-game-20",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-21": {
    "name": "Language Game 21",
    "url": "https://www.crazygames.com/embed/language-game-21",
    "embedUrl": "https://www.crazygames.com/embed/language-game-21",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-22": {
    "name": "Language Game 22",
    "url": "https://www.crazygames.com/embed/language-game-22",
    "embedUrl": "https://www.crazygames.com/embed/language-game-22",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-23": {
    "name": "Language Game 23",
    "url": "https://www.crazygames.com/embed/language-game-23",
    "embedUrl": "https://www.crazygames.com/embed/language-game-23",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-24": {
    "name": "Language Game 24",
    "url": "https://www.crazygames.com/embed/language-game-24",
    "embedUrl": "https://www.crazygames.com/embed/language-game-24",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-25": {
    "name": "Language Game 25",
    "url": "https://www.crazygames.com/embed/language-game-25",
    "embedUrl": "https://www.crazygames.com/embed/language-game-25",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-26": {
    "name": "Language Game 26",
    "url": "https://www.crazygames.com/embed/language-game-26",
    "embedUrl": "https://www.crazygames.com/embed/language-game-26",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-27": {
    "name": "Language Game 27",
    "url": "https://www.crazygames.com/embed/language-game-27",
    "embedUrl": "https://www.crazygames.com/embed/language-game-27",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-28": {
    "name": "Language Game 28",
    "url": "https://www.crazygames.com/embed/language-game-28",
    "embedUrl": "https://www.crazygames.com/embed/language-game-28",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-29": {
    "name": "Language Game 29",
    "url": "https://www.crazygames.com/embed/language-game-29",
    "embedUrl": "https://www.crazygames.com/embed/language-game-29",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "language-game-30": {
    "name": "Language Game 30",
    "url": "https://www.crazygames.com/embed/language-game-30",
    "embedUrl": "https://www.crazygames.com/embed/language-game-30",
    "category": "language",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-4": {
    "name": "Puzzle Game 4",
    "url": "https://www.crazygames.com/embed/puzzle-game-4",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-4",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-5": {
    "name": "Puzzle Game 5",
    "url": "https://www.crazygames.com/embed/puzzle-game-5",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-5",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-6": {
    "name": "Puzzle Game 6",
    "url": "https://www.crazygames.com/embed/puzzle-game-6",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-6",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-7": {
    "name": "Puzzle Game 7",
    "url": "https://www.crazygames.com/embed/puzzle-game-7",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-7",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-8": {
    "name": "Puzzle Game 8",
    "url": "https://www.crazygames.com/embed/puzzle-game-8",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-8",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-9": {
    "name": "Puzzle Game 9",
    "url": "https://www.crazygames.com/embed/puzzle-game-9",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-9",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-10": {
    "name": "Puzzle Game 10",
    "url": "https://www.crazygames.com/embed/puzzle-game-10",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-10",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-11": {
    "name": "Puzzle Game 11",
    "url": "https://www.crazygames.com/embed/puzzle-game-11",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-11",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-12": {
    "name": "Puzzle Game 12",
    "url": "https://www.crazygames.com/embed/puzzle-game-12",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-12",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-13": {
    "name": "Puzzle Game 13",
    "url": "https://www.crazygames.com/embed/puzzle-game-13",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-13",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-14": {
    "name": "Puzzle Game 14",
    "url": "https://www.crazygames.com/embed/puzzle-game-14",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-14",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-15": {
    "name": "Puzzle Game 15",
    "url": "https://www.crazygames.com/embed/puzzle-game-15",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-15",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-16": {
    "name": "Puzzle Game 16",
    "url": "https://www.crazygames.com/embed/puzzle-game-16",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-16",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-17": {
    "name": "Puzzle Game 17",
    "url": "https://www.crazygames.com/embed/puzzle-game-17",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-17",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-18": {
    "name": "Puzzle Game 18",
    "url": "https://www.crazygames.com/embed/puzzle-game-18",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-18",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-19": {
    "name": "Puzzle Game 19",
    "url": "https://www.crazygames.com/embed/puzzle-game-19",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-19",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-20": {
    "name": "Puzzle Game 20",
    "url": "https://www.crazygames.com/embed/puzzle-game-20",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-20",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-21": {
    "name": "Puzzle Game 21",
    "url": "https://www.crazygames.com/embed/puzzle-game-21",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-21",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-22": {
    "name": "Puzzle Game 22",
    "url": "https://www.crazygames.com/embed/puzzle-game-22",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-22",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-23": {
    "name": "Puzzle Game 23",
    "url": "https://www.crazygames.com/embed/puzzle-game-23",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-23",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-24": {
    "name": "Puzzle Game 24",
    "url": "https://www.crazygames.com/embed/puzzle-game-24",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-24",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-25": {
    "name": "Puzzle Game 25",
    "url": "https://www.crazygames.com/embed/puzzle-game-25",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-25",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-26": {
    "name": "Puzzle Game 26",
    "url": "https://www.crazygames.com/embed/puzzle-game-26",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-26",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-27": {
    "name": "Puzzle Game 27",
    "url": "https://www.crazygames.com/embed/puzzle-game-27",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-27",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-28": {
    "name": "Puzzle Game 28",
    "url": "https://www.crazygames.com/embed/puzzle-game-28",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-28",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-29": {
    "name": "Puzzle Game 29",
    "url": "https://www.crazygames.com/embed/puzzle-game-29",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-29",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "puzzle-game-30": {
    "name": "Puzzle Game 30",
    "url": "https://www.crazygames.com/embed/puzzle-game-30",
    "embedUrl": "https://www.crazygames.com/embed/puzzle-game-30",
    "category": "puzzle",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-4": {
    "name": "Art Game 4",
    "url": "https://www.crazygames.com/embed/art-game-4",
    "embedUrl": "https://www.crazygames.com/embed/art-game-4",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-5": {
    "name": "Art Game 5",
    "url": "https://www.crazygames.com/embed/art-game-5",
    "embedUrl": "https://www.crazygames.com/embed/art-game-5",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-6": {
    "name": "Art Game 6",
    "url": "https://www.crazygames.com/embed/art-game-6",
    "embedUrl": "https://www.crazygames.com/embed/art-game-6",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-7": {
    "name": "Art Game 7",
    "url": "https://www.crazygames.com/embed/art-game-7",
    "embedUrl": "https://www.crazygames.com/embed/art-game-7",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-8": {
    "name": "Art Game 8",
    "url": "https://www.crazygames.com/embed/art-game-8",
    "embedUrl": "https://www.crazygames.com/embed/art-game-8",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-9": {
    "name": "Art Game 9",
    "url": "https://www.crazygames.com/embed/art-game-9",
    "embedUrl": "https://www.crazygames.com/embed/art-game-9",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-10": {
    "name": "Art Game 10",
    "url": "https://www.crazygames.com/embed/art-game-10",
    "embedUrl": "https://www.crazygames.com/embed/art-game-10",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-11": {
    "name": "Art Game 11",
    "url": "https://www.crazygames.com/embed/art-game-11",
    "embedUrl": "https://www.crazygames.com/embed/art-game-11",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-12": {
    "name": "Art Game 12",
    "url": "https://www.crazygames.com/embed/art-game-12",
    "embedUrl": "https://www.crazygames.com/embed/art-game-12",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-13": {
    "name": "Art Game 13",
    "url": "https://www.crazygames.com/embed/art-game-13",
    "embedUrl": "https://www.crazygames.com/embed/art-game-13",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-14": {
    "name": "Art Game 14",
    "url": "https://www.crazygames.com/embed/art-game-14",
    "embedUrl": "https://www.crazygames.com/embed/art-game-14",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-15": {
    "name": "Art Game 15",
    "url": "https://www.crazygames.com/embed/art-game-15",
    "embedUrl": "https://www.crazygames.com/embed/art-game-15",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-16": {
    "name": "Art Game 16",
    "url": "https://www.crazygames.com/embed/art-game-16",
    "embedUrl": "https://www.crazygames.com/embed/art-game-16",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-17": {
    "name": "Art Game 17",
    "url": "https://www.crazygames.com/embed/art-game-17",
    "embedUrl": "https://www.crazygames.com/embed/art-game-17",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-18": {
    "name": "Art Game 18",
    "url": "https://www.crazygames.com/embed/art-game-18",
    "embedUrl": "https://www.crazygames.com/embed/art-game-18",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-19": {
    "name": "Art Game 19",
    "url": "https://www.crazygames.com/embed/art-game-19",
    "embedUrl": "https://www.crazygames.com/embed/art-game-19",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-20": {
    "name": "Art Game 20",
    "url": "https://www.crazygames.com/embed/art-game-20",
    "embedUrl": "https://www.crazygames.com/embed/art-game-20",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-21": {
    "name": "Art Game 21",
    "url": "https://www.crazygames.com/embed/art-game-21",
    "embedUrl": "https://www.crazygames.com/embed/art-game-21",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-22": {
    "name": "Art Game 22",
    "url": "https://www.crazygames.com/embed/art-game-22",
    "embedUrl": "https://www.crazygames.com/embed/art-game-22",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-23": {
    "name": "Art Game 23",
    "url": "https://www.crazygames.com/embed/art-game-23",
    "embedUrl": "https://www.crazygames.com/embed/art-game-23",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-24": {
    "name": "Art Game 24",
    "url": "https://www.crazygames.com/embed/art-game-24",
    "embedUrl": "https://www.crazygames.com/embed/art-game-24",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-25": {
    "name": "Art Game 25",
    "url": "https://www.crazygames.com/embed/art-game-25",
    "embedUrl": "https://www.crazygames.com/embed/art-game-25",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-26": {
    "name": "Art Game 26",
    "url": "https://www.crazygames.com/embed/art-game-26",
    "embedUrl": "https://www.crazygames.com/embed/art-game-26",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-27": {
    "name": "Art Game 27",
    "url": "https://www.crazygames.com/embed/art-game-27",
    "embedUrl": "https://www.crazygames.com/embed/art-game-27",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-28": {
    "name": "Art Game 28",
    "url": "https://www.crazygames.com/embed/art-game-28",
    "embedUrl": "https://www.crazygames.com/embed/art-game-28",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-29": {
    "name": "Art Game 29",
    "url": "https://www.crazygames.com/embed/art-game-29",
    "embedUrl": "https://www.crazygames.com/embed/art-game-29",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  },
  "art-game-30": {
    "name": "Art Game 30",
    "url": "https://www.crazygames.com/embed/art-game-30",
    "embedUrl": "https://www.crazygames.com/embed/art-game-30",
    "category": "art",
    "source": "CrazyGames",
    "ageRange": "8-16",
    "difficulty": "Medium"
  }
};

export { GAMES_CONFIG };

export class IntelligentGameCrawler {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, '../public/images/games/details');
    this.gameDataDir = path.join(__dirname, '../src/data/games');
  }

  async init() {
    console.log('🚀 启动智能游戏爬虫...');
    
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(this.gameDataDir, { recursive: true });

    // 启动浏览器
    this.browser = await puppeteer.launch({
      headless: false, // 可视化模式，方便观察
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    console.log('✅ 浏览器启动成功');
  }

  async crawlGame(gameId, config, retryCount = 0) {
    try {
      console.log(`🎮 开始爬取游戏: ${config.name}`);
      console.log(`🔗 URL: ${config.url}`);
      console.log(`🌐 正在加载游戏页面...`);

      const page = await this.browser.newPage();
      
      // 设置用户代理和视口
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // 导航到游戏页面
      const response = await page.goto(config.url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // 检查页面是否成功加载
      if (!response || response.status() !== 200) {
        throw new Error(`页面加载失败，状态码: ${response ? response.status() : 'unknown'}`);
      }

      // 等待页面内容加载
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 检查页面是否包含错误信息
      const pageContent = await page.content();
      const errorKeywords = ['404', 'not found', 'page not found', 'error', 'unavailable'];
      const hasError = errorKeywords.some(keyword => 
        pageContent.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasError) {
        throw new Error('页面包含错误信息');
      }

      // 提取游戏信息
      console.log('📝 提取游戏基本信息...');
      const gameInfo = await this.extractGameInfo(page, config);

      // 提取游戏图片
      console.log('🖼️ 提取游戏介绍图片...');
      const images = await this.extractGameImages(page, gameId);

      // 智能截图
      console.log('📸 智能截取游戏截图...');
      const screenshots = await this.takeIntelligentScreenshots(page, gameId);

      // 提取详细操作说明
      console.log('📖 提取详细操作说明...');
      const instructions = await this.extractDetailedInstructions(page, config);

      // 组合游戏数据
      const gameData = {
        info: gameInfo,
        images: images,
        screenshots: screenshots,
        instructions: instructions
      };

      // 保存游戏详情到JSON文件
      const detailsPath = path.join(process.cwd(), 'public/images/games/details', `${gameId}-details.json`);
      await fs.mkdir(path.dirname(detailsPath), { recursive: true });
      await fs.writeFile(detailsPath, JSON.stringify(gameData, null, 2));
      console.log(`💾 游戏详情已保存: ${detailsPath}`);

      // 更新游戏数据文件
      await this.updateGameDataFile(gameId, gameData);
      console.log(`📄 游戏数据已更新`);

      await page.close();
      console.log(`✅ ${config.name} 爬取完成`);
      return gameData;

    } catch (error) {
      console.log(`❌ 爬取 ${config.name} 时出错: ${error.message}`);
      
      // 重试逻辑
      if (retryCount < 3) {
        console.log(`🔄 将在5秒后重试 (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.crawlGame(gameId, config, retryCount + 1);
      } else {
        console.log(`❌ ${config.name} 重试 3 次后仍然失败，跳过此游戏`);
        return null;
      }
    }
  }

  async extractGameInfo(page, config) {
    try {
      const info = await page.evaluate((source) => {
        const result = {
          title: '',
          description: '',
          tags: [],
          rating: null,
          plays: null,
          features: [],
          objectives: []
        };

        // 根据不同来源提取信息
        if (source === 'CrazyGames') {
          // CrazyGames 特定选择器
          const titleEl = document.querySelector('h1') || document.querySelector('.game-title');
          if (titleEl) result.title = titleEl.textContent.trim();

          const descEl = document.querySelector('.game-description') || 
                        document.querySelector('[data-cy="game-description"]') ||
                        document.querySelector('meta[name="description"]');
          if (descEl) {
            result.description = descEl.content || descEl.textContent.trim();
          }

          // 提取标签
          const tagElements = document.querySelectorAll('.game-tags a, .tag, .chip');
          result.tags = Array.from(tagElements).map(el => el.textContent.trim()).filter(tag => tag);

        } else if (source === 'Miniplay') {
          // Miniplay 特定选择器
          const titleEl = document.querySelector('h1.game-title') || document.querySelector('h1');
          if (titleEl) result.title = titleEl.textContent.trim();

          const descEl = document.querySelector('.game-description') || 
                        document.querySelector('.description') ||
                        document.querySelector('meta[name="description"]');
          if (descEl) {
            result.description = descEl.content || descEl.textContent.trim();
          }

        } else if (source === 'Itch.io') {
          // Itch.io 特定选择器
          const titleEl = document.querySelector('h1.game_title') || 
                         document.querySelector('.game_title') || 
                         document.querySelector('h1');
          if (titleEl) result.title = titleEl.textContent.trim();

          const descEl = document.querySelector('.formatted_description') || 
                        document.querySelector('.game_description') ||
                        document.querySelector('.user_formatted');
          if (descEl) {
            result.description = descEl.textContent.trim();
          }

          // 提取标签
          const tagElements = document.querySelectorAll('.game_genre a, .tag');
          result.tags = Array.from(tagElements).map(el => el.textContent.trim()).filter(tag => tag);
        }

        // 通用信息提取
        if (!result.title) {
          const titleEl = document.querySelector('title');
          if (titleEl) result.title = titleEl.textContent.split('|')[0].trim();
        }

        if (!result.description) {
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) result.description = metaDesc.content;
        }

        return result;
      }, config.source);

      return info;
    } catch (error) {
      console.error('提取游戏信息时出错:', error);
      return {
        title: config.name,
        description: `${config.name} 是一个有趣的${config.categoryName.toLowerCase()}教育游戏，适合${config.ageRange}岁的学生。`,
        tags: [],
        rating: null,
        plays: null,
        features: [],
        objectives: []
      };
    }
  }

  async extractGameImages(page, gameId) {
    try {
      const images = await page.evaluate(() => {
        const imageUrls = [];
        
        // 查找游戏介绍图片
        const selectors = [
          'img[alt*="screenshot"]',
          'img[alt*="preview"]',
          'img[class*="screenshot"]',
          'img[class*="preview"]',
          'img[class*="game-image"]',
          '.game-screenshots img',
          '.screenshots img',
          '.gallery img',
          '.game-media img'
        ];

        selectors.forEach(selector => {
          const imgs = document.querySelectorAll(selector);
          imgs.forEach(img => {
            if (img.src && img.src.startsWith('http')) {
              imageUrls.push({
                url: img.src,
                alt: img.alt || '',
                type: 'screenshot'
              });
            }
          });
        });

        // 查找主要游戏图片
        const mainImageSelectors = [
          '.game-cover img',
          '.game-thumbnail img',
          '.main-image img',
          'meta[property="og:image"]'
        ];

        mainImageSelectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            const url = element.content || element.src;
            if (url && url.startsWith('http')) {
              imageUrls.push({
                url: url,
                alt: element.alt || 'Game Cover',
                type: 'cover'
              });
            }
          }
        });

        return imageUrls;
      });

      // 下载图片
      const downloadedImages = [];
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        const image = images[i];
        try {
          const response = await page.goto(image.url);
          if (response.ok()) {
            const buffer = await response.buffer();
            const filename = `${gameId}-intro-${i + 1}.jpg`;
            const filepath = path.join(this.outputDir, filename);
            await fs.writeFile(filepath, buffer);
            downloadedImages.push(filename);
            console.log(`   ✅ 下载介绍图片: ${filename}`);
          }
        } catch (error) {
          console.log(`   ⚠️ 下载图片失败: ${image.url}`);
        }
      }

      return downloadedImages;
    } catch (error) {
      console.log('⚠️ 提取游戏图片时出错:', error.message);
      return [];
    }
  }

  async takeIntelligentScreenshots(page, gameId) {
    const screenshots = [];
    
    try {
      // 主截图 - 页面加载完成后
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mainScreenshot = await page.screenshot({
        type: 'jpeg',
        quality: 90,
        fullPage: false
      });
      
      const mainFilename = `${gameId}-main.jpg`;
      await fs.writeFile(path.join(this.outputDir, mainFilename), mainScreenshot);
      screenshots.push(mainFilename);
      console.log(`   📸 主截图已保存: ${mainFilename}`);

      // 尝试点击开始按钮并截图
      try {
        const startButtonSelectors = [
          'button[class*="play"]',
          'button[class*="start"]',
          '.play-button',
          '.start-button',
          'button:contains("Play")',
          'button:contains("Start")',
          'a[class*="play"]',
          '.game-start',
          '#play-button',
          '#start-button'
        ];

        let buttonClicked = false;
        for (const selector of startButtonSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              const gameplayScreenshot = await page.screenshot({
                type: 'jpeg',
                quality: 90,
                fullPage: false
              });
              
              const gameplayFilename = `${gameId}-gameplay.jpg`;
              await fs.writeFile(path.join(this.outputDir, gameplayFilename), gameplayScreenshot);
              screenshots.push(gameplayFilename);
              console.log(`   ✅ 点击了开始按钮: ${selector}`);
              console.log(`   📸 游戏截图已保存: ${gameplayFilename}`);
              buttonClicked = true;
              break;
            }
          } catch (e) {
            // 继续尝试下一个选择器
          }
        }

        // 尝试模拟游戏操作
        if (buttonClicked) {
          try {
            // 模拟常见游戏操作
            await page.keyboard.press('Space');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.keyboard.press('ArrowRight');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.mouse.click(640, 360); // 点击屏幕中央
            await new Promise(resolve => setTimeout(resolve, 2000));

            const actionScreenshot = await page.screenshot({
              type: 'jpeg',
              quality: 90,
              fullPage: false
            });
            
            const actionFilename = `${gameId}-action.jpg`;
            await fs.writeFile(path.join(this.outputDir, actionFilename), actionScreenshot);
            screenshots.push(actionFilename);
            console.log(`   📸 操作截图已保存: ${actionFilename}`);
          } catch (e) {
            console.log('   ⚠️ 无法进行游戏操作截图');
          }
        }

      } catch (error) {
        console.log('   ⚠️ 无法进行游戏操作截图');
      }

      console.log(`   📸 已保存 ${screenshots.length} 张截图`);
      return screenshots;

    } catch (error) {
      console.error('截图时出错:', error);
      return screenshots;
    }
  }

  async extractDetailedInstructions(page, config) {
    try {
      const instructions = await page.evaluate((source) => {
        const result = {
          controls: [],
          howToPlay: '',
          objectives: [],
          tips: [],
          rules: []
        };

        // 查找控制说明
        const controlSelectors = [
          '.controls',
          '.how-to-play',
          '.instructions',
          '.game-controls',
          '[class*="control"]',
          '[class*="instruction"]'
        ];

        controlSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 10) {
              // 提取控制相关的文本
              if (text.toLowerCase().includes('mouse') || 
                  text.toLowerCase().includes('click') ||
                  text.toLowerCase().includes('keyboard') ||
                  text.toLowerCase().includes('arrow') ||
                  text.toLowerCase().includes('space')) {
                result.controls.push(text);
              }
            }
          });
        });

        // 查找游戏玩法说明
        const playSelectors = [
          '.how-to-play',
          '.gameplay',
          '.instructions',
          '.description',
          '.game-description'
        ];

        playSelectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element && !result.howToPlay) {
            const text = element.textContent.trim();
            if (text && text.length > 20) {
              result.howToPlay = text;
            }
          }
        });

        // 查找游戏目标
        const objectiveSelectors = [
          '.objectives',
          '.goals',
          '.aim',
          '[class*="objective"]',
          '[class*="goal"]'
        ];

        objectiveSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 10) {
              result.objectives.push(text);
            }
          });
        });

        return result;
      }, config.source);

      // 如果没有找到具体的控制说明，提供默认的
      if (instructions.controls.length === 0) {
        instructions.controls = [
          'Use mouse to click and interact',
          'Use keyboard arrow keys to move'
        ];
      }

      if (!instructions.howToPlay) {
        instructions.howToPlay = 'Follow the in-game instructions to play and complete various challenges.';
      }

      if (instructions.objectives.length === 0) {
        instructions.objectives = [
          'Complete game objectives',
          'Improve relevant skills'
        ];
      }

      return instructions;
    } catch (error) {
      console.error('提取操作说明时出错:', error);
      return {
        controls: ['Use mouse to click and interact', 'Use keyboard arrow keys to move'],
        howToPlay: 'Follow the in-game instructions to play and complete various challenges.',
        objectives: ['Complete game objectives', 'Improve relevant skills'],
        tips: [],
        rules: []
      };
    }
  }

  async updateGameDataFile(gameId, gameData) {
    try {
      // 更新通用游戏详情页的数据
      const gameDataFile = path.join(this.gameDataDir, 'games.json');
      
      let allGamesData = {};
      try {
        const existingData = await fs.readFile(gameDataFile, 'utf-8');
        allGamesData = JSON.parse(existingData);
      } catch (error) {
        // 文件不存在，创建新的
      }

      // 转换为通用模板格式
      allGamesData[gameId] = {
        title: gameData.info.title || gameData.name,
        description: gameData.info.description,
        category: gameData.category,
        categoryName: gameData.categoryName,
        ageRange: gameData.ageRange,
        difficulty: gameData.difficulty,
        tags: gameData.info.tags || [],
        iframeUrl: gameData.embedUrl,
        playCount: gameData.info.plays || Math.floor(Math.random() * 20000) + 5000,
        learningObjectives: this.generateLearningObjectives(gameData),
        gameFeatures: this.generateGameFeatures(gameData),
        howToPlay: this.generateHowToPlay(gameData),
        images: gameData.images,
        screenshots: gameData.screenshots
      };

      await fs.writeFile(gameDataFile, JSON.stringify(allGamesData, null, 2));
      console.log(`📄 游戏数据已更新: ${gameDataFile}`);

    } catch (error) {
      console.error('更新游戏数据文件时出错:', error);
    }
  }

  generateLearningObjectives(gameData) {
    const objectives = [];
    
    if (gameData.category === 'math') {
      objectives.push('Improve mathematical calculation skills', 'Develop logical thinking', 'Enhance problem-solving abilities', 'Build mathematical confidence');
    } else if (gameData.category === 'science') {
      objectives.push('Explore scientific concepts', 'Develop observation skills', 'Understand natural laws', 'Inspire scientific interest');
    } else if (gameData.category === 'coding') {
      objectives.push('Learn programming fundamentals', 'Develop computational thinking', 'Improve logical abilities', 'Master coding skills');
    } else {
      objectives.push('Improve relevant skills', 'Foster learning interest', 'Enhance cognitive abilities', 'Build learning confidence');
    }

    return objectives;
  }

  generateGameFeatures(gameData) {
    const features = [
      'Beautiful game interface',
      'Progressive difficulty design',
      'Instant feedback system',
      'Safe learning environment'
    ];

    if (gameData.info.features && gameData.info.features.length > 0) {
      return gameData.info.features;
    }

    return features;
  }

  generateHowToPlay(gameData) {
    if (gameData.instructions.controls && gameData.instructions.controls.length > 0) {
      return gameData.instructions.controls;
    }

    return [
      'Follow the in-game instructions to start',
      'Complete various challenge tasks',
      'Earn rewards and achievements',
      'Continuously improve skill levels'
    ];
  }

  async crawlAllGames() {
    const gameIds = Object.keys(GAMES_CONFIG);
    const results = [];
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    // 检查已爬取的游戏
    const gameDataFile = path.join(this.gameDataDir, 'games.json');
    let existingData = {};
    try {
      const data = await fs.readFile(gameDataFile, 'utf-8');
      existingData = JSON.parse(data);
    } catch (error) {
      console.log('📄 游戏数据文件不存在，将创建新文件');
    }

    console.log(`🎮 开始智能爬取 ${gameIds.length} 个游戏的详细信息...`);
    console.log(`📊 已爬取游戏数量: ${Object.keys(existingData).length}`);
    console.log('');

    for (let i = 0; i < gameIds.length; i++) {
      const gameId = gameIds[i];
      const config = GAMES_CONFIG[gameId];
      
      console.log(`\n📋 [${i + 1}/${gameIds.length}] 正在处理: ${config.name}`);
      console.log(`📊 进度: ${i + 1}/${gameIds.length} (${Math.round((i + 1) / gameIds.length * 100)}%)`);
      console.log(`✅ 成功: ${successCount} | ⏭️ 跳过: ${skipCount} | ❌ 失败: ${failCount}`);

      // 检查是否已经爬取过
      if (existingData[gameId]) {
        console.log(`⏭️ ${config.name} 已经爬取过，跳过`);
        console.log(`⏭️ ${gameId} 已存在，跳过`);
        skipCount++;
        results.push(null);
        console.log('⏳ 等待3秒后处理下一个游戏...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }

      // 暂时跳过所有itch.io游戏
      if (config.source === 'Itch.io') {
        console.log(`⏭️ 暂时跳过 ${config.name} (Itch.io游戏)`);
        skipCount++;
        results.push(null);
        console.log('⏳ 等待3秒后处理下一个游戏...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }

      try {
        const result = await this.crawlGame(gameId, config);
        if (result) {
          console.log(`✅ ${gameId} 处理完成`);
          successCount++;
        } else {
          console.log(`❌ 处理 ${gameId} 时出错`);
          failCount++;
        }
        results.push(result);
      } catch (error) {
        console.error(`❌ 爬取过程中出错:`, error);
        failCount++;
        results.push(null);
      }

      // 等待3秒再处理下一个游戏
      console.log('⏳ 等待3秒后处理下一个游戏...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎉 爬取任务完成！');
    console.log(`📊 最终统计: 成功 ${successCount} | 跳过 ${skipCount} | 失败 ${failCount}`);
    
    return results.filter(r => r !== null);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 浏览器已关闭');
    }
  }
} 