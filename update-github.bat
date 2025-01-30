@echo off
chcp 65001 >nul
echo [工作室记账系统 - GitHub更新工具]
echo ================================

:: 设置 Git 路径
set GIT="E:\科学上网\git\cmd\git.exe"

:: 检查 Git 是否可用
%GIT% --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Git路径无效: %GIT%
    echo 请检查Git是否正确安装
    pause
    exit /b 1
)

:: 配置 Git 用户信息
echo [配置] 设置Git用户信息...
%GIT% config --global user.email "yffkjb@example.com"
%GIT% config --global user.name "YFFKJB"

:: 确保在正确的目录
cd /d "%~dp0"

:: 检查是否已初始化 Git
if not exist .git (
    echo [初始化] 正在创建Git仓库...
    %GIT% init
    %GIT% remote add origin https://github.com/YFFKJB/accounting-system-new.git
)

:: 确保在main分支上
%GIT% checkout main 2>nul || %GIT% checkout -b main

echo.
echo 请选择要更新的文件:
echo [1] 所有文件
echo [2] vercel.json
echo [3] api/register.js
echo [4] api/login.js
echo [5] public/register.html
echo [6] public/index.html
echo [7] README.md
echo.
set /p choice=请输入数字(1-7): 

if "%choice%"=="1" (
    %GIT% add .
    %GIT% commit -m "Update files"
) else if "%choice%"=="2" (
    %GIT% add vercel.json
    %GIT% commit -m "移除敏感信息"
) else if "%choice%"=="3" (
    %GIT% add api/register.js
    %GIT% commit -m "更新register.js"
) else if "%choice%"=="4" (
    %GIT% add api/login.js
    %GIT% commit -m "更新login.js"
) else if "%choice%"=="5" (
    %GIT% add public/register.html
    %GIT% commit -m "更新register.html"
) else if "%choice%"=="6" (
    %GIT% add public/index.html
    %GIT% commit -m "更新index.html"
) else if "%choice%"=="7" (
    %GIT% add README.md
    %GIT% commit -m "更新README.md"
) else (
    echo [错误] 无效的选择！
    pause
    exit /b 1
)

:: 推送更改
echo [执行] 正在推送到GitHub...
%GIT% pull origin main --no-rebase
%GIT% push origin main

if errorlevel 1 (
    echo [错误] 推送失败！
    echo 请检查以下内容:
    echo 1. Git用户信息配置
    echo 2. GitHub登录状态
    echo 3. 网络连接状态
    echo.
    echo [当前配置]
    %GIT% config --global --list
) else (
    echo [成功] 文件已更新！
)

pause 