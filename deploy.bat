@echo off
chcp 65001 >nul
echo Portfolio GitHub Pages 一键部署
echo ============================================

REM 检查 Python 是否可用
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未检测到 Python，请先安装 Python
    pause
    exit /b 1
)

REM 运行部署脚本
python deploy.py %*

pause
