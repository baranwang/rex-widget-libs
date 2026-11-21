/// <reference types='@rexnow/libs/env' />
declare namespace TestWidget {
    interface GlobalParams {
        /**
         * Server
         * @default 'https://api.example.com'
         */
        server: 'https://api.example.com';
        /** Language */
        language: string;
    }
}

//#region test-module
/** Params of Test Module */
interface TestFunctionParams extends TestWidget.GlobalParams, VideoListParams {
    /** Foo */
    foo: string;
    /** Bar */
    bar: 'option1' | 'option2' | 'option3';
    /** Genre */
    genre?: string;
    /**
     * Baz
     * @description Baz Description
     * @default 'test-value'
     */
    baz: 'test-value';
    /** Page */
    page: string;
}

/** Return Type of Test Module */
interface TestFunctionReturnType extends Array<VideoItem> {
}

/**
 * Test Module
 * @description Test Module Subtitle
 */
declare let testFunction: (params: TestFunctionParams) => TestFunctionReturnType | Promise<TestFunctionReturnType>;
//#endregion test-module

//#region test-module-2
/** Params of Test Module 2 */
interface TestFunction2Params extends TestWidget.GlobalParams, VideoListParams {
}

/** Return Type of Test Module 2 */
interface TestFunction2ReturnType extends Array<VideoItem> {
}

/**
 * Test Module 2
 * @description Test Module 2 Subtitle
 */
declare let testFunction2: (params: TestFunction2Params) => TestFunction2ReturnType | Promise<TestFunction2ReturnType>;
//#endregion test-module-2

//#region searchDanmu
/** Params of Search Danmu */
interface SearchDanmuParams extends TestWidget.GlobalParams, BaseParams {
}

interface SearchDanmuReturnType {
    animes: Array<AnimeItem>;
}

/**
 * Search Danmu
 * @description Search Danmu Subtitle
 */
declare let searchDanmu: (params: SearchDanmuParams) => SearchDanmuReturnType | Promise<SearchDanmuReturnType>;
//#endregion searchDanmu

//#region getDetail
/** Params of Get Detail */
interface GetDetailParams extends TestWidget.GlobalParams, BaseParams, AnimeItem {
}

interface GetDetailReturnType extends Array<GetDetailResponseItem> {
}

/**
 * Get Detail
 * @description Get Detail Subtitle
 */
declare let getDetail: (params: GetDetailParams) => GetDetailReturnType | Promise<GetDetailReturnType>;
//#endregion getDetail

//#region getComments
/** Params of Get Comments */
interface GetCommentsParams extends TestWidget.GlobalParams, BaseParams, EpisodeItem {
}

type GetCommentsReturnType = DanmuCommentsResult;

/**
 * Get Comments
 * @description Get Comments Subtitle
 */
declare let getComments: (params: GetCommentsParams) => GetCommentsReturnType | Promise<GetCommentsReturnType>;
//#endregion getComments

//#region search
/** Params of Search */
interface SearchContentParams extends TestWidget.GlobalParams {
    /** 搜索关键词（由 Rex 注入） */
    keyword: string;
    /** Page */
    page: string;
}

/** Return Type of Search */
interface SearchContentReturnType extends Array<VideoItem> {
}

/** Search */
declare let searchContent: (params: SearchContentParams) => SearchContentReturnType | Promise<SearchContentReturnType>;
//#endregion search

//#region dynamicOptions:loadGenreOptions
/** Dynamic options loader: loadGenreOptions */
declare let loadGenreOptions: (params: TestFunctionParams) => Array<WidgetModuleParamOption> | Promise<Array<WidgetModuleParamOption>>;
//#endregion dynamicOptions:loadGenreOptions
