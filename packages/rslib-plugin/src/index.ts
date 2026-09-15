import fs from "node:fs";
import path from "node:path";
import { widgetMetadataSchema } from "@rexnow/libs/env.zod";
import type { RsbuildPlugin, RsbuildPluginAPI, Rspack } from "@rsbuild/core";
import { camelCase, upperFirst } from "es-toolkit";
import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { encryptWidgetSource } from "./encrypt";
import { generateDanmuModuleInterfaces } from "./generators/danmu";
import { generateStreamModuleInterface } from "./generators/stream";
import { generateSubtitleModuleInterface } from "./generators/subtitle";
import { generateVideoModuleInterface } from "./generators/video";
import { generateModuleFunctionType, generateParamType, generateTypeName } from "./utils";

// 类型定义
interface RexWidgetPluginOptions {
  /**
   * 生成的 dts 文件路径
   * @default `src/rex-widget-env.d.ts`
   */
  typesFilePath?: string;

  /**
   * 监听端口
   * @default 8000
   */
  devPort?: number;

  /**
   * 生产构建后调用 Rex 加密服务，将 JS 产物写成 REXENC 格式。
   * watch / 开发监听时不会加密。
   * @default false
   */
  encrypt?: boolean;
}

// Rslib ESM 会把 `export const WidgetMetadata` 打成 `const WidgetMetadata = …`。
// 解析时再包一层 `let WidgetMetadata` 会 SyntaxError: already been declared。
function toExecutableWidgetMetadataSource(content: string): string {
  return content.replace(/\b(?:export\s+)?(?:const|let|var)\s+WidgetMetadata\b/g, 'WidgetMetadata');
}

const parseTimeWidgetRequest = async () => ({
  data: undefined,
  statusCode: 0,
  headers: {},
});

/**
 * 解析 WidgetMetadata 时注入的 Rex 宿主全局 Widget。
 * 避免用户代码在模块顶层使用 Widget 时抛出 ReferenceError。
 */
function createParseTimeWidget() {
  return {
    http: {
      get: parseTimeWidgetRequest,
      post: parseTimeWidgetRequest,
      request: parseTimeWidgetRequest,
    },
    tmdb: {
      get: async () => undefined,
    },
    html: {
      load: async () => undefined,
    },
    storage: {
      get: async () => null,
      set: async () => undefined,
      remove: async () => undefined,
      keys: async () => [],
      clear: async () => undefined,
    },
    sharedCache: {
      get: () => null,
      set: () => undefined,
      remove: () => undefined,
    },
  };
}

// 元数据解析工具
function safeParseWidgetMetadataFactory(api: RsbuildPluginAPI) {
  /**
   * 安全地解析 WidgetMetadata 对象
   */
  return (content: string): WidgetMetadata | null => {
    try {
      // 创建安全的执行环境
      const sandbox = { WidgetMetadata: null as WidgetMetadata | null };
      const func = new Function(
        "sandbox",
        "Widget",
        `
        let WidgetMetadata;
        ${toExecutableWidgetMetadataSource(content)};
        sandbox.WidgetMetadata = WidgetMetadata;
      `,
      );

      func(sandbox, createParseTimeWidget());

      if (!sandbox.WidgetMetadata) {
        return null;
      }
      const { data, success, error } = widgetMetadataSchema.safeParse(sandbox.WidgetMetadata);
      if (!success) {
        api.logger.error("解析 WidgetMetadata 失败，跳过类型生成", error);
        return null;
      }
      return data;
    } catch (error) {
      api.logger.error("解析 WidgetMetadata 失败，跳过类型生成", error);
      return null;
    }
  };
}

// 类型生成工具
/**
 * 生成函数类型工厂函数
 */
function generateFunctionTypesFactory(api: RsbuildPluginAPI, sourceFile: SourceFile) {
  const safeParseWidgetMetadata = safeParseWidgetMetadataFactory(api);

  return async (entry: string): Promise<void> => {
    try {
      const content = await fs.promises.readFile(entry, "utf-8");
      const widgetMetadataObject = safeParseWidgetMetadata(content);

      if (!widgetMetadataObject) {
        return;
      }
      const nameSpaceName = upperFirst(camelCase(widgetMetadataObject.id));
      const nameSpace = sourceFile.addModule({
        name: nameSpaceName,
        hasDeclareKeyword: true,
      });
      nameSpace.addInterface({
        name: "GlobalParams",
        properties: widgetMetadataObject.globalParams?.map(generateParamType) || [],
      });

      generateModuleInterfaces(nameSpaceName, sourceFile, widgetMetadataObject.modules);
    } catch (error) {
      api.logger.error(`生成函数类型失败: ${entry}`, error);
    }
  };
}

function generateModuleInterfaces(nameSpaceName: string, sourceFile: SourceFile, modules: WidgetModule[]): void {
  const modulesByFunctionName = new Map<string, WidgetModule[]>();
  for (const module of modules) {
    const group = modulesByFunctionName.get(module.functionName);
    if (group) {
      group.push(module);
    } else {
      modulesByFunctionName.set(module.functionName, [module]);
    }
  }

  for (const module of modules) {
    const { id, type: moduleType } = module;
    const shared = (modulesByFunctionName.get(module.functionName)?.length ?? 0) > 1;
    const typeNames = generateTypeName(module, shared);

    // 添加区域注释
    sourceFile.addStatements(`\n//#region ${id}`);

    switch (moduleType) {
      case "danmu":
        generateDanmuModuleInterfaces(nameSpaceName, sourceFile, module, typeNames);
        break;
      case "stream":
        generateStreamModuleInterface(nameSpaceName, sourceFile, module, typeNames);
        break;
      case "subtitle":
        generateSubtitleModuleInterface(nameSpaceName, sourceFile, module, typeNames);
        break;
      default:
        // 没有 type 或 type 不是 'danmu' 的都是 video 类型
        generateVideoModuleInterface(nameSpaceName, sourceFile, module, typeNames);
        break;
    }

    if (!shared) {
      generateModuleFunctionType(sourceFile, module);
    }

    sourceFile.addStatements(`//#endregion ${id}`);
  }

  for (const group of modulesByFunctionName.values()) {
    if (group.length < 2) {
      continue;
    }

    const { paramsTypeName, returnTypeName } = generateTypeName(group[0]);
    sourceFile.addTypeAlias({
      name: paramsTypeName,
      type: group.map((module) => generateTypeName(module, true).paramsTypeName).join(" | "),
    });
    sourceFile.addTypeAlias({
      name: returnTypeName,
      type: group.map((module) => generateTypeName(module, true).returnTypeName).join(" | "),
    });
    generateModuleFunctionType(sourceFile, group[0]);
  }
}

// 文件处理工具
/**
 * 清除导出声明
 * @description Rex Widget 不支持脚本有导出声明
 */
async function clearExportDeclaration(distPath: string): Promise<void> {
  if (!fs.existsSync(distPath)) {
    return;
  }

  try {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(distPath);

    const exportStatements = sourceFile
      .getStatements()
      .filter((statement) => statement.getKind() === SyntaxKind.ExportDeclaration);

    exportStatements.forEach((statement) => {
      statement.remove();
    });

    if (exportStatements.length > 0) {
      await sourceFile.save();
    }
  } catch (error) {
    console.error(`清除导出声明失败: ${distPath}`, error);
  }
}

// WidgetMetadata = {} 加空格
async function addSpaceToWidgetMetadata(distPath: string): Promise<void> {
  if (!fs.existsSync(distPath)) {
    return;
  }

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(distPath);
  const insertions: { pos: number; text: string }[] = [];

  const fullText = sourceFile.getFullText();

  for (const be of sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
    // 必须是等号
    if (be.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) continue;

    // 左侧必须是 Identifier 且为 WidgetMetadata
    const left = be.getLeft();
    if (!Node.isIdentifier(left) || left.getText() !== "WidgetMetadata") continue;

    const eq = be.getOperatorToken();
    const start = eq.getStart();
    const end = eq.getEnd();

    const beforeCh = start > 0 ? fullText[start - 1] : "";
    const afterCh = end < fullText.length ? fullText[end] : "";

    // 无空格/制表符则补一个空格
    if (beforeCh !== " " && beforeCh !== "\t") {
      insertions.push({ pos: start, text: " " });
    }
    if (afterCh !== " " && afterCh !== "\t") {
      insertions.push({ pos: end, text: " " });
    }
  }

  // 统一从右往左插入，避免偏移
  insertions
    .sort((a, b) => b.pos - a.pos)
    .forEach(({ pos, text }) => {
      sourceFile.insertText(pos, text);
    });

  await sourceFile.save();
}

// 构建处理工具
async function encryptOutputFiles(api: RsbuildPluginAPI, outputFiles: string[]): Promise<void> {
  const jsFiles = outputFiles.filter((file) => file.endsWith(".js"));

  for (const file of jsFiles) {
    const source = await fs.promises.readFile(file, "utf-8");
    api.logger.info(`正在加密 ${path.basename(file)}…`);
    const encrypted = await encryptWidgetSource(source);
    await fs.promises.writeFile(file, encrypted);
    api.logger.info(`已加密 ${path.basename(file)}`);
  }
}

/**
 * 处理构建后的逻辑
 */
async function processAfterBuild(
  api: RsbuildPluginAPI,
  stats: Rspack.Stats | Rspack.MultiStats | undefined,
  dtsPath: string,
  options: { encrypt?: boolean; isWatch?: boolean } = {},
): Promise<void> {
  const outputFiles = getOutputFiles(api, stats);

  if (!outputFiles.length) {
    api.logger.warn("未找到输出文件，跳过类型生成");
    return;
  }

  const typeDefFile = await setupTypeDefinitionFile(dtsPath);

  const generateWidgetTypes = generateFunctionTypesFactory(api, typeDefFile);

  // 并行处理输出文件
  await Promise.all(
    outputFiles.map(async (outputFile) => {
      await clearExportDeclaration(outputFile);
      await addSpaceToWidgetMetadata(outputFile);
      await generateWidgetTypes(outputFile);
    }),
  );

  await typeDefFile.save();

  if (options.encrypt && !options.isWatch) {
    await encryptOutputFiles(api, outputFiles);
  }
}

function getOutputFiles(api: RsbuildPluginAPI, stats: Rspack.Stats | Rspack.MultiStats | undefined): string[] {
  const buildStats = stats?.toJson({ assets: true, outputPath: true });
  const outputDir = buildStats?.outputPath || api.context.distPath;
  const outputFiles = buildStats?.assets?.map((asset) => path.resolve(outputDir, asset.name));

  return outputFiles?.filter((file) => fs.existsSync(file)) || [];
}

async function setupTypeDefinitionFile(dtsPath: string): Promise<SourceFile> {
  const dtsProject = new Project();
  let typeDefFile: SourceFile;

  if (fs.existsSync(dtsPath)) {
    typeDefFile = dtsProject.addSourceFileAtPath(dtsPath);
    typeDefFile.removeStatements([0, typeDefFile.getStatementsWithComments().length]);
  } else {
    typeDefFile = dtsProject.createSourceFile(dtsPath, "");
  }

  typeDefFile.insertText(0, `/// <reference types='@rexnow/libs/env' />\n\n`);

  return typeDefFile;
}

// 主插件导出
export const pluginRexWidget = ({
  typesFilePath = "src/rex-widget-env.d.ts",
  devPort = 8000,
  encrypt = false,
}: RexWidgetPluginOptions = {}): RsbuildPlugin => ({
  name: "plugin-rex-widget",

  setup(api) {
    const dtsPath = path.resolve(api.context.rootPath, typesFilePath);

    // 添加类型文件依赖
    api.transform({ test: "/.ts$/" }, ({ code, addDependency }) => {
      addDependency(dtsPath);
      return code;
    });

    api.onAfterBuild(async ({ stats, isWatch, isFirstCompile }) => {
      try {
        await processAfterBuild(api, stats, dtsPath, { encrypt, isWatch });
      } catch (error) {
        api.logger.error("Rex Widget 插件处理失败", error);
        if (encrypt && !isWatch) {
          throw error;
        }
      }

      try {
        if (isWatch && isFirstCompile) {
          const { createDevServer } = await import("./dev-server");

          await createDevServer({
            api,
            port: devPort,
          });
        }
      } catch (error) {
        api.logger.error("Rex Widget 插件开发服务器启动失败", error);
      }
    });
  },
});
