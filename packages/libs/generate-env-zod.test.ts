import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@rstest/core';
import { generateEnvZodSource } from './generate-env-zod';

const envDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/env');

test('generated env.zod evaluates and has no empty imports or record.partial()', async () => {
  const source = generateEnvZodSource(envDir);

  expect(source).not.toMatch(/from ["']{2}/);
  expect(source).not.toMatch(/z\.record\([\s\S]*?\)\.partial\(\)/);
  expect(source).not.toContain('tsToZodShouldNotSeeThisSchema');

  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp-env-zod-eval.js');
  fs.writeFileSync(file, source);

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
