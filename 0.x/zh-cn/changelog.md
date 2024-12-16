`micro-app` 遵循 [Semantic Versioning 2.0.0](http://semver.org/lang/zh-CN/) 语义化版本规范。

#### 发布周期

- 主版本号：含有破坏性更新和新特性，不在发布周期内。
- 次版本号：每月发布一个带有新特性的向下兼容的版本。
- 修订版本号：每周末会进行日常 bugfix 更新。（如果有紧急的 bugfix，则任何时候都可发布）

---

### 1.0.0-alpha.6

`2022-08-18`

- **New**

  - 🆕 

- **Bug Fix**

  - 🐞 修复了router全局守卫参数和文档不一致的问题。

- **Update**
  - 🚀 


### 1.0.0-alpha.5

`2022-08-01`

- **New**

  - 🆕 新增子应用全局钩子函数mount, unmount，简化接入步骤。

- **Update**
  - 🚀 更新了1.0版本文档。


### 1.0.0-alpha.4

`2022-07-30`

- **New**

  - 🆕 新增了配置`disable-patch-request`，用于阻止MicroApp对子应用fetch、XMLHttpRequest等请求方法的重写。

- **Bug Fix**

  - 🐞 修复了设置document.title, history.scrollRestoration时报`Illegal invocation`错误的问题。
  - 🐞 修复了在umd模式部分场景下二次渲染时全局变量和全局事件丢失的问题。
  - 🐞 修复了高德地图二次渲染时地图无法显示的问题。
  - 🐞 修复了`element-plus`按需加载时，点击ElSelect组件空白区域无法收起的问题。
  - 🐞 修复了umd模式下每次渲染时fetch、XMLHttpRequest等API被重写的问题。

- **Update**
  - 🚀 更新了umd模式下全局事件和全局变量的处理逻辑，不再主动卸载全局事件和删除全局变量。
  - 🚀 更新了1.0版本文档


### 1.0.0-alpha.3

`2022-07-21`

- **New**

  - 🆕 重写了基座的`pushState`、`replaceState`方法，自动将子应用的路由信息同步到浏览器地址。
  - 🆕 重写了子应用的`Document`对象，每个子应用拥有单独的Document实例。

- **Bug Fix**

  - 🐞 修复了Document原型方法绑定到ProxyDocument时报错的问题。

- **Update**

  - 🚀 优化了路由相关代码和逻辑。
  - 🚀 更新了案例，增加适配场景


### 1.0.0-alpha.2

`2022-07-15`

- **New**

  - 🆕 新增了`attachToURL`、`attachAllToURL`方法，用于将子应用的路由信息同步到浏览器地址。
  - 🆕 新增了`setBaseRouter`、`getBaseRouter`方法，用于注册和使用基座路由。
  - 🆕 新增了`ProxyDocument`，为子应用创建一个虚拟的document对象。

- **Bug Fix**

  - 🐞 修复了`ant-design-vue`的弹窗类组件及其它特殊情况下，子应用元素逃逸到原生body上的问题。
  - 🐞 修复了在未设置`public_path`时，子应用的资源地址补全失败的问题。
  - 🐞 修复了子应用在调用fetch等API时，元素绑定没有解除的问题。
  - 🐞 修复了在`@keyframes`名称带有特殊字符时样式隔离失败的问题。

- **Update**

  - 🚀 优化了路由相关代码和逻辑。
  - 🚀 更新了案例。


### 1.0.0-alpha.1

`2022-07-06`

- **New**

  - 🆕 新增了`proxyRequest`，用于拦截fetch、XMLHttpRequest、EventSource请求并进行处理。

- **Bug Fix**

  - 🐞 修复了通过`create-react-app`创建的react应用热更新时报错的问题。
  - 🐞 修复了子应用执行`pushState/replaceState`时`popStateEvent`事件异常触发的问题。

- **Update**

  - 🚀 优化了资源加载相关代码和逻辑。


### 0.8.6

`2022-06-30`

- **New**

  - 🆕 在 plugin 中增加 excludeChecker 和 ignoreChecker 用于主应用主动忽略子应用部分 script 和 link。
  - 🆕 新增了`processHtml`，用于在插件中处理html。

- **Update**

  - 🚀 优化了资源加载相关代码和逻辑。
  - 🚀 优化了单元测试相关代码。


### 1.0.0-alpha.0

`2022-06-30`

- **New**

  - 🆕 新增了独立的路由系统 - `MemoryRouter`，完善JS沙箱。

- **Bug Fix**

  - 🐞 修复了在循环嵌套时`iconfont.js`在部分场景下报错的问题。

- **Update**

  - 🚀 优化了预加载相关代码和逻辑，提高并行渲染能力。


### 0.8.5

`2022-02-14`

- **New**

  - 🆕 插件的loader方法中新增包含script信息的info参数。


### 0.8.4

`2022-01-25`

- **Bug Fix**

  - 🐞 修复了在火狐浏览器80及以上版本中，样式隔离执行速度过慢的问题。


### 0.8.3

`2022-01-20`

- **Bug Fix**

  - 🐞 修复了在css中通过`background-image`引入`svg`时，样式隔离解析失败的问题。

- **Update**

  - 🚀 优化了样式隔离的逻辑，提高兼容和性能。

### 0.8.2

`2022-01-14`

- **New**

  - 🆕 新增了子应用`pureCreateElement`方法，用于创建无绑定的纯净元素。
  - 🆕 新增了子应用`removeDomScope`方法，用于解除元素绑定。


- **Bug Fix**

  - 🐞 修复了基座通过远程连接引入Vue，加载vue子应用报错的问题，issue [#234](https://github.com/micro-zoe/micro-app/issues/234)。

- **Update**

  - 🚀 优化了预加载相关代码和逻辑，减小对基座项目的影响。


### 0.8.1

`2022-01-12`

- **Bug Fix**

  - 🐞 修复了element-plus部分组件逃离元素隔离的问题, issue [#223](https://github.com/micro-zoe/micro-app/issues/223)。
  - 🐞 修复了在使用IE6、7 CSSHack时样式解析失败的问题, issue [#232](https://github.com/micro-zoe/micro-app/issues/223)。

- **Update**

  - 🚀 优化了插件相关代码和逻辑, PR [#224](https://github.com/micro-zoe/micro-app/pull/224) by [LinFeng1997](https://github.com/LinFeng1997)。
  - 🚀 优化了沙箱相关代码和逻辑。


### 0.8.0

`2022-01-07`

- **New**

  - 🆕 新增了在样式隔离下的动态忽略规则。

- **Bug Fix**

  - 🐞 修复了在使用css变量时导致样式丢失的问题，issue [#157](https://github.com/micro-zoe/micro-app/issues/157)、[#121](https://github.com/micro-zoe/micro-app/issues/121)。
  - 🐞 修复了在部分浏览器(如：safari)下，css表现有差异的问题。

- **Update**

  - 🚀 样式隔离重构，提升性能和兼容性。


### 0.7.1

`2021-12-31`

- **Bug Fix**

  - 🐞 修复了link标签在非head时样式丢失的问题
  - 🐞 修复了错误补全svg地址的问题，PR [#207](https://github.com/micro-zoe/micro-app/pull/207) by [icksky](https://github.com/icksky)。
  - 🐞 修复了在部分浏览器下报`WeakRef is not defined`错误的问题。


### 0.7.0

`2021-12-29`

- **New**

  - 🆕  新增Api，对外export `MicroApp`类。

- **Update**

  - 🚀 沙箱重构，性能优化。
  - 🚀 优化了`execScripts`方法，不再使用`Promise.all`，防止单文件加载错误导致后续文件无法执行的问题。
  - 🚀 优化了`getActiveApps`方法，增加对过滤keep-alive应用的支持。


### 0.6.2

`2021-12-19`

- **Bug Fix**

  - 🐞 修复了在SSR环境下，抛出`Image is not defined`的报错问题。


### 0.6.1

`2021-12-17`

- **New**

  - 🆕 新增了`unmountApp`, `unmountAllApps`方法，用于主动卸载应用。
  - 🆕 新增了对`disable-sandbox`, `disable-scopecss`配置的支持。

- **Bug Fix**

  - 🐞 修复了通过`new Image()`创建的元素逃离沙箱的问题，issue [#186](https://github.com/micro-zoe/micro-app/issues/186)，PR [#187](https://github.com/micro-zoe/micro-app/pull/187) by [asiainfoliwei](https://github.com/asiainfoliwei)。
  - 🐞 修复了通过`cloneNode`创建的元素逃离沙箱的问题。

- **Update**

  - 🚀 优化了元素隔离patch原型链方法相关代码。
  - 🚀 优化了kee-alive和destory相关的处理逻辑。
  - 🚀 优化了`unmount`生命周期的触发时机，移动到应用彻底卸载后执行。

### 0.6.0

`2021-12-10`

- **New**

  - 🆕 新增了对keep-alive模式的支持。


### 0.5.3

`2021-12-02`

- **New**

  - 🆕 新增了对ssr模式的全局配置的支持。

- **Bug Fix**

  - 🐞 修复了沙箱中注册的全局变量的映射key在部分场景下没有及时删除的问题。
  - 🐞 修复了在不支持ESModule的项目中，引入`polyfill/jsx-custom-event`报错的问题。


### 0.5.2

`2021-11-25`

- **Bug Fix**

  - 🐞 修复了`index.d.ts`中getActiveApps、getAllApps类型声明错误的问题。

### 0.5.1

`2021-11-25`

- **New**

  - 🆕 新增了`getActiveApps`方法，用于获取正在运行的子应用。
  - 🆕 新增了`getAllApps`方法，用于获取所有已经注册的子应用。

- **Bug Fix**

  - 🐞 修复了link、style元素格式化后顺序不一致导致的样式丢失的问题。

### 0.5.0

`2021-11-19`

- **Bug Fix**

  - 🐞 修复了name带有特殊符号时样式失效的问题，删除name中的特殊符号。
  - 🐞 修复了umd模式下，应用卸载并重新渲染时url冲突，旧应用没有卸载干净的问题。
  - 🐞 修复了在关闭样式隔离时，样式延迟生效导致页面布局错乱的问题。
  - 🐞 修复了多次重复向head中插入同一个style元素，导致样式失效的问题。

- **Update**

  - 🚀 优化了应用二次渲染时的性能及内存。
  - 🚀 优化了样式隔离逻辑，无论是否关闭样式隔离，始终将link元素提取转换为style元素。


### 0.4.3

`2021-11-05`

- **New**

  - 🆕 新增了`EventCenterForMicroApp`方法，用于沙箱关闭时实现通信功能(如vite)

- **Bug Fix**

  - 🐞 修复了在不支持`ShadowRoot`的浏览器中的报错问题，issue [#134](https://github.com/micro-zoe/micro-app/issues/134)
  - 🐞 修复了元素查询时带有特殊字符导致报错的问题，issue [#140](https://github.com/micro-zoe/micro-app/issues/140)


### 0.4.2

`2021-10-29`

- **New**

  - 🆕 新增了数据通信中`getGlobalData`方法，用于主动获取全局数据
  - 🆕 新增了对`mount`, `unmount`方法promise类型的支持
  - 🆕 新增了`destroy`配置项，用于替换`destory`，但依然保持对低版本的兼容，issue [#132](https://github.com/micro-zoe/micro-app/issues/132)

- **Bug Fix**

  - 🐞 修复了umd模式下，react16及以下版本二次渲染后路由跳转刷新页面的问题
  - 🐞 修复了SSR子应用二次渲染时url不同导致渲染失败的问题
  - 🐞 修复了 react-inlinesvg 无法正常渲染的问题，issue [#56](https://github.com/micro-zoe/micro-app/issues/56)
  - 🐞 修复了 safari 浏览器中，创建module脚本错误的问题
  - 🐞 修复了子应用通过defineProperty重写document.onclick时报错的问题

- **Update**

  - 🚀 优化了MicroAppElement、沙箱等代码
  - 🚀 优化了umd模式下，子应用初次渲染的速度
  - 🚀 优化了动态创建的script元素src或textContent为空时的处理逻辑
  - 🚀 优化了`mounted`生命周期的执行时机


### 0.4.1

`2021-10-22`

- **Bug Fix**

  - 🐞 修复了umd模式下，应用二次渲染时样式丢失的问题
  - 🐞 修复了资源地址为空时，补全错误的问题
  - 🐞 修复了对iframe元素src属性的错误处理
  - 🐞 修复了mounted生命周期在异步脚本中执行时机错误的问题
  - 🐞 修复了在非沙箱环境下使用umd模式，开启destory后，卸载时注册的函数没有卸载的问题
  - 🐞 修复了子应用带有preload时资源加载两次的问题

- **Update**

  - 🚀 优化了在非inline模式下，module类型script元素的执行方式
  - 🚀 优化了报错日志信息，增加应用名称


### 0.4.0

`2021-10-15`

- **New**

  - 🆕 新增了ignore属性，用于忽略部分部分元素
  - 🆕 新增了全局变量 `__MICRO_APP_BASE_APPLICATION__` 用于标记当前应用为基座应用

- **Bug Fix**

  - 🐞 修复了对webpack5 & jsonp 的支持
  - 🐞 修复了angular下动态设置url属性导致加载失败的问题
  - 🐞 修复了在vite环境下，内存优化的支持
  - 🐞 修复了script type 为特殊情况下的兜底处理，如application/json
  - 🐞 修复了循环嵌套时没有完全卸载应用的问题

- **Update**

  - 🚀 优化了对ssr的支持方式
  - 🚀 优化了动态module的创建和渲染
  - 🚀 优化了对data、blob类型数据的处理


### 0.3.3

`2021-09-13`

- **Bug Fix**

  - 🐞 修复了data属性赋值后插入文档时，初始化data值无法通过setAttribute拦截的问题
  - 🐞 修复了渲染缓存micro-app元素时导致的micro-app-head, micro-app-body重复的问题

### 0.3.2

`2021-09-10`

- **New**

  - 🆕 新增了`baseroute`配置项，用于替换`baseurl`
  - 🆕 新增了`__MICRO_APP_BASE_ROUTE__`全局变量，用于替换`__MICRO_APP_BASE_URL__`

- **Update**

  - 🚀 废弃了`baseurl`和`__MICRO_APP_BASE_URL__`，但依然兼容旧版

### 0.3.1

`2021-09-08`

- **Bug Fix**

  - 🐞 修复了micro-app元素先使用后定义导致start方法配置失效的问题

### 0.3.0

`2021-09-07`

- **New**

  - 🆕 新增了对umd格式的支持
  - 🆕 废弃eval方法，使用Function进行替换

- **Bug Fix**

  - 🐞 修复了子应用卸载部分内存无法释放的问题
  - 🐞 修复了widnow\document\timer事件在umd模式下多次渲染的问题
  - 🐞 修复了async和defer js文件没有缓存的问题
  - 🐞 修复了子应用同时存在多个head、body元素时，元素操作异常的问题。

- **Update**

  - 🚀 优化了修改name&url属性切换应用的操作，部分场景下被替换的应用可以计入缓存
  - 🚀 更新了全局数据通信卸载机制，基座应用和子应用只能卸载自身的全局监听函数


### 0.2.5

`2021-08-23`

- **New**

  - 🆕 新增了`main-vue3-vite`基座应用案例

- **Bug Fix**

  - 🐞 修复了在vue3中name被删除导致的样式丢失的问题
  - 🐞 修复了无法适配`.node`、`.php`、`.net`后缀文件的问题
  - 🐞 修复了子应用卸载后依然可以通过副作用函数绑定name作用域的问题

- **Update**

  - 🚀 优化了cosole日志方法和使用方式
  - 🚀 优化了vite适配方式

### 0.2.4

`2021-08-13`

- **New**

  - 🆕 新增了start配置项`globalAssets`，用于设置全局共享资源

- **Bug Fix**

  - 🐞 修复了在子应用中请求html元素被拦截的问题
  - 🐞 修复低版本nodejs对于rollup.config.js执行错误的问题

- **Update**

  - 🚀 代码优化


### 0.2.3

`2021-08-10`

- **Bug Fix**

  - 🐞 修复了切换至预加载app时报app already exists错误
  - 🐞 修复了地址补全对于a元素的错误处理

- **Update**

  - 🚀 文档更新
  - 🚀 代码优化
  - 🚀 更新单元测试

### 0.2.2

`2021-07-27`

- **Bug Fix**

  - 🐞 修复了JSX.IntrinsicElements属性生命丢失的问题

- **Update**

  - 🚀 代码优化


### 0.2.0

`2021-07-16`

- **Bug Fix**

  - 🐞 修复了`styled-componets`下样式失效的问题
  - 🐞 修复了沙箱关闭时，插件系统失效的问题
  - 🐞 修复了link地址没有协议前缀时补全相对地址失败的问题

- **Update**

  - 🚀 案例及文档更新


### 0.1.0

`2021-07-09`

- 🎉 `v0.1.0`正式版发布。
