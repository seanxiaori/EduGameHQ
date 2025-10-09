# 修复有本地t函数定义的文件，统一使用标准的t函数模式
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
        
        # 提取语言代码
        $langCode = ""
        if ($file -match "\\([a-z]{2})\\[^\\]*\.astro$") {
            $langCode = $matches[1]
        }
        
        if ($langCode) {
            Write-Host "Language code: $langCode"
            
            # 检查是否有本地t函数定义
            if ($content -match "const t = \([^)]*\) => \{") {
                Write-Host "Found local t function definition"
                
                # 替换导入语句，导入getTranslations和t函数，并重命名t为translateFn
                $content = $content -replace "import \{ getTranslations \} from '../../i18n/utils';", "import { getTranslations, t as translateFn } from '../../i18n/utils';"
                
                # 添加translations变量获取（如果不存在）
                if ($content -notmatch "const translations = await getTranslations\('$langCode'\);") {
                    $content = $content -replace "(import \{ getTranslations, t as translateFn \} from '../../i18n/utils';)", "`$1`n`n// 获取${langCode}翻译`nconst translations = await getTranslations('$langCode');"
                }
                
                # 替换本地t函数定义为标准模式
                $content = $content -replace "// 创建翻译函数\s*const t = \([^)]*\) => \{[^}]*\};", "const t = (key: string, fallback?: string) => translateFn(translations, key, fallback);"
                
                Write-Host "Fixed local t function in: $file"
            }
        }
        
        # 保存修改后的内容
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Processed: $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "All local t functions processed."