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
  expect(getPropertyTypeText(trailer, 'videoUrl')).toBe('string');
  expect(getPropertyTypeText(trailer, 'url')).toBe('string');
  expect(trailer.getProperty('coverUrl')?.hasQuestionToken()).toBe(true);
  expect(trailer.getProperty('videoUrl')?.hasQuestionToken()).toBe(true);
  expect(trailer.getProperty('url')?.hasQuestionToken()).toBe(true);
});

test('VideoItemChild includes official media, person, music, and playback fields', () => {
  const child = getInterface('VideoItemChild');

  expect(getPropertyTypeText(child, 'id')).toBe('string | number');
  expect(getPropertyTypeText(child, 'type')).toBe(
    "'url' | 'detail' | 'douban' | 'imdb' | 'tmdb' | 'forward' | 'person'",
  );
  expect(getPropertyTypeText(child, 'subtitle')).toBe('string');
  expect(getPropertyTypeText(child, 'coverUrl')).toBe('string');
  expect(getPropertyTypeText(child, 'coverRatio')).toBe('number');
  expect(getPropertyTypeText(child, 'detailPoster')).toBe('string');
  expect(getPropertyTypeText(child, 'mediaType')).toBe('MediaType');
  expect(getPropertyTypeText(child, 'rating')).toBe('number | string');
  expect(getPropertyTypeText(child, 'genreItems')).toBe('GenreItem[]');
  expect(getPropertyTypeText(child, 'peoples')).toBe('PersonItem[]');
  expect(getPropertyTypeText(child, 'avatar')).toBe('string');
  expect(getPropertyTypeText(child, 'role')).toBe('string');
  expect(getPropertyTypeText(child, 'language')).toBe('string');
  expect(getPropertyTypeText(child, 'albumMotionArtwork')).toBe('string');
  expect(getPropertyTypeText(child, 'trailers')).toBe('TrailerItem[]');
  expect(getPropertyTypeText(child, 'backdropPaths')).toBe('string[]');
  expect(getPropertyTypeText(child, 'season')).toBe('number | string');
  expect(getPropertyTypeText(child, 'customHeaders')).toBe('Record<string, string>');
  expect(getPropertyTypeText(child, 'headers')).toBe('Record<string, string>');
  expect(getPropertyTypeText(child, 'externalSubtitles')).toBe('ExternalSubtitleItem[]');
  expect(getPropertyTypeText(child, 'link')).toBe('string');
  expect(getPropertyTypeText(child, 'actions')).toBe('WidgetAction[]');

  const mediaTypeText = loadEnvSource('video.ts').getTypeAliasOrThrow('MediaType').getTypeNodeOrThrow().getText();
  for (const mediaType of ['tv', 'movie', 'person', 'album', 'song', 'playlist', 'albumList', 'genre', 'radio']) {
    expect(mediaTypeText).toContain(`'${mediaType}'`);
  }

  for (const optionalField of [
    'subtitle',
    'coverUrl',
    'coverRatio',
    'detailPoster',
    'genreItems',
    'peoples',
    'avatar',
    'role',
    'language',
    'albumMotionArtwork',
    'trailers',
    'backdropPaths',
    'season',
    'customHeaders',
    'headers',
    'externalSubtitles',
    'link',
    'actions',
  ]) {
    expect(child.getProperty(optionalField)?.hasQuestionToken()).toBe(true);
  }
});

test('VideoItem adds episodeItems, tracks, and relatedItems', () => {
  const item = getInterface('VideoItem');

  expect(getPropertyTypeText(item, 'episodeItems')).toBe('VideoItem[]');
  expect(getPropertyTypeText(item, 'tracks')).toBe('VideoItem[]');
  expect(getPropertyTypeText(item, 'relatedItems')).toBe('VideoItem[]');
  expect(item.getProperty('episodeItems')?.hasQuestionToken()).toBe(true);
  expect(item.getProperty('tracks')?.hasQuestionToken()).toBe(true);
  expect(item.getProperty('relatedItems')?.hasQuestionToken()).toBe(true);
});

test('loadDetail supports sync or async VideoItem or VideoItem[] without null', () => {
  const loadDetail = loadEnvSource('video.ts').getVariableDeclarationOrThrow('loadDetail');
  const typeNode = loadDetail.getTypeNode();
  expect(typeNode).toBeDefined();

  if (typeNode === undefined) {
    throw new Error('missing loadDetail type node');
  }

  expect(typeNode.getText()).toBe('(link: string) => VideoItem | VideoItem[] | Promise<VideoItem | VideoItem[]>');
});

test('VideoListParams carries implicit genreId, peopleId, radioId, and section', () => {
  const params = getInterface('VideoListParams');

  expect(getPropertyTypeText(params, 'genreId')).toBe('string');
  expect(getPropertyTypeText(params, 'peopleId')).toBe('string');
  expect(getPropertyTypeText(params, 'radioId')).toBe('string');
  expect(getPropertyTypeText(params, 'section')).toContain("'albums'");
  expect(getPropertyTypeText(params, 'section')).toContain("'songs'");
  expect(getPropertyTypeText(params, 'section')).toContain("'artists'");
  expect(getPropertyTypeText(params, 'section')).toContain("'profile'");
  expect(params.getProperty('genreId')?.hasQuestionToken()).toBe(true);
  expect(params.getProperty('peopleId')?.hasQuestionToken()).toBe(true);
  expect(params.getProperty('radioId')?.hasQuestionToken()).toBe(true);
  expect(params.getProperty('section')?.hasQuestionToken()).toBe(true);
});
