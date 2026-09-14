export const ENCRYPT_ENDPOINT = 'https://api.rexnow.tv/api/widgets/encrypt';
export const ENCRYPT_MAX_BYTES = 2 * 1024 * 1024;
const ENCRYPT_TIMEOUT_MS = 150_000;

const HTTP_ERRORS: Record<number, string> = {
  400: '服务无法识别这个模块，请检查源码。',
  413: '文件过大，请缩小后重试。',
  422: '源码无法完成混淆，请检查模块语法。',
  429: '操作过于频繁，请稍后再试。',
  503: '加密服务暂时繁忙，请稍后再试。',
};

export function isEncryptedWidget(source: string): boolean {
  return /^(?:FWENC|REXENC)/.test(source.trimStart());
}

export function validateEncryptEnvelope(text: string): void {
  const lines = text.split('\n');
  if (lines.length !== 3 || lines[0] !== 'REXENC') {
    throw new Error('服务返回了不兼容的格式，请稍后重试。');
  }

  try {
    const header = JSON.parse(lines[1] ?? '');
    if (
      header.v !== 2 ||
      header.mkv !== 'rex-1' ||
      header.alg !== 'A256GCM' ||
      typeof header.iv !== 'string' ||
      typeof header.kb !== 'string' ||
      Buffer.from(header.iv, 'base64').length !== 12 ||
      Buffer.from(header.kb, 'base64').length !== 60 ||
      Buffer.from((lines[2] ?? '').trim(), 'base64').length <= 16
    ) {
      throw new Error();
    }
  } catch {
    throw new Error('加密结果不完整，请重试。');
  }
}

export async function encryptWidgetSource(source: string): Promise<string> {
  if (!source.trim()) {
    throw new Error('请选择文件，或粘贴模块源码。');
  }
  if (Buffer.byteLength(source) > ENCRYPT_MAX_BYTES) {
    throw new Error('文件超过 2 MiB，请缩小后重试。');
  }
  if (isEncryptedWidget(source)) {
    throw new Error('这是已加密的模块。请使用原始 JavaScript 源码。');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENCRYPT_TIMEOUT_MS);

  try {
    const response = await fetch(ENCRYPT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: source,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(HTTP_ERRORS[response.status] ?? `加密失败（HTTP ${response.status}），请稍后重试。`);
    }

    const output = await response.text();
    validateEncryptEnvelope(output);
    return output;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('等待已超时，请稍后重试。');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
