#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cancel, intro, isCancel, note, outro, select, text } from '@clack/prompts';
import deepmerge from 'deepmerge';
import color from 'picocolors';
import type { PackageJson } from 'type-fest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatProjectName(input: string) {
  const formatted = input.trim().replace(/\/+$/g, '');
  return {
    packageName: formatted.startsWith('@') ? formatted : path.basename(formatted),
    targetDir: formatted,
  };
}

function cancelAndExit() {
  cancel('Operation cancelled.');
  process.exit(0);
}

function checkCancel<T>(value: unknown) {
  if (isCancel(value)) {
    cancelAndExit();
  }
  return value as T;
}

function isEmptyDir(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function updateWorkspaceDependencies(
  dependencies: PackageJson.Dependency | undefined,
  newVersion: string | undefined,
): void {
  // 如果依赖对象不存在或者新版本未定义，则直接返回
  if (!dependencies || typeof newVersion === 'undefined') {
    return;
  }

  for (const key in dependencies) {
    if (Object.hasOwn(dependencies, key)) {
      const value = dependencies[key];
      if (value?.startsWith('workspace:')) {
        dependencies[key] = newVersion;
      }
    }
  }
}
const isStableVersion = (version: string) => {
  return ['alpha', 'beta', 'rc', 'canary', 'nightly'].every((tag) => !version.includes(tag));
};

function savePackageJson(path: string, json: PackageJson, packageName: string) {
  json.name = packageName;
  json.version = '0.0.0';
  const libVersion = process.env.PACKAGE_VERSION || 'latest';
  const targetVersion = isStableVersion(libVersion) ? `^${libVersion}` : libVersion;
  updateWorkspaceDependencies(json.dependencies, targetVersion);
  updateWorkspaceDependencies(json.devDependencies, targetVersion);
  updateWorkspaceDependencies(json.peerDependencies, targetVersion);

  fs.writeFileSync(path, JSON.stringify(json, null, 2));
}

function copyFolder({ from, to, packageName }: { from: string; to: string; packageName: string }) {
  const skipFiles = ['node_modules', 'dist'];
  fs.mkdirSync(to, { recursive: true });

  const files = fs.readdirSync(from);
  for (const file of files) {
    if (skipFiles.includes(file)) {
      continue;
    }
    const srcPath = path.resolve(from, file);
    const destPath = path.resolve(to, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyFolder({ from: srcPath, to: destPath, packageName });
    } else if (file === 'package.json') {
      const targetPackage = path.resolve(to, 'package.json');
      if (fs.existsSync(targetPackage)) {
        const targetJson = JSON.parse(fs.readFileSync(targetPackage, 'utf-8'));
        const currentJson = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
        const newJson = deepmerge<PackageJson>(targetJson, currentJson);
        savePackageJson(targetPackage, newJson, packageName);
      } else {
        savePackageJson(targetPackage, JSON.parse(fs.readFileSync(srcPath, 'utf-8')), packageName);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getPkgManager() {
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    const [nameAndVersion] = userAgent.split(' ', 1);
    const [name] = nameAndVersion.split('/', 1);
    return name;
  }
  return 'npm';
}

async function main() {
  console.clear();
  const cwd = process.cwd();

  intro(color.cyan(color.bold('Create Rex Widget')));

  const projectName = checkCancel<string>(
    await text({
      message: 'Project name or path',
      placeholder: 'rex-widget-project',
      defaultValue: 'rex-widget-project',
      validate: (value) => {
        if (value == null || value.length === 0) {
          return 'Project name is required';
        }
      },
    }),
  );
  const { packageName, targetDir } = formatProjectName(projectName);
  const distFolder = path.isAbsolute(targetDir) ? targetDir : path.join(cwd, targetDir);

  if (fs.existsSync(distFolder) && !isEmptyDir(distFolder)) {
    const option = checkCancel<string>(
      await select({
        message: `"${targetDir}" is not empty, please choose:`,
        options: [
          { value: 'yes', label: 'Continue and override files' },
          { value: 'no', label: 'Cancel operation' },
        ],
      }),
    );

    if (option === 'no') {
      cancelAndExit();
    }
  }

  const language = checkCancel<'ts' | 'js'>(
    await select({
      message: 'Select language',
      options: [
        { value: 'ts', label: 'TypeScript' },
        { value: 'js', label: 'JavaScript' },
      ],
    }),
  );

  const templateRoot = path.resolve(__dirname, '..');
  const templatePath = path.resolve(templateRoot, language === 'ts' ? 'template-ts' : 'template-js');
  copyFolder({ from: path.resolve(templateRoot, 'template-common'), to: distFolder, packageName });
  copyFolder({ from: templatePath, to: distFolder, packageName });

  const pkgManager = getPkgManager();
  const nextSteps = [
    `1. ${color.cyan(`cd ${targetDir}`)}`,
    `2. ${color.cyan('git init')} ${color.dim('(optional)')}`,
    `3. ${color.cyan(`${pkgManager} install`)}`,
    `4. ${color.cyan(`${pkgManager} run dev`)}`,
  ];

  note(nextSteps.map((step) => color.reset(step)).join('\n'), 'Next steps');

  outro('All set, happy coding!');
}

main().catch(console.error);
