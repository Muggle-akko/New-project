# Paper Trail

一个基于 `Astro + Vercel` 的 Obsidian 笔记站 MVP。

## 本地开发

1. 安装依赖：`npm.cmd install`
2. 启动开发：`npm.cmd run dev`
3. 构建检查：`npm.cmd run build`

## 目录结构

- `vault/`: Obsidian 笔记和附件
- `src/`: 页面、布局、组件与内容逻辑
- `public/_vault/`: 构建前自动同步的附件目录

## Frontmatter

每篇公开笔记至少包含：

```yaml
---
title: 笔记标题
date: 2026-04-08
updated: 2026-04-08
description: 一句简介
tags:
  - tag-a
  - tag-b
draft: false
---
```

## 已支持的语法

- 标准 Markdown
- `[[内部链接]]`
- `[[内部链接|别名]]`
- `[!note]` / `[!tip]` / `[!warning]`
- `![[assets/file.svg]]`
- 相对路径图片，例如 `![alt](../assets/file.svg)`

## 部署到 Vercel

1. 把仓库推到 GitHub。
2. 在 Vercel 中导入这个仓库。
3. 把生产分支设为 `main`。
4. 之后每次 push，Vercel 都会自动构建和部署。

## Git 认证建议

优先使用 SSH，避免反复处理 HTTPS token。

- 生成密钥：`ssh-keygen -t ed25519 -C "you@example.com"`
- 把公钥加入 GitHub SSH Keys
- 把远端改成 `git@github.com:<user>/<repo>.git`

如果你仍想用 HTTPS，建议安装并启用 Git Credential Manager，而不是手工维护 token。