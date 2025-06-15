# GitHub教育游戏自动化部署脚本
# 作者: EduGameHQ开发团队
# 版本: v1.0
# 用途: 自动化部署GitHub开源教育游戏到我们的平台

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$GameSlug,
    
    [Parameter(Mandatory=$true)]
    [string]$GameTitle,
    
    [Parameter(Mandatory=$true)]
    [string]$Category,
    
    [Parameter(Mandatory=$false)]
    [string]$BuildCommand = "",
    
    [Parameter(Mandatory=$false)]
    [string]$BuildDir = "dist",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false
)

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }

# 脚本开始
Write-Info "🎮 GitHub教育游戏部署脚本启动..."
Write-Info "游戏: $GameTitle"
Write-Info "分类: $Category"
Write-Info "GitHub: $GitHubUrl"

# 检查必要工具
Write-Info "🔍 检查必要工具..."

if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Git未安装或不在PATH中"
    exit 1
}

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warning "⚠️ Node.js未安装，如果游戏需要构建可能会失败"
}

Write-Success "✅ 工具检查完成"

# 设置路径
$TempDir = "temp_games"
$GameTempDir = Join-Path $TempDir $GameSlug
$PublicGamesDir = "public/games"
$GamePublicDir = Join-Path $PublicGamesDir $GameSlug
$ImagesDir = "public/images/games/$Category"

# 创建必要目录
Write-Info "📁 创建目录结构..."
if (!(Test-Path $TempDir)) { New-Item -ItemType Directory -Path $TempDir | Out-Null }
if (!(Test-Path $PublicGamesDir)) { New-Item -ItemType Directory -Path $PublicGamesDir -Force | Out-Null }
if (!(Test-Path $ImagesDir)) { New-Item -ItemType Directory -Path $ImagesDir -Force | Out-Null }

# 清理旧的临时目录
if (Test-Path $GameTempDir) {
    Write-Info "🧹 清理旧的临时文件..."
    Remove-Item -Path $GameTempDir -Recurse -Force
}

# 克隆GitHub仓库
Write-Info "📥 克隆GitHub仓库..."
try {
    git clone $GitHubUrl $GameTempDir
    if ($LASTEXITCODE -ne 0) {
        throw "Git clone失败"
    }
    Write-Success "✅ 仓库克隆成功"
} catch {
    Write-Error "❌ 克隆仓库失败: $_"
    exit 1
}

# 进入游戏目录
Push-Location $GameTempDir

try {
    # 检查package.json是否存在
    $HasPackageJson = Test-Path "package.json"
    
    if ($HasPackageJson -and !$SkipBuild) {
        Write-Info "📦 检测到package.json，安装依赖..."
        
        # 安装依赖
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "⚠️ npm install失败，尝试继续..."
        } else {
            Write-Success "✅ 依赖安装成功"
        }
        
        # 构建项目（如果指定了构建命令）
        if ($BuildCommand -ne "") {
            Write-Info "🔨 构建项目: $BuildCommand"
            Invoke-Expression $BuildCommand
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "⚠️ 构建失败，尝试使用源文件..."
                $SkipBuild = $true
            } else {
                Write-Success "✅ 项目构建成功"
            }
        }
    }
    
    # 确定源目录
    $SourceDir = "."
    if (!$SkipBuild -and $BuildCommand -ne "" -and (Test-Path $BuildDir)) {
        $SourceDir = $BuildDir
        Write-Info "📂 使用构建目录: $BuildDir"
    } else {
        Write-Info "📂 使用源文件目录"
    }
    
    # 复制游戏文件到public目录
    Write-Info "📋 复制游戏文件..."
    
    # 清理目标目录
    if (Test-Path $GamePublicDir) {
        Remove-Item -Path $GamePublicDir -Recurse -Force
    }
    
    # 复制文件
    Copy-Item -Path $SourceDir -Destination $GamePublicDir -Recurse -Force
    Write-Success "✅ 游戏文件复制完成"
    
    # 检查主要文件
    $IndexFile = Join-Path $GamePublicDir "index.html"
    if (!(Test-Path $IndexFile)) {
        Write-Warning "⚠️ 未找到index.html，检查其他可能的入口文件..."
        
        # 查找可能的HTML文件
        $HtmlFiles = Get-ChildItem -Path $GamePublicDir -Filter "*.html" -Recurse | Select-Object -First 5
        if ($HtmlFiles.Count -gt 0) {
            Write-Info "找到的HTML文件:"
            $HtmlFiles | ForEach-Object { Write-Info "  - $($_.Name)" }
        }
    }
    
} finally {
    # 返回原目录
    Pop-Location
}

# 生成游戏预览图片
Write-Info "🖼️ 生成游戏预览图片..."
$ImagePath = Join-Path $ImagesDir "$GameSlug.svg"

$SvgContent = @"
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <rect x="20" y="20" width="360" height="260" fill="white" rx="10" opacity="0.9"/>
  <text x="200" y="80" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">$GameTitle</text>
  <text x="200" y="120" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#666">Educational Game</text>
  <text x="200" y="150" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#888">Category: $Category</text>
  <circle cx="200" cy="200" r="30" fill="#667eea" opacity="0.8"/>
  <polygon points="190,200 210,190 210,210" fill="white"/>
  <text x="200" y="250" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#999">Click to Play</text>
</svg>
"@

$SvgContent | Out-File -FilePath $ImagePath -Encoding UTF8
Write-Success "✅ 预览图片生成完成: $ImagePath"

# 更新games.json数据库
Write-Info "📝 更新游戏数据库..."
$GamesJsonPath = "src/data/games.json"

if (Test-Path $GamesJsonPath) {
    try {
        $GamesData = Get-Content $GamesJsonPath -Raw | ConvertFrom-Json
        
        # 创建新游戏对象
        $NewGame = @{
            slug = $GameSlug
            title = $GameTitle
            category = $Category.ToLower()
            categoryName = $Category
            iframeUrl = "/games/$GameSlug/"
            description = "An educational $Category game from GitHub open source project."
            gameGuide = @{
                howToPlay = @(
                    "Click on the game area to start playing",
                    "Follow the on-screen instructions",
                    "Use mouse or keyboard to interact with the game"
                )
            }
            thumbnailUrl = "/images/games/$Category/$GameSlug.svg"
            difficulty = "Medium"
            ageRange = "8-16"
            minAge = 8
            maxAge = 16
            tags = @($Category.ToLower(), "educational", "github", "opensource")
            source = "GitHub Open Source"
            iframeCompatible = $true
            verified = $true
            playCount = 0
            featured = $false
            trending = $false
            isNew = $true
        }
        
        # 检查是否已存在
        $ExistingGame = $GamesData | Where-Object { $_.slug -eq $GameSlug }
        if ($ExistingGame) {
            Write-Warning "⚠️ 游戏 '$GameSlug' 已存在，将更新现有记录"
            # 更新现有游戏
            for ($i = 0; $i -lt $GamesData.Count; $i++) {
                if ($GamesData[$i].slug -eq $GameSlug) {
                    $GamesData[$i] = $NewGame
                    break
                }
            }
        } else {
            # 添加新游戏
            $GamesData += $NewGame
            Write-Info "➕ 添加新游戏到数据库"
        }
        
        # 保存更新后的数据
        $GamesData | ConvertTo-Json -Depth 10 | Out-File -FilePath $GamesJsonPath -Encoding UTF8
        Write-Success "✅ 游戏数据库更新完成"
        
    } catch {
        Write-Error "❌ 更新游戏数据库失败: $_"
    }
} else {
    Write-Error "❌ 未找到games.json文件: $GamesJsonPath"
}

# 清理临时文件
Write-Info "🧹 清理临时文件..."
if (Test-Path $GameTempDir) {
    Remove-Item -Path $GameTempDir -Recurse -Force
}

# 生成部署报告
Write-Info "📊 生成部署报告..."
$ReportPath = "deployment-report-$GameSlug.txt"
$Report = @"
GitHub教育游戏部署报告
===================

游戏信息:
- 名称: $GameTitle
- 标识: $GameSlug  
- 分类: $Category
- GitHub: $GitHubUrl

部署路径:
- 游戏文件: $GamePublicDir
- 预览图片: $ImagePath
- 访问URL: /games/$GameSlug/

部署时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
部署状态: 成功

下一步:
1. 在浏览器中测试游戏: http://localhost:3000/games/$GameSlug/
2. 检查游戏是否在主页显示
3. 验证iframe嵌入是否正常工作
4. 如果满意，提交到Git仓库

"@

$Report | Out-File -FilePath $ReportPath -Encoding UTF8

Write-Success "🎉 部署完成！"
Write-Info "📋 部署报告已保存到: $ReportPath"
Write-Info "🌐 游戏访问地址: http://localhost:3000/games/$GameSlug/"
Write-Info "🎮 请在浏览器中测试游戏功能"

# 询问是否立即测试
$TestNow = Read-Host "是否现在在浏览器中打开游戏进行测试? (y/n)"
if ($TestNow -eq "y" -or $TestNow -eq "Y") {
    Start-Process "http://localhost:3000/games/$GameSlug/"
} 