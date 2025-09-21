# PowerShell脚本：为所有语言创建游戏详情页
# 创建游戏详情页的多语言版本

$languages = @('ar', 'de', 'es', 'fr', 'he', 'hi', 'ja', 'ko', 'ru')

# 读取英文模板
$templateContent = Get-Content -Path "src/pages/games/[slug].astro" -Raw

foreach ($lang in $languages) {
    $targetDir = "src/pages/$lang/games"
    
    # 创建目录（如果不存在）
    if (!(Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force
        Write-Host "Created directory: $targetDir"
    }
    
    # 修改模板内容以适配不同语言
    $modifiedContent = $templateContent -replace 
        'import BaseLayout from ''../../layouts/BaseLayout.astro'';',
        'import BaseLayout from ''../../../layouts/BaseLayout.astro'';'
    
    $modifiedContent = $modifiedContent -replace 
        'import GameCard from ''../../components/GameCard.astro'';',
        'import GameCard from ''../../../components/GameCard.astro'';'
    
    $modifiedContent = $modifiedContent -replace 
        'import ShareModal from ''../../components/ShareModal.astro'';',
        'import ShareModal from ''../../../components/ShareModal.astro'';'
    
    $modifiedContent = $modifiedContent -replace 
        'import type { Game } from ''../../types/game'';',
        'import type { Game } from ''../../../types/game'';'
    
    $modifiedContent = $modifiedContent -replace 
        'import fs from ''fs'';',
        'import fs from ''fs'';'
    
    $modifiedContent = $modifiedContent -replace 
        'import path from ''path'';',
        'import path from ''path'';'
    
    $modifiedContent = $modifiedContent -replace 
        'const gamesPath = path\.join\(process\.cwd\(\), ''src'', ''data'', ''games\.json''\);',
        'const gamesPath = path.join(process.cwd(), ''src'', ''data'', ''games.json'');'
    
    $modifiedContent = $modifiedContent -replace 
        'const gamesPath = path\.join\(process\.cwd\(\), ''src'', ''data'', ''games\.json''\);',
        'const gamesPath = path.join(process.cwd(), ''src'', ''data'', ''games.json'');'
    
    # 添加语言参数到BaseLayout
    $modifiedContent = $modifiedContent -replace 
        '<BaseLayout\s+title=\{dynamicSEO\.title\}\s+description=\{dynamicSEO\.description\}\s+gameData=\{game\}>',
        "<BaseLayout `n  title={dynamicSEO.title} `n  description={dynamicSEO.description}`n  gameData={game}`n  lang=`"$lang`"`n>"
    
    # 写入文件
    $targetFile = "$targetDir/[slug].astro"
    $modifiedContent | Out-File -FilePath $targetFile -Encoding UTF8
    Write-Host "Created file: $targetFile"
}

Write-Host "All language game detail pages created successfully!"
