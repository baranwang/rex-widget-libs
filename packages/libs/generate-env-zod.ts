import fs from 'node:fs';
import path from 'node:path';
import { Project } from 'ts-morph';
import { generate } from 'ts-to-zod';

export function generateEnvZodSource(envDir: string): string {
  const envFiles = fs
    .readdirSync(envDir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => fs.readFileSync(path.resolve(envDir, file), 'utf-8'))
    .join('\n');
  const project = new Project({
    useInMemoryFileSystem: true,
  });
  const sourceFile = project.createSourceFile('temp.ts', envFiles);
  sourceFile.getInterfaces().forEach((interfaceDeclaration) => {
    interfaceDeclaration.setIsExported(true);
  });
  sourceFile.getTypeAliases().forEach((typeAliasDeclaration) => {
    typeAliasDeclaration.setIsExported(true);
  });
  sourceFile.getEnums().forEach((enumDeclaration) => {
    enumDeclaration.setIsExported(true);
  });
  const { getZodSchemasFile } = generate({
    sourceText: sourceFile.getText(),
    keepComments: true,
  });
  return sanitizeEnvZodSource(getZodSchemasFile(''));
}

/** ts-to-zod emits Zod 4-invalid `.partial()` on records and an empty type import for recursive types. */
export function sanitizeEnvZodSource(source: string): string {
  return source
    .replace(/import \{ type \w+ \} from "";\n/g, '')
    .replace(
      /: z\.ZodSchema<\w+> = z\.lazy\(\(\) =>/g,
      ': z.ZodTypeAny = z.lazy((): z.ZodTypeAny =>',
    )
    .replace(
      'z.record(widgetI18nLocaleSchema, z.record(z.string(), z.string())).partial()',
      'z.record(widgetI18nLocaleSchema, z.record(z.string(), z.string()))',
    )
    .replace('z.string().and(z.object({}))', 'z.string()');
}
