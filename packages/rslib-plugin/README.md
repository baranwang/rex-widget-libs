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
| `encrypt` | `boolean` | `false` | 生产构建后调用 [Rex 模块加密](https://rexnow.tv/encrypt/) 服务，将 JS 产物写成 `REXENC` 格式。`watch` 开发监听时不会加密。 |

## 💡 工作原理

### 1. 解析 WidgetMetadata

插件会解析你的代码中的 `WidgetMetadata` 对象：

```ts
// src/index.ts
WidgetMetadata = {
  id: 'my-widget',
  title: 'My Widget',
  modules: [
    {
      id: 'search-module',
      title: 'Search Module',
      functionName: 'searchContent',
      description: 'Search for content',
      params: [
        {
          name: 'query',
          title: 'Search Query',
          type: 'input',
        },
        {
          name: 'category',
          title: 'Category',
          type: 'enumeration',
          enumOptions: [
            { title: 'Movies', value: 'movies' },
            { title: 'TV Shows', value: 'tvshows' },
          ],
        },
      ],
    },
  ],
};
```

### 2. 生成类型定义

插件会根据 `WidgetMetadata` 自动生成相应的类型定义：

```ts
// src/rex-widget-env.d.ts
/// <reference types='@rexnow/libs/env' />

//#region search-module
/**
 * Params of Search Module
 */
interface SearchContentParams {
  /**
   * Search Query
   */
  query: string;
  /**
   * Category
   */
  category: 'movies' | 'tvshows';
}

/**
 * Search Module
 * @description Search for content
 * @param {SearchContentParams} params
 * @returns {Promise<VideoItem[]>}
 */
function searchContent(params: SearchContentParams): Promise<VideoItem[]>;

/**
 * Search Module
 */
type SearchContentType = typeof searchContent;
//#endregion search-module
```

### 3. 清除导出声明

插件会自动清除构建输出中的导出声明，因为 Rex Widget 不支持脚本有导出声明。

### 4. 模块加密

设置 `encrypt: true` 后，插件会在类型生成完成之后，把构建出的 `.js` 发送到 `https://api.rexnow.tv/api/widgets/encrypt`，并用返回的 `REXENC` 信封覆盖产物。协议与 [rexnow.tv/encrypt](https://rexnow.tv/encrypt/) 一致：`AES-256-GCM`（`A256GCM` / `rex-1`），加密结果仅供 Rex 使用。

请保留未加密的源码。加密不会在 `rslib build --watch` 时执行，以免开发服务器读到密文。大文件可能需要 1–2 分钟；超过 2 MiB 或已经是 `REXENC` / `FWENC` 的文件会被拒绝。

## 📚 完整示例

### 项目结构

```
my-widget/
├── src/
│   ├── index.ts                    # 主要逻辑
│   └── rex-widget-env.d.ts     # 自动生成的类型定义
├── rslib.config.ts                 # 构建配置
├── package.json
└── tsconfig.json
```

### 源代码示例

```ts
// src/index.ts
WidgetMetadata = {
  id: 'movie-search',
  title: '电影搜索',
  modules: [
    {
      id: 'search',
      title: '搜索电影',
      functionName: 'searchMovies',
      description: '根据关键词搜索电影',
      params: [
        {
          name: 'keyword',
          title: '关键词',
          type: 'input',
        },
        {
          name: 'year',
          title: '年份',
          type: 'input',
        },
        {
          name: 'genre',
          title: '类型',
          type: 'enumeration',
          enumOptions: [
            { title: '动作', value: 'action' },
            { title: '喜剧', value: 'comedy' },
            { title: '剧情', value: 'drama' },
          ],
        },
      ],
    },
  ],
};

// 实现搜索函数
async function searchMovies(params: SearchMoviesParams): Promise<VideoItem[]> {
  const { keyword, year, genre } = params;
  
  // 使用 Widget API 进行搜索
  const response = await Widget.http.get('https://api.example.com/search', {
    params: { q: keyword, year, genre },
  });
  
  return response.data.map(item => ({
    id: item.id,
    title: item.title,
    year: item.year,
    // ... 其他字段
  }));
}
```

### 生成的类型定义

```ts
// src/rex-widget-env.d.ts (自动生成)
/// <reference types='@rexnow/libs/env' />

//#region search
/**
 * Params of 搜索电影
 */
interface SearchMoviesParams {
  /**
   * 关键词
   */
  keyword: string;
  /**
   * 年份
   */
  year: string;
  /**
   * 类型
   */
  genre: 'action' | 'comedy' | 'drama';
}

/**
 * 搜索电影
 * @description 根据关键词搜索电影
 * @param {SearchMoviesParams} params
 * @returns {Promise<VideoItem[]>}
 */
function searchMovies(params: SearchMoviesParams): Promise<VideoItem[]>;

/**
 * 搜索电影
 */
type SearchMoviesType = typeof searchMovies;
//#endregion search
```

## 🎯 支持的参数类型

插件支持以下参数类型的自动类型生成：

| 参数类型 | 描述 | 生成的 TypeScript 类型 |
|----------|------|----------------------|
| `input` | 输入框 | `string` |
| `enumeration` | 枚举选择 | `'option1' \| 'option2' \| ...` |
| `constant` | 常量值 | `'constantValue'` |

## 🔧 开发模式

在开发模式下，插件会监听文件变化并自动重新生成类型定义：

```bash
# 启动开发模式
npm run dev
# 或
pnpm dev
```

## 🤝 最佳实践

1. **保持 WidgetMetadata 结构清晰**：确保每个模块都有明确的 ID 和功能定义
2. **使用描述性的函数名**：函数名应该清晰地表达其功能
3. **提供完整的参数描述**：为每个参数提供有意义的标题和描述
4. **合理组织模块**：将相关功能组织在一起，避免模块过于复杂

## 📚 相关文档

- [@rexnow/libs](../libs/README.md) - 核心工具库
- [create-rex-widget](../create-rex-widget/README.md) - 脚手架工具
- [Rex Widget 开发指南](https://docs.forward-widget.com)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改善这个项目。

## 📄 许可证

MIT License