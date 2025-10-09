# 修复t函数导入和本地定义冲突的文件
$files = @(
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\ar\art-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\de\language-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\de\sports-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\he\art-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\he\recently-played.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\ja\language-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\ko\art-games.astro"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file"
        $content = Get-Content $file -Raw
        
        # 检查是否同时导入了t函数和定义了本地t函数
        if ($content -match "import.*\bt\b.*from.*i18n/utils" -and $content -match "const t = \(") {
            Write-Host "Found conflict in: $file"
            
            # 移除导入的t函数，只保留getTranslations
            $content = $content -replace "import\s*\{\s*getTranslations,\s*t\s*\}\s*from\s*'../../i18n/utils';", "import { getTranslations } from '../../i18n/utils';"
            $content = $content -replace "import\s*\{\s*t,\s*getTranslations\s*\}\s*from\s*'../../i18n/utils';", "import { getTranslations } from '../../i18n/utils';"
            
            # 移除未使用的translations变量声明（如果存在）
            if ($content -match "const translations = await getTranslations\(" -and $content -notmatch "translateFn\(translations") {
                # 如果translations变量没有被使用，移除它
                $content = $content -replace "const translations = await getTranslations\('[^']+'\);\s*\n", ""
            }
            
            Write-Host "Fixed conflict in: $file"
        }
        
        # 保存修改后的内容
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Processed: $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "All conflicts processed."