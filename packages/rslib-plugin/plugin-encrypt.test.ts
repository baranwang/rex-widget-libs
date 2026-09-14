import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { RsbuildPluginAPI, Rspack } from '@rsbuild/core';
import { afterEach, expect, test } from '@rstest/core';
import { pluginRexWidget } from './src/index';

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

function validEnvelope(): string {
  const header = {
    v: 2,
    mkv: 'rex-1',
    alg: 'A256GCM',
    iv: Buffer.alloc(12, 1).toString('base64'),
    kb: Buffer.alloc(60, 2).toString('base64'),
  };
  return `REXENC\n${JSON.stringify(header)}\n${Buffer.alloc(32, 3).toString('base64')}`;
}

const widgetSource = `WidgetMetadata = {
  id: 'encrypt-demo',
  title: 'Encrypt Demo',
  modules: [],
};
`;

const tempDirs: string[] = [];
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

async function setupPlugin(rootPath: string, options: { encrypt?: boolean } = {}) {
  let afterBuild:
    | ((params: { stats: Rspack.Stats; isWatch: boolean; isFirstCompile: boolean }) => Promise<void>)
    | undefined;

  const plugin = pluginRexWidget({
    typesFilePath: 'src/rex-widget-env.d.ts',
    ...options,
  });

  await plugin.setup({
    context: {
      rootPath,
      distPath: path.join(rootPath, 'dist'),
    },
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    transform: () => {},
    onAfterBuild: (fn) => {
      afterBuild = fn;
    },
  } as unknown as RsbuildPluginAPI);

  return afterBuild;
}

function writeWidgetProject() {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rex-rslib-encrypt-'));
  tempDirs.push(rootPath);

  const distPath = path.join(rootPath, 'dist');
  const srcPath = path.join(rootPath, 'src');
  fs.mkdirSync(distPath);
  fs.mkdirSync(srcPath);

  const outputFile = path.join(distPath, 'widget.js');
  fs.writeFileSync(outputFile, widgetSource);
  return { rootPath, distPath, outputFile };
}

test('encrypt:true overwrites the built js with a REXENC envelope', async () => {
  const { rootPath, distPath, outputFile } = writeWidgetProject();
  const envelope = validEnvelope();
  const bodies: unknown[] = [];

  globalThis.fetch = (async (_url, init) => {
    bodies.push(init?.body);
    return new Response(envelope, { status: 200 });
  }) as typeof fetch;

  const afterBuild = await setupPlugin(rootPath, { encrypt: true });
  await afterBuild?.({
    stats: createRspackNormalPresetStats(distPath, ['widget.js']),
    isWatch: false,
    isFirstCompile: false,
  });

  expect(bodies).toEqual([widgetSource]);
  expect(fs.readFileSync(outputFile, 'utf-8')).toBe(envelope);
});

test('encrypt:true skips watch rebuilds', async () => {
  const { rootPath, distPath, outputFile } = writeWidgetProject();
  let called = false;

  globalThis.fetch = (async () => {
    called = true;
    return new Response(validEnvelope(), { status: 200 });
  }) as typeof fetch;

  const afterBuild = await setupPlugin(rootPath, { encrypt: true });
  await afterBuild?.({
    stats: createRspackNormalPresetStats(distPath, ['widget.js']),
    isWatch: true,
    isFirstCompile: false,
  });

  expect(called).toBe(false);
  expect(fs.readFileSync(outputFile, 'utf-8')).toBe(widgetSource);
});

test('encrypt defaults to off', async () => {
  const { rootPath, distPath, outputFile } = writeWidgetProject();
  let called = false;

  globalThis.fetch = (async () => {
    called = true;
    return new Response(validEnvelope(), { status: 200 });
  }) as typeof fetch;

  const afterBuild = await setupPlugin(rootPath);
  await afterBuild?.({
    stats: createRspackNormalPresetStats(distPath, ['widget.js']),
    isWatch: false,
    isFirstCompile: false,
  });

  expect(called).toBe(false);
  expect(fs.readFileSync(outputFile, 'utf-8')).not.toMatch(/^REXENC/);
});
