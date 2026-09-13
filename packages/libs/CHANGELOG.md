# @rexnow/libs

## 3.0.0

### Major Changes

- ddb5a77: Rename the player from Forward to Rex and publish packages under the `@rexnow` scope.

### Minor Changes

- c325f08: Add the missing public widget env types used by official Forward demo scripts and official Rex plugins.

## 2.1.0

## 2.0.0

### Major Changes

- 25651b6: 更新 WidgetAdaptor 类型，对齐 Widget

## 1.9.0

## 1.8.5

## 1.8.4

### Patch Changes

- b7909a8: 在 CommentItem 接口中将 cid 属性改为可选，以提高灵活性

## 1.8.3

### Patch Changes

- bbefea2: 在 WidgetAdaptor 中添加 keys 方法以获取存储目录中的所有键

## 1.8.2

## 1.8.1

## 1.8.0

### Minor Changes

- 4a163b4: 在 WidgetAdaptor 中添加 base64Data 选项以支持 Base64 编码数据处理

## 1.7.3

### Patch Changes

- 8f43d12: 修复 zlibMode 获取数据的问题

## 1.7.2

### Patch Changes

- 7c7a851: WidgetAdaptor 中补充 remove 方法
- 586de84: 在 WidgetAdaptor 中将异步文件操作改为同步操作，对齐 Widget

## 1.7.1

### Patch Changes

- 87e654d: 在 Danmu 模块的参数接口中添加 EpisodeItem，以支持分段时间的相关功能

## 1.7.0

### Minor Changes

- 960cb5f: 在 Danmu 模块中添加分段时间参数及响应接口

### Patch Changes

- b4873ad: 在 WidgetAdaptor 中修复存储方法，确保文件路径编码正确
- 2b3aea1: 在 WidgetAdaptor 中优化存储方法，增加文件存在性检查并修正写入编码

## 1.6.0

### Minor Changes

- 4f6c7f2: 在 HTTP 请求中添加 zlibMode 选项，支持解压缩响应数据

### Patch Changes

- c4a7749: 优化 HTTP 请求体处理，支持字符串和对象类型的 body

## 1.5.1

### Patch Changes

- 0840c7b: 处理多值 headers，优化 HTTP 请求响应中的 headers 结构

## 1.5.0

### Minor Changes

- 5b57db7: 修改 CommentItem 接口，cid 类型支持字符串，p 属性格式化为特定字符串模板
- 5b57db7: Widget.http 对齐 app 的 params 参数

## 1.4.2

### Patch Changes

- 2e05130: 更新 GetDetailResponseItem 接口，修改 animeId 和 animeTitle 为 episodeId 和 episodeTitle

## 1.4.1

### Patch Changes

- c02d0fa: 完善弹幕类型定义和开发服务器功能

  - 优化弹幕相关接口类型定义，增强类型安全性
  - 改进开发服务器启动信息展示，支持显示局域网访问地址
  - 完善弹幕生成器的类型处理逻辑

## 1.4.0

### Minor Changes

- 32d48fb: 对齐 forward widget 类型

## 1.3.0

### Minor Changes

- f2189f8: 更新 `video`/`danmu` 环境定义与 `widget-adaptor` 适配逻辑，配合 dev-server 能力提供更完善的类型与运行时行为。

## 1.2.3

### Patch Changes

- 9305817: 修改 WidgetAdaptor 的 post 方法以支持请求体的 JSON 序列化

## 1.2.2

### Patch Changes

- 628f6a7: 修复 Widget.tmdb.get 的返回类型

## 1.2.1

## 1.2.0

### Minor Changes

- e521147: 增加弹幕类型插件支持

## 1.1.1

## 1.1.0

### Minor Changes

- 38b133d: 新增脚手架相关
