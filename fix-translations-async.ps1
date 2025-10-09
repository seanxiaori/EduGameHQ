# 修复getTranslations函数的异步调用和重复定义问题

# 定义语言代码映射
$langMap = @{
    'ar' = 'ar'
    'de' = 'de' 
    'en' = 'en'
    'es' = 'es'
    'fr' = 'fr'
    'he' = 'he'
    'hi' = 'hi'
    'ja' = 'ja'
    'ko' = 'ko'
    'ru' = 'ru'
    'zh' = 'zh'
}

# 获取所有需要修复的文件
$files = Get-ChildItem -Path "d:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages" -Recurse -Filter "*.astro" | Where-Object { 
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    $content -and $content -match "const translations = getTranslations\(\);"
}

foreach($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    # 从文件路径中提取语言代码
    $relativePath = $file.FullName -replace [regex]::Escape("d:\智汇互动\智汇浏览器\其他\EduGameHQ\EduGameHQ\src\pages\"), ""
    $langCode = $relativePath.Split('\')[0]
    
    if($langMap.ContainsKey($langCode)) {
        $content = Get-Content $file.FullName -Raw
        
        # 修复getTranslations调用
        $content = $content -replace "const translations = getTranslations\(\);", "const translations = await getTranslations('$langCode');"
        
        # 删除重复的translations定义（如果存在）
        $content = $content -replace "(?s)const translations = \{.*?\};", ""
        
        Set-Content $file.FullName -Value $content
        Write-Host "Fixed: $($file.Name) with language code: $langCode"
    } else {
        Write-Host "Unknown language code for: $($file.Name)"
    }
}

Write-Host "All files processed!"