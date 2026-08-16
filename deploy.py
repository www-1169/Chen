#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一键部署脚本：将 portfolio 同步到 docs 并推送到 GitHub Pages

用法：
    python deploy.py
    python deploy.py "自定义提交信息"
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime

# 配置
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PORTFOLIO_DIR = os.path.join(ROOT_DIR, "portfolio")
DOCS_DIR = os.path.join(ROOT_DIR, "docs")


def find_git():
    """查找 git 可执行文件路径"""
    git_path = shutil.which("git")
    if git_path:
        return git_path
    # Windows 常见安装路径
    common_paths = [
        r"C:\Program Files\Git\bin\git.exe",
        r"C:\Program Files (x86)\Git\bin\git.exe",
        r"C:\Users\{}\AppData\Local\Programs\Git\bin\git.exe".format(os.getlogin()),
    ]
    for path in common_paths:
        if os.path.exists(path):
            return path
    return None


GIT_EXE = find_git()


def check_git_available(dry_run=False):
    """检查 Git 是否已安装"""
    if GIT_EXE is None:
        if dry_run:
            print("警告：未检测到 Git，演练模式跳过 Git 操作")
            return False
        print("错误：未检测到 Git。")
        print("请先安装 Git 并确保已添加到系统 PATH：")
        print("  https://git-scm.com/download/win")
        print("安装后请重新打开终端再运行此脚本。")
        sys.exit(1)
    return True


def run_command(command, cwd=None):
    """运行命令并返回输出，失败时抛出异常"""
    # 将命令中的 git 替换为找到的完整路径
    if command and command[0] == "git":
        command = [GIT_EXE] + command[1:]

    print(f"$ {' '.join(command)}")
    result = subprocess.run(
        command,
        cwd=cwd or ROOT_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"命令执行失败，返回码：{result.returncode}")
    return result


def sync_portfolio_to_docs():
    """将 portfolio 内容同步到 docs 目录"""
    print("=" * 60)
    print("步骤 1/4：同步 portfolio 到 docs")
    print("=" * 60)

    if not os.path.exists(PORTFOLIO_DIR):
        raise FileNotFoundError(f"找不到 portfolio 目录：{PORTFOLIO_DIR}")

    # 如果 docs 已存在，先删除再复制，确保完全一致
    if os.path.exists(DOCS_DIR):
        shutil.rmtree(DOCS_DIR)

    shutil.copytree(PORTFOLIO_DIR, DOCS_DIR)
    print(f"已同步：{PORTFOLIO_DIR} -> {DOCS_DIR}")


def check_git_repository():
    """检查当前目录是否为 Git 仓库"""
    print("=" * 60)
    print("步骤 2/4：检查 Git 仓库状态")
    print("=" * 60)

    if not os.path.exists(os.path.join(ROOT_DIR, ".git")):
        print("当前目录尚未初始化 Git 仓库，正在初始化...")
        run_command(["git", "init"])
        run_command(["git", "branch", "-M", "main"])
        print("Git 仓库已初始化，分支为 main")
    else:
        print("Git 仓库已存在")


def commit_and_push(commit_message):
    """提交并推送变更"""
    print("=" * 60)
    print("步骤 3/4：提交变更")
    print("=" * 60)

    # 检查是否有变更
    status_result = run_command(["git", "status", "--porcelain"])
    if not status_result.stdout.strip():
        print("没有检测到变更，无需提交")
        return False

    # 添加所有变更
    run_command(["git", "add", "."])

    # 提交
    run_command(["git", "commit", "-m", commit_message])
    print(f"已提交：{commit_message}")
    return True


def push_to_github():
    """推送到 GitHub"""
    print("=" * 60)
    print("步骤 4/4：推送到 GitHub")
    print("=" * 60)

    # 检查是否有远程仓库
    remote_result = subprocess.run(
        [GIT_EXE, "remote"],
        cwd=ROOT_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    if "origin" not in remote_result.stdout:
        print("警告：尚未配置远程仓库 origin")
        print("请先运行：git remote add origin https://github.com/wzwy8866/你的仓库名.git")
        return False

    run_command(["git", "push", "origin", "main"])
    print("推送完成")
    return True


def main():
    print("=" * 60)
    print("Portfolio GitHub Pages 一键部署")
    print(f"开始时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 解析参数
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        sys.argv.remove("--dry-run")
        print("【演练模式】不会实际执行 git commit / push")
        print("=" * 60)

    try:
        # 检查 Git 是否可用
        git_available = check_git_available(dry_run=dry_run)

        # 获取提交信息
        if len(sys.argv) > 1:
            commit_message = sys.argv[1]
        else:
            commit_message = f"Update portfolio at {datetime.now().strftime('%Y-%m-%d %H:%M')}"

        # 执行部署流程
        sync_portfolio_to_docs()

        if dry_run:
            if git_available:
                check_git_repository()
                print("=" * 60)
                print("【演练】接下来会执行：")
                print(f"  git add .")
                print(f"  git commit -m \"{commit_message}\"")
                print(f"  git push origin main")
            else:
                print("=" * 60)
                print("【演练】因未检测到 Git，仅完成同步步骤")
                print("安装 Git 后实际执行：")
                print(f"  git init")
                print(f"  git add .")
                print(f"  git commit -m \"{commit_message}\"")
                print(f"  git push origin main")
            print("=" * 60)
            return

        check_git_repository()
        has_commit = commit_and_push(commit_message)

        if has_commit:
            push_to_github()
            print("=" * 60)
            print("部署成功！")
            print("等待 1-2 分钟后，访问 GitHub Pages 查看最新效果")
            print("=" * 60)
        else:
            print("=" * 60)
            print("没有需要推送的变更")
            print("=" * 60)

    except Exception as e:
        print("=" * 60)
        print(f"部署失败：{e}")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
