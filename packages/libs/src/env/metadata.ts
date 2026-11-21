declare let WidgetMetadata: WidgetMetadata;

/**
 * 模块内容类型（Rex 0.0.7+）
 */
type WidgetContentType = 'video' | 'music' | 'audiobook' | 'shortDrama';

interface WidgetMetadata {
  /** Widget 唯一标识符（必填，发布后不要修改） */
  id: string;
  /** Widget 显示标题（必填） */
  title: string;
  /** Widget 描述 */
  description?: string;
  /** 作者 */
  author?: string;
  /** 网站地址 */
  site?: string;
  /** Widget 版本（Rex 必填，修改模块后递增） */
  version?: string;
  /** 最低脚本引擎版本（Rex 必填；已发布基线为 0.0.6，开发版为 0.0.7） */
  requiredVersion?: string;
  /**
   * 声明整个模块的内容类型（Rex 0.0.7+，依赖此字段时需设置 requiredVersion 为 0.0.7）
   */
  contentType?: WidgetContentType;
  /**
   * 是否作为连播的默认偏好
   * @default false
   */
  continuousPlay?: boolean;
  /**
   * Widget 图标地址（历史兼容字段名，Rex 已忽略，建议使用 iconurl）
   */
  icon?: string;
  /**
   * Widget 图标地址（也接受 iconUrl / iconURL）
   */
  iconurl?: string;
  /**
   * Widget 图标地址（iconurl 别名）
   */
  iconUrl?: string;
  /**
   * Widget 图标地址（iconurl 别名）
   */
  iconURL?: string;
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
   * 全局参数配置，对所有入口生效
   */
  globalParams?: WidgetModuleParam[];
  /** 功能模块列表 */
  modules: WidgetModule[];
  /** 搜索入口配置（与 modules 项使用相同结构） */
  search?: WidgetSearchModule;
}

interface BaseWidgetModule {
  /** 模块唯一标识符（推荐填写稳定字符串；缺省时由标题计算） */
  id?: string;
  /** 模块类型（默认 video） */
  type?: 'video' | 'person' | 'danmu' | 'stream' | 'subtitle';
  /** 模块标题 */
  title: string;
  /** 模块副标题 */
  subtitle?: string;
  /** 模块图标地址 */
  iconurl?: string;
  /** 模块图标地址（iconurl 别名） */
  iconUrl?: string;
  /** 模块图标地址（iconurl 别名） */
  iconURL?: string;
  /** 模块描述 */
  description?: string;
  /**
   * 是否需要 WebView
   * @deprecated Rex 已忽略该字段
   */
  requiresWebView?: boolean;
  /** 处理函数名（同一文件内的顶层函数名） */
  functionName: string;
  /**
   * 是否支持分段模式
   * @deprecated Rex 已忽略该字段
   */
  sectionMode?: boolean;
  /**
   * 缓存时长，单位：秒
   * @default 86400
   */
  cacheDuration?: number;
  /** 参数配置 */
  params?: WidgetModuleParam[];
}

interface WidgetModuleVideo extends BaseWidgetModule {
  type?: 'video';
}

interface WidgetModulePerson extends BaseWidgetModule {
  type: 'person';
}

interface WidgetSearchModule extends BaseWidgetModule {
  type?: 'video' | 'person';
}

interface WidgetModuleDanmu extends BaseWidgetModule {
  type: 'danmu';
  id: 'searchDanmu' | 'getDetail' | 'getComments' | 'getCommentsWithSegmentTime' | 'getDanmuWithSegmentTime';
}

interface WidgetModuleStream extends BaseWidgetModule {
  type: 'stream';
  id: 'loadResource';
}

interface WidgetModuleSubtitle extends BaseWidgetModule {
  type: 'subtitle';
  id: 'loadSubtitle';
}

type WidgetI18nLocale =
  | 'en'
  | 'zh-Hans'
  | 'zh-Hant'
  | 'ja'
  | 'ko'
  | 'es'
  | 'fr'
  | 'pt-BR'
  | 'ru'
  | 'ar'
  | (string & {});

type WidgetModule =
  | WidgetModuleVideo
  | WidgetModulePerson
  | WidgetModuleDanmu
  | WidgetModuleStream
  | WidgetModuleSubtitle;

type WidgetModuleParamType =
  | 'input'
  | 'constant'
  | 'enumeration'
  | 'count'
  | 'page'
  | 'offset'
  | 'language'
  | 'timezone'
  | 'folder'
  | 'userId'
  | 'configId';

interface WidgetModuleParamOption {
  /** 选项显示标题 */
  title: string;
  /** 选项值（必须是字符串） */
  value: string;
}

interface WidgetModuleParamBelongTo {
  /** 所属参数名 */
  paramName: string;
  /** 所属参数包含的值列表 */
  value: string[];
}

interface WidgetModuleParamDynamicOptions {
  /** 动态加载选项的顶层函数名，返回 WidgetModuleParamOption[] */
  functionName: string;
  /** 依赖的参数名列表 */
  dependsOn?: string[];
}

interface WidgetModuleParam {
  /** 参数名 */
  name: string;
  /** 参数显示标题 */
  title: string;
  /** 参数类型 */
  type: WidgetModuleParamType;
  /** 参数描述 */
  description?: string;
  /** 默认值（必须是字符串） */
  value?: string;
  /** 起始页码（整数，仅 page 类型有效，设为 0 时从 0 开始） */
  startPage?: number;
  /** 当符合条件（对象或对象数组，全部满足）时才会显示该参数 */
  belongTo?: WidgetModuleParamBelongTo | WidgetModuleParamBelongTo[];
  /** 占位符选项 */
  placeholders?: WidgetModuleParamOption[];
  /** 枚举选项 */
  enumOptions?: WidgetModuleParamOption[];
  /** 动态枚举选项配置（仅 enumeration 类型有效） */
  dynamicOptions?: WidgetModuleParamDynamicOptions;
}
