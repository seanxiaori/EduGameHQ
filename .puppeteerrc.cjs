/**
 * Puppeteer配置文件
 * 指定Chrome可执行文件路径
 */

const path = require('path');
const fs = require('fs');

// 查找Chrome路径（按优先级）
const chromePaths = [
  path.join(__dirname, 'chrome/win64-141.0.7390.76/chrome-win64/chrome.exe'),  // 项目本地Chrome
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',                  // 系统Chrome (64位)
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'             // 系统Chrome (32位)
];

let executablePath;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

module.exports = {
  executablePath
};

