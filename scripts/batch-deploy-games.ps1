# EduGameHQ 批量游戏部署脚本 v1.0
# 基于Beetle Rush成功部署流程设计
# 支持批量部署GitHub教育游戏到EduGameHQ平台

param(
    [string]$ConfigFile = "scripts/games-to-deploy.json",
    [switch]$DryRun = $false,
    [switch]$SkipGit = $false,
    [string]$Category = ""
)

# 脚本配置
$TEMP_DIR = "temp-deploy"
$GAMES_DIR = "public/games"
$IMAGES_DIR = "public/images/games"
$GAMES_JSON = "src/data/games.json"

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    switch ($Color) {
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

# 日志函数
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-ColorOutput $logMessage $(if ($Level -eq "ERROR") { "Red" } elseif ($Level -eq "SUCCESS") { "Green" } elseif ($Level -eq "WARNING") { "Yellow" } else { "White" })
    Add-Content -Path "deploy.log" -Value $logMessage
}

# 检查必需目录
function Initialize-Directories {
    Write-Log "初始化部署目录..."
    
    $directories = @($TEMP_DIR, $GAMES_DIR, $IMAGES_DIR)
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "创建目录: $dir" "SUCCESS"
        }
    }
    
    # 创建分类子目录
    $categories = @("math", "science", "coding", "language", "puzzle", "sports", "art", "geography")
    foreach ($category in $categories) {
        $categoryImageDir = "$IMAGES_DIR/$category"
        if (!(Test-Path $categoryImageDir)) {
            New-Item -ItemType Directory -Path $categoryImageDir -Force | Out-Null
            Write-Log "创建分类图片目录: $categoryImageDir" "SUCCESS"
        }
    }
}

# 克隆GitHub仓库
function Clone-Repository {
    param([string]$RepoUrl, [string]$GameSlug)
    
    $tempPath = "$TEMP_DIR/$GameSlug"
    
    Write-Log "克隆仓库: $RepoUrl"
    
    if (Test-Path $tempPath) {
        Remove-Item -Path $tempPath -Recurse -Force
    }
    
    try {
        git clone $RepoUrl $tempPath 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "仓库克隆成功: $GameSlug" "SUCCESS"
            return $tempPath
        } else {
            Write-Log "仓库克隆失败: $GameSlug" "ERROR"
            return $null
        }
    } catch {
        Write-Log "克隆异常: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# 检查项目结构
function Test-ProjectStructure {
    param([string]$ProjectPath)
    
    Write-Log "检查项目结构: $ProjectPath"
    
    # 检查是否有构建好的文件
    $distPath = "$ProjectPath/dist"
    $buildPath = "$ProjectPath/build"
    $publicPath = "$ProjectPath/public"
    
    if (Test-Path "$distPath/index.html") {
        Write-Log "发现dist构建目录" "SUCCESS"
        return @{ Type = "dist"; Path = $distPath }
    } elseif (Test-Path "$buildPath/index.html") {
        Write-Log "发现build构建目录" "SUCCESS"
        return @{ Type = "build"; Path = $buildPath }
    } elseif (Test-Path "$publicPath/index.html") {
        Write-Log "发现public目录" "SUCCESS"
        return @{ Type = "public"; Path = $publicPath }
    } elseif (Test-Path "$ProjectPath/index.html") {
        Write-Log "发现根目录index.html" "SUCCESS"
        return @{ Type = "root"; Path = $ProjectPath }
    } else {
        Write-Log "未找到可用的游戏文件" "WARNING"
        return $null
    }
}

# 尝试构建项目
function Build-Project {
    param([string]$ProjectPath)
    
    Write-Log "尝试构建项目: $ProjectPath"
    
    Push-Location $ProjectPath
    
    try {
        # 检查package.json
        if (Test-Path "package.json") {
            Write-Log "发现package.json，尝试npm构建"
            
            # 安装依赖
            npm install 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Log "npm install失败" "WARNING"
                Pop-Location
                return $false
            }
            
            # 尝试构建
            $buildCommands = @("npm run build", "npm run dist", "npm run compile")
            foreach ($cmd in $buildCommands) {
                Write-Log "尝试命令: $cmd"
                Invoke-Expression $cmd 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "构建成功: $cmd" "SUCCESS"
                    Pop-Location
                    return $true
                }
            }
        }
        
        Write-Log "无需构建或构建失败" "WARNING"
        Pop-Location
        return $false
    } catch {
        Write-Log "构建异常: $($_.Exception.Message)" "ERROR"
        Pop-Location
        return $false
    }
}

# 部署游戏文件
function Deploy-GameFiles {
    param([string]$SourcePath, [string]$GameSlug)
    
    $targetPath = "$GAMES_DIR/$GameSlug"
    
    Write-Log "部署游戏文件: $GameSlug"
    
    if (Test-Path $targetPath) {
        Remove-Item -Path $targetPath -Recurse -Force
    }
    
    try {
        Copy-Item -Path $SourcePath -Destination $targetPath -Recurse -Force
        Write-Log "游戏文件部署成功: $GameSlug" "SUCCESS"
        return $true
    } catch {
        Write-Log "游戏文件部署失败: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# 创建游戏预览图
function Create-GamePreview {
    param([string]$GameSlug, [string]$Category, [string]$SourcePath)
    
    $imageFileName = "$GameSlug.jpg"
    $targetImagePath = "$IMAGES_DIR/$Category/$imageFileName"
    
    Write-Log "创建游戏预览图: $GameSlug"
    
    # 检查源目录是否有截图
    $screenshotFiles = @("screenshot.png", "screenshot.jpg", "preview.png", "preview.jpg", "image.png", "image.jpg")
    
    foreach ($file in $screenshotFiles) {
        $sourcePath = "$SourcePath/$file"
        if (Test-Path $sourcePath) {
            try {
                Copy-Item -Path $sourcePath -Destination $targetImagePath -Force
                Write-Log "预览图复制成功: $file -> $imageFileName" "SUCCESS"
                return "/images/games/$Category/$imageFileName"
            } catch {
                Write-Log "预览图复制失败: $($_.Exception.Message)" "WARNING"
            }
        }
    }
    
    # 如果没有找到截图，创建SVG占位符
    $svgContent = @"
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">$GameSlug</text>
  <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">Educational Game</text>
</svg>
"@
    
    $svgPath = "$IMAGES_DIR/$Category/$GameSlug.svg"
    Set-Content -Path $svgPath -Value $svgContent -Encoding UTF8
    Write-Log "创建SVG占位符: $GameSlug.svg" "SUCCESS"
    
    return "/images/games/$Category/$GameSlug.svg"
}

# 更新games.json数据库
function Update-GamesDatabase {
    param([hashtable]$GameData)
    
    Write-Log "更新游戏数据库: $($GameData.slug)"
    
    try {
        # 读取现有数据
        $gamesJson = Get-Content -Path $GAMES_JSON -Raw -Encoding UTF8 | ConvertFrom-Json
        $gamesList = @($gamesJson)
        
        # 检查游戏是否已存在
        $existingIndex = -1
        for ($i = 0; $i -lt $gamesList.Count; $i++) {
            if ($gamesList[$i].slug -eq $GameData.slug) {
                $existingIndex = $i
                break
            }
        }
        
        # 创建游戏对象
        $gameObject = [PSCustomObject]@{
            slug = $GameData.slug
            title = $GameData.title
            category = $GameData.category
            categoryName = $GameData.categoryName
            url = "/games/$($GameData.slug)/index.html"
            image = $GameData.image
            imageFallback = $GameData.image
            description = $GameData.description
            difficulty = $GameData.difficulty
            ageRange = $GameData.ageRange
            minAge = $GameData.minAge
            maxAge = $GameData.maxAge
            playCount = 0
            tags = $GameData.tags
            featured = $GameData.featured
            trending = $GameData.trending
            isNew = $true
            developer = $GameData.developer
            source = $GameData.source
            type = "Free"
        }
        
        if ($existingIndex -ge 0) {
            # 更新现有游戏
            $gamesList[$existingIndex] = $gameObject
            Write-Log "更新现有游戏: $($GameData.slug)" "SUCCESS"
        } else {
            # 添加新游戏
            $gamesList += $gameObject
            Write-Log "添加新游戏: $($GameData.slug)" "SUCCESS"
        }
        
        # 保存数据
        $gamesJson = $gamesList | ConvertTo-Json -Depth 10
        Set-Content -Path $GAMES_JSON -Value $gamesJson -Encoding UTF8
        
        return $true
    } catch {
        Write-Log "数据库更新失败: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# 清理临时文件
function Clean-TempFiles {
    param([string]$GameSlug)
    
    $tempPath = "$TEMP_DIR/$GameSlug"
    if (Test-Path $tempPath) {
        Remove-Item -Path $tempPath -Recurse -Force
        Write-Log "清理临时文件: $GameSlug" "SUCCESS"
    }
}

# Git提交和推送
function Commit-Changes {
    param([string]$GameSlug, [string]$GameTitle)
    
    if ($SkipGit) {
        Write-Log "跳过Git操作" "WARNING"
        return
    }
    
    Write-Log "提交更改到Git: $GameSlug"
    
    try {
        git add . 2>&1 | Out-Null
        $commitMessage = "feat: 添加$GameTitle游戏 - 来自GitHub开源项目的教育游戏"
        git commit -m $commitMessage 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            git push origin master 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Git提交和推送成功" "SUCCESS"
            } else {
                Write-Log "Git推送失败" "ERROR"
            }
        } else {
            Write-Log "Git提交失败" "ERROR"
        }
    } catch {
        Write-Log "Git操作异常: $($_.Exception.Message)" "ERROR"
    }
}

# 部署单个游戏
function Deploy-SingleGame {
    param([PSCustomObject]$GameConfig)
    
    Write-Log "开始部署游戏: $($GameConfig.title)" "INFO"
    Write-ColorOutput "=" * 60 "Cyan"
    
    # 1. 克隆仓库
    $tempPath = Clone-Repository -RepoUrl $GameConfig.repoUrl -GameSlug $GameConfig.slug
    if (-not $tempPath) {
        Write-Log "跳过游戏: $($GameConfig.slug) - 克隆失败" "ERROR"
        return $false
    }
    
    # 2. 检查项目结构
    $projectInfo = Test-ProjectStructure -ProjectPath $tempPath
    if (-not $projectInfo) {
        # 尝试构建
        $buildSuccess = Build-Project -ProjectPath $tempPath
        if ($buildSuccess) {
            $projectInfo = Test-ProjectStructure -ProjectPath $tempPath
        }
    }
    
    if (-not $projectInfo) {
        Write-Log "跳过游戏: $($GameConfig.slug) - 无可用文件" "ERROR"
        Clean-TempFiles -GameSlug $GameConfig.slug
        return $false
    }
    
    # 3. 部署游戏文件
    if (-not $DryRun) {
        $deploySuccess = Deploy-GameFiles -SourcePath $projectInfo.Path -GameSlug $GameConfig.slug
        if (-not $deploySuccess) {
            Write-Log "跳过游戏: $($GameConfig.slug) - 部署失败" "ERROR"
            Clean-TempFiles -GameSlug $GameConfig.slug
            return $false
        }
        
        # 4. 创建预览图
        $imagePath = Create-GamePreview -GameSlug $GameConfig.slug -Category $GameConfig.category -SourcePath $tempPath
        
        # 5. 更新数据库
        $gameData = @{
            slug = $GameConfig.slug
            title = $GameConfig.title
            category = $GameConfig.category
            categoryName = $GameConfig.categoryName
            image = $imagePath
            description = $GameConfig.description
            difficulty = $GameConfig.difficulty
            ageRange = $GameConfig.ageRange
            minAge = $GameConfig.minAge
            maxAge = $GameConfig.maxAge
            tags = $GameConfig.tags
            featured = $GameConfig.featured
            trending = $GameConfig.trending
            developer = $GameConfig.developer
            source = $GameConfig.source
        }
        
        $dbSuccess = Update-GamesDatabase -GameData $gameData
        if (-not $dbSuccess) {
            Write-Log "数据库更新失败: $($GameConfig.slug)" "ERROR"
        }
        
        # 6. Git提交
        Commit-Changes -GameSlug $GameConfig.slug -GameTitle $GameConfig.title
    } else {
        Write-Log "DryRun模式 - 跳过实际部署" "WARNING"
    }
    
    # 7. 清理临时文件
    Clean-TempFiles -GameSlug $GameConfig.slug
    
    Write-Log "游戏部署完成: $($GameConfig.title)" "SUCCESS"
    return $true
}

# 主函数
function Main {
    Write-ColorOutput "🎮 EduGameHQ 批量游戏部署脚本 v1.0" "Green"
    Write-ColorOutput "基于Beetle Rush成功部署流程设计" "Blue"
    Write-ColorOutput "=" * 60 "Cyan"
    
    # 检查配置文件
    if (-not (Test-Path $ConfigFile)) {
        Write-Log "配置文件不存在: $ConfigFile" "ERROR"
        Write-Log "请先创建配置文件，参考 scripts/games-to-deploy.json.example" "ERROR"
        exit 1
    }
    
    # 初始化
    Initialize-Directories
    
    # 读取配置
    try {
        $config = Get-Content -Path $ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json
        Write-Log "读取配置文件成功，共 $($config.games.Count) 个游戏" "SUCCESS"
    } catch {
        Write-Log "配置文件格式错误: $($_.Exception.Message)" "ERROR"
        exit 1
    }
    
    # 筛选游戏
    $gamesToDeploy = $config.games
    if ($Category) {
        $gamesToDeploy = $gamesToDeploy | Where-Object { $_.category -eq $Category }
        Write-Log "筛选分类: $Category，共 $($gamesToDeploy.Count) 个游戏" "INFO"
    }
    
    # 批量部署
    $successCount = 0
    $totalCount = $gamesToDeploy.Count
    
    foreach ($game in $gamesToDeploy) {
        try {
            $success = Deploy-SingleGame -GameConfig $game
            if ($success) {
                $successCount++
            }
        } catch {
            Write-Log "部署异常: $($game.slug) - $($_.Exception.Message)" "ERROR"
        }
        
        Write-ColorOutput "进度: $successCount/$totalCount" "Yellow"
        Start-Sleep -Seconds 1
    }
    
    # 总结
    Write-ColorOutput "=" * 60 "Cyan"
    Write-Log "批量部署完成！" "SUCCESS"
    Write-Log "成功: $successCount/$totalCount" "SUCCESS"
    Write-Log "失败: $($totalCount - $successCount)/$totalCount" $(if ($totalCount - $successCount -gt 0) { "WARNING" } else { "SUCCESS" })
    
    if ($DryRun) {
        Write-Log "这是DryRun模式，没有实际修改文件" "WARNING"
    }
}

# 执行主函数
Main 