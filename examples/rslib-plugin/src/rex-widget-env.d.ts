/// <reference types='@rexnow/libs/env' />
interface GlobalParams {
    /**
     * Server
     * @default 'https://api.example.com'
     */
    server: 'https://api.example.com';
}

//#region test-module
/** Params of Test Module */
interface TestFunctionParams extends GlobalParams {
    /** Foo */
    foo: string;
    /** Bar */
    bar: 'option1' | 'option2' | 'option3';
    /**
     * Baz
     * @description Baz Description
     * @default 'test-value'
     */
    baz: 'test-value';
}

/** Return Type of Test Module */
interface TestFunctionReturnType extends Array<VideoItem> {
}

/**
 * Test Module
 * @description Test Module Description
 */
declare let testFunction: (params: TestFunctionParams) => TestFunctionReturnType | Promise<TestFunctionReturnType>;
//#endregion test-module

//#region test-module-2
/** Params of Test Module 2 */
interface TestFunction2Params extends GlobalParams {
}

/** Return Type of Test Module 2 */
interface TestFunction2ReturnType extends Array<VideoItem> {
}

/**
 * Test Module 2
 * @description Test Module 2 Description
 */
declare let testFunction2: (params: TestFunction2Params) => TestFunction2ReturnType | Promise<TestFunction2ReturnType>;
//#endregion test-module-2

//#region searchDanmu
/** Params of Get Comments */
interface SearchDanmuParams extends GlobalParams, BaseDanmuParams {
}

interface SearchDanmuReturnType {
    animes: Array<AnimeItem>;
}

/**
 * Get Comments
 * @description Get Comments Description
 */
declare let searchDanmu: (params: SearchDanmuParams) => SearchDanmuReturnType | Promise<SearchDanmuReturnType>;
//#endregion searchDanmu

//#region getDetail
/** Params of Get Detail */
interface GetDetailParams extends GlobalParams, BaseDanmuParams, AnimeItem {
}

interface GetDetailReturnType extends Array<EpisodeItem> {
}

/**
 * Get Detail
 * @description Get Detail Description
 */
declare let getDetail: (params: GetDetailParams) => GetDetailReturnType | Promise<GetDetailReturnType>;
//#endregion getDetail

//#region getComments
/** Params of Get Comments */
interface GetCommentsParams extends GlobalParams, BaseDanmuParams, EpisodeItem {
}

interface GetCommentsReturnType extends GetCommentsResponse {
}

/**
 * Get Comments
 * @description Get Comments Description
 */
declare let getComments: (params: GetCommentsParams) => GetCommentsReturnType | Promise<GetCommentsReturnType>;
//#endregion getComments
