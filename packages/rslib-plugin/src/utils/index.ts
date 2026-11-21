import { camelCase, upperFirst } from 'es-toolkit';
import type { JSDocTagStructure, OptionalKind, PropertySignatureStructure, SourceFile } from 'ts-morph';
import { StructureKind, VariableDeclarationKind } from 'ts-morph';

/**
 * 大驼峰命名转换
 */
export const toPascalCase = (str: string): string => upperFirst(camelCase(str));

const VALID_IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;

function escapeSingleQuotes(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * 获取模块稳定标识（缺省 id 时回退到 functionName）
 */
export function getModuleId(module: BaseWidgetModule, fallback = 'module'): string {
  return module.id || module.functionName || fallback;
}

/**
 * 获取参数类型字符串
 */
function getParamTypeString(param: WidgetModuleParam): string {
  switch (param.type) {
    case 'enumeration':
      if (param.dynamicOptions) {
        return 'string';
      }
      return param.enumOptions?.length
        ? param.enumOptions.map((option) => `'${escapeSingleQuotes(option.value)}'`).join(' | ')
        : 'string';
    case 'constant':
      return param.value !== undefined ? `'${escapeSingleQuotes(param.value)}'` : 'undefined';
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

  if (param.value !== undefined) {
    tags.push({
      kind: StructureKind.JSDocTag,
      tagName: 'default',
      text: `'${escapeSingleQuotes(param.value)}'`,
    });
  }

  return {
    name: VALID_IDENTIFIER_RE.test(param.name) ? param.name : `'${escapeSingleQuotes(param.name)}'`,
    hasQuestionToken: param.belongTo !== undefined,
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

export function generateTypeName(module: BaseWidgetModule, distinct = false) {
  const moduleId = getModuleId(module);
  const paramsTypeName = distinct
    ? `${toPascalCase(moduleId)}${toPascalCase(module.functionName)}Params`
    : toPascalCase(`${module.functionName}Params`);
  const returnTypeName = distinct
    ? `${toPascalCase(moduleId)}${toPascalCase(module.functionName)}ReturnType`
    : toPascalCase(`${module.functionName}ReturnType`);
  return {
    paramsTypeName,
    returnTypeName,
  };
}

export function generateModuleFunctionType(sourceFile: SourceFile, module: BaseWidgetModule) {
  const { paramsTypeName, returnTypeName } = generateTypeName(module);
  const tags: JSDocTagStructure[] = [];

  const docDescription = module.description || module.subtitle;
  if (docDescription) {
    tags.push({
      kind: StructureKind.JSDocTag,
      tagName: 'description',
      text: docDescription,
    });
  }

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Let,
    hasDeclareKeyword: true,
    declarations: [
      {
        name: module.functionName,
        type: `(params: ${paramsTypeName}) => ${returnTypeName} | Promise<${returnTypeName}>`,
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
