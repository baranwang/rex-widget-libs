declare let WidgetMetadata: WidgetMetadata;

interface WidgetMetadata {
  /** Widget 唯一标识符 */
  id: string;
  /** Widget 显示标题 */
  title: string;
  /** Widget 描述 */
  description?: string;
  /** 作者 */
  author?: string;
  /** 网站地址 */
  site?: string;
  /** Widget 版本 */
  version?: string;
  /** 所需 Rex 版本 */
  requiredVersion?: string;
  /**
   * Widget 图标地址（官方 demo 字段名）
   */
  icon?: string;
  /**
   * Widget 图标地址（Rex 插件字段名，与 icon 同一含义）
   */
  iconurl?: string;
  /**
   * 文案国际化：locale → 源文案 → 译文
   */
  i18n?: Partial<Record<WidgetI18nLocale, Record<string, string>>>;
  /**
   * 详情数据缓存时长，单位：秒
   * @default 60
   */
  detailCacheDuration?: number;
  /**
   * 全局参数配置
   */
  globalParams?: WidgetModuleParam[];
  /** 功能模块列表 */
  modules: WidgetModule[];
  /** 搜索功能配置 */
  search?: {
    /** 搜索标题 */
    title: string;
    /** 搜索函数名 */
    functionName: string;
    /** 搜索参数配置 */
    params: WidgetModuleParam[];
  };
}

interface BaseWidgetModule {
  /** 模块唯一标识符 */
  id: string;
  /** 模块类型 */
  type?: "danmu" | "stream" | "subtitle";
  /** 模块标题 */
  title: string;
  /** 模块描述 */
  description?: string;
  /** 是否需要 WebView */
  requiresWebView?: boolean;
  /** 处理函数名 */
  functionName: string;
  /** 是否支持分段模式 */
  sectionMode?: boolean;
  /**
   * 缓存时长，单位：秒
   * @default 3600
   */
  cacheDuration?: number;
  /** 参数配置 */
  params?: WidgetModuleParam[];
}

interface WidgetModuleVideo extends BaseWidgetModule {
  type?: never;
}

interface WidgetModuleDanmu extends BaseWidgetModule {
  type: "danmu";
  id: "searchDanmu" | "getDetail" | "getComments" | "getDanmuWithSegmentTime";
}

interface WidgetModuleStream extends BaseWidgetModule {
  type: "stream";
  id: "loadResource";
}

interface WidgetModuleSubtitle extends BaseWidgetModule {
  type: "subtitle";
  id: "loadSubtitle";
}

type WidgetI18nLocale =
  | "en"
  | "zh-Hans"
  | "zh-Hant"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "pt-BR"
  | "ru"
  | "ar"
  | (string & {});

type WidgetModule = WidgetModuleVideo | WidgetModuleDanmu | WidgetModuleStream | WidgetModuleSubtitle;

type WidgetModuleParamType =
  | "input"
  | "constant"
  | "enumeration"
  | "count"
  | "page"
  | "offset"
  | "language"
  | "userId";

interface WidgetModuleParam {
  /** 参数名 */
  name: string;
  /** 参数显示标题 */
  title: string;
  /** 参数类型 */
  type: WidgetModuleParamType;
  /** 参数描述 */
  description?: string;
  /** 默认值 */
  value?: string;
  /** 当符合该条件时才会触发该参数 */
  belongTo?: {
    /** 所属参数的子参数 */
    paramName: string;
    /** 所属参数包含的值 */
    value: string[];
  };
  /** 占位符选项 */
  placeholders?: Array<{
    title: string;
    value: string;
  }>;
  /** 枚举选项 */
  enumOptions?: Array<{
    title: string;
    value: string;
  }>;
}
