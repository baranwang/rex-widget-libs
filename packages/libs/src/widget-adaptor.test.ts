import { afterEach, expect, rs, test } from '@rstest/core';
import { WidgetAdaptor } from './widget-adaptor';

afterEach(() => {
  rs.unstubAllGlobals();

  if (typeof WidgetAdaptor.sharedCache?.remove === 'function') {
    WidgetAdaptor.sharedCache.remove('rstest.widget-adaptor', 'featured');
  }
});

test('WidgetAdaptor.http.get is a function', () => {
  expect(typeof WidgetAdaptor.http.get).toBe('function');
});

test('WidgetAdaptor.http.request posts JSON from data', async () => {
  const fetchMock = rs.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    return new Response(JSON.stringify({ isMatched: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  rs.stubGlobal('fetch', fetchMock);

  const response = await WidgetAdaptor.http.request<{ isMatched: boolean }>({
    url: 'https://example.com/api/v2/match',
    method: 'POST',
    data: {
      fileName: 'Title S01E01',
      fileHash: null,
      fileSize: 0,
      videoDuration: 0,
      matchMode: 'fileNameOnly',
    },
    headers: { 'User-Agent': 'RexWidget' },
  });

  expect(response.statusCode).toBe(200);
  expect(response.data).toEqual({ isMatched: true });
  expect(fetchMock).toHaveBeenCalledTimes(1);

  const [input, init] = fetchMock.mock.calls[0] ?? [];
  expect(String(input)).toContain('/api/v2/match');
  expect(init?.method).toBe('POST');
  expect(init?.body).toBe(
    JSON.stringify({
      fileName: 'Title S01E01',
      fileHash: null,
      fileSize: 0,
      videoDuration: 0,
      matchMode: 'fileNameOnly',
    }),
  );
});

test('WidgetAdaptor.sharedCache get/set/remove are namespaced', () => {
  const namespace = 'rstest.widget-adaptor';
  const key = 'featured';

  expect(WidgetAdaptor.sharedCache.get(namespace, key)).toBeNull();

  WidgetAdaptor.sharedCache.set(namespace, key, [{ id: '1', title: 'Cached' }]);
  expect(WidgetAdaptor.sharedCache.get(namespace, key)).toEqual([{ id: '1', title: 'Cached' }]);
  expect(WidgetAdaptor.sharedCache.get('rstest.other', key)).toBeNull();

  WidgetAdaptor.sharedCache.remove(namespace, key);
  expect(WidgetAdaptor.sharedCache.get(namespace, key)).toBeNull();
});
