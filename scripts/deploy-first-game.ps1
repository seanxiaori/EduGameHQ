# 部署第一个GitHub教育游戏 - Sudoku for Kids
# 这是一个测试脚本，用于部署我们的第一个GitHub开源教育游戏

Write-Host "🎮 准备部署第一个GitHub教育游戏..." -ForegroundColor Cyan
Write-Host "游戏: Sudoku for Kids" -ForegroundColor Green
Write-Host "来源: MarynaShavlak/game-sudoku-for-kids" -ForegroundColor Green

# 检查部署脚本是否存在
if (!(Test-Path "scripts/deploy-github-game.ps1")) {
    Write-Host "❌ 部署脚本不存在，请先确保 scripts/deploy-github-game.ps1 文件存在" -ForegroundColor Red
    exit 1
}

# 设置游戏参数
$GameParams = @{
    GitHubUrl = "https://github.com/MarynaShavlak/game-sudoku-for-kids.git"
    GameSlug = "sudoku-for-kids"
    GameTitle = "Sudoku for Kids"
    Category = "Puzzle"
    SkipBuild = $true  # 这是纯HTML/CSS/JS项目，不需要构建
}

Write-Host "📋 游戏参数:" -ForegroundColor Yellow
Write-Host "  - GitHub: $($GameParams.GitHubUrl)" -ForegroundColor White
Write-Host "  - 游戏标识: $($GameParams.GameSlug)" -ForegroundColor White
Write-Host "  - 游戏名称: $($GameParams.GameTitle)" -ForegroundColor White
Write-Host "  - 分类: $($GameParams.Category)" -ForegroundColor White

# 确认部署
$Confirm = Read-Host "确认部署这个游戏吗? (y/n)"
if ($Confirm -ne "y" -and $Confirm -ne "Y") {
    Write-Host "❌ 部署已取消" -ForegroundColor Red
    exit 0
}

# 执行部署
Write-Host "🚀 开始部署..." -ForegroundColor Green

try {
    & "scripts/deploy-github-game.ps1" @GameParams
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 第一个游戏部署成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 接下来的步骤:" -ForegroundColor Yellow
        Write-Host "1. 在浏览器中访问: http://localhost:3000/games/sudoku-for-kids/" -ForegroundColor White
        Write-Host "2. 测试游戏是否正常运行" -ForegroundColor White
        Write-Host "3. 检查游戏是否在主页的益智游戏分类中显示" -ForegroundColor White
        Write-Host "4. 验证iframe嵌入功能" -ForegroundColor White
        Write-Host "5. 如果一切正常，我们可以继续批量部署其他游戏" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 提示: 如果游戏运行正常，请告诉我，我们将继续部署更多游戏！" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 部署失败，请检查错误信息" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 部署过程中发生错误: $_" -ForegroundColor Red
} 