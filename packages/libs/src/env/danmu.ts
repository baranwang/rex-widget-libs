interface AnimeItem {
  animeId: string | number;
  animeTitle: string;
  bangumiId?: string | number;
}

interface GetDetailResponseItem {
  /**
   * 透传给 getComments 的 commentId
   */
  episodeId: string | number;
  episodeTitle: string;
  /**
   * 分集序号（如 "1"）
   */
  episodeNumber?: string | number;
}

interface EpisodeItem {
  commentId: string;
}

interface CommentItem {
  cid?: number | string;
  /**
   * 弹幕属性字符串，如 `"1.0,1,16777215"`（时间,模式,颜色）或 `"1.0,1,16777215,userId"`
   */
  p: string;
  /**
   * 弹幕内容
   */
  m: string;
}

/**
 * 弹幕元组格式：[时间, 位置, 颜色, 额外信息, 文本]
 */
type CommentTuple = [number, string | number, string | number, string, string];

interface GetCommentsResponse {
  count?: number;
  comments: Array<CommentItem | CommentTuple>;
}

/**
 * danmuku 行数组格式：{ danmuku: [[时间, 位置, 颜色, "", 文本]] }
 */
interface DanmukuCommentsResponse {
  danmuku: CommentTuple[];
}

/**
 * 弹幕评论返回值：支持 comments 对象、danmuku 对象、裸数组或 XML/JSON 文本
 */
type DanmuCommentsResult = GetCommentsResponse | DanmukuCommentsResponse | CommentItem[] | string;

interface GetCommentsWithSegmentTimeParams extends BaseParams, AnimeItem, EpisodeItem {
  /**
   * 分段时间（Rex 传入字符串，兼容数值）
   */
  segmentTime: string | number;
}

interface GetDanmuWithSegmentTimeParams extends GetCommentsWithSegmentTimeParams {}

type GetCommentsWithSegmentTimeResponse = DanmuCommentsResult;

type GetDanmuWithSegmentTimeResponse = DanmuCommentsResult;
