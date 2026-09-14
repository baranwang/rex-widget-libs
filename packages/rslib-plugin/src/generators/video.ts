import type { SourceFile } from 'ts-morph';
import { StructureKind } from 'ts-morph';
import { generateParamType, generateTypeName } from '../utils';

/**
 * 生成 Video 模块接口
 */
export function generateVideoModuleInterface(
  nameSpaceName: string,
  sourceFile: SourceFile,
  module: WidgetModule,
  typeNames = generateTypeName(module),
) {
  const { paramsTypeName, returnTypeName } = typeNames;

  sourceFile.addInterface({
    name: paramsTypeName,
    docs: [
      {
        kind: StructureKind.JSDoc,
        description: `Params of ${module.title}`,
      },
    ],
    extends: [`${nameSpaceName}.GlobalParams`],
    properties: module.params?.map(generateParamType),
  });

  sourceFile.addInterface({
    name: returnTypeName,
    docs: [
      {
        kind: StructureKind.JSDoc,
        description: `Return Type of ${module.title}`,
      },
    ],
    extends: ['Array<VideoItem>'],
  });
}
