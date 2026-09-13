import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { defineConfig } from '@rslib/core';
import { generateEnvZodSource } from './generate-env-zod';

const tsToZodPlugin = (): RsbuildPlugin => {
  return {
    name: 'ts-to-zod',
    setup(api) {
      api.processAssets({ stage: 'additional' }, ({ sources, compilation }) => {
        const envDir = path.resolve(api.context.rootPath, 'src/env');
        const source = new sources.RawSource(generateEnvZodSource(envDir));
        compilation.emitAsset('env.zod/index.ts', source);
      });
    },
  };
};

export default defineConfig({
  plugins: [tsToZodPlugin()],
  source: {
    entry: {
      env: './src/env/index.ts',
      'widget-adaptor': './src/widget-adaptor.ts',
    },
    exclude: ['**/*.test.ts'],
  },
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: true,
    },
  ],
});
