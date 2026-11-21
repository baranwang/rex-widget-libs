import { afterEach, expect, rs, test } from '@rstest/core';
import { WidgetAdaptor } from './widget-adaptor';

const originalTmdbKey = process.env.TMDB_API_KEY;
const originalRexLocale = process.env.REX_LOCALE;

afterEach(() => {
  rs.unstubAllGlobals();
  process.env.TMDB_API_KEY = originalTmdbKey;
  if (originalRexLocale === undefined) {
    delete process.env.REX_LOCALE;
  } else {
    process.env.REX_LOCALE = originalRexLocale;
  }
  delete (globalThis as { WidgetMetadata?: unknown }).WidgetMetadata;

  WidgetAdaptor.sharedCache.remove('rstest.widget-adaptor', 'featured');
  WidgetAdaptor.sharedCache.remove('rstest.widget-adaptor', 'secondary');
  WidgetAdaptor.storage.clear();
});

test('WidgetAdaptor.http.get is a function', () => {
  expect(typeof WidgetAdaptor.http.get).toBe('function');
  expect(typeof WidgetAdaptor.http.put).toBe('function');
  expect(typeof WidgetAdaptor.http.delete).toBe('function');
});

test('WidgetAdaptor.http.request posts JSON from data', async () => {
  const fetchMock = rs.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
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

test.each([
  { data: 0, body: '0' },
  { data: '', body: '' },
  { data: false, body: 'false' },
])('WidgetAdaptor.http.request posts defined falsy data $data', async ({ data, body }) => {
  const fetchMock = rs.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  rs.stubGlobal('fetch', fetchMock);

  await WidgetAdaptor.http.request({
    url: 'https://example.com/api/v2/match',
    method: 'POST',
    data,
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(init?.body).toBe(body);
});

test('WidgetAdaptor.http supports put, delete, PATCH, numeric/boolean params, and form submission without body', async () => {
  const fetchMock = rs.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  rs.stubGlobal('fetch', fetchMock);

  await WidgetAdaptor.http.get('https://example.com/list', { params: { page: 2, adult: false } });
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://example.com/list?page=2&adult=false');

  await WidgetAdaptor.http.post('https://example.com/form', undefined, { params: { keyword: '科幻', page: 1 } });
  const [formUrl, formInit] = fetchMock.mock.calls[1] ?? [];
  expect(String(formUrl)).toBe('https://example.com/form');
  expect(formInit?.body).toBe('keyword=%E7%A7%91%E5%B9%BB&page=1');
  expect((formInit?.headers as Record<string, string> | undefined)?.['Content-Type']).toContain(
    'application/x-www-form-urlencoded',
  );

  await WidgetAdaptor.http.put('https://example.com/item/1', { title: 'Updated' });
  expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('PUT');
  expect(fetchMock.mock.calls[2]?.[1]?.body).toBe(JSON.stringify({ title: 'Updated' }));

  await WidgetAdaptor.http.delete('https://example.com/item/1');
  expect(fetchMock.mock.calls[3]?.[1]?.method).toBe('DELETE');

  await WidgetAdaptor.http.request({ url: 'https://example.com/item/1', method: 'PATCH', data: { active: true } });
  expect(fetchMock.mock.calls[4]?.[1]?.method).toBe('PATCH');
});

test('WidgetAdaptor.http throws HTTP errors on non-2xx and handles allow_redirects: false', async () => {
  rs.stubGlobal(
    'fetch',
    rs.fn(async () => new Response('Not Found', { status: 404, statusText: 'Not Found' })),
  );
  await expect(WidgetAdaptor.http.get('https://example.com/missing')).rejects.toThrow('HTTP 404: not found');

  const redirectMock = rs.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    expect(init?.redirect).toBe('manual');
    return new Response(null, { status: 302, headers: { Location: 'https://example.com/next' } });
  });
  rs.stubGlobal('fetch', redirectMock);
  await expect(WidgetAdaptor.http.get('https://example.com/redirect', { allow_redirects: false })).rejects.toThrow(
    'HTTP 302: found',
  );
});

test('WidgetAdaptor.http supports decodable: false and lossless big integer JSON parsing', async () => {
  const bigIntJson = '{"id":9007199254740993,"safe":42}';
  rs.stubGlobal(
    'fetch',
    rs.fn(async () => new Response(bigIntJson, { status: 200 })),
  );

  const parsed = await WidgetAdaptor.http.get<{ id: string; safe: number }>('https://example.com/big');
  expect(parsed.data).toEqual({ id: '9007199254740993', safe: 42 });

  const raw = await WidgetAdaptor.http.request<string>({
    url: 'https://example.com/big',
    decodable: false,
  });
  expect(raw.data).toBe(bigIntJson);
});

test('WidgetAdaptor.tmdb.get supports both v3 api_key and v4 Bearer token', async () => {
  const fetchMock = rs.fn(async () => new Response(JSON.stringify({ results: [] }), { status: 200 }));
  rs.stubGlobal('fetch', fetchMock);

  process.env.TMDB_API_KEY = 'v3-api-key-hex';
  const body = await WidgetAdaptor.tmdb.get<{ results: unknown[] }>('movie/popular', { params: { page: 1 } });
  expect(body).toEqual({ results: [] });
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
    'https://api.themoviedb.org/3/movie/popular?page=1&api_key=v3-api-key-hex',
  );

  process.env.TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.payload.sig';
  await WidgetAdaptor.tmdb.get('/tv/popular', { params: { language: 'zh-CN' } });
  const [v4Url, v4Init] = fetchMock.mock.calls[1] ?? [];
  expect(String(v4Url)).toBe('https://api.themoviedb.org/3/tv/popular?language=zh-CN');
  expect((v4Init?.headers as Record<string, string> | undefined)?.Authorization).toBe(
    'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig',
  );
});

test('WidgetAdaptor.html.load parses HTML synchronously and works with await', async () => {
  const $sync = WidgetAdaptor.html.load('<h1>片名</h1>');
  expect($sync('h1').text()).toBe('片名');

  const $async = await WidgetAdaptor.html.load('<p>简介</p>');
  expect($async('p').text()).toBe('简介');
});

test('WidgetAdaptor.storage is synchronous and supports objects, primitives, keys, remove, and clear', () => {
  expect(WidgetAdaptor.storage.get('missing')).toBeNull();

  WidgetAdaptor.storage.set('obj', { value: 1 });
  WidgetAdaptor.storage.set('str', 'hello');
  expect(WidgetAdaptor.storage.get<{ value: number }>('obj')).toEqual({ value: 1 });
  expect(WidgetAdaptor.storage.get<string>('str')).toBe('hello');
  expect(WidgetAdaptor.storage.keys().sort()).toEqual(['obj', 'str']);

  WidgetAdaptor.storage.remove('obj');
  expect(WidgetAdaptor.storage.get('obj')).toBeNull();

  WidgetAdaptor.storage.clear();
  expect(WidgetAdaptor.storage.keys()).toEqual([]);
});

test('WidgetAdaptor.sharedCache get/set/remove/keys are namespaced', () => {
  const namespace = 'rstest.widget-adaptor';
  const key = 'featured';

  expect(WidgetAdaptor.sharedCache.get(namespace, key)).toBeNull();
  expect(WidgetAdaptor.sharedCache.keys('rstest.nonexistent')).toEqual([]);

  WidgetAdaptor.sharedCache.set(namespace, key, [{ id: '1', title: 'Cached' }]);
  WidgetAdaptor.sharedCache.set(namespace, 'secondary', { ok: true });
  expect(WidgetAdaptor.sharedCache.get(namespace, key)).toEqual([{ id: '1', title: 'Cached' }]);
  expect(WidgetAdaptor.sharedCache.get('rstest.other', key)).toBeNull();
  expect(WidgetAdaptor.sharedCache.keys(namespace).sort()).toEqual(['featured', 'secondary']);

  WidgetAdaptor.sharedCache.remove(namespace, key);
  expect(WidgetAdaptor.sharedCache.get(namespace, key)).toBeNull();
  expect(WidgetAdaptor.sharedCache.keys(namespace)).toEqual(['secondary']);
});

test('WidgetAdaptor.i18n resolves translations using Rex locale fallback order', () => {
  (globalThis as { WidgetMetadata?: unknown }).WidgetMetadata = {
    i18n: {
      en: { 我的片单: 'My List', 热门电影: 'Popular' },
      'zh-Hant': { 我的片单: '我的片單' },
    },
  };

  process.env.REX_LOCALE = 'en_US';
  expect(WidgetAdaptor.i18n('我的片单')).toBe('My List');
  expect(WidgetAdaptor.i18n('未翻译')).toBe('未翻译');

  process.env.REX_LOCALE = 'zh-TW';
  expect(WidgetAdaptor.i18n('我的片单')).toBe('我的片單');

  process.env.REX_LOCALE = 'zh-CN';
  expect(WidgetAdaptor.i18n('我的片单')).toBe('我的片单');
});
