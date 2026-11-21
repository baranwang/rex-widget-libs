interface StreamSourceItem {
  name: string;
  description?: string;
  url: string;
  customHeaders?: Record<string, string>;
  headers?: Record<string, string>;
  playerType?: 'system' | 'app';
  /** 该线路附带的外挂字幕列表 */
  externalSubtitles?: ExternalSubtitleItem[];
}
