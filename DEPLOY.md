# GitHub Pages 部署说明

本项目使用 GitHub Pages 的 `/docs` 文件夹作为部署源，这样可以在保留 `p1/` 仓库根目录结构的同时，单独部署 Portfolio。

## 目录结构

```
p1/                      <- GitHub 仓库根目录
├── docs/                <- GitHub Pages 部署源
│   ├── index.html       <- Portfolio 入口
│   ├── assets/
│   │   ├── portrait.jpg
│   │   └── portrait.png
│   └── projects/
│       └── star-assault/
│           ├── index.html
│           └── src/
│               ├── main.js
│               └── styles.css
├── portfolio/           <- 本地开发目录（与 docs 内容保持一致）
├── airplane-battle/     <- 游戏原始项目（已复制到 docs/projects/star-assault）
└── DEPLOY.md            <- 本说明文件
```

## 为什么使用 /docs 方案

- 保留 `p1/` 作为仓库根目录，不影响其他项目文件
- GitHub Pages 原生支持从 `/docs` 文件夹部署
- 所有资源路径均为相对路径，无需修改 HTML 代码

## 部署步骤

### 1. 初始化 Git 仓库

```bash
cd D:\xiangmu\p1
git init
git branch -M main
```

### 2. 添加远程仓库

```bash
git remote add origin https://github.com/wzwy8866/你的仓库名.git
```

### 3. 提交代码

```bash
git add .
git commit -m "Initial portfolio with GitHub Pages"
git push -u origin main
```

### 4. 开启 GitHub Pages

1. 打开 GitHub 仓库页面
2. 进入 `Settings` → `Pages`
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`，文件夹选择 `/docs`
5. 点击 `Save`

### 5. 等待部署完成

保存后约 1-2 分钟，GitHub 会生成 Pages 链接。访问地址为：

```
https://wzwy8866.github.io/你的仓库名/
```

## 一键部署脚本

项目已提供 `deploy.py` 和 `deploy.bat`，可自动完成：同步 `portfolio/` → `docs/` → `git add` → `git commit` → `git push`。

### 首次使用

1. 确保已配置远程仓库：

```bash
git remote add origin https://github.com/wzwy8866/你的仓库名.git
```

2. 双击运行 `deploy.bat`，或在命令行执行：

```bash
python deploy.py
```

### 自定义提交信息

```bash
python deploy.py "更新作品描述和样式"
```

如果不指定提交信息，脚本会自动生成：`Update portfolio at 2026-08-15 12:34`

### 演练模式（不实际执行 git 操作）

```bash
python deploy.py --dry-run
```

此模式会同步 `portfolio/` 到 `docs/`，但不会执行 `git commit` 和 `git push`，适合在本地验证脚本是否报错。

## 后续更新流程

当修改 `portfolio/` 目录后，运行一键部署脚本即可：

```bash
cd D:\xiangmu\p1
python deploy.py
```

或手动同步：

```bash
cd D:\xiangmu\p1
python -c "import shutil; shutil.copytree('portfolio', 'docs', dirs_exist_ok=True)"
git add .
git commit -m "Update portfolio"
git push
```

## 注意事项

- `docs/` 和 `portfolio/` 内容应保持一致
- 修改游戏项目时，建议修改 `portfolio/projects/star-assault/` 或 `airplane-battle/`，然后同步到 `docs/`
- 确保证件照文件 `assets/portrait.png` 已提交到仓库
- `deploy.py` 会先删除旧 `docs/` 再重新复制，确保部署内容与 `portfolio/` 完全一致
