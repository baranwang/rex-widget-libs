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
  /** 预告片视频地址（Rex 官方推荐字段） */
  videoUrl?: string;
  /** 预告片地址（兼容别名） */
  url?: string;
}

/**
 * 条目的媒体类型（包含视频、人物以及 Rex 0.0.7 音乐/听书类型）
 */
type MediaType = 'tv' | 'movie' | 'person' | 'album' | 'song' | 'playlist' | 'albumList' | 'genre' | 'radio';

interface VideoItemChild {
  /** 唯一标识符（字符串或整数）。对于 url 类型为稳定 ID，对于 tmdb 类型可为数字 ID 或 type.id */
  id: string | number;
  /** 类型标识。forward 表示可匹配的网盘资源身份，person 表示自有歌手/人物条目 */
  type: 'url' | 'detail' | 'douban' | 'imdb' | 'tmdb' | 'forward' | 'person';
  /** 标题 */
  title: string;
  /** 卡片副标题（注意不是字幕，外挂字幕请使用 externalSubtitles） */
  subtitle?: string;
  /** 通用兜底封面。横图位排在 backdropPath 之后，竖图位排在最后 */
  coverUrl?: string;
  /** 封面宽高比 */
  coverRatio?: number;
  /** 纵向封面图片地址 */
  posterPath?: string;
  /** 详情页海报位专用，覆盖 posterPath */
  detailPoster?: string;
  /** 横向封面地址 */
  backdropPath?: string;
  /** 发布时间 */
  releaseDate?: string;
  /** 媒体类型 */
  mediaType?: MediaType;
  /** 评分（数字或数字字符串） */
  rating?: number | string;
  /** 分类 */
  genreTitle?: string;
  /** 可点击分类，详情页会用 id 打开列表 */
  genreItems?: GenreItem[];
  /** 演员/人物/歌手署名，详情页会用 id 打开列表 */
  peoples?: PersonItem[];
  /** 人物头像（用于 type: 'person' 或歌手 profile 返回） */
  avatar?: string;
  /** 人物角色/职业 */
  role?: string;
  /** 语言 */
  language?: string;
  /** 时长(秒) */
  duration?: number;
  /** 时长文本格式 */
  durationText?: string;
  /** 预览视频地址 */
  previewUrl?: string;
  /** 专辑动态封面 HTTP(S) 视频地址（Rex 0.0.7+，由 iOS 专辑详情消费） */
  albumMotionArtwork?: string;
  /** 预告片（推荐 [{ coverUrl, videoUrl }]） */
  trailers?: TrailerItem[];
  /** 视频/音频播放地址 */
  videoUrl?: string;
  /** 详情页地址（type: 'url' 时传给 loadDetail） */
  link?: string;
  /** 季数（整数或整数字符串） */
  season?: number | string;
  /** 集数（整数） */
  episode?: number;
  /** 描述 */
  description?: string;
  /** 播放器类型（system 优先系统播放器，app 优先软件解码） */
  playerType?: 'system' | 'app';
  /** 播放和加载图片时附带的自定义请求头 */
  customHeaders?: Record<string, string>;
  /** customHeaders 别名 */
  headers?: Record<string, string>;
  /** 条目外挂字幕列表 */
  externalSubtitles?: ExternalSubtitleItem[];
  /** 剧照/截图列表，详情页展示 */
  backdropPaths?: string[];
  /** 长按或右键打开的条目自定义菜单操作列表（Rex 0.0.9+） */
  actions?: WidgetAction[];
}

/**
 * 媒体条目的元数据接口（支持视频、人物以及音乐专辑/歌曲/歌单/流派/电台）
 */
interface VideoItem extends VideoItemChild {
  /** 子项目列表（如 albumList 详情返回专辑集合） */
  childItems?: VideoItemChild[];
  /** 剧集列表（旧版音乐专辑亦可用作兼容曲目列表） */
  episodeItems?: VideoItem[];
  /** 专辑或歌单的完整曲目列表（Rex 0.0.7+，数组顺序即播放顺序） */
  tracks?: VideoItem[];
  /** 相关推荐 */
  relatedItems?: VideoItem[];
}

/**
 * 列表模块隐式参数。从详情页分类、人物或音乐流派/电台/歌手页面进入列表时由客户端注入。
 */
interface VideoListParams {
  /** 分类/流派 ID，对应 genreItems[].id 或 mediaType: 'genre' 条目的 link/id */
  genreId?: string;
  /** 人物/歌手 ID，对应 peoples[].id 或 type: 'person' 条目的 id */
  peopleId?: string;
  /** 电台 ID（Rex 0.0.7+），对应 mediaType: 'radio' 条目的 link/id */
  radioId?: string;
  /** 音乐流派/电台/歌手分区（Rex 0.0.7+） */
  section?: 'albums' | 'songs' | 'artists' | 'profile' | (string & {});
}

/**
 * 详情加载函数（仅接收 link 字符串，收不到参数对象；没有结果时请返回 [] 或抛出错误，不要返回 null）
 */
declare let loadDetail: (link: string) => VideoItem | VideoItem[] | Promise<VideoItem | VideoItem[]>;
