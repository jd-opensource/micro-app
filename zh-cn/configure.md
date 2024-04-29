通过配置项，我们可以决定开启或关闭某些功能。

## name
- Desc: `应用名称`
- Type: `string`
- Default: `必传参数`
- 使用方式: `<micro-app name='xx'></micro-app>`
- 注意事项: 必须以字母开头，且不可以带特殊符号(中划线、下划线除外)

每个`name`都对应一个应用，当多个应用同时渲染时，name不可以重复。

当`name`的值发生变化时，会卸载当前应用并重新渲染。

## url
- Desc: `应用地址`
- Type: `string`
- Default: `必传参数`
- 使用方式: `<micro-app name='xx' url='xx'></micro-app>`

url必须指向子应用的index.html，如：http://localhost:3000/ 或 http://localhost:3000/index.html

MicroApp会根据url地址自动补全子应用的静态资源，如js、css、图片等

当`url`的值发生变化时，会卸载当前应用并根据新的`url`值重新渲染。

## iframe
- Desc: `开启iframe沙箱`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' iframe></micro-app>`

MicroApp有两种沙箱方案：`with沙箱`和`iframe沙箱`。

默认开启with沙箱，如果with沙箱无法正常运行，可以尝试切换到iframe沙箱，比如vite。


## inline
- Desc: `使用内联script`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' inline></micro-app>`

默认情况下，子应用的js会被提取并在后台运行，这会导致调试困难。

开启inline后，被提取的js会作为script标签插入应用中运行，在开发环境中更方便调试。

> [!NOTE]
> 开启inline后会稍微损耗性能，建议在开发环境中使用。

## destroy
- Desc: `卸载时强制删除缓存资源`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' destroy></micro-app>`

默认情况下，子应用被卸载后不会删除缓存的静态资源和数据，以便在重新渲染时获得更好的性能。

开启destroy，子应用在卸载后会清空缓存资源和数据，当重新渲染时将和初次渲染的行为保持一致。

## clear-data
- Desc: `卸载时清空数据通讯中的缓存数据`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' clear-data></micro-app>`

默认情况下，子应用被卸载后数据通讯中的缓存数据会被保留，如果你希望清空这些数据，设置`clear-data`即可。

子应用卸载时会同时清空主应用发送给当前子应用，和当前子应用发送给主应用的数据。

[destroy](/zh-cn/configure?id=destroy)也有同样的效果。


## disable-scopecss
- Desc: `关闭样式隔离`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' disable-scopecss></micro-app>`

关闭样式隔离可以提升页面渲染速度，在此之前，请确保各应用之间样式不会相互污染。

## disable-sandbox
- Desc: `关闭js沙箱`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' disable-sandbox></micro-app>`

关闭沙箱可能会导致一些不可预料的问题，通常情况不建议这样做。

> [!NOTE]
> 关闭沙箱后以下功能将失效:
> 
> 1、样式隔离
>
> 2、元素隔离
>
> 3、路由隔离
>
> 4、`__MICRO_APP_ENVIRONMENT__`、`__MICRO_APP_PUBLIC_PATH__`等全局变量
>
> 5、baseroute


## ssr
- Desc: `开启ssr模式`
- Type: `string(boolean)`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' ssr></micro-app>`
- 版本要求: `0.5.3及以上版本`

当子应用是ssr应用时，需要设置ssr属性，此时micro-app会根据ssr模式加载子应用。

## keep-alive
- Desc: `开启keep-alive模式`
- Type: `string(boolean)`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' keep-alive></micro-app>`
- 版本要求: `0.6.0及以上版本`

开启keep-alive后，应用卸载时会进入缓存，而不是销毁它们，以便保留应用的状态和提升重复渲染的性能。

keep-alive的优先级小于[destroy](/zh-cn/configure?id=destroy)，当两者同时存在时，keep-alive将失效。


## default-page
- Desc: `指定默认渲染的页面`
- Type: `string`
- Default: `''`
- 使用方式: `<micro-app name='xx' url='xx' default-page='页面地址'></micro-app>`

默认情况下，子应用渲染后会展示首页，设置`default-page`可以指定子应用渲染的页面。


## router-mode
- Desc: `路由模式`
- Type: `string`
- Default: `search`
- 使用方式: `<micro-app name='xx' url='xx' router-mode='search/native/native-scope/pure'></micro-app>`

路由分为四种模式：`search`、`native`、`native-scope`、`pure`，每种模式对应不同的功能，以满足尽可能多的项目需求，详情参考[虚拟路由系统](/zh-cn/router)。


## baseroute
- Desc: `设置子应用的基础路由`
- Type: `string`
- Default: `''`
- 使用方式: `<micro-app name='xx' url='xx' baseroute='/my-page/'></micro-app>`

在微前端环境下，子应用可以从window.__MICRO_APP_BASE_ROUTE__上获取baseroute的值，用于设置基础路由。

只有路由模式是native或native-scope我们才需要设置baseroute，详情参考[虚拟路由系统](/zh-cn/router)。


## keep-router-state
- Desc: `保留路由状态`
- Type: `string(boolean)`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' keep-router-state></micro-app>`

默认情况下，子应用卸载后重新渲染，将和首次加载一样渲染子应用的页面。

设置`keep-router-state`可以保留子应用路由状态，在卸载后重新渲染时将恢复卸载前的页面（页面中的状态不保留）。

注意：
  1. 如果关闭了虚拟路由系统，`keep-router-state`也将失效。
  2. 当设置了`default-page`时`keep-router-state`将失效，因为它的优先级小于`default-page`


## disable-memory-router
- Desc: `关闭虚拟路由系统`
- Type: `string(boolean)`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' disable-memory-router></micro-app>`

默认情况下，子应用将运行在虚拟路由系统中，和主应用的路由系统进行隔离，避免相互影响。

子应用的路由信息会作为query参数同步到浏览器地址上，如下：

![alt](https://img12.360buyimg.com/imagetools/jfs/t1/204018/30/36539/9736/6523add2F41753832/31f5ad7e48ea6570.png ':size=700')

设置`disable-memory-router`后，子应用将基于浏览器的路由系统进行渲染，拥有更加简洁优雅的的浏览器地址，详情参考[虚拟路由系统](/zh-cn/router)。


## disable-patch-request
- Desc: `关闭子应用请求的自动补全功能`
- Type: `string(boolean)`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' disable-patch-request></micro-app>`

默认情况下，MicroApp对子应用的fetch、XMLHttpRequest、EventSource进行重写，当请求相对地址时会使用子应用域名自动补全

如：`fetch('/api/data')` 补全为 `fetch(子应用域名 + '/api/data')`

如果不需要这样的补全，可以配置`disable-patch-request`进行关闭，此时相对地址会兜底到主应用域名。

如：`fetch('/api/data')` 兜底为 `fetch(主应用域名 + '/api/data')`

## fiber
- Desc: `开启fiber模式`
- Type: `string(boolean)`
- Default: `false`
- 使用方式: `<micro-app name='xx' url='xx' fiber></micro-app>`

默认情况下，子应用js是同步执行的，这会阻塞主应用的渲染线程，当开启fiber后，micro-app会降低子应用的优先级，通过异步执行子应用的js文件，以减小对主应用的影响，快速响应用户操作。

> [!NOTE]
> 开启fiber后会降低子应用的渲染速度。


<!-- ## shadowDOM
- Desc: `开启shadowDOM`
- Type: `string(boolean)`
- Default: `false`
- 使用方式: 
```html 
<micro-app name='xx' url='xx' shadowDOM></micro-app>
```

shadowDOM具有更强的样式隔离能力，开启后，`<micro-app>`标签会成为一个真正的WebComponent。

但shadowDOM在React框架及一些UI库中的兼容不是很好，经常会出现一些不可预料的问题，除非你很清楚它会带来的问题并有信心解决，否则不建议使用。 -->


## 全局配置
全局配置会影响每一个子应用，请小心使用！

**使用方式**

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  iframe: true, // 全局开启iframe沙箱，默认为false
  inline: true, // 全局开启内联script模式运行js，默认为false
  destroy: true, // 全局开启destroy模式，卸载时强制删除缓存资源，默认为false
  ssr: true, // 全局开启ssr模式，默认为false
  'disable-scopecss': true, // 全局禁用样式隔离，默认为false
  'disable-sandbox': true, // 全局禁用沙箱，默认为false
  'keep-alive': true, // 全局开启保活模式，默认为false
  'disable-memory-router': true, // 全局关闭虚拟路由系统，默认值false
  'keep-router-state': true, // 子应用在卸载时保留路由状态，默认值false
  'disable-patch-request': true, // 关闭子应用请求的自动补全功能，默认值false
  iframeSrc: location.origin, // 设置iframe沙箱中iframe的src地址，默认为子应用所在页面地址
})
```

如果希望在某个应用中不使用全局配置，可以单独配置关闭：
```html
<micro-app 
  name='xx' 
  url='xx' 
  iframe='false'
  inline='false'
  destroy='false'
  ssr='false'
  disable-scopecss='false'
  disable-sandbox='false'
  keep-alive='false'
  disable-memory-router='false'
  keep-router-state='false'
  disable-patch-request='false'
></micro-app>
```

## 其它配置
### global
当多个子应用使用相同的js或css资源，在link、script设置`global`属性会将文件提取为公共文件，共享给其它应用。

设置`global`属性后文件第一次加载会放入公共缓存，其它子应用加载相同的资源时直接从缓存中读取内容，从而提升渲染速度。

**使用方式**
```html
<link rel="stylesheet" href="xx.css" global>
<script src="xx.js" global></script>
```

### globalAssets
globalAssets用于设置全局共享资源，它和预加载的思路相同，在浏览器空闲时加载资源并放入缓存，提高渲染效率。

当子应用加载相同地址的js或css资源时，会直接从缓存中提取数据，从而提升渲染速度。

**使用方式**
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  globalAssets: {
    js: ['js地址1', 'js地址2', ...], // js地址
    css: ['css地址1', 'css地址2', ...], // css地址
  }
})
```

### exclude(过滤元素)
当子应用不需要加载某个js或css，可以通过在link、script、style设置exclude属性，当micro-app遇到带有exclude属性的元素会进行删除。

**使用方式**
```html
<link rel="stylesheet" href="xx.css" exclude>
<script src="xx.js" exclude></script>
<style exclude></style>
```

### ignore(忽略元素)
当link、script、style元素具有ignore属性，micro-app不会处理它，元素将原封不动进行渲染。

使用场景例如：jsonp

jsonp会创建一个script元素加载数据，正常情况script会被拦截导致jsonp请求失败，此时可以给script元素添加ignore属性，跳过拦截。

```js
// 修改jsonp方法，在创建script元素后添加ignore属性
const script = document.createElement('script')
script.setAttribute('ignore', 'true')
```
