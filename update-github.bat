@echo off
:: 使用 UTF-8 编码，并隐藏输出
chcp 65001 >nul

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

:: 更新所有文件
%GIT% add .
%GIT% commit -m "更新所有文件"
%GIT% pull origin main
%GIT% push origin main

echo 更新完成
pause