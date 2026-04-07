---
title: Async Functions 速记
date: 2026-04-07
description: 从返回值、异常传播和可读性三个角度理解 async/await。
tags:
  - javascript
  - async
---

`async` / `await` 让异步控制流的阅读成本更低，但它没有改变底层调度规则。

- `async function` 一定返回 Promise。
- `await` 只是把后续逻辑拆成了一个微任务。
- 发生异常时，仍然要用 `try/catch` 或链式 `catch` 处理。

如果你要把这三篇串起来读，建议从 [[event-loop]] 开始，再看 [[promises]]。