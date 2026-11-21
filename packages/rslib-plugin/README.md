# @rexnow/rslib-plugin

[![NPM Version](https://img.shields.io/npm/v/@rexnow/rslib-plugin)](https://www.npmjs.com/package/@rexnow/rslib-plugin)
![NPM License](https://img.shields.io/npm/l/@rexnow/rslib-plugin)

> Rex Widget 专用的 Rslib 构建插件

## 🚀 简介

`@rexnow/rslib-plugin` 是一个专为 Rex Widget 开发优化的 Rslib 插件。它提供了以下核心功能：

- 🔧 **自动类型生成**：根据 `WidgetMetadata` 自动生成 TypeScript 类型定义
- 📦 **构建优化**：清除 Rex Widget 不支持的导出声明
- 🔐 **模块加密**：可选调用 Rex 官方加密服务，将产物写成 `REXENC` 格式
- 🛠️ **开发体验**：提供完整的类型支持和智能提示
- 🔄 **热更新**：开发模式下自动重新生成类型定义

## 📦 安装

```bash
npm install -D @rexnow/rslib-plugin
# 或
yarn add -D @rexnow/rslib-plugin
# 或
pnpm add -D @rexnow/rslib-plugin
```

## 🛠️ 使用方法

### 基础配置

在你的 `rslib.config.ts` 文件中添加插件：

```ts
import { pluginRexWidget } from '@rexnow/rslib-plugin';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  plugins: [pluginRexWidget()],
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: true,
    },
  ],
});
```

### 自定义配置

```ts
import { pluginRexWidget } from '@rexnow/rslib-plugin';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  plugins: [
    pluginRexWidget({
      typesFilePath: 'src/custom-types.d.ts', // 自定义类型文件路径
      encrypt: true, // 生产构建后加密 JS 产物
    }),
  ],
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: true,
    },
  ],
});
```

## 📋 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `typesFilePath` | `string` | `'src/rex-widget-env.d.ts'` | 生成的类型定义文件路径 |
| `devPort` | `number` | `8000` | 开发模式本地文件服务监听端口 |
| `encrypt` | `boolean` | `false` | 生产构建后调用 [Rex 模块加密](https://modules.rexnow.app/) 服务，将 JS 产物写成 `REXENC` 格式。`watch` 开发监听时不会加密。 |

## 💡 工作原理

### 1. 解析 WidgetMetadata

插件会解析你的代码中的 `WidgetMetadata` 对象（包含 `globalParams`、`modules`、`search` 以及参数的 `dynamicOptions`）：

```ts
// src/index.ts
WidgetMetadata = {
  id: 'my-widget',
  title: 'My Widget',
  version: '1.0.0',
  requiredVersion: '0.0.6',
  modules: [
    {
      id: 'popular',
      title: '热门内容',
      functionName: 'loadPopular',
      params: [
        {
          name: 'category',
          title: '分类',
          type: 'enumeration',
          enumOptions: [
            { title: '电影', value: 'movies' },
            { title: '剧集', value: 'tvshows' },
          ],
        },
        {
          name: 'page',
          title: '页码',
          type: 'page',
        },
      ],
    },
  ],
  search: {
    id: 'search',
    title: '搜索',
    functionName: 'searchContent',
    params: [{ name: 'page', title: '页码', type: 'page' }],
  },
};
```

### 2. 生成类型定义

插件会根据 `WidgetMetadata` 自动生成相应的类型定义（包括 `GlobalParams`、模块入口、顶层 `search` 入口以及 `dynamicOptions` 加载函数）：

```ts
// src/rex-widget-env.d.ts
/// <reference types='@rexnow/libs/env' />

declare namespace MyWidget {
  interface GlobalParams {}
}

//#region popular
/** Params of 热门内容 */
interface LoadPopularParams extends MyWidget.GlobalParams, VideoListParams {
  /** 分类 */
  category: 'movies' | 'tvshows';
  /** 页码 */
  page: string;
}

/** Return Type of 热门内容 */
interface LoadPopularReturnType extends Array<VideoItem> {}

/** 热门内容 */
declare let loadPopular: (params: LoadPopularParams) => LoadPopularReturnType | Promise<LoadPopularReturnType>;
//#endregion popular

//#region search
/** Params of 搜索 */
interface SearchContentParams extends MyWidget.GlobalParams {
  /** 搜索关键词（由 Rex 注入） */
  keyword: string;
  /** 页码 */
  page: string;
}

/** Return Type of 搜索 */
interface SearchContentReturnType extends Array<VideoItem> {}

/** 搜索 */
declare let searchContent: (params: SearchContentParams) => SearchContentReturnType | Promise<SearchContentReturnType>;
//#endregion search
```

### 3. 清除导出声明

插件会自动清除构建输出中的导出声明，因为 Rex Widget 不支持脚本有导出声明。

### 4. 模块加密

设置 `encrypt: true` 后，插件会在类型生成完成之后，把构建出的 `.js` 发送到 `https://api.rexnow.tv/api/widgets/encrypt`，并用返回的 `REXENC` 信封覆盖产物。协议与 [modules.rexnow.app](https://modules.rexnow.app/) 一致：`AES-256-GCM`（`A256GCM` / `rex-1`），加密结果仅供 Rex 使用。

请保留未加密的源码。加密不会在 `rslib build --watch` 时执行，以免开发服务器读到密文。构建机需要能访问 `api.rexnow.tv`；加密失败会使生产构建失败。大文件可能需要 1–2 分钟；超过 2 MiB 或已经是 `REXENC` / `FWENC` 的文件会被拒绝。不要同时发布未加密的 source map。

## 🎯 支持的参数类型

插件支持 [Rex 模块文档](https://modules.rexnow.app/guide#params) 中的全部参数类型：

| 参数类型 | 描述 | 生成的 TypeScript 类型 |
|----------|------|----------------------|
| `input` | 文本输入 | `string` |
| `enumeration` | 单选枚举（静态 / 配置 `dynamicOptions` 时） | `'option1' \| 'option2' \| ...` / `string` |
| `constant` | 固定常量值 | `'constantValue'` |
| `count` | 数量 | `string` |
| `page` | 页码（支持 `startPage`） | `string` |
| `offset` | 偏移量 | `string` |
| `language` | App 注入语言 | `string` |
| `timezone` | App 注入时区 | `string` |
| `folder` | 文件夹 | `string` |
| `userId` | App 注入用户 ID | `string` |
| `configId` | App 注入配置 ID | `string` |

> 带 `belongTo` 条件的参数在生成的接口中会自动标记为可选属性（`?`）；带 `dynamicOptions` 的参数会自动为其 `functionName` 生成顶层函数声明。

## 🔧 开发模式

在开发模式下，插件会监听文件变化并自动重新生成类型定义：

```bash
# 启动开发模式
npm run dev
# 或
pnpm dev
```

## 📚 相关文档

- [@rexnow/libs](../libs/README.md) - 核心工具库
- [create-rex-widget](../create-rex-widget/README.md) - 脚手架工具
- [Rex 模块官方文档](https://modules.rexnow.app/guide)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改善这个项目。

## 📄 许可证

MIT License