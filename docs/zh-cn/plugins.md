微前端的使用场景非常复杂，没有完美的沙箱方案，所以我们提供了一套插件系统，它赋予开发者灵活处理静态资源的能力，对有问题的资源文件进行修改。

插件系统的主要作用就是对js进行修改，每一个js文件都会经过插件系统，我们可以对这些js进行拦截和处理，它通常用于修复js中的错误或向子应用注入一些全局变量。

## 适用场景
通常我们无法控制js的表现，比如在沙箱中，顶层的变量是无法泄漏为全局变量的（如 var xx = , function xxx 定义变量，无法通过window.xx 访问），导致js报错，此时开发者可以通过插件对js进行修改处理。

## 使用方式
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  plugins: {
    // 全局插件，作用于所有子应用的js文件
    global?: Array<{
      // 可选，强隔离的全局变量(默认情况下子应用无法找到的全局变量会兜底到主应用中，scopeProperties可以禁止这种情况)
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
      loader?: (code: string, url: string, options: any, info: sourceScriptInfo) => code,
      // 可选，html 处理函数，必须返回 code 值
      processHtml?: (code: string, url: string, options: unknown) => code
    }>

    // 子应用插件
    modules?: {
      // appName为应用的名称，这些插件只会作用于指定的应用
      [appName: string]: Array<{
        // 可选，强隔离的全局变量(默认情况下子应用无法找到的全局变量会兜底到主应用中，scopeProperties可以禁止这种情况)
        scopeProperties?: string[],
        // 可选，可以逃逸到外部的全局变量(escapeProperties中的变量会同时赋值到子应用和外部真实的window上)
        escapeProperties?: string[],
        // 可选，如果函数返回 `true` 则忽略 script 和 link 标签的创建
        excludeChecker?: (url: string) => boolean
        // 可选，如果函数返回 `true` ，则 micro-app 不会处理它，元素将原封不动进行渲染
        ignoreChecker?: (url: string) => boolean
        // 可选，传递给loader的配置项
        options?: any,
        // 可选，js处理函数，必须返回code值
        loader?: (code: string, url: string, options: any, info: sourceScriptInfo) => code,
        // 可选，html 处理函数，必须返回 code 值
        processHtml?: (code: string, url: string, options: unknown) => code
      }>
    }
  }
})
```

## 案例
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  plugins: {
    global: [
      {
        scopeProperties: ['key', 'key', ...], // 可选
        escapeProperties: ['key', 'key', ...], // 可选
        excludeChecker: (url) => ['/foo.js', '/bar.css'].some(item => url.includes(item)), // 可选
        options: 配置项, // 可选
        loader(code, url, options, info) { // 可选
          console.log('全局插件')
          return code
        },
        processHtml(code, url, options, info) { // 可选
          console.log('每个子应用 HTML 都会传入')
          return code
        },
      }
    ],
    modules: {
      'appName1': [{
        loader(code, url, options, info) {
          if (url === 'xxx.js') {
            code = code.replace('var abc =', 'window.abc =')
          }
          return code
        }
      }],
      'appName2': [{
        scopeProperties: ['key', 'key', ...], // 可选
        escapeProperties: ['key', 'key', ...], // 可选
        ignoreChecker: (url) => ['/foo.js', '/bar.css'].some(item => url.includes(item)), // 可选
        options: 配置项, // 可选
        loader(code, url, options, info) { // 可选
          console.log('只适用于appName2的插件')
          return code
        },
        processHtml(code, url, options, info) { // 可选
          console.log('只适用于 appName2 的 HTML 处理')
          return code
        },
      }]
    }
  }
})
```

## 1、地图插件
微前端 Micro-app 地图插件，适配高德、百度、腾讯地图 🎉🎉🎉

### 使用

Installation安装地图插件

```bash
  # with npm
  npm install @micro-zoe/micro-plugin-map --save-dev
  # with yarn
  yarn add @micro-zoe/micro-plugin-map --dev
```

Usage
we use the package like this step:

1、主用，在入口处安装对应地图的sdk

- 高德sdk `https://webapi.amap.com/maps?v=2.0&key=xxxxxx`
- 腾讯sdk `https://map.qq.com/api/gljs?v=1.exp&key=xxxxxx`
- 百度sdk `https://api.map.baidu.com/api?type=webgl&v=1.0&ak=xxxxxx`

2、在主应用中，使用该包

```js
  import microApp from '@micro-zoe/micro-app'
  import microPluginMap from '@micro-zoe/micro-plugin-map'

  // 设置为全局插件，作用于所有子应用
  microApp.start({
    plugins: {
      global: [microPluginMap],
    }
  })

  // 或者设置为某个子应用的插件，只作用于当前子应用
  microApp.start({
    plugins: {
      modules: {
        'appName': [microPluginMap],
      }
    }
  })
```

### 注意

- 目前插件目前仅在with沙箱下适用

- 插件以umd同步的方式引入sdk，异步加载的方式暂不支持

- 高德地图的不存在跨域问题，可以不用进行任何操作，高德地图若设置了使用白名单，需将白名单范围囊括主应用域名

- 腾讯地图，使用时候只是常规的跨越，用此插件进行常规使用即可，腾讯地图若设置了使用白名单，需将白名单范围囊括主应用域名

- 百度地图，使用时有跨域问题，可用此插件进行处理，百度地图若设置了使用白名单，需将白名单范围囊括主应用域名

### 源码
micro-plugin-map 源码地址：[https://github.com/micro-zoe/micro-plugin-map](https://github.com/micro-zoe/micro-plugin-map)

## 2、子午线埋点插件
子午线埋点文件中使用function定义将函数泄漏为全局变量，这在沙箱中是不允许的，所以我们需要将其修改为
`window.xx = funnction xx` 的形式进行适配。

```bash
# 安装子午线埋点插件
npm install @micro-zoe/plugin-painful-joya -S
```

```js
import microApp from '@micro-zoe/micro-app'
import painfulJoya from '@micro-zoe/plugin-painful-joya'

// 设置为全局插件，作用于所有子应用
microApp.start({
  plugins: {
    global: [painfulJoya],
  }
})

// 或者设置为某个子应用的插件，只作用于当前子应用
microApp.start({
  plugins: {
    modules: {
      'appName': [painfulJoya],
    }
  }
})
```
