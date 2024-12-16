本篇以`Vue 2、3`作为案例介绍vue的接入方式，其它版本vue的接入方式以此类推，我们默认开发者掌握了各版本vue的开发技巧，比如示例中vue2的代码如何转换为vue1。

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

<!-- tabs:start -->

#### ** Vue2 **

```js
// router.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import MyPage from './my-page.vue'

Vue.use(VueRouter)

const routes = [
  {
    // 👇 非严格匹配，/my-page/* 都指向 MyPage 页面
    path: '/my-page/*',
    name: 'my-page',
    component: MyPage,
  },
]

export default routes
```

#### ** Vue3 **
```js
// router.js
import { createRouter, createWebHistory } from 'vue-router'
import MyPage from './my-page.vue'

const routes = [
  {
    // 👇 非严格匹配，/my-page/* 都指向 MyPage 页面
    path: '/my-page/:page*',
    name: 'my-page',
    component: MyPage,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
```
<!-- tabs:end -->


#### 4、在页面中嵌入子应用

```html
<!-- my-page.vue -->
<template>
  <div>
    <h1>子应用</h1>
    <!-- 
      name(必传)：应用名称
      url(必传)：应用地址，会被自动补全为http://localhost:3000/index.html
      baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的 `/my-page`
     -->
    <micro-app name='app1' url='http://localhost:3000/' baseroute='/my-page'></micro-app>
  </div>
</template>
```

## 作为子应用

#### 1、设置跨域支持

在`vue.config.js`中添加配置

```js
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  }
}
```


#### 2、设置基础路由`(如果基座是history路由，子应用是hash路由，这一步可以省略)`

<!-- tabs:start -->

#### ** Vue2 **

```js
// main.js
import VueRouter from 'vue-router'
import routes from './router'

const router = new VueRouter({
  mode: 'history',
  // 👇 __MICRO_APP_BASE_ROUTE__ 为micro-app传入的基础路由
  base: window.__MICRO_APP_BASE_ROUTE__ || process.env.BASE_URL,
  routes,
})

```

#### ** Vue3 **
```js
// main.js
import { createRouter, createWebHistory } from 'vue-router'
import routes from './router'

const router = createRouter({
  // 👇 __MICRO_APP_BASE_ROUTE__ 为micro-app传入的基础路由
  history: createWebHistory(window.__MICRO_APP_BASE_ROUTE__ || process.env.BASE_URL),
  routes,
})
```
<!-- tabs:end -->


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

<!-- tabs:start -->

#### ** Vue2 **

```js
// main.js
const app = new Vue(...)

// 监听卸载操作
window.addEventListener('unmount', function () {
  app.$destroy()
})
```

#### ** Vue3 **
```js
// main.js
const app = createApp(App)
app.mount('#app')

// 监听卸载操作
window.addEventListener('unmount', function () {
  app.unmount()
})
```
<!-- tabs:end -->


## 实战案例
以上介绍了vue如何接入微前端，但在实际使用中会涉及更多功能，如数据通信、路由跳转、打包部署，为此我们提供了一套案例，用于展示vue作为基座嵌入(或作为子应用被嵌入) react、vue、angular、vite、nextjs、nuxtjs等框架，在案例中我们使用尽可能少的代码实现尽可能多的功能。

案例地址：https://github.com/micro-zoe/micro-app-demo-0.x

## 常见问题
#### 1、基座应用中抛出警告，micro-app未定义

**报错信息：**
  - vue2: `[Vue warn]: Unknown custom element: <micro-app>`
  - vue3: `[Vue warn]: Failed to resolve component: micro-app`

**参考issue：**[vue-next@1414](https://github.com/vuejs/vue-next/issues/1414)

**解决方式：** 在基座应用中添加如下配置
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

<!-- #### 2、子应用中element-plus部分弹框样式失效

**原因：**element-plus中部分组件，如`Select`, `TimePicker`的弹框元素会脱离micro-app的范围逃逸到外层body上，导致样式失效。

**解决方式：** 

  1、关闭样式隔离[disablescopecss](/zh-cn/configure?id=disablescopecss)

  2、部分组件，如`Select`提供了`popper-append-to-body`配置，用于设置弹框不插入body，可以避免这个问题。如果组件没有提供类似的功能，则暂且只能通过关闭样式隔离解决。 -->


#### 2、当基座和子应用都是vue-router4，点击浏览器返回按钮页面丢失

**原因：**vue-router4没有对路由堆栈state做唯一性标记，导致基座和子应用相互影响，vue-router3及其它框架路由没有类似问题。

**测试版本：**vue-router@4.0.12

**相关issue：**[155](https://github.com/micro-zoe/micro-app/issues/155)

**解决方式：**在子应用中添加如下设置
```js
if (window.__MICRO_APP_ENVIRONMENT__) {
  // 如果__MICRO_APP_BASE_ROUTE__为 `/基座应用基础路由/子应用基础路由/`，则应去掉`/基座应用基础路由`
  // 如果对这句话不理解，可以参考案例：https://github.com/micro-zoe/micro-app-demo-0.x
  const realBaseRoute = window.__MICRO_APP_BASE_ROUTE__

  router.beforeEach(() => {
    if (typeof window.history.state?.current === 'string') {
      window.history.state.current = window.history.state.current.replace(new RegExp(realBaseRoute, 'g'), '')
    }
  })

  router.afterEach(() => {
    if (typeof window.history.state === 'object') {
      window.history.state.current = realBaseRoute +  (window.history.state.current || '')
    }
  })
}
```

#### 3、vue-router在hash模式无法通过base设置基础路由

**解决方式：**创建一个空的路由页面，将其它路由作为它的children，具体设置如下：

```js
import RootApp from './root-app.vue'

const routes = [
    {
      path: window.__MICRO_APP_BASE_ROUTE__ || '/',
      component: RootApp,
      children: [
        // 其他的路由都写到这里
      ],
    },
]
```

`root-app.vue`内容如下：
```html
<template>
  <router-view />
</template>
```
