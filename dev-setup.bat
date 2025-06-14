@echo off
echo ========================================
echo EduGameHQ Astro 开发环境设置
echo ========================================
echo.

echo 检查Node.js版本...
node --version
echo.

echo 检查npm版本...
npm --version
echo.

echo 当前目录: %CD%
echo.

echo 选择操作:
echo 1. 安装依赖 (npm install)
echo 2. 启动开发服务器 (npm run dev)
echo 3. 构建项目 (npm run build)
echo 4. 预览构建 (npm run preview)
echo 5. 类型检查 (npm run check)
echo 6. 退出
echo.

set /p choice=请输入选择 (1-6): 

if "%choice%"=="1" (
    echo.
    echo 正在安装依赖...
    npm install
    echo.
    echo 依赖安装完成！
    pause
    goto :start
)

if "%choice%"=="2" (
    echo.
    echo 启动开发服务器...
    echo 服务器将在 http://localhost:4321 启动
    echo 按 Ctrl+C 停止服务器
    echo.
    npm run dev
    pause
    goto :start
)

if "%choice%"=="3" (
    echo.
    echo 构建项目...
    npm run build
    echo.
    echo 构建完成！
    pause
    goto :start
)

if "%choice%"=="4" (
    echo.
    echo 预览构建...
    npm run preview
    pause
    goto :start
)

if "%choice%"=="5" (
    echo.
    echo 运行类型检查...
    npm run check
    echo.
    echo 类型检查完成！
    pause
    goto :start
)

if "%choice%"=="6" (
    echo 再见！
    exit /b 0
)

echo 无效选择，请重试...
pause
goto :start

:start
cls
goto :eof 