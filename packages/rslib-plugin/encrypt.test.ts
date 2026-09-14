import { afterEach, expect, test } from '@rstest/core';
import { ENCRYPT_ENDPOINT, encryptWidgetSource, isEncryptedWidget, validateEncryptEnvelope } from './src/encrypt';

function validEnvelope(payloadBytes = 32): string {
  const header = {
    v: 2,
    mkv: 'rex-1',
    alg: 'A256GCM',
    iv: Buffer.alloc(12, 1).toString('base64'),
    kb: Buffer.alloc(60, 2).toString('base64'),
  };
  return `REXENC\n${JSON.stringify(header)}\n${Buffer.alloc(payloadBytes, 3).toString('base64')}`;
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('isEncryptedWidget detects REXENC and FWENC prefixes', () => {
  expect(isEncryptedWidget('REXENC\n{}\nxx')).toBe(true);
  expect(isEncryptedWidget('  FWENC\n{}\nxx')).toBe(true);
  expect(isEncryptedWidget('WidgetMetadata = {}')).toBe(false);
});

test('validateEncryptEnvelope accepts a rex-1 A256GCM envelope', () => {
  expect(() => validateEncryptEnvelope(validEnvelope())).not.toThrow();
});

test('validateEncryptEnvelope rejects a wrong magic or header', () => {
  expect(() => validateEncryptEnvelope('not-an-envelope')).toThrow('服务返回了不兼容的格式');
  const bad = validEnvelope().replace('"v":2', '"v":1');
  expect(() => validateEncryptEnvelope(bad)).toThrow('加密结果不完整');
});

test('encryptWidgetSource posts source to the official encrypt endpoint', async () => {
  const envelope = validEnvelope();
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = (async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(envelope, { status: 200 });
  }) as typeof fetch;

  const source = "WidgetMetadata = { id: 'demo', title: 'Demo', modules: [] };";
  await expect(encryptWidgetSource(source)).resolves.toBe(envelope);

  expect(calls).toHaveLength(1);
  expect(calls[0]?.url).toBe(ENCRYPT_ENDPOINT);
  expect(calls[0]?.init?.method).toBe('POST');
  expect(calls[0]?.init?.headers).toMatchObject({ 'Content-Type': 'text/plain; charset=utf-8' });
  expect(calls[0]?.init?.body).toBe(source);
  expect(calls[0]?.init?.cache).toBe('no-store');
  expect(calls[0]?.init?.credentials).toBe('omit');
});

test('encryptWidgetSource maps a failed fetch to the official network message', async () => {
  globalThis.fetch = (async () => {
    throw new TypeError('fetch failed');
  }) as typeof fetch;

  await expect(encryptWidgetSource('WidgetMetadata = { id: "x" };')).rejects.toThrow(
    '无法连接加密服务，请检查网络后重试。',
  );
});

test('encryptWidgetSource maps HTTP 400 to the official client message', async () => {
  globalThis.fetch = (async () => new Response('nope', { status: 400 })) as typeof fetch;

  await expect(encryptWidgetSource('WidgetMetadata = { id: "x" };')).rejects.toThrow(
    '服务无法识别这个模块，请检查源码。',
  );
});

test('encryptWidgetSource rejects already encrypted modules', async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response(validEnvelope(), { status: 200 });
  }) as typeof fetch;

  await expect(encryptWidgetSource(validEnvelope())).rejects.toThrow('这是已加密的模块');
  expect(called).toBe(false);
});
