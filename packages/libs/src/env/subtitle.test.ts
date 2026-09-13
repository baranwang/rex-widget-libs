import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { type InterfaceDeclaration, Project, type SourceFile } from 'ts-morph';

const envDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvSource(): SourceFile {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  return project.addSourceFileAtPath(path.join(envDir, 'subtitle.ts'));
}

function getInterface(interfaceName: string): InterfaceDeclaration {
  return loadEnvSource().getInterfaceOrThrow(interfaceName);
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

  return typeNode.getText();
}

test('SubtitleArchiveFile describes an extracted archive entry', () => {
  const file = getInterface('SubtitleArchiveFile');

  expect(getPropertyTypeText(file, 'path')).toBe('string');
  expect(getPropertyTypeText(file, 'name')).toBe('string');
  expect(getPropertyTypeText(file, 'extension')).toBe('string');
  expect(getPropertyTypeText(file, 'size')).toBe('number');
  expect(file.getProperty('path')?.hasQuestionToken()).toBe(false);
  expect(file.getProperty('name')?.hasQuestionToken()).toBe(false);
  expect(file.getProperty('extension')?.hasQuestionToken()).toBe(false);
  expect(file.getProperty('size')?.hasQuestionToken()).toBe(true);
});

test('ResolveSubtitleArchiveParams matches the client hook payload', () => {
  const params = getInterface('ResolveSubtitleArchiveParams');

  expect(getPropertyTypeText(params, 'archiveName')).toBe('string');
  expect(getPropertyTypeText(params, 'archiveUrl')).toBe('string');
  expect(getPropertyTypeText(params, 'subtitleId')).toBe('string');
  expect(getPropertyTypeText(params, 'subtitleName')).toBe('string');
  expect(getPropertyTypeText(params, 'subtitleLanguage')).toBe('string');
  expect(getPropertyTypeText(params, 'files')).toBe('string');
  expect(getPropertyTypeText(params, 'subtitleFiles')).toBe('string');

  for (const name of [
    'archiveName',
    'archiveUrl',
    'subtitleId',
    'subtitleName',
    'subtitleLanguage',
    'files',
    'subtitleFiles',
  ]) {
    expect(params.getProperty(name)?.hasQuestionToken()).toBe(true);
  }
});

test('ResolveSubtitleArchiveResult allows path, paths, object forms, or null', () => {
  const alias = loadEnvSource().getTypeAliasOrThrow('ResolveSubtitleArchiveResult');
  const typeNode = alias.getTypeNode();
  expect(typeNode).toBeDefined();

  if (typeNode === undefined) {
    throw new Error('missing ResolveSubtitleArchiveResult type node');
  }

  expect(typeNode.getText()).toBe('string | string[] | { path: string } | { files: string[] } | null');
});

test('resolveSubtitleArchive is a top-level async-capable hook', () => {
  const decl = loadEnvSource().getVariableDeclarationOrThrow('resolveSubtitleArchive');
  const typeNode = decl.getTypeNode();
  expect(typeNode).toBeDefined();

  if (typeNode === undefined) {
    throw new Error('missing resolveSubtitleArchive type node');
  }

  expect(typeNode.getText().replace(/,/g, '').replace(/\s+/g, '')).toBe(
    '(params:ResolveSubtitleArchiveParams)=>ResolveSubtitleArchiveResult|Promise<ResolveSubtitleArchiveResult>',
  );
});
