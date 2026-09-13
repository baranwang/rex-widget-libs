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
}

interface EpisodeItem {
  commentId: string;
}

interface CommentItem {
  cid?: number | string;
  p: `${number},${1 | 4 | 5},${number},${string}`;
  m: string;
}

/**
 * README 弹幕格式 2：[时间, 位置, 颜色, 额外信息, 文本]
 */
type CommentTuple = [number, string, string, string, string];

interface GetCommentsResponse {
  count: number;
  comments: Array<CommentItem | CommentTuple>;
}

interface GetDanmuWithSegmentTimeParams extends BaseParams, AnimeItem, EpisodeItem {
  /**
   * 分段时间
   */
  segmentTime: number;
}

interface GetDanmuWithSegmentTimeResponse extends GetCommentsResponse {}
