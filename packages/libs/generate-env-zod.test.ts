import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@rstest/core';
import { generateEnvZodSource } from './generate-env-zod';

const envDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/env');

/** Emitted env.zod is TypeScript; Node eval needs the type annotations stripped. */
function asRuntimeJs(source: string): string {
  return source.replaceAll(': z.ZodTypeAny', '').replaceAll('(): z.ZodTypeAny =>', '() =>');
}

test('generated env.zod evaluates and has no empty imports or record.partial()', async () => {
  const source = generateEnvZodSource(envDir);

  expect(source).not.toMatch(/from ["']{2}/);
  expect(source).not.toMatch(/z\.record\([\s\S]*?\)\.partial\(\)/);
  expect(source).not.toContain('tsToZodShouldNotSeeThisSchema');
  expect(source).not.toMatch(/: z\.ZodSchema</);
  expect(source).toContain('export const videoItemSchema: z.ZodTypeAny = z.lazy((): z.ZodTypeAny =>');

  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp-env-zod-eval.js');
  fs.writeFileSync(file, asRuntimeJs(source));

  try {
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
    expect(mod.widgetMetadataSchema).toBeDefined();
    expect(() =>
      mod.widgetMetadataSchema.parse({
        id: 'demo',
        title: 'Demo',
        modules: [],
        i18n: { en: { hello: 'Hello' } },
      }),
    ).not.toThrow();
  } finally {
    fs.unlinkSync(file);
  }
});

test('widgetMetadataSchema accepts unknown i18n locale keys, 0.0.7 music metadata, dynamicOptions, and belongTo arrays', async () => {
  const source = generateEnvZodSource(envDir);
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp-env-zod-i18n.js');
  fs.writeFileSync(file, asRuntimeJs(source));

  try {
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
    const result = mod.widgetMetadataSchema.safeParse({
      id: 'rex.example.music',
      title: '音乐目录示例',
      version: '1.3.0',
      requiredVersion: '0.0.7',
      contentType: 'music',
      continuousPlay: true,
      iconUrl: 'https://example.com/icon.png',
      i18n: { de: { hello: 'Hallo' } },
      globalParams: [
        { name: 'tz', title: '时区', type: 'timezone' },
        { name: 'folder', title: '目录', type: 'folder' },
        { name: 'cfg', title: '配置', type: 'configId' },
      ],
      modules: [
        {
          id: 'musicGenres',
          title: '流派',
          subtitle: '按流派浏览',
          type: 'video',
          functionName: 'loadGenres',
          editActions: [{ id: 'refresh', title: '刷新流派', functionName: 'refreshGenres' }],
          params: [
            { name: 'page', title: '页码', type: 'page', startPage: 0 },
            {
              name: 'genre',
              title: '类型',
              type: 'enumeration',
              enumOptions: [{ title: '全部', value: '' }],
              dynamicOptions: { functionName: 'loadGenreOptions', dependsOn: ['tz'] },
              belongTo: [
                { paramName: 'tz', value: ['Asia/Shanghai'] },
                { paramName: 'folder', value: ['-1'] },
              ],
            },
          ],
        },
        {
          id: 'musicArtists',
          title: '歌手',
          type: 'person',
          functionName: 'loadArtists',
        },
        {
          id: 'getCommentsWithSegmentTime',
          title: '分段弹幕',
          type: 'danmu',
          functionName: 'loadSegmentComments',
        },
      ],
      search: {
        id: 'search',
        title: '搜索',
        functionName: 'search',
      },
    });
    expect(result.success).toBe(true);

    const mediaResult = mod.videoItemSchema.safeParse({
      id: 550,
      type: 'url',
      mediaType: 'album',
      title: '海岸线',
      subtitle: '林晨',
      rating: 8.6,
      coverRatio: 1,
      season: 1,
      albumMotionArtwork: 'https://example.com/motion.mp4',
      customHeaders: { Referer: 'https://example.com' },
      externalSubtitles: [{ url: 'https://example.com/zh.srt', title: '中文', language: 'zh-CN', isDefault: true }],
      actions: [{ id: 'favorite', title: '加入收藏', functionName: 'toggleFavorite' }],
      tracks: [
        {
          id: 'song-01',
          type: 'url',
          mediaType: 'song',
          title: '潮汐',
          videoUrl: 'https://example.com/1.mp3',
          actions: [{ id: 'like', title: '红心喜欢', functionName: 'toggleLike' }],
        },
      ],
    });
    expect(mediaResult.success).toBe(true);
  } finally {
    fs.unlinkSync(file);
  }
});
