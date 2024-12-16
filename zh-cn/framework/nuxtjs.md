本篇以`nuxtjs 2`作为案例介绍nuxtjs的接入方式，其它版本nuxtjs接入方式会在后续补充，如果你在使用时出现问题，请在github上提issue告知我们。

## 作为主应用 :id=main

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、初始化micro-app
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

#### 3、在页面中加载子应用
因为micro-app只能运行在浏览器环境，所以在`mounted`钩子中通过变量控制子应用显示。

```html
<template>
  <!-- name：应用名称, url：应用地址 -->
  <micro-app v-if='show' name='my-app' url='http://localhost:3000/'></micro-app>
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

## 作为子应用 :id=child

#### 1、在主应用中添加ssr配置 :id=ssr
当子应用是ssr应用时，主应用需要在micro-app元素上添加ssr属性，此时micro-app会根据ssr模式加载子应用。

```html
<micro-app name='xx' url='xx' ssr></micro-app>
```


#### 2、设置跨域支持 :id=Access-Control-Allow-Origin
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
  console.log(`Ready on http://localhost:${port}/`)
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


#### 3、通过env注入运行时变量`assetPrefix` :id=assetPrefix
`assetPrefix`为静态资源路径前缀，开发者需要手动通过`assetPrefix`补全图片地址，避免子应用的图片在使用相对地址时加载失败的情况。

```js
// nuxt.config.js
const basePath = '基础路径' // 默认为 '/'
// 静态资源路径前缀
const assetPrefix = process.env.NODE_ENV === 'production' ? `线上域名${basePath}` : `http://localhost:${process.env.PORT || 3000}${basePath}`

module.exports = {
  // 将 assetPrefix 写入环境变量，通过 process.env.assetPrefix 访问
  env: {
    assetPrefix,
  },
  // 设置基础路径
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


#### 4、监听卸载 :id=unmount
子应用被卸载时会接受到一个名为`unmount`的事件，在此可以进行卸载相关操作。

```js
// 监听卸载操作
window.addEventListener('unmount', function () {
  // 执行卸载相关操作
})
```

#### 5、切换到iframe沙箱 :id=iframe
MicroApp有两种沙箱方案：`with沙箱`和`iframe沙箱`。

默认开启with沙箱，如果with沙箱无法正常运行，可以尝试切换到iframe沙箱。

```html
<micro-app name='xxx' url='xxx' iframe></micro-app>
```


## 常见问题
#### 1、控制台抛出警告`[Vue warn]: Unknown custom element: <micro-app>` :id=question-1
  
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
> nuxtjs相关问题可以在[nuxtjs专属讨论贴](https://github.com/jd-opensource/micro-app/issues/169)下反馈。

#### 2、无法预加载ssr子应用 :id=question-2

**原因：**因为ssr应用每个路由地址加载的html、js、css等静态资源都不同，所以无法对ssr子应用使用预加载。
