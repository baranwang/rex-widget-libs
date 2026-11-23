import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { type InterfaceDeclaration, Project, type SourceFile } from 'ts-morph';

/** Canary: ts-to-zod must not scan env test files (I4). */
// biome-ignore lint/correctness/noUnusedVariables: scanned-by-schema-gen canary
interface TsToZodShouldNotSeeThis {
  leaked: true;
}

const envDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvSource(fileName: string): SourceFile {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  return project.addSourceFileAtPath(path.join(envDir, fileName));
}

function getInterface(fileName: string, interfaceName: string): InterfaceDeclaration {
  return loadEnvSource(fileName).getInterfaceOrThrow(interfaceName);
}

function getPropertyTypeText(iface: InterfaceDeclaration, name: string): string {
  const property = iface.getProperty(name);
  expect(property).toBeDefined();

  if (property === undefined) {
    throw new Error(`missing property ${name}`);
  }

  const typeNode = property.getTypeNode();
  expect(typeNode).toBeDefined();

  if (typeNode === undefined) {
    throw new Error(`missing type node for ${name}`);
  }

  expect(property.hasQuestionToken()).toBe(true);
  return typeNode.getText();
}

test('WidgetMetadata declares icon aliases, contentType, continuousPlay, and search module', () => {
  const metadata = getInterface('metadata.ts', 'WidgetMetadata');

  expect(getPropertyTypeText(metadata, 'icon')).toBe('string');
  expect(getPropertyTypeText(metadata, 'iconurl')).toBe('string');
  expect(getPropertyTypeText(metadata, 'iconUrl')).toBe('string');
  expect(getPropertyTypeText(metadata, 'iconURL')).toBe('string');
  expect(getPropertyTypeText(metadata, 'contentType')).toBe('WidgetContentType');
  expect(getPropertyTypeText(metadata, 'continuousPlay')).toBe('boolean');
  expect(getPropertyTypeText(metadata, 'search')).toBe('WidgetSearchModule');

  const contentTypeText = loadEnvSource('metadata.ts')
    .getTypeAliasOrThrow('WidgetContentType')
    .getTypeNodeOrThrow()
    .getText();
  for (const contentType of ['video', 'music', 'audiobook', 'shortDrama']) {
    expect(contentTypeText).toContain(`'${contentType}'`);
  }
});

test('WidgetMetadata.i18n uses known Rex locales then string fallback', () => {
  const sourceFile = loadEnvSource('metadata.ts');
  const localeAlias = sourceFile.getTypeAliasOrThrow('WidgetI18nLocale');
  const localeNode = localeAlias.getTypeNode();
  expect(localeNode).toBeDefined();

  if (localeNode === undefined) {
    throw new Error('missing WidgetI18nLocale type node');
  }

  const localeText = localeNode.getText();
  for (const locale of ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'es', 'fr', 'pt-BR', 'ru', 'ar']) {
    expect(localeText.includes(`'${locale}'`) || localeText.includes(`"${locale}"`)).toBe(true);
  }
  expect(localeText).toContain('(string & {})');

  const metadata = getInterface('metadata.ts', 'WidgetMetadata');
  expect(getPropertyTypeText(metadata, 'i18n')).toBe('Partial<Record<WidgetI18nLocale, Record<string, string>>>');
});

test('WidgetModule supports video, person, danmu (including getCommentsWithSegmentTime), stream, and subtitle', () => {
  const baseModule = getInterface('metadata.ts', 'BaseWidgetModule');
  expect(getPropertyTypeText(baseModule, 'id')).toBe('string');
  expect(getPropertyTypeText(baseModule, 'subtitle')).toBe('string');
  expect(getPropertyTypeText(baseModule, 'iconurl')).toBe('string');
  expect(getPropertyTypeText(baseModule, 'iconUrl')).toBe('string');
  expect(getPropertyTypeText(baseModule, 'iconURL')).toBe('string');

  const videoModule = getInterface('metadata.ts', 'WidgetModuleVideo');
  expect(getPropertyTypeText(videoModule, 'type')).toBe("'video'");

  const personModule = getInterface('metadata.ts', 'WidgetModulePerson');
  expect(personModule.getProperty('type')?.hasQuestionToken()).toBe(false);
  expect(personModule.getProperty('type')?.getTypeNodeOrThrow().getText()).toBe("'person'");

  const danmuModule = getInterface('metadata.ts', 'WidgetModuleDanmu');
  const danmuIdText = danmuModule.getProperty('id')?.getTypeNodeOrThrow().getText() ?? '';
  expect(danmuIdText).toContain("'getCommentsWithSegmentTime'");
  expect(danmuIdText).toContain("'getDanmuWithSegmentTime'");
});

test('WidgetModuleParamType includes all 11 Rex param types and WidgetModuleParam supports startPage, belongTo array, and dynamicOptions', () => {
  const alias = loadEnvSource('metadata.ts').getTypeAliasOrThrow('WidgetModuleParamType');
  const typeNode = alias.getTypeNode();
  expect(typeNode).toBeDefined();

  if (typeNode === undefined) {
    throw new Error('missing WidgetModuleParamType type node');
  }

  const paramTypeText = typeNode.getText();
  for (const paramType of [
    'input',
    'constant',
    'enumeration',
    'count',
    'page',
    'offset',
    'language',
    'timezone',
    'folder',
    'userId',
    'configId',
  ]) {
    expect(paramTypeText.includes(`'${paramType}'`) || paramTypeText.includes(`"${paramType}"`)).toBe(true);
  }

  const param = getInterface('metadata.ts', 'WidgetModuleParam');
  expect(getPropertyTypeText(param, 'startPage')).toBe('number');
  expect(getPropertyTypeText(param, 'belongTo')).toBe('WidgetModuleParamBelongTo | WidgetModuleParamBelongTo[]');
  expect(getPropertyTypeText(param, 'dynamicOptions')).toBe('WidgetModuleParamDynamicOptions');
});

test('Rex 0.0.9 custom actions types and BaseWidgetModule.editActions match the official guide', () => {
  const baseModule = getInterface('metadata.ts', 'BaseWidgetModule');
  expect(getPropertyTypeText(baseModule, 'editActions')).toBe('WidgetAction[]');

  const action = getInterface('metadata.ts', 'WidgetAction');
  expect(action.getProperty('id')?.hasQuestionToken()).toBe(false);
  expect(action.getProperty('id')?.getTypeNodeOrThrow().getText()).toBe('string');
  expect(action.getProperty('title')?.hasQuestionToken()).toBe(false);
  expect(action.getProperty('title')?.getTypeNodeOrThrow().getText()).toBe('string');
  expect(action.getProperty('functionName')?.hasQuestionToken()).toBe(false);
  expect(action.getProperty('functionName')?.getTypeNodeOrThrow().getText()).toBe('string');

  const editParams = getInterface('metadata.ts', 'WidgetEditActionParams');
  expect(editParams.getProperty('actionId')?.hasQuestionToken()).toBe(false);
  expect(editParams.getProperty('actionId')?.getTypeNodeOrThrow().getText()).toBe('string');

  const itemParams = getInterface('metadata.ts', 'WidgetItemActionParams');
  expect(itemParams.getProperty('actionId')?.hasQuestionToken()).toBe(false);
  expect(itemParams.getProperty('actionId')?.getTypeNodeOrThrow().getText()).toBe('string');
  expect(itemParams.getProperty('itemId')?.hasQuestionToken()).toBe(false);
  expect(itemParams.getProperty('itemId')?.getTypeNodeOrThrow().getText()).toBe('string');

  const result = getInterface('metadata.ts', 'WidgetActionResult');
  expect(getPropertyTypeText(result, 'message')).toBe('string');
  expect(getPropertyTypeText(result, 'refresh')).toBe('boolean');
});
