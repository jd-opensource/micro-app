本篇以`React 16、17`作为案例介绍react的接入方式，其它版本react的接入方式以此类推。我们默认开发者掌握了各版本react的开发技巧，如示例中useEffect，在不支持hooks的版本中转换为componentDidMount。

## 作为基座应用
我们强烈建议基座应用采用history模式，hash路由的基座应用只能加载hash路由的子应用，history模式的基座应用对这两种子应用都支持。

在以下案例中，我们默认基座的路由为history模式。

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、在入口处引入
```js
// entry
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

#### 3、分配一个路由给子应用

```js
// router.js
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import MyPage from './my-page'

export default function AppRoute () {
  return (
    <BrowserRouter>
      <Switch>
        // 👇 非严格匹配，/my-page/* 都指向 MyPage 页面
        <Route path='/my-page'>
          <MyPage />
        </Route>
      </Switch>
    </BrowserRouter>
  )
}
```

#### 4、在页面中嵌入子应用

```js
export function MyPage () {
  return (
    <div>
      <h1>子应用</h1>
      <micro-app
        name='app1' // name(必传)：应用名称
        url='http://localhost:3000/' // url(必传)：应用地址，会被自动补全为http://localhost:3000/index.html
        baseroute='/my-page' // baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的 `/my-page`
      ></micro-app>
    </div>
  )
}
```

## 作为子应用

#### 1、设置跨域支持

使用`create-react-app`脚手架创建的项目，在 `config/webpackDevServer.config.js` 文件中添加headers。

其它项目在`webpack-dev-server`中添加headers。

```js
headers: {
  'Access-Control-Allow-Origin': '*',
}
```


#### 2、设置基础路由`(如果基座是history路由，子应用是hash路由，这一步可以省略)`

```js
// router.js
import { BrowserRouter, Switch, Route } from 'react-router-dom'

export default function AppRoute () {
  return (
    // 👇 设置基础路由，如果没有设置baseroute属性，则window.__MICRO_APP_BASE_ROUTE__为空字符串
    <BrowserRouter basename={window.__MICRO_APP_BASE_ROUTE__ || '/'}>
      ...
    </BrowserRouter>
  )
}
```

#### 3、设置 publicPath

这一步借助了webpack的功能，避免子应用的静态资源使用相对地址时加载失败的情况，详情参考webpack文档 [publicPath](https://webpack.docschina.org/guides/public-path/#on-the-fly)

*如果子应用不是webpack构建的，这一步可以省略。*

**步骤1:** 在子应用src目录下创建名称为`public-path.js`的文件，并添加如下内容
```js
// __MICRO_APP_ENVIRONMENT__和__MICRO_APP_PUBLIC_PATH__是由micro-app注入的全局变量
if (window.__MICRO_APP_ENVIRONMENT__) {
  // eslint-disable-next-line
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__
}
```

**步骤2:** 在子应用入口文件的**最顶部**引入`public-path.js`
```js
// entry
import './public-path'
```

#### 4、监听卸载
子应用被卸载时会接受到一个名为`unmount`的事件，在此可以进行卸载相关操作。

```js
window.addEventListener('unmount', function () {
  ReactDOM.unmountComponentAtNode(document.getElementById('root'))
})
```

## 实战案例
以上介绍了react如何接入微前端，但在实际使用中会涉及更多功能，如数据通信、路由跳转、打包部署，为此我们提供了一套案例，用于展示react作为基座嵌入(或作为子应用被嵌入) react、vue、angular、vite、nextjs、nuxtjs等框架，在案例中我们使用尽可能少的代码实现尽可能多的功能。

案例地址：https://github.com/micro-zoe/micro-app-demo-0.x

## 常见问题
#### 1、create-react-app创建的子应用，被嵌入微前端后sockjs-node报错

**报错信息：**`WebSocket connection to 'ws://localhost:3000/sockjs-node' failed`

**原因：**子应用的sockjs-node会根据当前页面的端口号进行通信，嵌入微前端后，端口号为基座的，而非子应用的，导致报错。
虽然这个问题不影响应用的正常运行，但还是要进行处理。

**解决方式：**使用插件系统补全子应用sockjs-node的端口号。
```js
microApp.start({
  plugins: {
    modules: {
      子应用名称: [{
        loader(code) {
          if (process.env.NODE_ENV === 'development' && code.indexOf('sockjs-node') > -1) {
            code = code.replace('window.location.port', 子应用端口)
          }
          return code
        }
      }],
    }
  }
})
```
