import type { SourceFile, WriterFunction } from "ts-morph";
import { StructureKind } from "ts-morph";
import { generateTypeName } from "../utils";

/**
 * 获取弹幕模块的返回类型扩展
 */
function getReturnTypeExtends(moduleId: string): WriterFunction | undefined {
  switch (moduleId) {
    case "getDetail":
      return (writer) => writer.write("Array<GetDetailResponseItem>");
    case "getComments":
      return (writer) => writer.write("GetCommentsResponse");
    case "getDanmuWithSegmentTime":
      return (writer) => writer.write("GetDanmuWithSegmentTimeResponse");
    default:
      return undefined;
  }
}

/**
 * 生成弹幕模块接口
 */
export function generateDanmuModuleInterfaces(
  nameSpaceName: string,
  sourceFile: SourceFile,
  module: WidgetModule,
  typeNames = generateTypeName(module),
) {
  if (module.type !== "danmu") {
    return;
  }

  const { id, title } = module;
  const { paramsTypeName, returnTypeName } = typeNames;

  sourceFile.addInterface({
    name: paramsTypeName,
    docs: [
      {
        kind: StructureKind.JSDoc,
        description: `Params of ${title}`,
      },
    ],
    extends: (writer) => {
      writer.write(`${nameSpaceName}.GlobalParams, BaseParams`);
      if (id === "getDetail") {
        writer.write(", AnimeItem");
      }
      if (id === "getComments") {
        writer.write(", EpisodeItem");
      }
      if (id === "getDanmuWithSegmentTime") {
        writer.write(", GetDanmuWithSegmentTimeParams");
      }
    },
  });

  // 生成返回类型接口
  sourceFile.addInterface({
    name: returnTypeName,
    extends: getReturnTypeExtends(id),
    properties:
      id === "searchDanmu"
        ? [
            {
              name: "animes",
              type: "Array<AnimeItem>",
            },
          ]
        : [],
  });
}
