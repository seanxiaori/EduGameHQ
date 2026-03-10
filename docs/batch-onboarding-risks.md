# 批量上架流程 - 潜在问题和遗漏分析

## 🚨 高风险问题（必须解决）

### 1. URL稳定性问题

**问题：** GitHub Pages可能随时删除/重命名
- 用户删除仓库 → 游戏404
- 用户改名 → URL失效
- GitHub Pages被禁用 → 无法访问

**解决方案：**
```javascript
// 在验证时记录URL类型
const urlTypes = {
  githubPages: /\.github\.io/,      // 风险：中等
  customDomain: /^(?!.*github)/,    // 风险：低
  rawGithub: /raw\.githubusercontent/, // 风险：高（不稳定）
};

// 优先级：自定义域名 > GitHub Pages > 其他
// 如果是rawGithub，直接跳过
```

**补充检查：**
- 检查仓库是否archived（已归档）
- 检查最后commit时间（>1年未更新=高风险）
- 记录仓库owner的活跃度

---

### 2. iframe安全策略问题

**问题：** 网站设置了X-Frame-Options或CSP，禁止iframe嵌入

```bash
# 当前验证不够，需要检查HTTP头
curl -I <url> | grep -i "x-frame-options\|content-security-policy"

# 如果返回：
# X-Frame-Options: DENY
# X-Frame-Options: SAMEORIGIN
# → 无法iframe嵌入！
```

**解决方案：**
```javascript
// 步骤3增加检查
const response = await fetch(gameUrl);
const xFrameOptions = response.headers.get('x-frame-options');
const csp = response.headers.get('content-security-policy');

if (xFrameOptions === 'DENY' || xFrameOptions === 'SAMEORIGIN') {
  return { status: 'blocked', reason: 'X-Frame-Options' };
}

if (csp && csp.includes("frame-ancestors 'none'")) {
  return { status: 'blocked', reason: 'CSP' };
}
```

---

### 3. 游戏实际不可玩

**问题：** URL返回200，但游戏有致命bug
- 点击开始后黑屏
- 加载卡住不动
- 需要特定浏览器/插件
- 依赖外部资源（CDN失效）

**解决方案：**
```javascript
// 步骤5增加交互测试
await page.goto(gameUrl);
await page.waitForTimeout(5000);

// 尝试点击开始
const startBtn = await page.$('button, .start, #start');
if (startBtn) await startBtn.click();
await page.waitForTimeout(5000);

// 检查是否有错误
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

page.on('pageerror', err => {
  errors.push(err.message);
});

// 检查canvas/游戏元素是否渲染
const hasCanvas = await page.$('canvas');
const hasGameContent = await page.evaluate(() => {
  return document.body.innerText.length > 100;
});

if (errors.length > 5 || !hasCanvas) {
  return { playable: false, reason: 'Runtime errors' };
}
```

---

### 4. 游戏分类错误

**问题：** 自动分类不准确
- 搜索"math game"但实际是arcade
- 游戏名称误导（如"Math Shooter"是射击游戏）

**解决方案：**
人工审核时必须确认分类匹配游戏内容

---

### 5. 重复游戏（不同URL）

**问题：** 同一个游戏有多个fork/镜像

**解决方案：**
检查标题相似度和截图相似度

---

### 6. 移动端不兼容

**问题：** 游戏只能在桌面端玩

**解决方案：**
使用Playwright模拟移动设备测试

---

### 7. 游戏内容不适宜

**问题：** 暴力、恐怖、赌博内容

**解决方案：**
关键词黑名单检测 + 人工审核实际游玩

---

### 8. 依赖外部资源失效

**问题：** CDN/API失效导致游戏无法运行

**解决方案：**
监听网络请求失败，检查关键资源

---

## 📋 最终检查清单（上架前必做）

### 强制检查（不通过=不上架）
- [ ] URL返回200状态码
- [ ] 没有X-Frame-Options阻止
- [ ] iframe可以正常加载
- [ ] 游戏可以实际游玩
- [ ] 无控制台严重错误
- [ ] 截图是游戏画面
- [ ] 分类正确
- [ ] 不是重复游戏
- [ ] 内容适合16岁以下

### 建议检查
- [ ] 加载时间<10秒
- [ ] 移动端兼容
- [ ] 有游戏说明

---

## 🔄 返工场景预防

| 返工原因 | 概率 | 预防措施 |
|---------|------|---------|
| URL失效404 | 高 | 检查仓库活跃度 |
| iframe被阻止 | 中 | 检查HTTP头 |
| 游戏不可玩 | 中 | 实际点击测试 |
| 分类错误 | 中 | 人工审核 |
| 内容不适宜 | 低 | 关键词+人工审核 |

---

## 💡 实施策略

1. **第一批**: 5-10款，手动验证所有步骤
2. **第二批**: 20-30款，自动化+人工审核
3. **第三批**: 50+款，完全自动化筛选

**成功指标：**
- 7天内下架率 < 5%
- 游戏可玩率 > 95%
