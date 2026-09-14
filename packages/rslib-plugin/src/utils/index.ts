import { camelCase, upperFirst } from 'es-toolkit';
import type { JSDocTagStructure, OptionalKind, PropertySignatureStructure, SourceFile } from 'ts-morph';
import { StructureKind, VariableDeclarationKind } from 'ts-morph';

/**
 * 大驼峰命名转换
 */
export const toPascalCase = (str: string): string => upperFirst(camelCase(str));

/**
 * 获取参数类型字符串
 */
function getParamTypeString(param: WidgetModuleParam): string {
  switch (param.type) {
    case 'enumeration':
      return param.enumOptions?.map((option) => `'${option.value}'`).join(' | ') || 'string';
    case 'constant':
      return param.value ? `'${param.value}'` : 'undefined';
    default:
      return 'string';
  }
}

/**
 * 生成参数类型
 */
export function generateParamType(param: WidgetModuleParam): OptionalKind<PropertySignatureStructure> {
  const type = getParamTypeString(param);
  const tags: JSDocTagStructure[] = [];

  if (param.description) {
    tags.push({
      kind: StructureKind.JSDocTag,
      tagName: 'description',
      text: param.description,
    });
  }

  if (param.value) {
    tags.push({
      kind: StructureKind.JSDocTag,
      tagName: 'default',
      text: `'${param.value}'`,
    });
  }

  return {
    name: param.name.includes('.') ? `'${param.name}'` : param.name,
    type,
    docs: [
      {
        kind: StructureKind.JSDoc,
        description: param.title,
        tags,
      },
    ],
  };
}

export function generateTypeName(module: WidgetModule, distinct = false) {
  const paramsTypeName = distinct
    ? `${toPascalCase(module.id)}${toPascalCase(module.functionName)}Params`
    : toPascalCase(`${module.functionName}Params`);
  const returnTypeName = distinct
    ? `${toPascalCase(module.id)}${toPascalCase(module.functionName)}ReturnType`
    : toPascalCase(`${module.functionName}ReturnType`);
  return {
    paramsTypeName,
    returnTypeName,
  };
}

export function generateModuleFunctionType(sourceFile: SourceFile, module: WidgetModule) {
  const { paramsTypeName, returnTypeName } = generateTypeName(module);
  const tags: JSDocTagStructure[] = [];

  if (module.description) {
    tags.push({
      kind: StructureKind.JSDocTag,
      tagName: 'description',
      text: module.description,
    });
  }

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Let,
    hasDeclareKeyword: true,
    declarations: [
      {
        name: module.functionName,
        type: `(params: ${paramsTypeName}) => ${returnTypeName} | null | Promise<${returnTypeName} | null>`,
      },
    ],
    docs: [
      {
        kind: StructureKind.JSDoc,
        description: module.title,
        tags,
      },
    ],
  });
}
