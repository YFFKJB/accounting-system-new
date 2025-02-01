@echo off
:: 使用 UTF-8 编码，并隐藏输出
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 设置 Git 路径
set GIT="E:\科学上网\git\cmd\git.exe"

:: 使用 echo. 来输出空行，避免乱码
echo.
echo ================================
echo   工作室记账系统 - GitHub更新工具
echo ================================
echo.

:: 检查 Git 是否可用
%GIT% --version >nul 2>&1
if errorlevel 1 (
    echo Git路径无效: %GIT%
    echo 请检查Git是否正确安装
    pause
    exit /b 1
)

:: 配置 Git
%GIT% config --global user.email "yffkjb@example.com"
%GIT% config --global user.name "YFFKJB"

:: 确保在正确的目录
cd /d "%~dp0"

:: 初始化 Git
if not exist .git (
    %GIT% init
    %GIT% remote add origin https://github.com/YFFKJB/accounting-system-new.git
)

:: 切换到 main 分支
%GIT% checkout main 2>nul || %GIT% checkout -b main

:: 确保 .gitignore 文件存在并包含 bat 文件
echo update-github.bat>> .gitignore
echo update-from-github.bat>> .gitignore
sort .gitignore /unique > .gitignore.tmp
move /y .gitignore.tmp .gitignore >nul

:: 显示当前状态
echo 当前修改的文件:
%GIT% status --short

echo.
set /p confirm=是否确认上传这些文件? (Y/N): 
if /i not "%confirm%"=="Y" (
    echo 已取消上传
    goto :end
)

:: 选择版本类型
echo.
echo 选择版本类型:
echo [1] 普通更新
echo [2] 功能更新 (v1.x.0)
echo [3] 修复更新 (v1.0.x)
echo.
set /p vtype=请选择 (1-3): 

:: 获取当前版本号
for /f "tokens=*" %%i in ('%GIT% describe --tags --abbrev^=0 2^>nul') do set current_version=%%i
if "!current_version!"=="" set current_version=v1.0.0

if "%vtype%"=="1" (
    set message=常规更新
    %GIT% add .
    %GIT% commit -m "!message!"
) else if "%vtype%"=="2" (
    :: 功能更新，增加第二个数字
    for /f "tokens=1,2,3 delims=." %%a in ("!current_version:~1!") do (
        set /a new_feature=%%b+1
        set new_version=v%%a.!new_feature!.0
    )
    set message=功能更新 !new_version!
    %GIT% add .
    %GIT% commit -m "!message!"
    %GIT% tag -a !new_version! -m "功能更新"
) else if "%vtype%"=="3" (
    :: 修复更新，增加第三个数字
    for /f "tokens=1,2,3 delims=." %%a in ("!current_version:~1!") do (
        set /a new_fix=%%c+1
        set new_version=v%%a.%%b.!new_fix!
    )
    set message=修复更新 !new_version!
    %GIT% add .
    %GIT% commit -m "!message!"
    %GIT% tag -a !new_version! -m "修复更新"
)

:: 推送更新
%GIT% pull origin main
%GIT% push origin main
if "%vtype%"=="2" %GIT% push origin !new_version!
if "%vtype%"=="3" %GIT% push origin !new_version!

echo.
echo 更新完成！
if defined new_version echo 新版本: !new_version!

:end
endlocal
pause