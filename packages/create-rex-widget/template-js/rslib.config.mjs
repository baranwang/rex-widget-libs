import { pluginRexWidget } from '@rexnow/rslib-plugin';
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
      syntax: 'es6',
      autoExternal: false,
    },
  ],
  output: {
    target: "web",
    minify: {
      jsOptions: {
        minimizerOptions: {
          mangle: true,
          minify: false,
          compress: true,
          format: {
            comments: false,
          },
        },
      },
    },
  },
  plugins: [pluginRexWidget()],
});
