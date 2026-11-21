interface BaseParams {
  /**
   * 条目的原始 ID（模块自己的 id，TMDB 条目为 TMDB 编号）
   */
  id: string;
  /**
   * TMDB ID
   */
  tmdbId?: string;
  /**
   * IMDB ID
   */
  imdbId?: string;
  /**
   * 类型
   */
  type: 'tv' | 'movie' | 'other';
  /**
   * 搜索用的片名（仅字幕和弹幕入口会收到）
   */
  title?: string;
  /**
   * 剧名（电影为片名）
   */
  seriesName?: string;
  /**
   * 分集名
   */
  episodeName?: string;
  /**
   * 播出日期
   */
  airDate?: string;
  /**
   * 首播日期
   */
  premiereDate?: string;
  /**
   * 时长（秒）
   */
  runtime?: string;
  /**
   * 季
   */
  season?: string;
  /**
   * 集
   */
  episode?: string;
  /**
   * 条目的 link
   */
  link?: string;
  /**
   * 视频链接
   * @deprecated Rex 播放上下文不传入 videoUrl，仅作历史兼容保留
   */
  videoUrl?: string;
}
