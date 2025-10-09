# 批量修复所有有本地t函数定义的文件
$files = @(
    'ar\art-games.astro',
    'de\language-games.astro', 
    'de\sports-games.astro',
    'he\art-games.astro',
    'he\recently-played.astro',
    'hi\sports-games.astro',
    'ja\language-games.astro',
    'ko\art-games.astro'
)

foreach($file in $files) {
    $fullPath = "d:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\$file"
    
    if(Test-Path $fullPath) {
        Write-Host "Processing: $file"
        
        $content = Get-Content $fullPath -Raw
        
        # 1. 添加 t 函数的导入
        $content = $content -replace "import \{ getTranslations \} from '../../i18n/utils';", "import { getTranslations, t } from '../../i18n/utils';"
        
        # 2. 删除本地的 t 函数定义
        $content = $content -replace "(?s)// 定义翻译函数，支持嵌套键.*?};", "// 使用从 i18n/utils 导入的 t 函数"
        
        # 3. 更新 seoData 中的 t 函数调用（如果存在）
        $content = $content -replace "t\('([^']+)',\s*([^)]+)\)", 't(translations, ''$1'', $2)'
        
        Set-Content $fullPath -Value $content
        Write-Host "Fixed: $file"
    } else {
        Write-Host "Not found: $file"
    }
}

Write-Host "All files processed!"