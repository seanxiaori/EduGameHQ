#!/bin/bash
# 批量游戏上架完整流程

echo "🚀 开始批量游戏上架流程..."
echo ""

# 步骤1: 搜索游戏
echo "📍 步骤1: 搜索游戏"
node scripts/batch-onboard/1-search-games.mjs
if [ $? -ne 0 ]; then
  echo "❌ 搜索失败"
  exit 1
fi
echo ""

# 步骤2: 重复检测
echo "📍 步骤2: 重复检测"
node scripts/batch-onboard/2-detect-duplicate.mjs
if [ $? -ne 0 ]; then
  echo "❌ 重复检测失败"
  exit 1
fi
echo ""

# 步骤3: URL验证
echo "📍 步骤3: URL验证"
node scripts/batch-onboard/3-verify-url.mjs
if [ $? -ne 0 ]; then
  echo "❌ URL验证失败"
  exit 1
fi
echo ""

# 步骤4: 质量评估
echo "📍 步骤4: 质量评估"
node scripts/batch-onboard/4-evaluate-quality.mjs
if [ $? -ne 0 ]; then
  echo "❌ 质量评估失败"
  exit 1
fi
echo ""

# 步骤5: 截图
echo "📍 步骤5: 截取游戏画面"
node scripts/batch-onboard/5-capture-screenshots.mjs
if [ $? -ne 0 ]; then
  echo "❌ 截图失败"
  exit 1
fi
echo ""

# 步骤6: 生成数据
echo "📍 步骤6: 生成游戏数据"
node scripts/batch-onboard/6-generate-data.mjs
if [ $? -ne 0 ]; then
  echo "❌ 生成数据失败"
  exit 1
fi
echo ""

# 步骤7: 上架
echo "📍 步骤7: 批量上架"
node scripts/batch-onboard/7-onboard.mjs
if [ $? -ne 0 ]; then
  echo "❌ 上架失败"
  exit 1
fi
echo ""

echo "✅ 批量上架流程完成！"
echo ""
echo "下一步："
echo "1. 检查新游戏: http://localhost:4000/"
echo "2. 提交到git: git add . && git commit && git push"
