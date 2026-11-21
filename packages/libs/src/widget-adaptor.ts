import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { inflate } from 'node:zlib';
import { load } from 'cheerio';

export type HttpQueryParams = Record<string, string | number | boolean>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: HttpQueryParams;
  zlibMode?: boolean;
  base64Data?: boolean;
  allow_redirects?: boolean;
}

export interface HttpRequestOptions extends RequestOptions {
  url: string;
  method?: HttpMethod;
  /** 请求体（对象自动 JSON 序列化，字符串按原样发送；Rex 仅读取 data 字段） */
  data?: unknown;
  /**
   * @deprecated Rex 宿主（WidgetShim / modules.rexnow.app 代理）仅消费 `data`，传入 `body` 会被忽略导致空请求体
   */
  body?: never;
  /** 超时时间（秒），默认 20，范围 3–40；仅 Widget.http.request 生效 */
  timeout?: number;
  /** 是否自动解析 JSON 响应体，默认 true；仅 Widget.http.request 生效 */
  decodable?: boolean;
}

export interface HttpResponse<T = unknown> {
  data: T;
  statusCode: number;
  headers: Record<string, string>;
}

export interface TmdbRequestOptions {
  headers?: Record<string, string>;
  params?: HttpQueryParams;
}

const HTTP_REASON_PHRASES: Record<number, string> = {
  301: 'moved permanently',
  302: 'found',
  303: 'see other',
  304: 'unmodified',
  307: 'temporarily redirected',
  308: 'permanently redirected',
  400: 'bad request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not found',
  405: 'method not allowed',
  408: 'request timed out',
  409: 'conflict',
  410: 'no longer exists',
  429: 'too many requests',
  500: 'internal server error',
  502: 'bad gateway',
  503: 'service unavailable',
  504: 'gateway timed out',
};

const MAX_SAFE_BIGINT = BigInt('9007199254740991');

function formatHttpError(status: number, statusText?: string): string {
  const reason =
    HTTP_REASON_PHRASES[status] ??
    (statusText?.trim() ? statusText.trim().toLowerCase() : undefined) ??
    (status < 200 ? 'informational' : status < 400 ? 'redirected' : status < 500 ? 'client error' : 'server error');
  return `HTTP ${status}: ${reason}`;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  const target = name.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
}

/** 超过 JS 安全整数范围的 JSON 整数按字符串解析，与 Rex 运行时一致。 */
function parseJSONLossless(text: string): unknown {
  const normalized = text.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (token) => {
    if (token[0] === '"' || /[.eE]/.test(token)) {
      return token;
    }
    try {
      const value = BigInt(token);
      return value > MAX_SAFE_BIGINT || value < -MAX_SAFE_BIGINT ? JSON.stringify(token) : token;
    } catch {
      return token;
    }
  });
  return JSON.parse(normalized);
}

const createHttpRequest = async <T = unknown>(
  url: string,
  method: HttpMethod,
  options?: RequestOptions & { body?: unknown; timeout?: number; decodable?: boolean },
): Promise<HttpResponse<T>> => {
  const normalizedMethod = method.toUpperCase() as HttpMethod;
  const reqHeaders: Record<string, string> = {
    ...options?.headers,
  };
  const fetchOptions: RequestInit = {
    method: normalizedMethod,
    headers: reqHeaders,
    redirect: options?.allow_redirects === false ? 'manual' : 'follow',
  };

  const uri = new URL(url);
  const isBodyMethod = normalizedMethod === 'POST' || normalizedMethod === 'PUT' || normalizedMethod === 'PATCH';
  const hasBody = options?.body !== undefined && options?.body !== null;

  if (isBodyMethod && !hasBody && options?.params && Object.keys(options.params).length > 0) {
    const formParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      formParams.append(key, String(value));
    });
    fetchOptions.body = formParams.toString();
    if (!hasHeader(reqHeaders, 'content-type')) {
      reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
    }
  } else {
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        uri.searchParams.set(key, String(value));
      });
    }
    if (isBodyMethod && hasBody) {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      if (!hasHeader(reqHeaders, 'content-type')) {
        reqHeaders['Content-Type'] = 'application/json';
      }
    }
  }

  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (typeof options?.timeout === 'number' && Number.isFinite(options.timeout)) {
    const timeoutMs = Math.min(40_000, Math.max(3_000, options.timeout * 1000));
    controller = new AbortController();
    fetchOptions.signal = controller.signal;
    timer = setTimeout(() => controller?.abort(), timeoutMs);
  }

  let response: Response;
  try {
    response = await fetch(uri, fetchOptions);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(formatHttpError(response.status, response.statusText));
  }

  let data: T;
  if (options?.base64Data) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    data = base64Data as T;
  } else if (options?.zlibMode) {
    data = (await promisify(inflate)(await response.arrayBuffer())).toString('utf-8') as T;
  } else {
    const textData = await response.text();
    if (options?.decodable === false) {
      data = textData as T;
    } else {
      try {
        data = parseJSONLossless(textData) as T;
      } catch {
        data = textData as T;
      }
    }
  }

  // 处理多值 headers，如 set-cookie
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    if (headers[key]) {
      headers[key] = `${headers[key]}, ${value}`;
    } else {
      headers[key] = value;
    }
  });

  return {
    data,
    statusCode: response.status,
    headers,
  };
};

const ADAPTOR_ROOT = path.join(os.tmpdir(), 'rex-widget-adaptor');

const STORAGE_CONFIG = {
  get DIR() {
    const dir = path.join(ADAPTOR_ROOT, 'storage');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },
  getFilePath: (key: string) => {
    return path.join(STORAGE_CONFIG.DIR, encodeURIComponent(key));
  },
};

const SHARED_CACHE_CONFIG = {
  getDir: (namespace: string) => {
    return path.join(ADAPTOR_ROOT, 'shared-cache', encodeURIComponent(namespace));
  },
  getFilePath: (namespace: string, key: string) => {
    const dir = SHARED_CACHE_CONFIG.getDir(namespace);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, encodeURIComponent(key));
  },
};

function normalizeLocale(locale: string): string {
  return locale.replace(/_/g, '-').toLowerCase();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function resolveI18n(value: string, dictionary: unknown, locale: string): string {
  if (typeof value !== 'string' || !isPlainRecord(dictionary)) {
    return value;
  }

  const normalized = normalizeLocale(locale);
  const parts = normalized.split('-');
  const candidates = [normalized];
  if (parts[0] === 'zh') {
    candidates.push(/(?:hant|tw|hk|mo)/.test(normalized) ? 'zh-hant' : 'zh-hans');
  } else if (parts[1]?.length === 4) {
    candidates.push(parts.slice(0, 2).join('-'));
  }
  candidates.push(parts[0]);

  for (const candidate of new Set(candidates)) {
    for (const [key, map] of Object.entries(dictionary)) {
      if (normalizeLocale(key) === candidate && isPlainRecord(map)) {
        const translated = map[value];
        if (typeof translated === 'string' && translated.trim()) {
          return translated;
        }
      }
    }
  }

  return value;
}

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

function pickShortcutOptions(options?: RequestOptions): RequestOptions | undefined {
  if (!options) {
    return undefined;
  }
  return {
    headers: options.headers,
    params: options.params,
    zlibMode: options.zlibMode,
    base64Data: options.base64Data,
    allow_redirects: options.allow_redirects,
  };
}

export const WidgetAdaptor = {
  /**
   * 按 WidgetMetadata.i18n 词典解析多语言文案（Rex 0.0.6+）
   */
  i18n: (value: string): string => {
    if (typeof value !== 'string') {
      return value;
    }
    const metadata = (globalThis as { WidgetMetadata?: { i18n?: unknown } }).WidgetMetadata;
    const locale = process.env.REX_LOCALE || Intl.DateTimeFormat().resolvedOptions().locale || 'zh-CN';
    return resolveI18n(value, metadata?.i18n, locale);
  },
  http: {
    get: async <T = unknown>(url: string, options?: RequestOptions) => {
      return createHttpRequest<T>(url, 'GET', pickShortcutOptions(options));
    },
    post: async <T = unknown>(url: string, data?: unknown, options?: RequestOptions) => {
      return createHttpRequest<T>(url, 'POST', { ...pickShortcutOptions(options), body: data });
    },
    put: async <T = unknown>(url: string, data?: unknown, options?: RequestOptions) => {
      return createHttpRequest<T>(url, 'PUT', { ...pickShortcutOptions(options), body: data });
    },
    delete: async <T = unknown>(url: string, options?: RequestOptions) => {
      return createHttpRequest<T>(url, 'DELETE', pickShortcutOptions(options));
    },
    request: async <T = unknown>(options: HttpRequestOptions) => {
      const { url, method = 'GET', data, body: _ignoredBody, ...rest } = options;
      return createHttpRequest<T>(url, method, { ...rest, body: data });
    },
  },
  tmdb: {
    get: async <T = unknown>(url: string, options?: TmdbRequestOptions) => {
      const normalizedPath = url.replace(/^\//, '');
      const urlObj = new URL(`/3/${normalizedPath}`, 'https://api.themoviedb.org/');
      const headers: Record<string, string> = {
        accept: 'application/json',
        ...options?.headers,
      };
      const params: HttpQueryParams = {
        ...options?.params,
      };
      const apiKey = process.env.TMDB_API_KEY;
      if (apiKey) {
        if (apiKey.includes('.')) {
          if (!hasHeader(headers, 'authorization')) {
            headers.Authorization = `Bearer ${apiKey}`;
          }
        } else if (params.api_key === undefined) {
          params.api_key = apiKey;
        }
      }
      const resp = await WidgetAdaptor.http.get<T>(urlObj.toString(), { headers, params });
      return resp.data;
    },
  },
  html: {
    load: (...args: Parameters<typeof load>): ReturnType<typeof load> => load(...args),
  },
  storage: {
    get: <T = unknown>(key: string): T | null => {
      return readJsonFile<T>(STORAGE_CONFIG.getFilePath(key));
    },
    set: (key: string, value: unknown): void => {
      if (value === undefined) {
        return;
      }
      fs.writeFileSync(STORAGE_CONFIG.getFilePath(key), JSON.stringify(value), 'utf-8');
    },
    remove: (key: string): void => {
      fs.rmSync(STORAGE_CONFIG.getFilePath(key), { force: true });
    },
    keys: (): string[] => {
      return fs.readdirSync(STORAGE_CONFIG.DIR).map((key) => decodeURIComponent(key));
    },
    clear: (): void => {
      fs.rmSync(STORAGE_CONFIG.DIR, { recursive: true, force: true });
    },
  },
  sharedCache: {
    get: <T = unknown>(namespace: string, key: string): T | null => {
      const ns = namespace.trim();
      const trimmedKey = key.trim();
      if (!ns || !trimmedKey) {
        return null;
      }
      return readJsonFile<T>(SHARED_CACHE_CONFIG.getFilePath(ns, trimmedKey));
    },
    set: (namespace: string, key: string, value?: unknown): void => {
      const ns = namespace.trim();
      const trimmedKey = key.trim();
      if (!ns || !trimmedKey || value === undefined) {
        return;
      }
      fs.writeFileSync(SHARED_CACHE_CONFIG.getFilePath(ns, trimmedKey), JSON.stringify(value), 'utf-8');
    },
    remove: (namespace: string, key: string): void => {
      const ns = namespace.trim();
      const trimmedKey = key.trim();
      if (!ns || !trimmedKey) {
        return;
      }
      fs.rmSync(SHARED_CACHE_CONFIG.getFilePath(ns, trimmedKey), { force: true });
    },
    keys: (namespace: string): string[] => {
      const ns = namespace.trim();
      if (!ns) {
        return [];
      }
      const dir = SHARED_CACHE_CONFIG.getDir(ns);
      if (!fs.existsSync(dir)) {
        return [];
      }
      return fs.readdirSync(dir).map((key) => decodeURIComponent(key));
    },
  },
};
