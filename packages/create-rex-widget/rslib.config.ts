import { defineConfig } from '@rslib/core';
import pkg from './package.json';

export default defineConfig({
  source: {
    define: {
      'process.env.PACKAGE_VERSION': JSON.stringify(pkg.version),
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: true,
    },
  ],
});
