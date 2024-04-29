本篇以`Vue 2、3`作为案例介绍vue的接入方式。

## 作为主应用

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、初始化micro-app
```js
// main.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

#### 3、嵌入子应用
```html
<template>
  <div>
    <h1>子应用👇</h1>
    <!-- name：应用名称, url：应用地址 -->
    <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
  </div>
</template>
```

> [!NOTE]
> 1、name：必传参数，必须以字母开头，且不可以带特殊符号(中划线、下划线除外)
>
> 2、url：必传参数，必须指向子应用的index.html，如：http://localhost:3000/ 或 http://localhost:3000/index.html


## 作为子应用

#### 1、设置跨域支持

<!-- tabs:start -->

#### ** vue.config.js **

```js
module.exports = {
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  }
}
```

#### ** vite.config.js **
vite默认开启跨域支持，不需要额外配置。
<!-- tabs:end -->


#### 2、注册卸载函数
子应用卸载时会自动执行`window.unmount`，在此可以进行卸载相关操作。

<!-- tabs:start -->

#### ** Vue2 **

```js
// main.js
const app = new Vue(...)

// 卸载应用
window.unmount = () => {
  app.$destroy()
}
```

#### ** Vue3 **
```js
// main.js
const app = createApp(App)
app.mount('#app')

// 卸载应用
window.unmount = () => {
  app.unmount()
}
```
<!-- tabs:end -->

完成以上步骤微前端即可正常渲染。

### 可选设置
以下配置是针对子应用的，它们是可选的，建议根据实际情况选择设置。

#### 1、开启umd模式，优化内存和性能
MicroApp支持两种渲染微前端的模式，默认模式和umd模式。

- **默认模式：**子应用在初次渲染和后续渲染时会顺序执行所有js，以保证多次渲染的一致性。
- **umd模式：**子应用暴露出`mount`、`unmount`方法，此时只在初次渲染时执行所有js，后续渲染只会执行这两个方法，在多次渲染时具有更好的性能和内存表现。

如果子应用渲染和卸载不频繁，那么使用默认模式即可，如果子应用渲染和卸载非常频繁建议使用umd模式。

<!-- tabs:start -->

#### ** Vue2 **
```js
// main.js
import Vue from 'vue'
import router from './router'
import App from './App.vue'

let app = null
// 👇 将渲染操作放入 mount 函数，子应用初始化时会自动执行
window.mount = () => {
  app = new Vue({
    router,
    render: h => h(App),
  }).$mount('#app')
}

// 👇 将卸载操作放入 unmount 函数，就是上面步骤2中的卸载函数
window.unmount = () => {
  app.$destroy()
  app.$el.innerHTML = ''
  app = null
}

// 如果不在微前端环境，则直接执行mount渲染
if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount()
}
```

#### ** Vue3 **
```js
// main.js
import { createApp } from 'vue'
import * as VueRouter from 'vue-router'
import routes from './router'
import App from './App.vue'

let app = null
let router = null
let history = null
// 👇 将渲染操作放入 mount 函数，子应用初始化时会自动执行
window.mount = () => {
  history = VueRouter.createWebHistory()
  router = VueRouter.createRouter({
    history,
    routes,
  })

  app = createApp(App)
  app.use(router)
  app.mount('#app')
}

// 👇 将卸载操作放入 unmount 函数，就是上面步骤2中的卸载函数
window.unmount = () => {
  app.unmount()
  history.destroy()
  app = null
  router = null
  history = null
}

// 如果不在微前端环境，则直接执行mount渲染
if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount()
}
```

<!-- tabs:end -->


#### 2、设置 webpack.jsonpFunction
如果微前端正常运行，则可以忽略这一步。

如果子应用资源加载混乱导致渲染失败，可以尝试设置`jsonpFunction`来解决，因为相同的`jsonpFunction`名称会导致资源污染。

这种情况常见于主应用和子应用都是通过`create-react-app`脚手架创建的react项目，vue项目中并不常见。

**解决方式：修改子应用的webpack配置**
<!-- tabs:start -->

#### ** vue.config.js **
```js
// vue.config.js
module.exports = {
  configureWebpack: {
    output: {
      jsonpFunction: `webpackJsonp_自定义名称`,
      globalObject: 'window',
    }
  },
}

```

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

`publicPath`是webpack提供的功能，所以vite应用是不支持的，它可以补全静态资源的地址，详情参考webpack文档 [publicPath](https://webpack.docschina.org/guides/public-path/#on-the-fly)

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

#### 4、切换到iframe沙箱
MicroApp有两种沙箱方案：`with沙箱`和`iframe沙箱`。

默认开启with沙箱，如果with沙箱无法正常运行，可以尝试切换到iframe沙箱。



## 常见问题
#### 1、主应用中抛出警告，micro-app未定义

**报错信息：**
  - vue2: `[Vue warn]: Unknown custom element: <micro-app>`
  - vue3: `[Vue warn]: Failed to resolve component: micro-app`

**参考issue：**[vue-next@1414](https://github.com/vuejs/vue-next/issues/1414)

**解决方式：** 在主应用中添加如下配置
<!-- tabs:start -->

#### ** Vue2 **
在入口文件main.js中设置ignoredElements，详情查看：https://cn.vuejs.org/v2/api/#ignoredElements
```js
// main.js
import Vue from 'vue'

Vue.config.ignoredElements = [
  'micro-app',
]
```

#### ** Vue3 **
在vue.config.js中添加chainWebpack配置，如下：
```js
// vue.config.js
module.exports = {
  chainWebpack: config => {
    config.module
    .rule('vue')
    .use('vue-loader')
    .tap(options => {
      options.compilerOptions = {
        ...(options.compilerOptions || {}),
        isCustomElement: (tag) => /^micro-app/.test(tag),
      };
      return options
    })
  }
}
```

#### ** Vite + Vue3 **
在vite.config.js中通过vue插件设置isCustomElement，如下：
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => /^micro-app/.test(tag)
        }
      }
    })
  ],
})
```
<!-- tabs:end -->

#### 2、虚拟路由系统为search模式时主应用循环刷新

**解决方式：**将router-view或者包含微前端的上层组件中`:key="route.fullPath"`改为`:key="route.path"`或者`:key="route.name"`

**例如：**

```html
<!-- bad 😭 -->
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.fullPath" />
  </transition>
</router-view>

<!-- good 😊 -->
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

```html
<!-- bad 😭 -->
<router-view :key="$route.fullPath"></router-view>

<!-- good 😊 -->
<router-view :key="$route.path"></router-view>
```
