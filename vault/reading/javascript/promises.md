---
title: Promise 速记
date: 2026-04-05
description: 用几个实际约束回顾 Promise、链式调用和错误传播。
tags:
  - javascript
  - async
---

Promise 的重点不是“异步语法糖”，而是状态和值的传递模型。

- `then` 返回新的 Promise，所以链式调用天然就是数据流。
- `catch` 会捕获前面链路里抛出的错误。
- 当你需要等多个任务同时结束时，再考虑 `Promise.all`。

如果需要理解浏览器为什么会把回调放到不同队列，再回看 [[event-loop]].