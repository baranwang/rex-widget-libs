# Create Rex Widget

> 快速创建 Rex Widget 项目的脚手架工具

[![NPM Version](https://img.shields.io/npm/v/create-rex-widget)](https://www.npmjs.com/package/create-rex-widget)
![NPM License](https://img.shields.io/npm/l/create-rex-widget)

## 🚀 简介

`create-rex-widget` 是一个用于快速创建 Rex Widget 项目的脚手架工具。它提供了开箱即用的项目模板，包含完整的开发环境配置和类型定义，让你可以专注于 Widget 逻辑的实现。

## 📦 安装与使用

### 创建新项目

```bash
npm create rex-widget@latest
# 或
yarn create rex-widget
# 或
pnpm create rex-widget@latest
```

### 交互式创建

运行命令后，脚手架会引导你完成以下步骤：

1. **输入项目名称**：指定项目名称或路径
2. **选择语言**：支持 TypeScript 和 JavaScript
3. **自动生成项目**：创建完整的项目结构和配置文件

### 项目初始化

创建项目后，按照提示完成初始化：

```bash
cd your-project-name
git init  # 可选
npm install
npm run dev
```

## 📁 项目结构

生成的项目包含以下文件结构：

```
your-project-name/
├── src/
│   ├── rex-widget-env.d.ts    # 类型定义文件
│   └── index.ts                   # 主要逻辑文件
├── dist/                          # 构建输出目录
├── package.json                   # 项目配置
├── rslib.config.ts               # 构建配置
└── tsconfig.json                 # TypeScript 配置（TS 项目）
```

## 🛠️ 开发流程

### 开发模式

```bash
npm run dev
```

启动开发模式，支持文件监听和热重载。

### 构建项目

```bash
npm run build
```

构建生产环境的 Widget 包。

## 🎯 使用脚手架编写组件的优势

- [x] **完整的类型推断**：提供完整的 TypeScript 类型定义，包括 Widget API、环境变量等
- [x] **方便引入部分兼容的外部依赖**：预配置的构建工具支持现代 JavaScript 特性
- [x] **开箱即用的开发环境**：预配置 Rslib 构建工具，无需额外配置
- [x] **标准化的项目结构**：统一的项目结构，便于维护和协作
- [x] **热重载支持**：开发模式下支持文件监听和自动重新构建
- [x] **多语言支持**：同时支持 TypeScript 和 JavaScript 模板
- [x] **现代化构建工具**：基于 Rslib 的高性能构建配置
- [x] **环境变量管理**：内置环境变量类型定义和管理
- [x] **测试支持**：集成测试工具和模拟环境

## 📚 相关文档

- [Rex Widget 开发文档](https://github.com/your-org/rex-widget-docs)
- [@rexnow/libs](../libs/README.md) - 核心工具库
- [@rexnow/rslib-plugin](../rslib-plugin/README.md) - 构建插件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改善这个项目。

## 📄 许可证

MIT License