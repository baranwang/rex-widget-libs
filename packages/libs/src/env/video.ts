interface GenreItem {
  /** 分类 ID，详情页打开列表时作为 genreId 回传 */
  id: string;
  /** 分类标题 */
  title: string;
}

interface PersonItem {
  /** 人物 ID，详情页打开列表时作为 peopleId 回传 */
  id: string;
  /** 人物名称 */
  title: string;
  /** 头像地址 */
  avatar?: string;
  /** 角色 */
  role?: string;
}

interface TrailerItem {
  /** 预告片封面 */
  coverUrl?: string;
  /** 预告片地址 */
  url: string;
}

interface VideoItemChild {
  /** 唯一标识符。对于 url 类型为 url 地址,对于 douban/imdb/tmdb 类型为对应 ID。tmdb ID 格式为 type.id,如 tv.123 */
  id: string;
  /** 类型标识。forward 表示可匹配的网盘资源身份，客户端会归一为 fw- 前缀 */
  type: 'url' | 'detail' | 'douban' | 'imdb' | 'tmdb' | 'forward';
  /** 标题 */
  title: string;
  /** 通用兜底封面。横图位排在 backdropPath 之后，竖图位排在最后 */
  coverUrl?: string;
  /** 纵向封面图片地址 */
  posterPath?: string;
  /** 详情页海报位专用，覆盖 posterPath */
  detailPoster?: string;
  /** 横向封面地址 */
  backdropPath?: string;
  /** 发布时间 */
  releaseDate?: string;
  /** 媒体类型 */
  mediaType?: 'tv' | 'movie';
  /** 评分 */
  rating?: string;
  /** 分类 */
  genreTitle?: string;
  /** 可点击分类，详情页会用 id 打开列表 */
  genreItems?: GenreItem[];
  /** 演员/人物，详情页会用 id 打开列表 */
  peoples?: PersonItem[];
  /** 时长(秒) */
  duration?: number;
  /** 时长文本格式 */
  durationText?: string;
  /** 预览视频地址 */
  previewUrl?: string;
  /** 预告片 */
  trailers?: TrailerItem[];
  /** 视频播放地址 */
  videoUrl?: string;
  /** 详情页地址 */
  link: string;
  /** 集数 */
  episode?: number;
  /** 描述 */
  description?: string;
  /** 播放器类型 */
  playerType?: 'system' | 'app';
  /** 剧照/截图列表，详情页展示 */
  backdropPaths?: string[];
}

/**
 * 视频项目的元数据接口
 */
interface VideoItem extends VideoItemChild {
  /** 子项目列表(最多一层) */
  childItems?: VideoItemChild[];
  /** 剧集列表 */
  episodeItems?: VideoItem[];
  /** 相关推荐 */
  relatedItems?: VideoItem[];
}

declare let loadDetail: (link: string) => Promise<Omit<VideoItem, 'videoUrl'> & Pick<Required<VideoItem>, 'videoUrl'>>;
