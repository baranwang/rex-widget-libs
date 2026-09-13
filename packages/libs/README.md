# @rexnow/libs

[![NPM Version](https://img.shields.io/npm/v/@rexnow/libs)](https://www.npmjs.com/package/@rexnow/libs)
![NPM License](https://img.shields.io/npm/l/@rexnow/libs)

> Rex Widget 开发工具库

## 🚀 简介

`@rexnow/libs` 是一个专为 Rex Widget 开发者设计的工具库，提供了完整的类型定义和测试工具，帮助开发者更高效地构建和测试 Widget 应用。

## 📦 安装

```bash
npm install @rexnow/libs
# 或
yarn add @rexnow/libs
# 或
pnpm add @rexnow/libs
```

## 🛠️ 使用方法

### 环境类型定义

#### TypeScript 项目

在你的项目中创建一个 `.d.ts` 文件，引入类型定义：

```ts
// rex-widget-env.d.ts
/// <reference types="@rexnow/libs/env" />
```

这样你就可以在 TypeScript 代码中获得完整的类型支持：

```ts
// 现在可以使用 Widget 相关的类型和全局变量
WidgetMetadata = {
  name: "My Widget",
  version: "1.0.0",
  // ... 其他配置
};

async function loadDetail(url: string) {
  const resp = await Widget.http.get('https://api.example.com/data')

  const result: VideoItem = {
    // ...
  }
  // ...
  return result
}
```

#### JavaScript 项目

对于 JavaScript 项目，你可以使用 JSDoc 来获得类型提示：

```js
/**
 * @type {import('@rexnow/libs/env')}
 */


WidgetMetadata = {
  name: "My Widget",
  version: "1.0.0",
  // ... 其他配置
};

async function loadDetail(url) {
  const resp = await Widget.http.get('https://api.example.com/data')
  /**
   * @type {import('@rexnow/libs/env').VideoItem}
   */
  const result = {
    // ...
  }
  // ...
  return result
}
```

### 单元测试

`@rexnow/libs` 提供了 `WidgetAdaptor` 来模拟 Widget 运行环境，方便进行单元测试。

以 [Rstest](http://rstest.rs/) 为例：

```ts
import { expect, test, beforeAll } from "@rstest/core";

beforeAll(async () => {
  const { WidgetAdaptor } = await import("@rexnow/libs/widget-adaptor");
  rstest.stubGlobal("Widget", WidgetAdaptor);
});

test("测试 HTTP 请求", async () => {
  const response = await Widget.http.get("https://api.example.com/data");
  expect(response).toBeDefined();
  expect(response.status).toBe(200);
});
```

#### TMDB

如果需要使用到 `Widget.tmdb` 下的方法，需要环境变量中配置 `TMDB_API_KEY`

```ini
# .env
TMDB_API_KEY=xxxx
```

```ts
// rstest.config.ts

import { defineConfig } from "@rstest/core";

export default defineConfig({
  testEnvironment: "node",
  pool: {
    type: "forks",
    execArgv: ["--env-file=.env"], // 通过指定 env-file 加载环境变量
  },
});
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改善这个项目。

## 📄 许可证

MIT License
