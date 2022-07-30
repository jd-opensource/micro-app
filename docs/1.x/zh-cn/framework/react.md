本篇以`React 16、17`作为案例介绍react的接入方式，其它版本react的接入方式以此类推。我们默认开发者掌握了各版本react的开发技巧，如示例中useEffect，在不支持hooks的版本中转换为componentDidMount。

## 作为基座应用

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app@alpha --save
```

#### 2、初始化micro-app
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

#### 3、嵌入子应用
```js
export function MyPage () {
  return (
    <div>
      <h1>子应用👇</h1>
      // name：应用名称, url：应用地址
      <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
    </div>
  )
}
```

> [!NOTE]
> 1、name：必传参数，必须以字母开头，且不可以带特殊符号(中划线、下划线除外)
>
> 2、url：必传参数，必须指向子应用的index.html，如：http://localhost:3000/ 或 http://localhost:3000/index.html

## 作为子应用

#### 1、设置跨域支持

使用`create-react-app`脚手架创建的项目，在 `config/webpackDevServer.config.js` 文件中添加headers。

其它项目在`webpack-dev-server`中添加headers。

```js
headers: {
  'Access-Control-Allow-Origin': '*',
}
```

#### 2、监听卸载事件
子应用被卸载时会接受到一个名为`unmount`的事件，在此可以进行卸载相关操作。

```js
// index.js
window.addEventListener('unmount', function () {
  ReactDOM.unmountComponentAtNode(document.getElementById('root'))
})
```

### 可选配置
以下配置是针对子应用的，它们是可选的，但建议根据实际情况选择设置。

#### 1、开启umd模式，优化内存和性能
`micro-app`支持两种渲染微前端的模式，默认模式和umd模式。

- **默认模式：**子应用在初次渲染和后续渲染时会顺序执行所有js，以保证多次渲染的一致性。
- **umd模式：**子应用暴露出`mount`、`unmount`方法，此时只在初次渲染时执行所有js，后续渲染只会执行这两个方法，在多次渲染时具有更好的性能和内存表现。

如果子应用渲染和卸载不频繁，那么使用默认模式即可，如果子应用渲染和卸载非常频繁建议使用umd模式。

```js
// index.js
import React from "react"
import ReactDOM from "react-dom"
import App from './App'

// 👇 将渲染操作放入 mount 函数
function mount () {
  ReactDOM.render(<App />, document.getElementById("root"))
}

// 👇 将卸载操作放入 unmount 函数
function unmount () {
  ReactDOM.unmountComponentAtNode(document.getElementById("root"))
}

// 微前端环境下，注册mount和unmount方法
if (window.__MICRO_APP_ENVIRONMENT__) {
  window[`micro-app-${window.__MICRO_APP_NAME__}`] = { mount, unmount }
} else {
  // 非微前端环境直接渲染
  mount()
}
```

> [!NOTE]
>
> 1、mount和unmount方法都是必须的
>
> 2、因为注册了`unmount`函数，此时上述步骤2中监听卸载事件可以省略

#### 2、设置 webpack.jsonpFunction
如果子应用资源加载混乱导致渲染失败，可以尝试设置`jsonpFunction`来解决，因为相同的`jsonpFunction`名称会导致资源污染。

这种情况常见于基座和子应用都是通过`create-react-app`等脚手架创建的项目。

**解决方式：修改子应用的webpack配置**
<!-- tabs:start -->

#### ** webpack4 **
```js
// webpack.config.js
module.exports = {
  output: {
    ...
    jsonpFunction: `webpackJsonp_自定义名称`,
    globalObject: 'window',
  },
}
```

#### ** webpack5 **
```js
// webpack.config.js
module.exports = {
  output: {
    ...
    chunkLoadingGlobal: 'webpackJsonp_自定义名称',
    globalObject: 'window',
  },
}
```
<!-- tabs:end -->


#### 3、设置 publicPath
如果子应用出现静态资源地址404(js、css、图片)，建议设置`publicPath`来尝试解决这个问题。

`publicPath`是webpack提供的功能，它可以补全静态资源的地址，详情参考webpack文档 [publicPath](https://webpack.docschina.org/guides/public-path/#on-the-fly)

**步骤1:** 在子应用src目录下创建名称为`public-path.js`的文件，并添加如下内容
```js
// __MICRO_APP_ENVIRONMENT__和__MICRO_APP_PUBLIC_PATH__是由micro-app注入的全局变量
if (window.__MICRO_APP_ENVIRONMENT__) {
  // eslint-disable-next-line
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__
}
```

**步骤2:** 在子应用入口文件的`最顶部`引入`public-path.js`
```js
// index.js
import './public-path'
```


## 常见问题
无
