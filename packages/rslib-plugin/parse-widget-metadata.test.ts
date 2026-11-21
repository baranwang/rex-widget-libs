import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { RsbuildPluginAPI, Rspack } from '@rsbuild/core';
import { afterEach, expect, test } from '@rstest/core';
import { pluginRexWidget } from './src/index';

function assertDtsTypechecks(dts: string) {
  const dir = fs.mkdtempSync(path.join(process.cwd(), 'node_modules', '.tmp-dts-'));
  try {
    fs.writeFileSync(path.join(dir, 'rex-widget-env.d.ts'), dts);
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          noEmit: true,
          strict: true,
          skipLibCheck: false,
          module: 'ESNext',
          moduleResolution: 'bundler',
          types: [],
        },
        files: ['./rex-widget-env.d.ts'],
      }),
    );
    const result = spawnSync(
      path.join(process.cwd(), 'node_modules', '.bin', 'tsc'),
      ['-p', dir, '--pretty', 'false'],
      {
        encoding: 'utf8',
        cwd: process.cwd(),
      },
    );
    expect(result.error).toBeUndefined();
    expect(`${result.stdout}${result.stderr}`.trim()).toBe('');
    expect(result.status).toBe(0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function createRspackNormalPresetStats(outputPath: string, assetNames: string[]): Rspack.Stats {
  return {
    toJson(options?: boolean | string | Record<string, unknown>) {
      const opts = options && typeof options === 'object' ? options : undefined;
      const wantsAssets = opts?.assets === true || opts?.all === true;

      return {
        outputPath,
        assets: wantsAssets ? assetNames.map((name) => ({ name })) : undefined,
      };
    },
  } as Rspack.Stats;
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

async function generateTypesFromOutput(source: string) {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rex-rslib-parse-'));
  tempDirs.push(rootPath);

  const distPath = path.join(rootPath, 'dist');
  const srcPath = path.join(rootPath, 'src');
  fs.mkdirSync(distPath);
  fs.mkdirSync(srcPath);

  const outputFile = path.join(distPath, 'douban-bridge.js');
  fs.writeFileSync(outputFile, source);

  const errors: string[] = [];
  let afterBuild:
    | ((params: { stats: Rspack.Stats; isWatch: boolean; isFirstCompile: boolean }) => Promise<void>)
    | undefined;

  const plugin = pluginRexWidget({
    typesFilePath: 'src/rex-widget-env.d.ts',
  });

  await plugin.setup({
    context: {
      rootPath,
      distPath,
    },
    logger: {
      warn: () => {},
      error: (...args: unknown[]) => {
        errors.push(args.map(String).join(' '));
      },
    },
    transform: () => {},
    onAfterBuild: (fn) => {
      afterBuild = fn;
    },
  } as unknown as RsbuildPluginAPI);

  await afterBuild?.({
    stats: createRspackNormalPresetStats(distPath, ['douban-bridge.js']),
    isWatch: false,
    isFirstCompile: false,
  });

  return {
    dts: fs.readFileSync(path.join(srcPath, 'rex-widget-env.d.ts'), 'utf-8'),
    output: fs.readFileSync(outputFile, 'utf-8'),
    errors,
  };
}

const widgetMetadataObject = `{
  id: 'douban.bridge',
  title: '豆瓣',
  modules: [
    {
      id: 'movie_genre',
      title: '电影类型榜',
      functionName: 'loadGenreCatalog',
      params: [],
    },
  ],
}`;

test('generates types from assignment WidgetMetadata', async () => {
  const { dts, errors } = await generateTypesFromOutput(`WidgetMetadata = ${widgetMetadataObject};
`);

  expect(errors.join('\n')).not.toMatch(/already been declared/);
  expect(dts).toContain('DoubanBridge');
  expect(dts).toContain('loadGenreCatalog');
  expect(dts).toContain('interface LoadGenreCatalogParams');
  expect(dts.match(/declare let loadGenreCatalog/g)).toHaveLength(1);
  assertDtsTypechecks(dts);
});

test('merges declarations when modules share functionName', async () => {
  const { dts, errors } = await generateTypesFromOutput(`WidgetMetadata = {
  id: 'example',
  title: 'Example',
  modules: [
    {
      id: 'movies',
      title: 'Movies',
      functionName: 'loadCatalog',
      params: [
        { name: 'collectionId', title: 'Collection', type: 'constant', value: 'movies' },
      ],
    },
    {
      id: 'shows',
      title: 'Shows',
      functionName: 'loadCatalog',
      params: [
        { name: 'collectionId', title: 'Collection', type: 'constant', value: 'shows' },
      ],
    },
  ],
};
`);

  expect(errors).toEqual([]);
  expect(dts.match(/declare let loadCatalog/g)).toHaveLength(1);
  expect(dts.match(/interface LoadCatalogParams/g) ?? []).toHaveLength(0);
  expect(dts).toMatch(/collectionId:\s*'movies'/);
  expect(dts).toMatch(/collectionId:\s*'shows'/);
  expect(dts).toContain('type LoadCatalogParams');
  assertDtsTypechecks(dts);
});

test('generates types from rslib const WidgetMetadata plus Object.assign(globalThis)', async () => {
  const { dts, errors } = await generateTypesFromOutput(`function loadGenreCatalog() {}
const WidgetMetadata = ${widgetMetadataObject};
Object.assign(globalThis, {
    WidgetMetadata: WidgetMetadata,
    loadGenreCatalog: loadGenreCatalog
});
`);

  expect(errors.join('\n')).not.toMatch(/already been declared/);
  expect(dts).toContain('DoubanBridge');
  expect(dts).toContain('loadGenreCatalog');
});

test('generates types from export const WidgetMetadata rslib bundle', async () => {
  const { dts, output, errors } = await generateTypesFromOutput(`const WidgetMetadata = ${widgetMetadataObject};

export { WidgetMetadata };
`);

  expect(errors.join('\n')).not.toMatch(/already been declared/);
  expect(output).not.toMatch(/export\s*\{/);
  expect(dts).toContain('DoubanBridge');
  expect(dts).toContain('loadGenreCatalog');
});

test('generates types when output uses the global Widget host API', async () => {
  const { dts, errors } = await generateTypesFromOutput(`const { http, i18n, storage, sharedCache } = Widget;
const label = i18n('电影类型榜');
storage.get('last');
sharedCache.keys('ns');
http.get('https://example.com');
http.put('https://example.com', {});
http.delete('https://example.com');
const loadGenreCatalog = async () => http.get('https://example.com');
WidgetMetadata = ${widgetMetadataObject};
`);

  expect(errors.join('\n')).not.toMatch(/Widget is not defined/);
  expect(errors).toEqual([]);
  expect(dts).toContain('DoubanBridge');
  expect(dts).toContain('loadGenreCatalog');
  assertDtsTypechecks(dts);
});

test('generates types for 0.0.7 music metadata, person module, and top-level search entry', async () => {
  const { dts, errors } = await generateTypesFromOutput(`var WidgetMetadata = {
  id: 'rex.example.music',
  title: '音乐目录示例',
  version: '1.3.0',
  requiredVersion: '0.0.7',
  contentType: 'music',
  continuousPlay: true,
  modules: [
    { id: 'musicAlbums', title: '专辑', type: 'video', functionName: 'loadMusicAlbums' },
    {
      id: 'musicArtists',
      title: '歌手',
      type: 'person',
      functionName: 'loadArtists',
      params: [
        { name: 'peopleId', title: '歌手 ID', type: 'input' },
        {
          name: 'section',
          title: '歌手分区',
          type: 'enumeration',
          enumOptions: [
            { title: '歌曲', value: 'songs' },
            { title: '专辑', value: 'albums' },
            { title: '资料', value: 'profile' },
            { title: '相似歌手', value: 'artists' },
          ],
        },
        { name: 'page', title: '页码', type: 'page', startPage: 0 },
      ],
    },
  ],
  search: {
    id: 'search',
    title: '搜索',
    functionName: 'searchMusic',
    params: [{ name: 'page', title: '页码', type: 'page' }],
  },
};
`);

  expect(errors).toEqual([]);
  expect(dts).toContain('interface LoadMusicAlbumsParams extends RexExampleMusic.GlobalParams, VideoListParams');
  expect(dts).toContain('interface LoadArtistsParams extends RexExampleMusic.GlobalParams, VideoListParams');
  expect(dts).toContain("section: 'songs' | 'albums' | 'profile' | 'artists'");
  expect(dts).toContain('interface SearchMusicParams extends RexExampleMusic.GlobalParams');
  expect(dts).toContain('keyword: string;');
  expect(dts).toContain(
    'declare let searchMusic: (params: SearchMusicParams) => SearchMusicReturnType | Promise<SearchMusicReturnType>;',
  );
  assertDtsTypechecks(dts);
});

test('generates types for dynamicOptions, belongTo optional params, empty constant, and colliding GlobalParams', async () => {
  const { dts, errors } = await generateTypesFromOutput(`WidgetMetadata = {
  id: 'rex.test.dynamic-options',
  title: '动态枚举测试',
  version: '1.0.0',
  requiredVersion: '0.0.6',
  globalParams: [
    { name: 'section', title: '全局分区', type: 'constant', value: '' },
    { name: 'timezone', title: '时区', type: 'timezone' },
    { name: 'folder', title: '目录', type: 'folder' },
    { name: 'configId', title: '配置', type: 'configId' },
  ],
  modules: [
    {
      id: 'genreDiscover',
      title: '按类型发现',
      functionName: 'genreDiscover',
      params: [
        {
          name: 'mediaType',
          title: '媒体',
          type: 'enumeration',
          enumOptions: [
            { title: '电影', value: 'movie' },
            { title: '剧集', value: 'tv' },
          ],
        },
        {
          name: 'genre',
          title: '类型',
          type: 'enumeration',
          enumOptions: [{ title: '全部', value: '' }],
          belongTo: [{ paramName: 'mediaType', value: ['movie', 'tv'] }],
          dynamicOptions: { functionName: 'loadGenres', dependsOn: ['mediaType'] },
        },
      ],
    },
  ],
};
`);

  expect(errors).toEqual([]);
  expect(dts).toContain("section: '';");
  expect(dts).toContain('genre?: string;');
  expect(dts).toContain(
    'declare let loadGenres: (params: GenreDiscoverParams) => Array<WidgetModuleParamOption> | Promise<Array<WidgetModuleParamOption>>;',
  );
  assertDtsTypechecks(dts);
});

test('generates types for danmu including getCommentsWithSegmentTime and DanmuCommentsResult', async () => {
  const { dts, errors } = await generateTypesFromOutput(`var WidgetMetadata = {
  id: 'rex.example.danmu',
  title: '弹幕示例',
  version: '1.0.0',
  requiredVersion: '0.0.6',
  modules: [
    { id: 'searchDanmu', title: '搜索番剧', type: 'danmu', functionName: 'findAnime' },
    { id: 'getDetail', title: '加载分集', type: 'danmu', functionName: 'findEpisodes' },
    { id: 'getComments', title: '加载弹幕', type: 'danmu', functionName: 'findComments' },
    {
      id: 'getCommentsWithSegmentTime',
      title: '分段弹幕',
      type: 'danmu',
      functionName: 'findSegmentComments',
      params: [{ name: 'source', title: '弹幕源', type: 'input' }],
    },
  ],
};
`);

  expect(errors).toEqual([]);
  expect(dts).toContain('type FindCommentsReturnType = DanmuCommentsResult;');
  expect(dts).toContain(
    'interface FindSegmentCommentsParams extends RexExampleDanmu.GlobalParams, BaseParams, GetCommentsWithSegmentTimeParams',
  );
  expect(dts).toContain('source: string;');
  expect(dts).toContain('type FindSegmentCommentsReturnType = DanmuCommentsResult;');
  assertDtsTypechecks(dts);
});
