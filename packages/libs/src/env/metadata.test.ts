import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { Project, type InterfaceDeclaration, type SourceFile } from 'ts-morph';

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

test('WidgetMetadata declares icon and iconurl as one optional icon field', () => {
  const metadata = getInterface('metadata.ts', 'WidgetMetadata');

  expect(getPropertyTypeText(metadata, 'icon')).toBe('string');
  expect(getPropertyTypeText(metadata, 'iconurl')).toBe('string');
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
  for (const locale of ['"en"', '"zh-Hans"', '"zh-Hant"', '"ja"', '"ko"', '"es"', '"fr"', '"pt-BR"', '"ru"', '"ar"']) {
    expect(localeText).toContain(locale);
  }
  expect(localeText).toContain('(string & {})');

  const metadata = getInterface('metadata.ts', 'WidgetMetadata');
  expect(getPropertyTypeText(metadata, 'i18n')).toBe('Partial<Record<WidgetI18nLocale, Record<string, string>>>');
});

test('WidgetModuleParamType includes userId', () => {
  const alias = loadEnvSource('metadata.ts').getTypeAliasOrThrow('WidgetModuleParamType');
  const typeNode = alias.getTypeNode();
  expect(typeNode).toBeDefined();

  if (typeNode === undefined) {
    throw new Error('missing WidgetModuleParamType type node');
  }

  expect(typeNode.getText()).toContain('"userId"');
});
