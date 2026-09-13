interface SubtitleItem {
  id: string;
  title: string;
  lang: string;
  count: number;
  url: string;
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

declare let resolveSubtitleArchive: (params: ResolveSubtitleArchiveParams) => ResolveSubtitleArchiveResult | Promise<ResolveSubtitleArchiveResult>;
