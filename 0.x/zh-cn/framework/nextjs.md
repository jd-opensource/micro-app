本篇以`nextjs 11`作为案例介绍nextjs的接入方式，其它版本nextjs接入方式会在后续补充，如果你在使用时出现问题，请在github上提issue告知我们。

## 作为基座应用

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、引入micro-app
因为webComponent只能运行在浏览器环境，所以我们在`pages/_app.jsx`的`useEffect`中进行初始化。

```js
// pages/_app.jsx
import { useEffect } from 'react'
import microApp from '@micro-zoe/micro-app'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 初始化micro-app
    microApp.start()

    /**
     * BUG FIX
     * 在nextjs 11下，子应用内部跳转，基座无法监听，导致点击浏览器前进、后退按钮，无法回退到正确的子应用页面
     * 通过监听popstate事件，在地址变化时重新替换为next路由来解决这个问题
     */
    window.addEventListener('popstate', () => {
      const { href, origin } = window.location
      router.replace(href.replace(origin, ''))
    })
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
```

#### 3、设置动态路由
通过`pages/my-page/[[...]].js`设置动态路由，以确保`/my-page/*` 都指向当前页面。

详情参考：[optional-catch-all-routes](https://nextjs.org/docs/routing/dynamic-routes#optional-catch-all-routes)

#### 4、在页面中嵌入子应用
如上所述，micro-app只能运行在浏览器环境，所以在`useEffect`中通过变量控制子应用显示。

```js
// pages/my-page/[[...]].js
import { useState, useEffect } from 'react'

const MyPage = () => {
  const [show, changeShow] = useState(false)

  useEffect(() => {
    changeShow(true)
  }, [])

  return (
    <div>
      <h1>子应用</h1>
      {
        show && (
          <micro-app
            name='app1' // name(必传)：应用名称
            url='http://localhost:3000/' // url(必传)：应用地址，会被自动补全为http://localhost:3000/index.html
            baseroute='/my-page' // baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的 `/my-page`
          ></micro-app>
        )
      }
    </div>
  )
}

export default MyPage
```

## 作为子应用

#### 1、在基座应用中添加ssr配置
当子应用是ssr应用时，基座需要在micro-app元素上添加ssr属性，此时micro-app会根据ssr模式加载子应用。

```html
<micro-app name='xx' url='xx' ssr></micro-app>
```
基座应用不需要设置baseroute属性，因为ssr子应用无法使用。


#### 2、设置跨域支持
通过自定义服务设置跨域访问，详情参考 [custom-server](https://nextjs.org/docs/advanced-features/custom-server)

**步骤1、在根目录创建`server.js`**

`server.js`的内容如下：
```js
// server.js
const express = require('express')
const next = require('next')
const config = require('./next.config')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  // 设置跨域支持
  server.all('*', (req, res) => {
    res.setHeader('access-control-allow-origin', '*')
    return handle(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}${config.basePath}/`)
  })
})
```

**步骤2、修改`package.json`中的`scripts`，如下：**

```js
"scripts": {
  "dev": "node server.js",
  "build": "next build",
  "start": "cross-env NODE_ENV=production node server.js"
}
```

#### 3、设置基础路由
nextjs的基础路由只能在`next.config.js`中通过`basePath`写死，无法像SPA应用一样灵活配置。

```js
// next.config.js
const basePath = '基础路由，与基座分配的路由地址一致',
module.exports = {
  basePath,
}
```

#### 4、设置`assetPrefix` 和 `publicRuntimeConfig`
在`next.config.js`中设置`assetPrefix`，为静态资源添加路径前缀，避免子应用的静态资源使用相对地址时加载失败的情况。

```js
// next.config.js
// 基础路由
const basePath = '基础路由，与基座分配的路由地址一致',
// 静态资源路径前缀
const assetPrefix = process.env.NODE_ENV === 'production' ? `线上域名${basePath}` : `http://localhost:${process.env.PORT || 3000}${basePath}`

module.exports = {
  basePath,
  assetPrefix,
  // 添加 assetPrefix 地址到 publicRuntimeConfig
  publicRuntimeConfig: {
    assetPrefix,
  },
}
```

`assetPrefix`只对js、css等静态资源生效，对本地图片无效。

为此我们将`assetPrefix`作为参数传入`publicRuntimeConfig`，开发者需要手动通过`publicRuntimeConfig`补全图片地址。

方式如下：
```js
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

const Page = () => {
  return (
    <div>
      <img src={`${publicRuntimeConfig.assetPrefix}/local-img.png`} />
    </div>
  )
}

export default Page
```


#### 5、监听卸载
子应用被卸载时会接受到一个名为`unmount`的事件，在此可以进行卸载相关操作。

```js
// 监听卸载操作
window.addEventListener('unmount', function () {
  // 执行卸载相关操作
})
```

> [!NOTE]
> nextjs默认支持css module功能，如果你使用了此功能，建议关闭样式隔离以提升性能：`<micro-app name='xx' url='xx' disableScopecss></micro-app>`


## 实战案例
以上介绍了nextjs如何接入微前端，但在实际使用中会涉及更多功能，如数据通信、路由跳转、打包部署，为此我们提供了一套案例，用于展示nextjs作为基座嵌入(或作为子应用被嵌入) react、vue、angular、vite、nextjs、nuxtjs等框架，在案例中我们使用尽可能少的代码实现尽可能多的功能。

案例地址：https://github.com/micro-zoe/micro-app-demo-0.x

## 常见问题
#### 1、使用`next/image`组件加载图片失败
  
**解决方式：**

在部分nextjs版本中(如：nextjs 11)，使用`next/image`组件无法正确引入图片，此时推荐使用img元素代替。

#### 2、无法预加载ssr子应用

**原因：**因为ssr应用每个路由地址加载的html、js、css等静态资源都不同，所以无法对ssr子应用使用预加载。

#### 3、控制台报错`Cannot read properties of null (reading 'tagName')`

**原因：**当基座和子应用都是nextjs应用时，`next/head`组件冲突。

**解决方式：**去掉子应用中`next/head`组件。

#### 4、webpack.jsonpFunction冲突，导致加载子应用失败
**原因：**当基座和子应用都是官方脚手架创建的项目，容易造成webpack.jsonpFunction冲突。

**解决方式：**修改子应用的webpack配置。

`jsonpFunction`是webpack4中的名称，在webpack5中名称为`chunkLoadingGlobal`，请根据自己项目的webpack版本设置。

在`next.config.js`中配置webpack：
```js
// next.config.js
module.exports = {
  webpack: (config) => {
    Object.assign(config.output, {
      chunkLoadingGlobal: 'webpackJsonp_child_app', // webpack5
      // jsonpFunction: 'webpackJsonp_child_app', // webpack4
      globalObject: 'window',
    })
    return config
  },
}
```


> [!TIP]
>
> nextjs相关问题可以在[nextjs专属讨论贴](https://github.com/micro-zoe/micro-app/issues/168)下反馈。
