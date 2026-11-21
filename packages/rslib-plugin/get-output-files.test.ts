import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { RsbuildPluginAPI, Rspack } from '@rsbuild/core';
import { afterEach, expect, test } from '@rstest/core';
import { pluginRexWidget } from './src/index';

/**
 * Rslib 1.0 / Rspack Stats: `toJson(true)` is preset `'normal'` and omits `assets`.
 * `toJson({ assets: true })` and `toJson({ all: true })` include them.
 */
function createRspackNormalPresetStats(outputPath: string, assetNames: string[]): Rspack.Stats {
  return {
    toJson(options?: boolean | string | Record<string, unknown>) {
      const opts = options && typeof options === 'object' ? options : undefined;
      const wantsAssets = opts?.assets === true || opts?.all === true;

      return {
        outputPath: outputPath,
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

test('onAfterBuild still strips export when toJson(true) has no assets', async () => {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rex-rslib-plugin-'));
  tempDirs.push(rootPath);

  const distPath = path.join(rootPath, 'dist');
  const srcPath = path.join(rootPath, 'src');
  fs.mkdirSync(distPath);
  fs.mkdirSync(srcPath);

  const outputFile = path.join(distPath, 'douban-bridge.js');
  fs.writeFileSync(
    outputFile,
    `WidgetMetadata = {
  id: 'douban-bridge',
  title: 'Douban Bridge',
  modules: [],
};

export { WidgetMetadata };
`,
  );

  const warnings: string[] = [];
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
      warn: (message: string) => {
        warnings.push(String(message));
      },
      error: () => {},
    },
    transform: () => {},
    onAfterBuild: (fn) => {
      afterBuild = fn;
    },
  } as unknown as RsbuildPluginAPI);

  expect(afterBuild).toBeTypeOf('function');

  await afterBuild?.({
    stats: createRspackNormalPresetStats(distPath, ['douban-bridge.js']),
    isWatch: false,
    isFirstCompile: false,
  });

  expect(warnings).not.toContain('未找到输出文件，跳过类型生成');
  expect(fs.readFileSync(outputFile, 'utf-8')).not.toMatch(/export\s*\{/);
  expect(fs.existsSync(path.join(srcPath, 'rex-widget-env.d.ts'))).toBe(true);
});

test('onAfterBuild collects JS assets from MultiStats children, ignores non-JS files, and deduplicates shared WidgetMetadata.id', async () => {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rex-rslib-plugin-multi-'));
  tempDirs.push(rootPath);

  const distPath = path.join(rootPath, 'dist');
  const srcPath = path.join(rootPath, 'src');
  fs.mkdirSync(distPath);
  fs.mkdirSync(srcPath);

  const fullFile = path.join(distPath, 'danmu-universal.js');
  const liteFile = path.join(distPath, 'danmu-universal.lite.js');
  const licenseFile = path.join(distPath, 'danmu-universal.js.LICENSE.txt');

  fs.writeFileSync(
    fullFile,
    `WidgetMetadata={id:'baranwang.danmu.universal',title:'Danmu',modules:[{id:'searchDanmu',title:'Search',type:'danmu',functionName:'searchDanmu'}]};export{WidgetMetadata};`,
  );
  fs.writeFileSync(
    liteFile,
    `WidgetMetadata={id:'baranwang.danmu.universal',title:'Danmu',modules:[{id:'searchDanmu',title:'Search',type:'danmu',functionName:'searchDanmu'}]};export{WidgetMetadata};`,
  );
  fs.writeFileSync(licenseFile, 'MIT License');

  const warnings: string[] = [];
  let afterBuild:
    | ((params: { stats: Rspack.MultiStats; isWatch: boolean; isFirstCompile: boolean }) => Promise<void>)
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
      warn: (message: string) => {
        warnings.push(String(message));
      },
      error: () => {},
    },
    transform: () => {},
    onAfterBuild: (fn) => {
      afterBuild = fn;
    },
  } as unknown as RsbuildPluginAPI);

  const multiStats = {
    toJson() {
      return {
        children: [
          {
            outputPath: distPath,
            assets: [{ name: 'danmu-universal.js' }, { name: 'danmu-universal.js.LICENSE.txt' }],
          },
          {
            outputPath: distPath,
            assets: [{ name: 'danmu-universal.lite.js' }],
          },
        ],
      };
    },
  } as unknown as Rspack.MultiStats;

  await afterBuild?.({
    stats: multiStats,
    isWatch: false,
    isFirstCompile: false,
  });

  expect(warnings).not.toContain('未找到输出文件，跳过类型生成');
  expect(fs.readFileSync(fullFile, 'utf-8')).toContain('WidgetMetadata = {');
  expect(fs.readFileSync(fullFile, 'utf-8')).not.toMatch(/export\s*\{/);
  expect(fs.readFileSync(liteFile, 'utf-8')).toContain('WidgetMetadata = {');
  expect(fs.readFileSync(liteFile, 'utf-8')).not.toMatch(/export\s*\{/);
  expect(fs.readFileSync(licenseFile, 'utf-8')).toBe('MIT License');

  const dts = fs.readFileSync(path.join(srcPath, 'rex-widget-env.d.ts'), 'utf-8');
  expect(dts.match(/declare namespace BaranwangDanmuUniversal/g)?.length).toBe(1);
});
