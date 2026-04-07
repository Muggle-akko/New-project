---
title: Event Loop 速记
date: 2026-04-06
updated: 2026-04-07
description: 解释微任务、宏任务以及为什么 async/await 看起来像“同步代码”。
tags:
  - javascript
  - runtime
---

Event Loop 的核心不是一句“单线程”，而是调度顺序。

> [!tip] 阅读方法
> 先抓住“调用栈清空后，微任务先执行，再轮到下一个宏任务”这一条主线。

在这之后，再去看 [[promises|Promise 速记]] 会容易很多。

下面这张附件也能当作 vault 嵌入测试：

![[assets/obsidian-flow.svg]]