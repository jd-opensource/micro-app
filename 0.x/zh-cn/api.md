<!-- tabs:start -->

# ** 基座应用API **
## start
**描述：**micro-app注册函数，全局执行一次

**介绍：**
```js
start (options?: {
  tagName?: string, // 标签名称，默认为micro-app
  shadowDOM?: boolean, // 是否开启shadowDOM，默认为false
  destroy?: boolean, // 是否在子应用卸载时强制销毁所有缓存资源，默认为false
  inline?: boolean, // 是否使用内联script方式执行js，默认为false
  disableScopecss?: boolean, // 是否全局禁用样式隔离，默认为false
  disableSandbox?: boolean, // 是否全局禁用沙箱，默认为false
  ssr?: boolean, // 是否全局启用ssr模式，默认为false
  // 全局生命周期
  lifeCycles?: {
    created?(e?: CustomEvent): void
    beforemount?(e?: CustomEvent): void
    mounted?(e?: CustomEvent): void
    unmount?(e?: CustomEvent): void
    error?(e?: CustomEvent): void
  },
  // 预加载，支持数组或函数
  preFetchApps?: Array<{
    name: string,
    url: string,
    disableScopecss?: boolean,
    disableSandbox?: boolean,
    shadowDOM?: boolean
  }> | (() => Array<{
    name: string,
    url: string,
    disableScopecss?: boolean,
    disableSandbox?: boolean,
    shadowDOM?: boolean
  }>),
  // 插件系统，用于处理子应用的js文件
  plugins?: {
    // 全局插件，作用于所有子应用的js文件
    global?: Array<{
      // 可选，强隔离的全局变量(默认情况下子应用无法找到的全局变量会兜底到基座应用中，scopeProperties可以禁止这种情况)
      scopeProperties?: string[],
      // 可选，可以逃逸到外部的全局变量(escapeProperties中的变量会同时赋值到子应用和外部真实的window上)
      escapeProperties?: string[],
      // 可选，如果函数返回 `true` 则忽略 script 和 link 标签的创建
      excludeChecker?: (url: string) => boolean
      // 可选，如果函数返回 `true` ，则 micro-app 不会处理它，元素将原封不动进行渲染
      ignoreChecker?: (url: string) => boolean
      // 可选，传递给loader的配置项
      options?: any,
      // 可选，js处理函数，必须返回 code 值
      loader?: (code: string, url: string, options: any, info: sourceScriptInfo) => string,
      // 可选，html 处理函数，必须返回 code 值
      processHtml?: (code: string, url: string, options: unknown) => string
    }>

    // 子应用插件
    modules?: {
      // appName为应用的名称，这些插件只会作用于指定的应用
      [name: string]: Array<{
        // 可选，强隔离的全局变量(默认情况下子应用无法找到的全局变量会兜底到基座应用中，scopeProperties可以禁止这种情况)
        scopeProperties?: string[],
        // 可选，可以逃逸到外部的全局变量(escapeProperties中的变量会同时赋值到子应用和外部真实的window上)
        escapeProperties?: string[],
        // 可选，如果函数返回 `true` 则忽略 script 和 link 标签的创建
        excludeChecker?: (url: string) => boolean
        // 可选，如果函数返回 `true` ，则 micro-app 不会处理它，元素将原封不动进行渲染
        ignoreChecker?: (url: string) => boolean
        // 可选，传递给loader的配置项
        options?: any,
        // 必填，js处理函数，必须返回code值
        loader?: (code: string, url: string, options: any, info: sourceScriptInfo) => string,
        // 可选，html 处理函数，必须返回 code 值
        processHtml?: (code: string, url: string, options: unknown) => string
      }>
    }
  },
  // 重定义fetch方法，可以用于拦截资源请求操作
  fetch?: (url: string, options: Record<string, any>, appName: string | null) => Promise<string>
  // 设置全局静态资源
  globalAssets?: {
    js?: string[], // js地址
    css?: string[], // css地址
  },
})
```

**使用方式：**
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

## preFetch
**描述：**预加载，在浏览器空闲时间，依照开发者传入的顺序，依次加载每个应用的静态资源

**介绍：**
```js
preFetch([
  {
    name: string,
    url: string,
    disableScopecss?: boolean,
    disableSandbox?: boolean,
  },
])
```

**使用方式：**
```js
import { preFetch } from '@micro-zoe/micro-app'

// 方式一
preFetch([
  { name: 'my-app1', url: 'xxx' },
  { name: 'my-app2', url: 'xxx' },
])

// 方式二
preFetch(() => [
  { name: 'my-app1', url: 'xxx' },
  { name: 'my-app2', url: 'xxx' },
])
```


## getActiveApps
**描述：**获取正在运行的子应用，不包含已卸载和预加载的应用

**版本限制：** 0.5.2及以上版本

**介绍：**
```js
/**
 * @param excludeHiddenApp 是否过滤处于隐藏状态的keep-alive应用，默认false
 */
function getActiveApps(excludeHiddenApp?: boolean): string[]
```

**使用方式：**
```js
import { getActiveApps } from '@micro-zoe/micro-app'

getActiveApps() // [子应用name, 子应用name, ...]

getActiveApps(true) // 处于隐藏状态的keep-alive将会被过滤
```

## getAllApps
**描述：**获取所有子应用，包含已卸载和预加载的应用

**版本限制：** 0.5.2及以上版本

**介绍：**
```js
function getAllApps(): string[]
```

**使用方式：**
```js
import { getAllApps } from '@micro-zoe/micro-app'

getAllApps() // [子应用name, 子应用name, ...]
```


## version
**描述：**查看版本号

**方式1：**
```js
import { version } from '@micro-zoe/micro-app'
```

**方式2：**通过micro-app元素上的version属性查看
```js
document.querySelector('micro-app').version
```

## pureCreateElement
**描述：**创建无绑定的纯净元素

**使用方式：**
```js
import { pureCreateElement } from '@micro-zoe/micro-app'

const pureDiv = pureCreateElement('div')

document.body.appendChild(pureDiv)
```


## removeDomScope
**描述：**解除元素绑定，通常用于受子应用元素绑定影响，导致基座元素错误绑定到子应用的情况

**使用方式：**
```js
import { removeDomScope } from '@micro-zoe/micro-app'

// 重置作用域
removeDomScope()
```


## EventCenterForMicroApp
**描述：**创建子应用通信对象，用于沙箱关闭时(如：vite)与子应用进行通信

**使用方式：**
```js
import { EventCenterForMicroApp } from '@micro-zoe/micro-app'

// 每个子应用根据appName单独分配一个通信对象
window.eventCenterForAppName = new EventCenterForMicroApp(appName)
```

详情查看：[关闭沙箱后的通信方式](/zh-cn/data?id=关闭沙箱后的通信方式)


## unmountApp
**描述：**手动卸载应用

**版本限制：** 0.6.1及以上版本

**介绍：**
```js
// unmountApp 参数配置
interface unmountAppParams {
  /**
   * destroy: 是否强制卸载应用并删除缓存资源，默认值：false
   * 优先级: 高于 clearAliveState
   * 对于已经卸载的应用: 当子应用已经卸载或keep-alive应用已经推入后台，则清除应用状态及缓存资源
   * 对于正在运行的应用: 当子应用正在运行，则卸载应用并删除状态及缓存资源
   */
  destroy?: boolean;
  /**
   * clearAliveState: 是否清空应用的缓存状态，默认值：false
   * 解释: 如果子应用是keep-alive，则卸载并清空状态，并保留缓存资源，如果子应用不是keep-alive，则执行正常卸载流程，并保留缓存资源
   * 补充: 无论keep-alive应用正在运行还是已经推入后台，都将执行卸载操作，清空应用缓存状态，并保留缓存资源
   */
  clearAliveState?: boolean;
}

function unmountApp(appName: string, options?: unmountAppParams): Promise<void>
```

**使用方式：**
```js
// 正常流程
unmountApp(子应用名称).then(() => console.log('卸载成功'))

// 卸载应用并清空缓存资源
unmountApp(子应用名称, { destroy: true }).then(() => console.log('卸载成功'))

// 如果子应用是keep-alive应用，则卸载并清空状态，如果子应用不是keep-alive应用，则正常卸载
unmountApp(子应用名称, { clearAliveState: true }).then(() => console.log('卸载成功'))

// 如果destroy和clearAliveState同时为true，则clearAliveState将失效
unmountApp(子应用名称, { destroy: true, clearAliveState: true }).then(() => console.log('卸载成功'))
```

## unmountAllApps
**描述：**手动卸载所有应用

**版本限制：** 0.6.1及以上版本

**介绍：**
```js
// unmountAllApps 参数配置
interface unmountAppParams {
  /**
   * destroy: 是否强制卸载应用并删除缓存资源，默认值：false
   * 优先级: 高于 clearAliveState
   * 对于已经卸载的应用: 当子应用已经卸载或keep-alive应用已经推入后台，则清除应用状态及缓存资源
   * 对于正在运行的应用: 当子应用正在运行，则卸载应用并删除状态及缓存资源
   */
  destroy?: boolean;
  /**
   * clearAliveState: 是否清空应用的缓存状态，默认值：false
   * 解释: 如果子应用是keep-alive，则卸载并清空状态，并保留缓存资源，如果子应用不是keep-alive，则执行正常卸载流程，并保留缓存资源
   * 补充: 无论keep-alive应用正在运行还是已经推入后台，都将执行卸载操作，清空应用缓存状态，并保留缓存资源
   */
  clearAliveState?: boolean;
}

function unmountAllApps(options?: unmountAppParams): Promise<void>
```

**使用方式：**
```js
// 正常流程
unmountAllApps().then(() => console.log('卸载成功'))

// 卸载所有应用并清空缓存资源
unmountAllApps({ destroy: true }).then(() => console.log('卸载成功'))

// 如果子应用是keep-alive应用，则卸载并清空状态，如果子应用不是keep-alive应用，则正常卸载
unmountAllApps({ clearAliveState: true }).then(() => console.log('卸载成功'))

// 如果destroy和clearAliveState同时为true，则clearAliveState将失效
unmountAllApps({ destroy: true, clearAliveState: true }).then(() => console.log('卸载成功'))
```

## setData
**描述：**向指定的子应用发送数据

**介绍：**
```js
setData(appName: String, data: Object)
```

**使用方式：**
```js
import microApp from '@micro-zoe/micro-app'

// 发送数据给子应用 my-app，setData第二个参数只接受对象类型
microApp.setData('my-app', {type: '新的数据'})
```

## getData
**描述：**获取指定的子应用data数据

**介绍：**
```js
getData(appName: String): Object
```

**使用方式：**
```js
import microApp from '@micro-zoe/micro-app'

const childData = microApp.getData('my-app') // 返回my-app子应用的data数据
```

## addDataListener
**描述：**监听指定子应用的数据变化

**介绍：**
```js
/**
 * 绑定监听函数
 * appName: 应用名称
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
microApp.addDataListener(appName: string, dataListener: Function, autoTrigger?: boolean)
```

**使用方式：**
```js
import microApp from '@micro-zoe/micro-app'

function dataListener (data) {
  console.log('来自子应用my-app的数据', data)
}

microApp.addDataListener('my-app', dataListener)
```

## removeDataListener
**描述：**解除基座绑定的指定子应用的数据监听函数

**使用方式：**

```js
import microApp from '@micro-zoe/micro-app'

function dataListener (data) {
  console.log('来自子应用my-app的数据', data)
}

// 解绑监听my-app子应用的数据监听函数
microApp.removeDataListener('my-app', dataListener)
```

## clearDataListener
**描述：**清空基座绑定的指定子应用的所有数据监听函数

**使用方式：**

```js
import microApp from '@micro-zoe/micro-app'

// 清空所有监听appName子应用的数据监听函数
microApp.clearDataListener('my-app')
```


## getGlobalData
**描述：**获取全局数据

**使用方式：**
```js
import microApp from '@micro-zoe/micro-app'

// 直接获取数据
const globalData = microApp.getGlobalData() // 返回全局数据
```


## addGlobalDataListener
**描述：**绑定数据监听函数

**介绍：**
```js
/**
 * 绑定监听函数
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
microApp.addGlobalDataListener(dataListener: Function, autoTrigger?: boolean)
```

**使用方式：**
```js
import microApp from '@micro-zoe/micro-app'

function dataListener (data) {
  console.log('全局数据', data)
}

microApp.addGlobalDataListener(dataListener)
```

## removeGlobalDataListener
**描述：**解绑全局数据监听函数

**使用方式：**

```js
import microApp from '@micro-zoe/micro-app'

function dataListener (data) {
  console.log('全局数据', data)
}

microApp.removeGlobalDataListener(dataListener)
```

## clearGlobalDataListener
**描述：**清空基座应用绑定的所有全局数据监听函数

**使用方式：**

```js
import microApp from '@micro-zoe/micro-app'

microApp.clearGlobalDataListener()
```

## setGlobalData
**描述：**发送全局数据

**使用方式：**

```js
import microApp from '@micro-zoe/micro-app'

// setGlobalData只接受对象作为参数
microApp.setGlobalData({type: '全局数据'})
```


<!--
  ---------------------------------------------------------------------
  -------------------------------  分割线  -----------------------------
  ---------------------------------------------------------------------
-->

# ** 子应用API **

## pureCreateElement
**描述：**创建无绑定的纯净元素，该元素可以逃离元素隔离的边界，不受子应用沙箱的控制

**版本限制：** 0.8.2及以上版本

**使用方式：**
```js
const pureDiv = window.microApp.pureCreateElement('div')

document.body.appendChild(pureDiv)
```


## removeDomScope
**描述：**解除元素绑定，通常用于受子应用元素绑定影响，导致基座元素错误绑定到子应用的情况

**版本限制：** 0.8.2及以上版本

**使用方式：**
```js
// 重置作用域
window.microApp.removeDomScope()
```

## rawWindow
**描述：**获取真实的window

**使用方式：**
```js
window.rawWindow
```

## rawDocument
**描述：**获取真实的document

**使用方式：**
```js
window.rawDocument
```


## getData
**描述：**获取基座下发的data数据

**使用方式：**
```js
const data = window.microApp.getData() // 返回基座下发的data数据
```

## addDataListener
**描述：**绑定数据监听函数

**介绍：**
```js
/**
 * 绑定监听函数，监听函数只有在数据变化时才会触发
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 * !!!重要说明: 因为子应用是异步渲染的，而基座发送数据是同步的，
 * 如果在子应用渲染结束前基座应用发送数据，则在绑定监听函数前数据已经发送，在初始化后不会触发绑定函数，
 * 但这个数据会放入缓存中，此时可以设置autoTrigger为true主动触发一次监听函数来获取数据。
 */
window.microApp.addDataListener(dataListener: Function, autoTrigger?: boolean)
```

**使用方式：**
```js
function dataListener (data) {
  console.log('来自基座应用的数据', data)
}

window.microApp.addDataListener(dataListener)
```

## removeDataListener
**描述：**解绑数据监听函数

**使用方式：**

```js
function dataListener (data) {
  console.log('来自基座应用的数据', data)
}

window.microApp.removeDataListener(dataListener)
```

## clearDataListener
**描述：**清空当前子应用的所有数据监听函数(全局数据函数除外)

**使用方式：**

```js
window.microApp.clearDataListener()
```

## dispatch
**描述：**向基座应用发送数据

**使用方式：**

```js
// dispatch只接受对象作为参数
window.microApp.dispatch({type: '子应用发送的数据'})
```


## getGlobalData
**描述：**获取全局数据

**使用方式：**
```js
const globalData = window.microApp.getGlobalData() // 返回全局数据
```


## addGlobalDataListener
**描述：**绑定数据监听函数

**介绍：**
```js
/**
 * 绑定监听函数
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
window.microApp.addGlobalDataListener(dataListener: Function, autoTrigger?: boolean)

```

**使用方式：**
```js
function dataListener (data) {
  console.log('全局数据', data)
}

window.microApp.addGlobalDataListener(dataListener)
```

## removeGlobalDataListener
**描述：**解绑全局数据监听函数

**使用方式：**

```js
function dataListener (data) {
  console.log('全局数据', data)
}

window.microApp.removeGlobalDataListener(dataListener)
```

## clearGlobalDataListener
**描述：**清空当前子应用绑定的所有全局数据监听函数

**使用方式：**

```js
window.microApp.clearGlobalDataListener()
```

## setGlobalData
**描述：**发送全局数据

**使用方式：**

```js
// setGlobalData只接受对象作为参数
window.microApp.setGlobalData({type: '全局数据'})
```
<!-- tabs:end -->

