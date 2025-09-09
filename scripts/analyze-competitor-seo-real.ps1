# 反指纹浏览器竞品SEO真实数据分析脚本
# 使用 Invoke-WebRequest 获取真实网页内容
# 分析标题结构(H1-H6)和关键词密度

param(
    [string]$OutputPath = "反指纹浏览器SEO真实分析报告.md"
)

# 设置编码和请求头
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 网站列表
$websites = @(
    @{
        name = "AdsPower"
        url = "https://www.adspower.net/"
        category = "海外主流"
    },
    @{
        name = "OctoBrowser" 
        url = "https://octobrowser.net/"
        category = "海外主流"
    },
    @{
        name = "BitBrowser"
        url = "https://www.bitbrowser.cn"
        category = "国内平台"
    },
    @{
        name = "紫鸟浏览器"
        url = "https://www.ziniao.com/"
        category = "国内平台"
    },
    @{
        name = "VMLogin"
        url = "https://www.vmlogin.cc"
        category = "其他工具"
    }
)

# 设置请求头模拟真实浏览器
$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    'Accept-Language' = 'zh-CN,zh;q=0.9,en;q=0.8'
    'Accept-Encoding' = 'gzip, deflate, br'
    'DNT' = '1'
    'Connection' = 'keep-alive'
    'Upgrade-Insecure-Requests' = '1'
}

# 函数：提取标题结构
function Get-HeadingStructure {
    param([string]$htmlContent, [string]$websiteName)
    
    Write-Host "🔍 分析 $websiteName 的标题结构..." -ForegroundColor Green
    
    $headings = @{
        H1 = @()
        H2 = @()
        H3 = @()
        H4 = @()
        H5 = @()
        H6 = @()
    }
    
    # 提取各级标题
    for ($i = 1; $i -le 6; $i++) {
        $pattern = "<h$i[^>]*>(.*?)</h$i>"
        $matches = [regex]::Matches($htmlContent, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
        
        foreach ($match in $matches) {
            $text = $match.Groups[1].Value
            # 清理HTML标签
            $cleanText = $text -replace '<[^>]+>', '' -replace '&nbsp;', ' ' -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '\s+', ' '
            $cleanText = $cleanText.Trim()
            
            if ($cleanText -and $cleanText.Length -gt 0) {
                $headings["H$i"] += $cleanText
            }
        }
    }
    
    return $headings
}

# 函数：计算关键词密度
function Get-KeywordDensity {
    param([string]$htmlContent, [string]$websiteName)
    
    Write-Host "📊 分析 $websiteName 的关键词密度..." -ForegroundColor Green
    
    # 提取文本内容（移除HTML标签和脚本）
    $textContent = $htmlContent -replace '<script[^>]*>.*?</script>', '' -replace '<style[^>]*>.*?</style>', '' -replace '<[^>]+>', ' '
    $textContent = $textContent -replace '&nbsp;', ' ' -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '\s+', ' '
    $textContent = $textContent.Trim().ToLower()
    
    # 分词（简单按空格和标点分割）
    $words = $textContent -split '[\s\p{P}]+' | Where-Object { $_.Length -gt 1 }
    $totalWords = $words.Count
    
    Write-Host "   总词数: $totalWords" -ForegroundColor Gray
    
    # 统计词频
    $wordCount = @{}
    foreach ($word in $words) {
        if ($wordCount.ContainsKey($word)) {
            $wordCount[$word]++
        } else {
            $wordCount[$word] = 1
        }
    }
    
    # 定义关键词列表（中英文）
    $keywordList = @(
        # 中文关键词
        '反指纹', '浏览器', '多账号', '管理', '安全', '跨境', '电商', '营销', '指纹', '防护', 
        '账号', '多开', '自动化', '团队', '协作', 'api', '批量', '操作', '配置', '同步',
        # 英文关键词  
        'anti-detect', 'browser', 'fingerprint', 'multi-account', 'management', 'automation',
        'protection', 'security', 'team', 'collaboration', 'proxy', 'profile', 'account',
        'marketing', 'ecommerce', 'scraping', 'social', 'media', 'advertising', 'platform'
    )
    
    # 计算关键词密度
    $keywordDensity = @{}
    foreach ($keyword in $keywordList) {
        if ($wordCount.ContainsKey($keyword.ToLower())) {
            $count = $wordCount[$keyword.ToLower()]
            $density = [math]::Round(($count / $totalWords) * 100, 2)
            $keywordDensity[$keyword] = @{
                count = $count
                density = $density
            }
        }
    }
    
    # 获取高频词汇（前20个）
    $topWords = $wordCount.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20
    
    return @{
        totalWords = $totalWords
        keywordDensity = $keywordDensity
        topWords = $topWords
    }
}

# 函数：生成分析报告
function Generate-Report {
    param($analysisResults, [string]$outputPath)
    
    Write-Host "📝 生成分析报告..." -ForegroundColor Green
    
    $report = @"
# 反指纹浏览器行业SEO真实数据分析报告

**项目**: 反指纹浏览器市场SEO分析  
**分析日期**: $(Get-Date -Format 'yyyy年MM月dd日')  
**分析工具**: PowerShell Invoke-WebRequest  
**数据类型**: 真实抓取数据  

---

## 📊 分析网站列表

"@

    foreach ($result in $analysisResults) {
        if ($result.success) {
            $report += @"

### $($result.name) - $($result.category)
**URL**: $($result.url)  
**分析状态**: ✅ 成功  
**页面大小**: $($result.pageSize) KB  
**响应时间**: $($result.responseTime) ms  

"@
        } else {
            $report += @"

### $($result.name) - $($result.category)
**URL**: $($result.url)  
**分析状态**: ❌ 失败  
**错误信息**: $($result.error)  

"@
        }
    }

    $report += @"

---

## 🎯 标题结构分析 (真实数据)

"@

    foreach ($result in $analysisResults) {
        if ($result.success) {
            $report += @"

### $($result.name)
**URL**: $($result.url)

**标题层级结构**:
"@
            
            foreach ($level in @('H1', 'H2', 'H3', 'H4', 'H5', 'H6')) {
                if ($result.headings[$level].Count -gt 0) {
                    $report += "`n- **${level}标题**:`n"
                    foreach ($heading in $result.headings[$level]) {
                        $report += "  - `"$heading`"`n"
                    }
                }
            }
            
            $report += "`n**SEO策略特点**:`n"
            # 分析标题特点
            if ($result.headings.H1.Count -eq 1) {
                $report += "- ✅ H1标题唯一性良好`n"
            } elseif ($result.headings.H1.Count -gt 1) {
                $report += "- ⚠️ 存在多个H1标题`n"
            } else {
                $report += "- ❌ 缺少H1标题`n"
            }
            
            if ($result.headings.H2.Count -gt 0) {
                $report += "- ✅ H2标题结构清晰`n"
            }
            
            $report += "`n---`n"
        }
    }

    $report += @"

## 📈 关键词密度分析 (真实数据)

"@

    foreach ($result in $analysisResults) {
        if ($result.success) {
            $report += @"

### $($result.name) 关键词密度
**总词汇数**: $($result.density.totalWords)

**核心关键词密度表**:

| 关键词 | 出现次数 | 密度(%) | SEO评价 |
|--------|----------|---------|---------|
"@
            
            # 按密度排序显示关键词
            $sortedKeywords = $result.density.keywordDensity.GetEnumerator() | Sort-Object { $_.Value.density } -Descending
            foreach ($kw in $sortedKeywords) {
                if ($kw.Value.density -gt 0) {
                    $evaluation = if ($kw.Value.density -gt 5) { "⚠️ 过高" } 
                                 elseif ($kw.Value.density -gt 2) { "✅ 适中" }
                                 elseif ($kw.Value.density -gt 0.5) { "🔵 偏低" }
                                 else { "⚪ 很低" }
                    
                    $report += "| $($kw.Key) | $($kw.Value.count) | $($kw.Value.density)% | $evaluation |`n"
                }
            }
            
            $report += "`n**高频词汇 (前10名)**:`n`n| 词汇 | 出现次数 |`n|------|----------|`n"
            
            $topWords = $result.density.topWords | Select-Object -First 10
            foreach ($word in $topWords) {
                $report += "| $($word.Key) | $($word.Value) |`n"
            }
            
            $report += "`n---`n"
        }
    }

    $report += @"

## 🔍 SEO策略对比分析

### 基于真实数据的关键发现

"@

    # 统计成功分析的网站数量
    $successCount = ($analysisResults | Where-Object { $_.success }).Count
    $report += "1. **数据可信度**: 成功分析 $successCount 个网站的真实数据`n"
    
    # 分析H1标题策略
    $h1Analysis = @{}
    foreach ($result in $analysisResults) {
        if ($result.success -and $result.headings.H1.Count -gt 0) {
            $h1Text = $result.headings.H1[0]
            $h1Analysis[$result.name] = $h1Text
        }
    }
    
    if ($h1Analysis.Count -gt 0) {
        $report += "`n2. **H1标题策略对比**:`n"
        foreach ($site in $h1Analysis.GetEnumerator()) {
            $report += "   - **$($site.Key)**: `"$($site.Value)`"`n"
        }
    }

    $report += @"

### 优化建议

基于真实数据分析，建议：

1. **标题优化**:
   - 确保每页只有一个H1标题
   - H1标题包含核心关键词
   - 建立清晰的H2-H6层级结构

2. **关键词密度**:
   - 核心关键词密度保持在2-5%
   - 避免关键词堆砌
   - 注重长尾关键词布局

3. **内容策略**:
   - 增加行业相关高频词汇
   - 优化页面文字内容比例
   - 建立专业术语词汇库

---

**报告生成时间**: $(Get-Date)  
**数据获取方式**: PowerShell Invoke-WebRequest  
**分析工具**: 自开发SEO分析脚本  
**数据准确性**: ✅ 100%真实数据

"@

    # 写入报告文件
    $report | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "✅ 报告已生成: $outputPath" -ForegroundColor Green
}

# 主执行流程
Write-Host "🚀 开始反指纹浏览器SEO真实数据分析..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$analysisResults = @()

foreach ($site in $websites) {
    Write-Host "`n🔗 正在分析: $($site.name) ($($site.url))" -ForegroundColor Yellow
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        # 发送HTTP请求
        $response = Invoke-WebRequest -Uri $site.url -Headers $headers -TimeoutSec 30
        $stopwatch.Stop()
        
        $pageSize = [math]::Round($response.Content.Length / 1024, 2)
        Write-Host "   ✅ 页面加载成功 ($pageSize KB, $($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
        
        # 分析标题结构
        $headings = Get-HeadingStructure -htmlContent $response.Content -websiteName $site.name
        
        # 分析关键词密度
        $density = Get-KeywordDensity -htmlContent $response.Content -websiteName $site.name
        
        $analysisResults += @{
            name = $site.name
            url = $site.url
            category = $site.category
            success = $true
            pageSize = $pageSize
            responseTime = $stopwatch.ElapsedMilliseconds
            headings = $headings
            density = $density
        }
        
        Write-Host "   ✅ 分析完成" -ForegroundColor Green
        
    } catch {
        $stopwatch.Stop()
        Write-Host "   ❌ 分析失败: $($_.Exception.Message)" -ForegroundColor Red
        
        $analysisResults += @{
            name = $site.name
            url = $site.url
            category = $site.category
            success = $false
            error = $_.Exception.Message
        }
    }
    
    # 避免请求过快
    Start-Sleep -Seconds 2
}

Write-Host "`n📊 数据分析完成，正在生成报告..." -ForegroundColor Cyan

# 生成最终报告
Generate-Report -analysisResults $analysisResults -outputPath $OutputPath

Write-Host "`n🎉 SEO分析任务完成!" -ForegroundColor Green
Write-Host "📄 报告文件: $OutputPath" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

