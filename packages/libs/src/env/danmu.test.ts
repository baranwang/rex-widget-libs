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

test('BaseParams includes other type, optional title, and premiereDate', () => {
  const params = getInterface('common.ts', 'BaseParams');

  expect(getPropertyTypeText(params, 'type')).toBe("'tv' | 'movie' | 'other'");
  expect(getPropertyTypeText(params, 'title')).toBe('string');
  expect(params.getProperty('title')?.hasQuestionToken()).toBe(true);
  expect(getPropertyTypeText(params, 'premiereDate')).toBe('string');
  expect(params.getProperty('premiereDate')?.hasQuestionToken()).toBe(true);
});

test('AnimeItem and GetDetailResponseItem match official Rex danmu schemas', () => {
  const anime = getInterface('danmu.ts', 'AnimeItem');

  expect(getPropertyTypeText(anime, 'animeId')).toBe('string | number');
  expect(getPropertyTypeText(anime, 'animeTitle')).toBe('string');
  expect(getPropertyTypeText(anime, 'bangumiId')).toBe('string | number');
  expect(anime.getProperty('bangumiId')?.hasQuestionToken()).toBe(true);

  const episode = getInterface('danmu.ts', 'GetDetailResponseItem');
  expect(getPropertyTypeText(episode, 'episodeId')).toBe('string | number');
  expect(getPropertyTypeText(episode, 'episodeTitle')).toBe('string');
  expect(getPropertyTypeText(episode, 'episodeNumber')).toBe('string | number');
  expect(episode.getProperty('episodeNumber')?.hasQuestionToken()).toBe(true);
});

test('Danmu comments support comments object, danmuku tuples, bare array, XML string, and segment time params', () => {
  const sourceFile = loadEnvSource('danmu.ts');
  const commentItem = getInterface('danmu.ts', 'CommentItem');
  expect(getPropertyTypeText(commentItem, 'p')).toBe('string');

  const commentTuple = sourceFile.getTypeAliasOrThrow('CommentTuple');
  expect(commentTuple.getTypeNodeOrThrow().getText()).toBe(
    '[number, string | number, string | number, string, string]',
  );

  const response = getInterface('danmu.ts', 'GetCommentsResponse');
  expect(response.getProperty('count')?.hasQuestionToken()).toBe(true);
  expect(getPropertyTypeText(response, 'comments')).toBe('Array<CommentItem | CommentTuple>');

  const resultAlias = sourceFile.getTypeAliasOrThrow('DanmuCommentsResult');
  expect(resultAlias.getTypeNodeOrThrow().getText()).toBe(
    'GetCommentsResponse | DanmukuCommentsResponse | CommentItem[] | string',
  );

  const segmentParams = getInterface('danmu.ts', 'GetCommentsWithSegmentTimeParams');
  expect(getPropertyTypeText(segmentParams, 'segmentTime')).toBe('string | number');
});
