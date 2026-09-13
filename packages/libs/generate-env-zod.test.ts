import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@rstest/core';
import { generateEnvZodSource } from './generate-env-zod';

const envDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/env');

/** Emitted env.zod is TypeScript; Node eval needs the type annotations stripped. */
function asRuntimeJs(source: string): string {
  return source
    .replaceAll(': z.ZodTypeAny', '')
    .replaceAll('(): z.ZodTypeAny =>', '() =>');
}

test('generated env.zod evaluates and has no empty imports or record.partial()', async () => {
  const source = generateEnvZodSource(envDir);

  expect(source).not.toMatch(/from ["']{2}/);
  expect(source).not.toMatch(/z\.record\([\s\S]*?\)\.partial\(\)/);
  expect(source).not.toContain('tsToZodShouldNotSeeThisSchema');
  expect(source).not.toMatch(/: z\.ZodSchema</);
  expect(source).toContain(
    'export const videoItemSchema: z.ZodTypeAny = z.lazy((): z.ZodTypeAny =>',
  );

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

test('widgetMetadataSchema accepts unknown i18n locale keys', async () => {
  const source = generateEnvZodSource(envDir);
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp-env-zod-i18n.js');
  fs.writeFileSync(file, asRuntimeJs(source));

  try {
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
    const result = mod.widgetMetadataSchema.safeParse({
      id: 'demo',
      title: 'Demo',
      modules: [],
      i18n: { de: { hello: 'Hallo' } },
    });
    expect(result.success).toBe(true);
  } finally {
    fs.unlinkSync(file);
  }
});
