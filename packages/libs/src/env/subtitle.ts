/**
 * 条目或线路里附带的外挂字幕轨道
 */
interface ExternalSubtitleItem {
  /** 字幕地址 */
  url: string;
  /** 字幕标题 */
  title?: string;
  /** 字幕语言代码（如 zh-CN） */
  language?: string;
  /** 是否默认启用 */
  isDefault?: boolean;
  /** 请求字幕时附带的自定义请求头 */
  customHeaders?: Record<string, string>;
  /** customHeaders 别名 */
  headers?: Record<string, string>;
}

interface SubtitleItem {
  /** 字幕唯一标识（可选） */
  id?: string;
  /** 字幕标题（注意独立字幕入口用 title / lang） */
  title?: string;
  /** 字幕语言代码（如 zh-CN） */
  lang?: string;
  /** 字幕地址 */
  url: string;
  /** 请求字幕时附带的自定义请求头 */
  customHeaders?: Record<string, string>;
  /** customHeaders 别名 */
  headers?: Record<string, string>;
  /**
   * @deprecated Rex 不消费该字段，仅作历史兼容保留
   */
  count?: number;
}

interface SubtitleArchiveFile {
  /** 解压目录内的相对路径，原样返回，不要拼绝对路径 */
  path: string;
  /** 文件名 */
  name: string;
  /** 小写扩展名 */
  extension: string;
  /** 文件大小，可能为空 */
  size?: number;
}

interface ResolveSubtitleArchiveParams {
  archiveName?: string;
  archiveUrl?: string;
  subtitleId?: string;
  subtitleName?: string;
  subtitleLanguage?: string;
  /** 全部解压文件的 JSON 字符串 */
  files?: string;
  /** 客户端支持的字幕文件 JSON 字符串 */
  subtitleFiles?: string;
}

type ResolveSubtitleArchiveResult = string | string[] | { path: string } | { files: string[] } | null;

declare let resolveSubtitleArchive: (
  params: ResolveSubtitleArchiveParams,
) => ResolveSubtitleArchiveResult | Promise<ResolveSubtitleArchiveResult>;
