# 修复有本地t函数定义但仍使用三参数调用的文件
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
        
        # 将 t(translations, 'key', 'fallback') 替换为 t('key', 'fallback')
        $content = $content -replace "t\(translations,\s*'([^']+)',\s*'([^']*?)'\)", "t('`$1', '`$2')"
        $content = $content -replace 't\(translations,\s*"([^"]+)",\s*"([^"]*?)"\)', 't("`$1", "`$2")'
        
        # 保存修改后的内容
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Fixed: $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "All files processed."