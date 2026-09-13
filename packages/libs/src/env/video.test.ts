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

function getInterface(interfaceName: string): InterfaceDeclaration {
  return loadEnvSource('video.ts').getInterfaceOrThrow(interfaceName);
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

test('GenreItem, PersonItem, and TrailerItem match the official detail models', () => {
  const genre = getInterface('GenreItem');
  expect(getPropertyTypeText(genre, 'id')).toBe('string');
  expect(getPropertyTypeText(genre, 'title')).toBe('string');

  const person = getInterface('PersonItem');
  expect(getPropertyTypeText(person, 'id')).toBe('string');
  expect(getPropertyTypeText(person, 'title')).toBe('string');
  expect(getPropertyTypeText(person, 'avatar')).toBe('string');
  expect(getPropertyTypeText(person, 'role')).toBe('string');
  expect(person.getProperty('avatar')?.hasQuestionToken()).toBe(true);
  expect(person.getProperty('role')?.hasQuestionToken()).toBe(true);

  const trailer = getInterface('TrailerItem');
  expect(getPropertyTypeText(trailer, 'coverUrl')).toBe('string');
  expect(getPropertyTypeText(trailer, 'url')).toBe('string');
  expect(trailer.getProperty('coverUrl')?.hasQuestionToken()).toBe(true);
  expect(trailer.getProperty('url')?.hasQuestionToken()).toBe(false);
});

test('VideoItemChild includes official cover fields and nested models', () => {
  const child = getInterface('VideoItemChild');

  expect(getPropertyTypeText(child, 'type')).toBe("'url' | 'detail' | 'douban' | 'imdb' | 'tmdb' | 'forward'");
  expect(getPropertyTypeText(child, 'coverUrl')).toBe('string');
  expect(getPropertyTypeText(child, 'detailPoster')).toBe('string');
  expect(getPropertyTypeText(child, 'genreItems')).toBe('GenreItem[]');
  expect(getPropertyTypeText(child, 'peoples')).toBe('PersonItem[]');
  expect(getPropertyTypeText(child, 'trailers')).toBe('TrailerItem[]');
  expect(getPropertyTypeText(child, 'backdropPaths')).toBe('string[]');

  expect(child.getProperty('coverUrl')?.hasQuestionToken()).toBe(true);
  expect(child.getProperty('detailPoster')?.hasQuestionToken()).toBe(true);
  expect(child.getProperty('genreItems')?.hasQuestionToken()).toBe(true);
  expect(child.getProperty('peoples')?.hasQuestionToken()).toBe(true);
  expect(child.getProperty('trailers')?.hasQuestionToken()).toBe(true);
  expect(child.getProperty('backdropPaths')?.hasQuestionToken()).toBe(true);
});

test('VideoItem adds episodeItems and relatedItems', () => {
  const item = getInterface('VideoItem');

  expect(getPropertyTypeText(item, 'episodeItems')).toBe('VideoItem[]');
  expect(getPropertyTypeText(item, 'relatedItems')).toBe('VideoItem[]');
  expect(item.getProperty('episodeItems')?.hasQuestionToken()).toBe(true);
  expect(item.getProperty('relatedItems')?.hasQuestionToken()).toBe(true);
});
