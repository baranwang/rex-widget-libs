import type { OptionalKind, PropertySignatureStructure, SourceFile } from 'ts-morph';
import { StructureKind } from 'ts-morph';
import { generateParamType, generateTypeName } from '../utils';

const VIDEO_LIST_IMPLICIT_FIELDS: ReadonlyArray<{ name: string; type: string; description: string }> = [
  { name: 'genreId', type: 'string', description: '分类/流派 ID' },
  { name: 'peopleId', type: 'string', description: '人物/歌手 ID' },
  { name: 'radioId', type: 'string', description: '电台 ID' },
  { name: 'section', type: "'albums' | 'songs' | 'artists' | 'profile' | (string & {})", description: '音乐分区' },
];

export interface VideoModuleGeneratorOptions {
  globalParamNames?: ReadonlySet<string>;
  isSearch?: boolean;
}

/**
 * 生成 Video / Person / Search 模块接口
 */
export function generateVideoModuleInterface(
  nameSpaceName: string,
  sourceFile: SourceFile,
  module: BaseWidgetModule,
  typeNames = generateTypeName(module),
  options: VideoModuleGeneratorOptions = {},
) {
  const { paramsTypeName, returnTypeName } = typeNames;
  const globalParamNames = options.globalParamNames ?? new Set<string>();
  const moduleParamNames = new Set((module.params ?? []).map((param) => param.name));
  const properties: OptionalKind<PropertySignatureStructure>[] = module.params?.map(generateParamType) ?? [];

  const extendsList = [`${nameSpaceName}.GlobalParams`];

  if (options.isSearch) {
    if (!globalParamNames.has('keyword') && !moduleParamNames.has('keyword')) {
      properties.unshift({
        name: 'keyword',
        type: 'string',
        docs: [
          {
            kind: StructureKind.JSDoc,
            description: '搜索关键词（由 Rex 注入）',
          },
        ],
      });
    }
  } else {
    const canExtendVideoListParams = VIDEO_LIST_IMPLICIT_FIELDS.every((field) => !globalParamNames.has(field.name));
    if (canExtendVideoListParams) {
      extendsList.push('VideoListParams');
    } else {
      for (const field of VIDEO_LIST_IMPLICIT_FIELDS) {
        if (!globalParamNames.has(field.name) && !moduleParamNames.has(field.name)) {
          properties.push({
            name: field.name,
            hasQuestionToken: true,
            type: field.type,
            docs: [
              {
                kind: StructureKind.JSDoc,
                description: field.description,
              },
            ],
          });
        }
      }
    }
  }

  sourceFile.addInterface({
    name: paramsTypeName,
    docs: [
      {
        kind: StructureKind.JSDoc,
        description: `Params of ${module.title}`,
      },
    ],
    extends: extendsList,
    properties,
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
