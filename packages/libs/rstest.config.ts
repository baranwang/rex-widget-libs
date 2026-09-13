import { defineConfig } from '@rstest/core';
import { withRslibConfig } from '@rstest/adapter-rslib';

export default defineConfig({
  extends: withRslibConfig({
    modifyLibConfig: (libConfig) => {
      libConfig.plugins = [];
      return libConfig;
    },
  }),
});
