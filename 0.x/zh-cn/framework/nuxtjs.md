本篇以`nuxtjs 2`作为案例介绍nuxtjs的接入方式，其它版本nuxtjs接入方式会在后续补充，如果你在使用时出现问题，请在github上提issue告知我们。

## 作为基座应用

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、引入micro-app
因为webComponent只能运行在浏览器环境，所以我们需要在浏览器环境执行micro-app的初始化。

如果没有layouts文件，则创建文件`layouts/default.vue`，如果已经有layouts文件，直接复用即可，layouts相关信息参考：[layouts](https://nuxtjs.org/docs/directory-structure/layouts)

```js
// layouts/default.vue
<template>
  <Nuxt />
</template>

<script>
import microApp from '@micro-zoe/micro-app'

export default {
  name: 'default',
  mounted () {
    microApp.start()
  }
}
</script>
```

#### 3、设置动态路由
通过`pages/my-page/_.vue`设置动态路由，以确保`/my-page/*` 都指向当前页面。

详情参考：[dynamic-routes](https://nuxtjs.org/docs/features/file-system-routing#dynamic-routes)

#### 4、在页面中嵌入子应用
如上所述，micro-app只能运行在浏览器环境，所以在`mounted`钩子中通过变量控制子应用显示。

```html
<template>
  <div>
    <h1>子应用</h1>
    <!-- 
      name(必传)：应用名称
      url(必传)：应用地址，会被自动补全为http://localhost:3000/index.html
      baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的 `/my-page`
     -->
    <micro-app v-if='show' name='app1' url='http://localhost:3000/' baseroute='/my-page'></micro-app>
  </div>
</template>

<script>
export default {
  name: 'my-page',
  data () {
    return {
      show: false,
    }
  },
  mounted () {
    this.show = true
  },
}
</script>
```

## 作为子应用

#### 1、在基座应用中添加ssr配置
当子应用是ssr应用时，基座需要在micro-app元素上添加ssr属性，此时micro-app会根据ssr模式加载子应用。

```html
<micro-app name='xx' url='xx' ssr></micro-app>
```
基座应用不需要设置baseroute属性，因为ssr子应用无法使用。


#### 2、设置跨域支持
通过自定义服务设置跨域访问。

**步骤1、在根目录创建`server.js`**

`server.js`的内容如下：
```js
// server.js
const express = require('express')
const { Nuxt, Builder } = require('nuxt')

const app = express()

const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3000

// Import and set Nuxt options
const config = require('./nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

const nuxt = new Nuxt(config)

// Start build process in dev mode
if (config.dev) {
  const builder = new Builder(nuxt)
  builder.build()
}

// 设置跨域支持
app.all('*', (req, res, next) => {
	res.header("Access-Control-Allow-Origin", '*')
  next()
})

// Give nuxt middleware to express
app.use(nuxt.render)

// Start express server
app.listen(port, host, () => {
  console.log(`Ready on http://localhost:${port}${config.router.base}`)
})
```

**步骤2、修改`package.json`中的`scripts`，如下：**

```js
"scripts": {
  "dev": "node server.js",
  "build": "nuxt build",
  "start": "cross-env NODE_ENV=production node server.js",
}
```

#### 3、设置基础路由
nuxtjs的基础路由只能在`nuxt.config.js`中通过`router.base`写死，无法像SPA应用一样灵活配置。

```js
// nuxt.config.js
const basePath = '基础路由，与基座分配的路由地址一致',

module.exports = {
  // 设置基础路由
  router: {
    base: basePath,
  },
}
```

#### 4、通过env注入运行时变量`assetPrefix`
`assetPrefix`为静态资源路径前缀，开发者需要手动通过`assetPrefix`补全图片地址，避免子应用的图片在使用相对地址时加载失败的情况。

```js
// nuxt.config.js
// 基础路由
const basePath = '基础路由，与基座分配的路由地址一致',
// 静态资源路径前缀
const assetPrefix = process.env.NODE_ENV === 'production' ? `线上域名${basePath}` : `http://localhost:${process.env.PORT || 3000}${basePath}`

module.exports = {
  // 将 assetPrefix 写入环境变量，通过 process.env.assetPrefix 访问
  env: {
    assetPrefix,
  },
  // 设置基础路由
  router: {
    base: basePath,
  },
}
```

使用方式如下：
```js
<template>
  <div>
    <img :src="localImg" />
  </div>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  data () {
    return {
      // 补全图片地址
      localImg: process.env.assetPrefix + '/local-img.png',
    }
  }
})
</script>
```


#### 5、监听卸载
子应用被卸载时会接受到一个名为`unmount`的事件，在此可以进行卸载相关操作。

```js
// 监听卸载操作
window.addEventListener('unmount', function () {
  // 执行卸载相关操作
})
```


## 实战案例
以上介绍了nuxtjs如何接入微前端，但在实际使用中会涉及更多功能，如数据通信、路由跳转、打包部署，为此我们提供了一套案例，用于展示nuxtjs作为基座嵌入(或作为子应用被嵌入) react、vue、angular、vite、nextjs、nuxtjs等框架，在案例中我们使用尽可能少的代码实现尽可能多的功能。

案例地址：https://github.com/micro-zoe/micro-app-demo-0.x

## 常见问题
#### 1、控制台抛出警告`[Vue warn]: Unknown custom element: <micro-app>`
  
**解决方式：**在`nuxt.config.js`中添加配置，设置`ignoredElements`忽略micro-app元素。
```js
// nuxt.config.js
module.exports = {
  vue: {
    config: {
      ignoredElements: [
        'micro-app',
      ],
    }
  },
}
```


> [!TIP]
>
> nuxtjs相关问题可以在[nuxtjs专属讨论贴](https://github.com/micro-zoe/micro-app/issues/169)下反馈。
