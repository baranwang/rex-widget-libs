import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { inflate } from 'node:zlib';
import { load } from 'cheerio';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  zlibMode?: boolean;
  base64Data?: boolean;
  allow_redirects?: boolean;
}

const createHttpRequest = async <T>(
  url: string,
  method: 'GET' | 'POST',
  options?: RequestOptions & { body?: unknown },
) => {
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  if (method === 'POST' && options?.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  const uri = new URL(url);
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      uri.searchParams.set(key, value);
    });
  }

  let data: T;
  const response = await fetch(uri, fetchOptions);
  if (options?.base64Data) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    data = base64Data as T;
  } else if (options?.zlibMode) {
    data = (await promisify(inflate)(await response.arrayBuffer())).toString('utf-8') as T;
  } else {
    const textData = await response.text();
    try {
      data = JSON.parse(textData) as T;
    } catch {
      data = textData as T;
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

const STORAGE_CONFIG = {
  get DIR() {
    const dir = path.join(os.tmpdir(), 'rex-widget-adaptor', 'storage');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },
  getFilePath: (key: string) => {
    return path.join(STORAGE_CONFIG.DIR, encodeURIComponent(key));
  },
};

export const WidgetAdaptor = {
  http: {
    get: async <T>(url: string, options?: RequestOptions) => {
      return createHttpRequest<T>(url, 'GET', options);
    },
    post: async <T>(url: string, body: unknown, options?: RequestOptions) => {
      return createHttpRequest<T>(url, 'POST', { ...options, body });
    },
  },
  tmdb: {
    get: async <T>(url: string, options?: RequestOptions) => {
      const urlObj = new URL(`/3/${url}`, 'https://api.themoviedb.org/');
      options ||= {};
      options.headers = {
        ...options.headers,
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      };
      const resp = await WidgetAdaptor.http.get<T>(urlObj.toString(), options);
      return resp.data;
    },
  },
  html: {
    load: ((...args: Parameters<typeof import('cheerio').load>) =>
      new Promise((resolve) => resolve(load(...args)))) as (
      ...args: Parameters<typeof import('cheerio').load>
    ) => Promise<ReturnType<typeof import('cheerio').load>>,
  },
  storage: {
    get: async (key: string) => {
      const filePath = STORAGE_CONFIG.getFilePath(key);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.promises.readFile(filePath, 'utf-8');
    },
    set: (key: string, value: string) => {
      return fs.promises.writeFile(STORAGE_CONFIG.getFilePath(key), value, 'utf-8');
    },
    remove: (key: string) => {
      return fs.promises.rm(STORAGE_CONFIG.getFilePath(key));
    },
    keys: async () => {
      const keys = await fs.promises.readdir(STORAGE_CONFIG.DIR);
      return keys.map((key) => decodeURIComponent(key));
    },
    clear: () => {
      return fs.promises.rm(STORAGE_CONFIG.DIR, { recursive: true });
    },
  },
};
