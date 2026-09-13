import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { type InterfaceDeclaration, Project } from 'ts-morph';

const envDir = path.dirname(fileURLToPath(import.meta.url));

function getStreamSourceItem(): InterfaceDeclaration {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const sourceFile = project.addSourceFileAtPath(path.join(envDir, 'stream.ts'));
  return sourceFile.getInterfaceOrThrow('StreamSourceItem');
}

function getPropertyTypeText(iface: InterfaceDeclaration, name: string): string {
  const property = iface.getProperty(name);
  expect(property).toBeDefined();

  if (property === undefined) {
    throw new Error(`missing property ${name}`);
  }

  const typeNode = property.getTypeNode();
  expect(typeNode).toBeDefined();

  if (typeNode === undefined) {
    throw new Error(`missing type node for ${name}`);
  }

  return typeNode.getText();
}

test('StreamSourceItem matches official VideoResource extras', () => {
  const item = getStreamSourceItem();

  expect(getPropertyTypeText(item, 'name')).toBe('string');
  expect(getPropertyTypeText(item, 'url')).toBe('string');
  expect(item.getProperty('name')?.hasQuestionToken()).toBe(false);
  expect(item.getProperty('url')?.hasQuestionToken()).toBe(false);

  expect(getPropertyTypeText(item, 'description')).toBe('string');
  expect(item.getProperty('description')?.hasQuestionToken()).toBe(true);

  expect(getPropertyTypeText(item, 'customHeaders')).toBe('Record<string, string>');
  expect(getPropertyTypeText(item, 'headers')).toBe('Record<string, string>');
  expect(getPropertyTypeText(item, 'playerType')).toBe("'system' | 'app'");
  expect(item.getProperty('customHeaders')?.hasQuestionToken()).toBe(true);
  expect(item.getProperty('headers')?.hasQuestionToken()).toBe(true);
  expect(item.getProperty('playerType')?.hasQuestionToken()).toBe(true);
});
