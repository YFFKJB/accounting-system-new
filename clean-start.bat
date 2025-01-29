@echo off
chcp 65001 >nul
echo [工作室记账系统 - 初始化工具]
echo ================================

:: 设置 Git 路径
set GIT="E:\科学上网\git\cmd\git.exe"

:: 删除已存在的 .git 目录（如果有）
if exist .git (
    echo [清理] 删除旧的 Git 仓库...
    rmdir /S /Q .git
)

:: 初始化 Git
echo [初始化] 创建新的 Git 仓库...
%GIT% init
%GIT% branch -M main

:: 配置 Git 用户信息
echo [配置] 设置Git用户信息...
%GIT% config --global user.email "yffkjb@example.com"
%GIT% config --global user.name "YFFKJB"

:: 添加所有文件
echo [添加] 准备所有文件...
%GIT% add .

:: 提交
echo [提交] 创建初始提交...
%GIT% commit -m "初始化项目"

:: 设置远程仓库（替换为您新创建的仓库地址）
echo [远程] 设置 GitHub 仓库...
%GIT% remote add origin https://github.com/YFFKJB/accounting-system-new.git

:: 推送
echo [推送] 上传到 GitHub...
%GIT% push -u origin main

if errorlevel 1 (
    echo [错误] 推送失败！
    echo 请检查：
    echo 1. GitHub 仓库地址是否正确
    echo 2. 是否已登录 GitHub
    echo 3. 网络连接是否正常
) else (
    echo [成功] 文件已上传到 GitHub！
)

echo.
echo 完成！按任意键退出...
pause 