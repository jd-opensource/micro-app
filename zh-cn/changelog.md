`micro-app` 遵循 [Semantic Versioning 2.0.0](http://semver.org/lang/zh-CN/) 语义化版本规范。

#### 发布周期

- 主版本号：含有破坏性更新和新特性，不在发布周期内。
- 次版本号：每月发布一个带有新特性的向下兼容的版本。
- 修订版本号：每周末会进行日常 bugfix 更新。（如果有紧急的 bugfix，则任何时候都可发布）

---

### 1.0.0-rc.5

`2024-4-29`

- **New**

  - 🆕 新增虚拟路由系统`state`模式，用于适配更多使用场景。

- **Bug Fix**

  - 🐞 修复了iframe沙箱下`unhandledrejection`事件失效的问题，[issue 1102](https://github.com/micro-zoe/micro-app/issues/1102)、[issue 1159](https://github.com/micro-zoe/micro-app/issues/1159)。
  - 🐞 修复了with沙箱下`keep-alive`子应用二次渲染后无法通过`microApp.router`控制跳转的问题，[issue 1115](https://github.com/micro-zoe/micro-app/issues/1115)。
  - 🐞 修复了with沙箱下预渲染子应用路由跳转异常的问题。
  - 🐞 修复了native路由模式下，主应用和子应用都是vue-router@4导致浏览器前进后退路由地址混乱的问题。
  - 🐞 修复了设置`disable-memory-router`后，部分场景下子应用内部跳转失败的问题，[issue 1132](https://github.com/micro-zoe/micro-app/issues/1132)。
  - 🐞 修复了iframe沙箱下`Aliplayer`视频播放器无法正常运行的问题。
  - 🐞 修复了`native`、`disable-memory-router`路由模式下，主应用、子应用都是vue3导致路由冲突导航异常的问题，[issue 1148](https://github.com/micro-zoe/micro-app/issues/1148)、[issue 1132](https://github.com/micro-zoe/micro-app/issues/1132)。
  - 🐞 修复了格式化子应用url导致部分场景下路由匹配异常的问题，[issue 1147](https://github.com/micro-zoe/micro-app/issues/1147)。
  - 🐞 修复了with沙箱下生命周期`mounted`, `unmount`重复触发的问题，[issue 1161](https://github.com/micro-zoe/micro-app/issues/1161)。
  - 🐞 修复了域名中包含.js导致子应用渲染失败的问题，[issue 1172](https://github.com/micro-zoe/micro-app/issues/1172)，[PR 1173](https://github.com/micro-zoe/micro-app/pull/1173) by [SepVeneto](https://github.com/SepVeneto)。
  - 🐞 修复了iframe沙箱下子应用设置`history.scrollRestoration`不生效的问题。
  - 🐞 修复了虚拟路由系统pure模式下，通过location进行跳转表现异常的问题，[issue 1135](https://github.com/micro-zoe/micro-app/issues/1135)。

- **Update**

  - 🚀 优化了生命周期全局监听函数的传递参数。
  - 🚀 更新了路由相关文档。


### 1.0.0-rc.4

`2024-1-31`

- **New**

  - 🆕 新增全局配置`iframeSrc`，用于动态设置iframe沙箱的src地址。
  - 🆕 新增micro-app元素公有变量`publicPath`、`baseRoute`，用于支持chrome插件，[PR 1052](https://github.com/micro-zoe/micro-app/pull/1052) by [raoenhui](https://github.com/raoenhui)。
  - 🆕 新增了在iframe沙箱下对`Document.prototype.createElementNS`、`Document.prototype.createDocumentFragment`的拦截和处理。
  - 🆕 新增了`removeDomScope`方法的配置项`force`，用于在一定时间内解除元素绑定，[issue 995](https://github.com/micro-zoe/micro-app/issues/995)。
  - 🆕 新增了with沙箱对于`Document.prototype.createElementNS`的直接处理，规避可能存在的元素泄漏风险。

- **Bug Fix**

  - 🐞 修复了父应用非根目录下微应用无法正常渲染的问题，[PR 1037](https://github.com/micro-zoe/micro-app/pull/1037) by [xuhongbo](https://github.com/xuhongbo)。
  - 🐞 修复了iframe沙箱下antd `Dropdown`、`Tooltip`等组件渲染异常的问题，[PR 1015](https://github.com/micro-zoe/micro-app/pull/1015) by [keuby](https://github.com/keuby)。
  - 🐞 修复了micro-app url属性为相对地址时没有自动补全导致子应用渲染失败的问题，[PR 1056](https://github.com/micro-zoe/micro-app/pull/1056)。
  - 🐞 修复了EventTarget在低版本浏览器中的兼容性问题，[issue 1064](https://github.com/micro-zoe/micro-app/issues/1064)，[issue 1065](https://github.com/micro-zoe/micro-app/issues/1065)。
  - 🐞 修复了with沙箱在部分场景下强隔离变量`scopeProperties`通过`key in window`判断异常的问题。
  - 🐞 修复了with沙箱在默认模式下用户自定义的强隔离变量`scopeProperties`在卸载时无法清空的问题。
  - 🐞 修复了with沙箱子应用的`window.onpopstate`兜底到主应用导致多次执行的问题。
  - 🐞 修复了craco子应用style元素插入顺序错误导致样式优先级混乱的问题，[issue 1071](https://github.com/micro-zoe/micro-app/issues/1071)。
  - 🐞 修复了在部分场景下子应用重写`Array.prototype.includes`导致死循环的问题，[PR 1067](https://github.com/micro-zoe/micro-app/pull/1067) by [tinymins](https://github.com/tinymins)。
  - 🐞 修复了在关闭虚拟路由系统时子应用域名与浏览器域名不一致的问题，[issue 937](https://github.com/micro-zoe/micro-app/issues/937)。

- **Update**
  - 🚀 虚拟路由系统升级，新增`search`、`native`、`native-scope`、`pure`模式，用于适配更多使用场景。
  - 🚀 优化了对于iframe沙箱`Node.parentNode`的处理方式。
  - 🚀 优化了iframe沙箱对于插件系统`escapeProperties`的支持。
  - 🚀 更新了案例。


### 1.0.0-rc.3

`2023-12-18`

- **New**

  - 🆕 新增`componentMode`组件模式，micro-app支持单独运行js文件[944](https://github.com/micro-zoe/micro-app/pull/944)。
  - 🆕 新增方法`getAppState`，用于在基座中获取子应用的状态。
  - 🆕 新增虚拟路由系统`push`, `replace`方法对Promise的支持。
  - 🆕 新增对于CSS循环嵌套的支持[956](https://github.com/micro-zoe/micro-app/pull/956)。

- **Bug Fix**

  - 🐞 修复了在非`custom`路由模式下设置baseroute导致子应用渲染失败的问题。
  - 🐞 修复了`isObject`方法中参数为null导致错误的问题[998](https://github.com/micro-zoe/micro-app/pull/998)。
  - 🐞 修复了子应用`onerror`事件无法触发的问题[992](https://github.com/micro-zoe/micro-app/pull/992)。
  - 🐞 修复了iframe沙箱下子应用`Node.ownerDocument`指向错误的问题[988](https://github.com/micro-zoe/micro-app/pull/988)。
  - 🐞 修复了with沙箱下判断MicroDocument实例时目标为null导致报错的问题[986](https://github.com/micro-zoe/micro-app/pull/986)。
  - 🐞 修复了iframe沙箱下通过`document.head.querySelector(...)`查询元素异常的问题[984](https://github.com/micro-zoe/micro-app/pull/984)。
  - 🐞 修复了子应用html自带元素`parentNode`指向异常的问题。

- **Update**
  - 🚀 更新with沙箱运行逻辑，异步执行初始化操作，确保不同沙箱之间逻辑一致。
  - 🚀 优化了utils方法中元素判断的方式[998](https://github.com/micro-zoe/micro-app/pull/998)。
  - 🚀 更新了案例。
  

### 1.0.0-rc.2

`2023-10-30`

- **New**

  - 🆕 新增了子应用全局变量`__MICRO_APP_STATE__`，用于标记当前应用的状态。
  - 🆕 新增了子应用document变量`__MICRO_APP_NAME__`，用于标记document所属应用。
  - 🆕 重写了原型方法`Node.prototype.parentNode`，用于处理特殊元素parentNode的指向问题。

- **Bug Fix**

  - 🐞 修复了在iframe沙箱下循环嵌套的问题。
  - 🐞 修复了在iframe沙箱下开启`inline`模式导致通过`getElementsByTagName`获取script元素失败的问题。

- **Update**
  - 🚀 优化了内存占用，在iframe沙箱模式下默认开启inline模式。
  - 🚀 更新了官网文档。
  

### 1.0.0-rc.1

`2023-10-16`

- **New**

  - 🆕 新增了Chrome浏览器插件`Micro-App-DevTools`，提高开发效率。

- **Update**

  - 🚀 完善单元测试功能。
  - 🚀 更新了官网文档。


### 1.0.0-rc.0

`2023-09-22`

- **New**

  - 🆕 新增了子应用全局变量`__MICRO_APP_SANDBOX_TYPE__`，用于标记当前应用的沙箱类型。

- **Bug Fix**

  - 🐞 修复了在关闭沙箱后发送生命周期事件异常的问题。
  - 🐞 修复了在部分场景下，多次执行`microApp.start`方法导致的死循环问题。
  - 🐞 修复了`afterhidden`过早触发导致的container为空的问题。

- **Update**

  - 🚀 完善单元测试功能。
  - 🚀 更新了官网文档。
  - 🚀 发布1.0正式版。


### 1.0.0-beta.7

`2023-09-20`

- **New**

  - 🆕 新增了子应用内部状态`before_mount`，用于标记子应用在资源加载后和执行js前的中间状态。

- **Bug Fix**

  - 🐞 修复了在iframe沙箱模式下，子应用使用`monaco-editor`时代码输入框光标失效的问题。
  - 🐞 修复了在`window.mount`为Promise时抛出的错误无法捕获的问题。
  - 🐞 修复了在iframe沙箱模式下，子应用加载完成之前进行导航导致报错的问题。
  - 🐞 修复了在with沙箱模式下，异步创建路由系统导致部分场景下location未定义的问题，issue [#908](https://github.com/micro-zoe/micro-app/issues/908)。
  - 🐞 修复了在micro-app子应用开始渲染到渲染完成之前通过路由API无法控制跳转的问题。

- **Update**

  - 🚀 完善单元测试功能。
  - 🚀 更新了官网文档。


### 1.0.0-beta.6

`2023-09-14`

- **New**

  - 🆕 新增了虚拟路由多种模式功能，新增了三种路由模式：`search`、`history`、`custom`。
  - 🆕 新增了在预渲染时可以选择不同路由模式进行渲染的功能。
  - 🆕 新增了全局变量`document.microAppElement`，用于获取子应用所在的`micro-app`元素。
  
- **Bug Fix**

  - 🐞 修复了在with沙箱下子应用使用`vuedraggable`报错的问题。
  - 🐞 修复了在iframe沙箱下子应用定义`onpopstate`、`onhashchange`会覆盖主应用方法的问题。
  - 🐞 修复了`window.addEventListener`绑定非window对象时表现异常的问题。
  - 🐞 修复了`document.addEventListener`绑定非document对象时表现异常的问题。
  - 🐞 修复了在子应用初始化后`icon link`丢失的问题。
  - 🐞 修复了通过`rawDocument`、`rawWindow`操作元素时，元素作用域绑定异常的问题。
  - 🐞 修复了通过`document.querySelector(":root")`无法获取根元素的问题。

- **Update**

  - 🚀 删除了配置项`disable-memory-router`，虚拟路由不再支持关闭功能。
  - 🚀 优化了with沙箱中特殊事件的处理方式，`onpopstate`、`onhashchange`等方法不再绑定到原生window。
  - 🚀 优化了沙箱的架构设计及代码。
  - 🚀 完成了部分1.0版本单元测试的功能。
  - 🚀 更新了官网文档。


### 1.0.0-beta.5

`2023-05-23`

- **Bug Fix**

  - 🐞 修复了环境变量`__MICRO_APP_BASE_APPLICATION__`为undefined的问题。
  - 🐞 修复了`vite+react`子应用接入失败的问题。
  - 🐞 修复了通过修改name和url渲染`keep-alive`应用失败的问题。

- **Update**

  - 🚀 优化了部分开发案例。


### 1.0.0-beta.4

`2023-04-27`

- **New**

  - 🆕 新增了在iframe沙箱下支持关闭虚拟路由系统的功能。

- **Bug Fix**

  - 🐞 修复了在子应用还未渲染时通过虚拟路由控制子应用跳转导致浏览器URL地址修改的问题。
  - 🐞 修复了在`keep-alive`应用隐藏后通过虚拟路由控制子应用跳转导致浏览器URL地址修改的问题。

- **Update**

  - 🚀 优化了部分开发案例。


### 1.0.0-beta.3

`2023-04-13`

- **Bug Fix**

  - 🐞 修复了在非内联模式下通过`insertAdjacentElement`插入script导致报错的问题。
  - 🐞 修复了在关闭沙箱时`module script`远程资源被重复加载的问题。
  - 🐞 修复了在加载资源过程中卸载`keep-alive`应用导致应用二次渲染失败的问题。
  - 🐞 修复了在umd模式下卸载`preRender app`、`hidden keep-alive app`应用导致事件覆盖的问题。
  

### 1.0.0-beta.2

`2023-04-06`

- **New**

  - 🆕 新增了对`insertAdjacentElement`元素方法的处理。
  - 🆕 新增了在iframe沙箱下对`append`、`prepend`元素方法的处理。

- **Bug Fix**

  - 🐞 修复了异步卸载子应用时`Element.prototype.setAttribute`方法可能被重置的问题。
  - 🐞 修复了在多层嵌套时异步卸载子应用导致应用绑定作用域异常的问题。
  - 🐞 修复了在iframe沙箱下无法设置`document.title`的问题。
  - 🐞 修复了在开发环境下vite4样式隔离失效的问题。
  - 🐞 修复了在with沙箱下循环嵌套子应用无法设置`document.onclick`的问题。

- **Update**

  - 🚀 优化了with沙箱Document事件系统的架构设计，增加兼容性。
  - 🚀 优化了iframe沙箱Document、Element原型方法。
  - 🚀 优化了iframe沙箱路由相关代码。
  - 🚀 更新了vite4的开发案例。
  

### 1.0.0-beta.1

`2023-03-23`

- **Bug Fix**

  - 🐞 修复了主应用和子应用修改domain导致的iframe跨域问题。
  - 🐞 修复了关闭沙箱导致onmount方法报错的问题。
  - 🐞 修复了with沙箱环境下react的抽屉组件无法渲染的问题。
  - 🐞 修复了with沙箱环境下重写ownerDocument导致的react事件重复触发的问题。

- **Update**

  - 🚀 更新了开发环境的案例。


### 1.0.0-beta.0

`2023-03-17`

- **New**

  - 🆕 新增了iframe沙箱功能，兼容vite等开发环境。
  - 🆕 新增了虚拟路由系统的iframe沙箱模式。
  - 🆕 新增了`video`、`audio`、`source`、`embed`等资源标签的自动补全功能。

- **Bug Fix**

  - 🐞 修复了通过`unmountApp`方法卸载预渲染应用报错的问题。
  - 🐞 修复了主动卸载keep-alive、预渲染应用时全局事件缓存错误的问题。
  - 🐞 修复了html静态元素无法标记和处理的问题。
  - 🐞 修复了根元素下`parentNode`表现异常的问题。
  - 🐞 修复了低版本浏览器不支持`String.prototype.replaceAll`的问题。
  - 🐞 修复了忽略的脚本内获取 currentScript 出错的问题。
  - 🐞 修复了数据通信在部分场景下快照备份数据监听函数报错的问题。

- **Update**

  - 🚀 优化了资源管理系统，支持多种沙箱之间动态切换，提升资源复用效率。
  - 🚀 移除了`esmodule`配置，iframe沙箱环境下默认开启。
  - 🚀 优化了预加载、预渲染相关功能，增加用户体验。
  - 🚀 优化了umd模式下对子应用定时器的处理逻辑。


### 1.0.0-alpha.10

`2022-10-11`

- **Bug Fix**

  - 🐞 修复了innerHTML创建的元素无法被拦截的问题。
  - 🐞 修复了循环嵌套下，根元素的parentNode被多次重写导致parentNode指向错误的问题。

- **Update**
  - 🚀 优化了相关案例。


### 1.0.0-alpha.9

`2022-09-09`

- **Bug Fix**

  - 🐞 修复了angular框架下，micro-app设置动态url导致应用多次渲染的问题。
  - 🐞 修复了子应用title、meta元素丢失的问题。
  - 🐞 修复了部分场景下`scopeProperties`可以逃逸的问题。
  - 🐞 修复了关闭虚拟路由系统时keep-alive应用依然可以触发虚拟路由系统的问题。

- **Update**

  - 🚀 增加对document的缓存，优化沙箱性能。
  - 🚀 更新了title元素的处理逻辑，子应用的title元素兜底到主应用，确保title全局唯一。


### 1.0.0-alpha.8

`2022-09-02`

- **New**

  - 🆕 新增了预渲染的功能，提升首次渲染速度。
  - 🆕 新增了rollup中__DEV__配置，优化开发体验。
  - 🆕 更新了`getActiveApps`方法，增加参数`excludePreRender`。
  - 🆕 更新了`attachAllToURL`方法，增加参数`includePreRender`。

- **Bug Fix**

  - 🐞 修复了在部分场景下，子应用卸载后删除元素导致removeChild方法被循环调用的问题。
  - 🐞 修复了UMD模式下，二次渲染时document全局事件无法自动卸载的问题。
  - 🐞 修复了keep-alive模式下，子应用隐藏后全局事件无法自动卸载导致元素作用域异常绑定的问题。

- **Update**

  - 🚀 优化了数据通讯系统，增加回调函数的返回值。
  - 🚀 优化了预加载逻辑，减小对主应用性能的影响。


### 1.0.0-alpha.7

`2022-08-26`

- **New**

  - 🆕 新增了`reload`方法，用于手动重新加载子应用。
  - 🆕 新增了`renderApp`方法，用于手动渲染子应用。
  - 🆕 新增了子应用全局事件`onmount`、`onunmount`，用于监听子应用的渲染与卸载。
  - 🆕 新增了`clear-data`配置，用于在卸载时清空数据通讯中的缓存数据。

- **Bug Fix**

  - 🐞 修复了ElementUI下拉选框在局部刷新时选择框无法消失的问题。

- **Update**

  - 🚀 优化了destroy的逻辑，卸载时主动清空数据通讯中的缓存数据。
  - 🚀 优化了数据通信系统，合并新旧值，增加强制更新API和防抖处理。


### 1.0.0-alpha.6

`2022-08-19`

- **New**

  - 🆕 重构了资源管理系统，提升资源复用率。
  - 🆕 新增了`excludeAssetFilter`配置，用于指定部分特殊的动态加载的微应用资源（css/js) 不被 micro-app 劫持处理。
  - 🆕 新增了`fiber`配置，支持子应用以fiber模式运行，增加主应用的响应速度。


- **Bug Fix**

  - 🐞 修复了sourceMap地址丢失，导致调试困难的问题。
  - 🐞 修复了document.defaultView可以获取真实window的问题。
  - 🐞 修复了document.currentScript丢失的问题。
  - 🐞 修复了动态script标签二次渲染时执行顺序错误的问题。
  - 🐞 修复了angular13、14及vue-cli5 build后应用沙箱失效的问题。
  - 🐞 修复了全局路由守卫参数与文档不一致的问题。
  - 🐞 修复了micro-app在vue keep-alive环境下频繁渲染的问题。

- **Update**

  - 🚀 优化了预加载逻辑，提升预加载子应用的渲染速度。
  - 🚀 优化了sandbox、create_app相关代码。


### 1.0.0-alpha.5

`2022-08-01`

- **New**

  - 🆕 新增子应用全局钩子函数`mount`, `unmount`，简化接入步骤。

- **Update**
  - 🚀 更新了1.0版本文档


### 1.0.0-alpha.4

`2022-07-28`

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

  - 🆕 重写了主应用的`pushState`、`replaceState`方法，自动将子应用的路由信息同步到浏览器地址。
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
  - 🆕 新增了`setBaseRouter`、`getBaseRouter`方法，用于注册和使用主应用路由。
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


### 1.0.0-alpha.0

`2022-06-30`

- **New**

  - 🆕 新增了独立的路由系统 - `MemoryRouter`，完善JS沙箱。

- **Bug Fix**

  - 🐞 修复了在循环嵌套时`iconfont.js`在部分场景下报错的问题。

- **Update**

  - 🚀 优化了预加载相关代码和逻辑，提高并行渲染能力。


### 0.8.10

`2022-08-19`

- **New**

  - 🆕 新增了`excludeAssetFilter`配置，用于指定部分特殊的动态加载的微应用资源（css/js) 不被 micro-app 劫持处理。


### 0.8.9

`2022-08-15`

- **Bug Fix**

  - 🐞 修复了在umd模式下异常清空全局变量的问题。


### 0.8.8

`2022-07-15`

- **Bug Fix**

  - 🐞 修复systemjs的script标签src没有自动补全的问题 


### 0.8.6

`2022-06-30`

- **New**

  - 🆕 在 plugin 中增加 excludeChecker 和 ignoreChecker 用于主应用主动忽略子应用部分 script 和 link。
  - 🆕 新增了`processHtml`，用于在插件中处理html。

- **Update**

  - 🚀 优化了资源加载相关代码和逻辑。
  - 🚀 优化了单元测试相关代码。


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

  - 🐞 修复了主应用通过远程连接引入Vue，加载vue子应用报错的问题，issue [#234](https://github.com/micro-zoe/micro-app/issues/234)。

- **Update**

  - 🚀 优化了预加载相关代码和逻辑，减小对主应用项目的影响。


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
  - 🆕 新增了全局变量 `__MICRO_APP_BASE_APPLICATION__` 用于标记当前应用为主应用

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
  - 🚀 更新了全局数据通信卸载机制，主应用和子应用只能卸载自身的全局监听函数


### 0.2.5

`2021-08-23`

- **New**

  - 🆕 新增了`main-vue3-vite`主应用案例

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
