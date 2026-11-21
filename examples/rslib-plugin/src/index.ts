WidgetMetadata = {
  id: 'test-widget',
  title: 'Test Widget',
  author: 'Baran',
  description: 'Test Widget Description',
  version: '1.0.0',
  requiredVersion: '0.0.6',
  continuousPlay: false,
  i18n: {
    en: {
      'Test Widget': 'Test Widget',
    },
  },
  globalParams: [
    {
      name: 'server',
      title: 'Server',
      type: 'constant',
      value: 'https://api.example.com',
    },
    {
      name: 'language',
      title: 'Language',
      type: 'language',
    },
  ],
  modules: [
    {
      id: 'test-module',
      title: 'Test Module',
      subtitle: 'Test Module Subtitle',
      type: 'video',
      functionName: 'testFunction',
      params: [
        {
          name: 'foo',
          title: 'Foo',
          type: 'input',
        },
        {
          name: 'bar',
          title: 'Bar',
          type: 'enumeration',
          enumOptions: [
            {
              title: 'Option 1',
              value: 'option1',
            },
            {
              title: 'Option 2',
              value: 'option2',
            },
            {
              title: 'Option 3',
              value: 'option3',
            },
          ],
        },
        {
          name: 'genre',
          title: 'Genre',
          type: 'enumeration',
          enumOptions: [{ title: 'All', value: '' }],
          belongTo: { paramName: 'bar', value: ['option1', 'option2'] },
          dynamicOptions: { functionName: 'loadGenreOptions', dependsOn: ['bar'] },
        },
        {
          name: 'baz',
          title: 'Baz',
          description: 'Baz Description',
          type: 'constant',
          value: 'test-value',
        },
        {
          name: 'page',
          title: 'Page',
          type: 'page',
        },
      ],
    },
    {
      id: 'test-module-2',
      title: 'Test Module 2',
      subtitle: 'Test Module 2 Subtitle',
      functionName: 'testFunction2',
      params: [],
    },
    {
      type: 'danmu',
      id: 'searchDanmu',
      functionName: 'searchDanmu',
      title: 'Search Danmu',
      subtitle: 'Search Danmu Subtitle',
      params: [],
    },
    {
      type: 'danmu',
      id: 'getDetail',
      functionName: 'getDetail',
      title: 'Get Detail',
      subtitle: 'Get Detail Subtitle',
      params: [],
    },
    {
      type: 'danmu',
      id: 'getComments',
      functionName: 'getComments',
      title: 'Get Comments',
      subtitle: 'Get Comments Subtitle',
      params: [],
    },
  ],
  search: {
    id: 'search',
    title: 'Search',
    functionName: 'searchContent',
    params: [{ name: 'page', title: 'Page', type: 'page' }],
  },
};

testFunction = async (params) => {
  console.log(params);
  return [];
};

loadGenreOptions = async (params) => {
  console.log(params.bar);
  return [{ title: 'All', value: '' }];
};

searchContent = async (params) => {
  console.log(params.keyword, params.page);
  return [];
};

loadDetail = async (link) => {
  return {
    id: link,
    type: 'url',
    link,
    title: Widget.i18n('Test Widget'),
  };
};
