import type { SourceFile } from 'ts-morph';
import { StructureKind } from 'ts-morph';
import { generateParamType, generateTypeName } from '../utils';

/**
 * 生成弹幕模块接口
 */
export function generateDanmuModuleInterfaces(
  nameSpaceName: string,
  sourceFile: SourceFile,
  module: WidgetModule,
  typeNames = generateTypeName(module),
) {
  if (module.type !== 'danmu') {
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
      if (id === 'getDetail') {
        writer.write(', AnimeItem');
      }
      if (id === 'getComments') {
        writer.write(', EpisodeItem');
      }
      if (id === 'getCommentsWithSegmentTime') {
        writer.write(', GetCommentsWithSegmentTimeParams');
      }
      if (id === 'getDanmuWithSegmentTime') {
        writer.write(', GetDanmuWithSegmentTimeParams');
      }
    },
    properties: module.params?.map(generateParamType),
  });

  if (id === 'getComments' || id === 'getCommentsWithSegmentTime' || id === 'getDanmuWithSegmentTime') {
    sourceFile.addTypeAlias({
      name: returnTypeName,
      type: 'DanmuCommentsResult',
    });
    return;
  }

  // 生成返回类型接口
  sourceFile.addInterface({
    name: returnTypeName,
    extends: id === 'getDetail' ? ['Array<GetDetailResponseItem>'] : undefined,
    properties:
      id === 'searchDanmu'
        ? [
            {
              name: 'animes',
              type: 'Array<AnimeItem>',
            },
          ]
        : [],
  });
}
