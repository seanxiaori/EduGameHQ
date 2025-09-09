# Anti-Detect Browser SEO Analysis Script
# Real data extraction using Invoke-WebRequest
# Analysis of heading structure (H1-H6) and keyword density

param(
    [string]$OutputPath = "real-seo-analysis-report.md"
)

# Website list for analysis
$websites = @(
    @{
        name = "AdsPower"
        url = "https://www.adspower.net/"
        category = "International"
    },
    @{
        name = "OctoBrowser" 
        url = "https://octobrowser.net/"
        category = "International"
    },
    @{
        name = "BitBrowser"
        url = "https://www.bitbrowser.cn"
        category = "Chinese"
    },
    @{
        name = "VMLogin"
        url = "https://www.vmlogin.cc"
        category = "Tools"
    }
)

# Set headers to simulate real browser
$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    'Accept-Language' = 'en-US,en;q=0.5'
}

# Function: Extract heading structure
function Get-HeadingStructure {
    param([string]$htmlContent, [string]$websiteName)
    
    Write-Host "Analyzing headings for $websiteName..." -ForegroundColor Green
    
    $headings = @{
        H1 = @()
        H2 = @()
        H3 = @()
        H4 = @()
        H5 = @()
        H6 = @()
    }
    
    # Extract headings H1-H6
    for ($i = 1; $i -le 6; $i++) {
        $pattern = "<h$i[^>]*>(.*?)</h$i>"
        $matches = [regex]::Matches($htmlContent, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
        
        foreach ($match in $matches) {
            $text = $match.Groups[1].Value
            # Clean HTML tags
            $cleanText = $text -replace '<[^>]+>', '' -replace '&nbsp;', ' ' -replace '&amp;', '&'
            $cleanText = $cleanText.Trim()
            
            if ($cleanText -and $cleanText.Length -gt 0 -and $cleanText.Length -lt 200) {
                $headings["H$i"] += $cleanText
            }
        }
    }
    
    return $headings
}

# Function: Calculate keyword density
function Get-KeywordDensity {
    param([string]$htmlContent, [string]$websiteName)
    
    Write-Host "Analyzing keyword density for $websiteName..." -ForegroundColor Green
    
    # Extract text content (remove HTML tags and scripts)
    $textContent = $htmlContent -replace '<script[^>]*>.*?</script>', ''
    $textContent = $textContent -replace '<style[^>]*>.*?</style>', ''
    $textContent = $textContent -replace '<[^>]+>', ' '
    $textContent = $textContent -replace '&nbsp;', ' ' -replace '&amp;', '&'
    $textContent = $textContent.Trim().ToLower()
    
    # Split into words
    $words = $textContent -split '[\s\p{P}]+' | Where-Object { $_.Length -gt 1 }
    $totalWords = $words.Count
    
    Write-Host "   Total words: $totalWords" -ForegroundColor Gray
    
    # Count word frequency
    $wordCount = @{}
    foreach ($word in $words) {
        if ($wordCount.ContainsKey($word)) {
            $wordCount[$word]++
        } else {
            $wordCount[$word] = 1
        }
    }
    
    # Define keyword list
    $keywordList = @(
        'browser', 'anti-detect', 'fingerprint', 'multi-account', 'automation',
        'protection', 'security', 'management', 'proxy', 'profile', 'account',
        'marketing', 'team', 'collaboration', 'ecommerce', 'social', 'media'
    )
    
    # Calculate keyword density
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
    
    # Get top words
    $topWords = $wordCount.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 15
    
    return @{
        totalWords = $totalWords
        keywordDensity = $keywordDensity
        topWords = $topWords
    }
}

# Main execution
Write-Host "Starting Anti-Detect Browser SEO Analysis..." -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$analysisResults = @()

foreach ($site in $websites) {
    Write-Host ""
    Write-Host "Analyzing: $($site.name) ($($site.url))" -ForegroundColor Yellow
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        # Send HTTP request
        $response = Invoke-WebRequest -Uri $site.url -Headers $headers -TimeoutSec 30
        $stopwatch.Stop()
        
        $pageSize = [math]::Round($response.Content.Length / 1024, 2)
        Write-Host "   SUCCESS: Page loaded ($pageSize KB, $($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
        
        # Analyze heading structure
        $headings = Get-HeadingStructure -htmlContent $response.Content -websiteName $site.name
        
        # Analyze keyword density
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
        
        Write-Host "   COMPLETED" -ForegroundColor Green
        
    } catch {
        $stopwatch.Stop()
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
        
        $analysisResults += @{
            name = $site.name
            url = $site.url
            category = $site.category
            success = $false
            error = $_.Exception.Message
        }
    }
    
    # Avoid too fast requests
    Start-Sleep -Seconds 3
}

# Generate report
Write-Host ""
Write-Host "Generating report..." -ForegroundColor Cyan

$report = @"
# Anti-Detect Browser SEO Real Data Analysis Report

**Project**: Anti-Detect Browser Market SEO Analysis  
**Analysis Date**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Tool**: PowerShell Invoke-WebRequest  
**Data Type**: Real scraped data  

---

## Analysis Results Summary

"@

foreach ($result in $analysisResults) {
    if ($result.success) {
        $report += @"

### $($result.name) - $($result.category)
**URL**: $($result.url)  
**Status**: SUCCESS  
**Page Size**: $($result.pageSize) KB  
**Response Time**: $($result.responseTime) ms  

"@
    } else {
        $report += @"

### $($result.name) - $($result.category)
**URL**: $($result.url)  
**Status**: FAILED  
**Error**: $($result.error)  

"@
    }
}

$report += @"

---

## Heading Structure Analysis (Real Data)

"@

foreach ($result in $analysisResults) {
    if ($result.success) {
        $report += @"

### $($result.name)
**URL**: $($result.url)

**Heading Structure**:
"@
        
        foreach ($level in @('H1', 'H2', 'H3', 'H4', 'H5', 'H6')) {
            if ($result.headings[$level].Count -gt 0) {
                $report += "`n- **${level} Tags**:`n"
                foreach ($heading in $result.headings[$level]) {
                    $report += "  - `"$heading`"`n"
                }
            }
        }
        
        $report += "`n**SEO Analysis**:`n"
        if ($result.headings.H1.Count -eq 1) {
            $report += "- Good: Unique H1 tag`n"
        } elseif ($result.headings.H1.Count -gt 1) {
            $report += "- Warning: Multiple H1 tags`n"
        } else {
            $report += "- Error: No H1 tag found`n"
        }
        
        if ($result.headings.H2.Count -gt 0) {
            $report += "- Good: H2 structure present`n"
        }
        
        $report += "`n---`n"
    }
}

$report += @"

## Keyword Density Analysis (Real Data)

"@

foreach ($result in $analysisResults) {
    if ($result.success) {
        $report += @"

### $($result.name) Keyword Density
**Total Words**: $($result.density.totalWords)

**Keyword Density Table**:

| Keyword | Count | Density(%) | SEO Score |
|---------|-------|------------|-----------|
"@
        
        $sortedKeywords = $result.density.keywordDensity.GetEnumerator() | Sort-Object { $_.Value.density } -Descending
        foreach ($kw in $sortedKeywords) {
            if ($kw.Value.density -gt 0) {
                $evaluation = if ($kw.Value.density -gt 5) { "Too High" } 
                             elseif ($kw.Value.density -gt 2) { "Good" }
                             elseif ($kw.Value.density -gt 0.5) { "Low" }
                             else { "Very Low" }
                
                $report += "| $($kw.Key) | $($kw.Value.count) | $($kw.Value.density)% | $evaluation |`n"
            }
        }
        
        $report += "`n**Top Words (First 10)**:`n`n| Word | Count |`n|------|-------|`n"
        
        $topWords = $result.density.topWords | Select-Object -First 10
        foreach ($word in $topWords) {
            $report += "| $($word.Key) | $($word.Value) |`n"
        }
        
        $report += "`n---`n"
    }
}

$report += @"

## SEO Strategy Comparison

### Key Findings Based on Real Data

"@

$successCount = ($analysisResults | Where-Object { $_.success }).Count
$report += "1. **Data Reliability**: Successfully analyzed $successCount websites with real data`n"

$h1Analysis = @{}
foreach ($result in $analysisResults) {
    if ($result.success -and $result.headings.H1.Count -gt 0) {
        $h1Text = $result.headings.H1[0]
        $h1Analysis[$result.name] = $h1Text
    }
}

if ($h1Analysis.Count -gt 0) {
    $report += "`n2. **H1 Title Strategy Comparison**:`n"
    foreach ($site in $h1Analysis.GetEnumerator()) {
        $report += "   - **$($site.Key)**: `"$($site.Value)`"`n"
    }
}

$report += @"

### Optimization Recommendations

Based on real data analysis:

1. **Title Optimization**:
   - Ensure only one H1 tag per page
   - Include core keywords in H1
   - Build clear H2-H6 hierarchy

2. **Keyword Density**:
   - Keep core keyword density between 2-5%
   - Avoid keyword stuffing
   - Focus on long-tail keyword layout

3. **Content Strategy**:
   - Increase industry-related high-frequency words
   - Optimize text content ratio
   - Build professional terminology database

---

**Report Generated**: $(Get-Date)  
**Data Source**: PowerShell Invoke-WebRequest  
**Analysis Tool**: Custom SEO Analysis Script  
**Data Accuracy**: 100% Real Data

"@

# Write report to file
$report | Out-File -FilePath $OutputPath -Encoding UTF8
Write-Host "Report generated: $OutputPath" -ForegroundColor Green

Write-Host ""
Write-Host "SEO Analysis Completed!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan
