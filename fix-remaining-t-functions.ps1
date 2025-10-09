# 修复剩余的本地t函数定义问题
$files = @(
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\ar\art-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\de\language-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\de\sports-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\he\art-games.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\he\recently-played.astro",
    "D:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\ko\art-games.astro"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file"
        $content = Get-Content $file -Raw
        
        # 提取语言代码
        $langCode = ""
        if ($file -match "\\([a-z]{2})\\[^\\]*\.astro$") {
            $langCode = $matches[1]
        }
        
        if ($langCode) {
            Write-Host "Language code: $langCode"
            
            # 检查是否有复杂的本地t函数定义
            if ($content -match "const t = \([^)]*\) => \{[\s\S]*?\};") {
                Write-Host "Found complex local t function definition"
                
                # 替换复杂的本地t函数定义
                $content = $content -replace "const t = \([^)]*\) => \{[\s\S]*?\};", "const t = (key: string, fallback?: string) => translateFn(translations, key, fallback);"
                
                # 确保有正确的导入
                if ($content -notmatch "import.*translateFn.*from.*i18n/utils") {
                    $content = $content -replace "import \{ getTranslations \} from '../../i18n/utils';", "import { getTranslations, t as translateFn } from '../../i18n/utils';"
                }
                
                # 确保有translations变量
                if ($content -notmatch "const translations = await getTranslations\('$langCode'\);") {
                    $content = $content -replace "(import \{ getTranslations, t as translateFn \} from '../../i18n/utils';)", "`$1`n`n// 获取${langCode}翻译`nconst translations = await getTranslations('$langCode');"
                }
                
                Write-Host "Fixed complex local t function in: $file"
            }
        }
        
        # 保存修改后的内容
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Processed: $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "All remaining t functions processed."