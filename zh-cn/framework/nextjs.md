本篇以`nextjs 11`作为案例介绍nextjs的接入方式，其它版本nextjs接入方式会在后续补充，如果你在使用时出现问题，请在github上提issue告知我们。

## 作为主应用 :id=main

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、初始化micro-app
因为webComponent只能运行在浏览器环境，所以我们在`pages/_app.jsx`的`useEffect`中进行初始化。

```js
// pages/_app.jsx
import { useEffect } from 'react'
import microApp from '@micro-zoe/micro-app'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 初始化micro-app
    microApp.start()
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
```

#### 3、在页面中加载子应用
因为micro-app只能运行在浏览器环境，所以在`useEffect`中通过变量控制子应用显示。

```js
// pages/my-page.js
import { useState, useEffect } from 'react'

const MyPage = () => {
  const [show, changeShow] = useState(false)

  useEffect(() => {
    changeShow(true)
  }, [])

  return (
    <div>
      {
        // name：应用名称, url：应用地址
        show && (<micro-app name='my-app' url='http://localhost:3000/'></micro-app>)
      }
    </div>
  )
}

export default MyPage
```

> [!NOTE]
> 1、name：必传参数，必须以字母开头，且不可以带特殊符号(中划线、下划线除外)
>
> 2、url：必传参数，必须指向子应用的index.html，如：http://localhost:3000/ 或 http://localhost:3000/index.html


## 作为子应用 :id=child

#### 1、在主应用中添加ssr配置 :id=ssr
当子应用是ssr应用时，主应用需要在micro-app元素上添加ssr属性，此时micro-app会根据ssr模式加载子应用。

```html
<micro-app name='xx' url='xx' ssr></micro-app>
```


#### 2、设置跨域支持 :id=Access-Control-Allow-Origin
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
    console.log(`> Ready on http://localhost:${port}/`)
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

#### 3、设置`assetPrefix` 和 `publicRuntimeConfig` :id=assetPrefix
在`next.config.js`中设置`assetPrefix`，为静态资源添加路径前缀，避免子应用的静态资源使用相对地址时加载失败的情况。

```js
// next.config.js
const basePath = '基础路径' // 默认为 '/'
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


#### 4、监听卸载 :id=unmount
子应用被卸载时会接受到一个名为`unmount`的事件，在此可以进行卸载相关操作。

```js
// 监听卸载操作
window.addEventListener('unmount', function () {
  // 执行卸载相关操作
})
```

> [!NOTE]
> nextjs默认支持css module功能，如果你使用了此功能，建议关闭样式隔离以提升性能：`<micro-app name='xx' url='xx' disableScopecss></micro-app>`

#### 5、切换到iframe沙箱 :id=iframe
MicroApp有两种沙箱方案：`with沙箱`和`iframe沙箱`。

默认开启with沙箱，如果with沙箱无法正常运行，可以尝试切换到iframe沙箱。

```html
<micro-app name='xxx' url='xxx' iframe></micro-app>
```


## 常见问题
#### 1、使用`next/image`组件加载图片失败 :id=question-1
  
**解决方式：**

在部分nextjs版本中(如：nextjs 11)，使用`next/image`组件无法正确引入图片，此时推荐使用img元素代替。

#### 2、无法预加载ssr子应用 :id=question-2

**原因：**因为ssr应用每个路由地址加载的html、js、css等静态资源都不同，所以无法对ssr子应用使用预加载。

#### 3、控制台报错`Cannot read properties of null (reading 'tagName')` :id=question-3

**原因：**当主应用和子应用都是nextjs应用时，`next/head`组件冲突。

**解决方式：**去掉子应用中`next/head`组件。

#### 4、webpack.jsonpFunction冲突，导致加载子应用失败 :id=question-4
**原因：**当主应用和子应用都是官方脚手架创建的项目，容易造成webpack.jsonpFunction冲突。

**解决方式：**修改子应用的webpack配置。

`jsonpFunction`是webpack4中的名称，在webpack5中名称为`chunkLoadingGlobal`，请根据自己项目的webpack版本设置。

在`next.config.js`中配置webpack：
```js
// next.config.js
module.exports = {
  webpack: (config) => {
    Object.assign(config.output, {
      chunkLoadingGlobal: 'webpackJsonp_自定义名称', // webpack5
      // jsonpFunction: 'webpackJsonp_自定义名称', // webpack4
      globalObject: 'window',
    })
    return config
  },
}
```


> [!TIP]
>
> nextjs相关问题可以在[nextjs专属讨论贴](https://github.com/jd-opensource/micro-app/issues/168)下反馈。
