import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { type InterfaceDeclaration, Project, type SourceFile } from 'ts-morph';

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

  return typeNode.getText();
}

test('BaseParams includes premiereDate', () => {
  const params = getInterface('common.ts', 'BaseParams');

  expect(getPropertyTypeText(params, 'premiereDate')).toBe('string');
  expect(params.getProperty('premiereDate')?.hasQuestionToken()).toBe(true);
});

test('AnimeItem includes bangumiId from official search results', () => {
  const anime = getInterface('danmu.ts', 'AnimeItem');

  expect(getPropertyTypeText(anime, 'animeId')).toBe('string | number');
  expect(getPropertyTypeText(anime, 'animeTitle')).toBe('string');
  expect(getPropertyTypeText(anime, 'bangumiId')).toBe('string | number');
  expect(anime.getProperty('bangumiId')?.hasQuestionToken()).toBe(true);
});

test('GetCommentsResponse comments accept object format and tuple format', () => {
  const commentTuple = loadEnvSource('danmu.ts').getTypeAliasOrThrow('CommentTuple');
  const tupleNode = commentTuple.getTypeNode();
  expect(tupleNode).toBeDefined();

  if (tupleNode === undefined) {
    throw new Error('missing CommentTuple type node');
  }

  expect(tupleNode.getText()).toBe('[number, string, string, string, string]');

  const response = getInterface('danmu.ts', 'GetCommentsResponse');
  expect(getPropertyTypeText(response, 'comments')).toBe('Array<CommentItem | CommentTuple>');
});
