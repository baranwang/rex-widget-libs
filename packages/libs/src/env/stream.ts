interface StreamSourceItem {
  name: string;
  description?: string;
  url: string;
  customHeaders?: Record<string, string>;
  headers?: Record<string, string>;
  playerType?: 'system' | 'app';
}
