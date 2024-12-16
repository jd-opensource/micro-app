## 1、自定义fetch
通过自定义fetch替换框架自带的fetch，可以修改fetch配置(添加cookie或header信息等等)，或拦截HTML、JS、CSS等静态资源。

自定义的fetch必须是一个返回string类型的Promise。

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  /**
   * 自定义fetch
   * @param {string} url 静态资源地址
   * @param {object} options fetch请求配置项
   * @param {string|null} appName 应用名称
   * @returns Promise<string>
  */
  fetch (url, options, appName) {
    if (url === 'http://localhost:3001/error.js') {
      // 删除 http://localhost:3001/error.js 的内容
      return Promise.resolve('')
    }
    
    const config = {
      // fetch 默认不带cookie，如果需要添加cookie需要配置credentials
      credentials: 'include', // 请求时带上cookie
    }

    return window.fetch(url, Object.assign(options, config)).then((res) => {
      return res.text()
    })
  }
})
```

> [!NOTE]
> 1、如果跨域请求带cookie，那么`Access-Control-Allow-Origin`不能设置为`*`，这一点需要注意


## 2、性能&内存优化
`micro-app`支持两种渲染微前端的模式，默认模式和umd模式。

- **默认模式：**子应用在初次渲染和后续渲染时会顺序执行所有js，以保证多次渲染的一致性。
- **umd模式：**子应用暴露出`mount`、`unmount`方法，此时只在初次渲染时执行所有js，后续渲染只会执行这两个方法，在多次渲染时具有更好的性能和内存表现。

**我的项目是否需要切换为umd模式?**

如果子应用渲染和卸载不频繁，那么使用默认模式即可，如果子应用渲染和卸载非常频繁建议使用umd模式。

**切换为umd模式：子应用在window上注册mount和unmount方法**

<!-- tabs:start -->

#### ** React **
```js
// index.js
import React from "react"
import ReactDOM from "react-dom"
import App from './App'

// 👇 将渲染操作放入 mount 函数 -- 必填
export function mount () {
  ReactDOM.render(<App />, document.getElementById("root"))
}

// 👇 将卸载操作放入 unmount 函数 -- 必填
export function unmount () {
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

#### ** Vue2 **
这里只介绍配合`vue-router3.x`的用法

```js
// main.js
import Vue from 'vue'
import router from './router'
import App from './App.vue'

let app = null
// 👇 将渲染操作放入 mount 函数 -- 必填
function mount () {
  app = new Vue({
    router,
    render: h => h(App),
  }).$mount('#app')
}

// 👇 将卸载操作放入 unmount 函数 -- 必填
function unmount () {
  app.$destroy()
  app.$el.innerHTML = ''
  app = null
}

// 微前端环境下，注册mount和unmount方法
if (window.__MICRO_APP_ENVIRONMENT__) {
  window[`micro-app-${window.__MICRO_APP_NAME__}`] = { mount, unmount }
} else {
  // 非微前端环境直接渲染
  mount()
}
```

#### ** Vue3 **
这里只介绍配合`vue-router4.x`的用法

```js
// main.js
import { createApp } from 'vue'
import * as VueRouter from 'vue-router'
import routes from './router'
import App from './App.vue'

let app = null
let router = null
let history = null
// 👇 将渲染操作放入 mount 函数 -- 必填
function mount () {
  history = VueRouter.createWebHistory(window.__MICRO_APP_BASE_ROUTE__ || '/')
  router = VueRouter.createRouter({
    history,
    routes,
  })

  app = createApp(App)
  app.use(router)
  app.mount('#app')
}

// 👇 将卸载操作放入 unmount 函数 -- 必填
function unmount () {
  app.unmount()
  history.destroy()
  app = null
  router = null
  history = null
}

// 微前端环境下，注册mount和unmount方法
if (window.__MICRO_APP_ENVIRONMENT__) {
  window[`micro-app-${window.__MICRO_APP_NAME__}`] = { mount, unmount }
} else {
  // 非微前端环境直接渲染
  mount()
}
```

#### ** Angular **
以`angular11`为例。

```js
// main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

declare global {
  interface Window {
    microApp: any
    __MICRO_APP_NAME__: string
    __MICRO_APP_ENVIRONMENT__: string
  }
}

let app = null;
// 👇 将渲染操作放入 mount 函数 -- 必填
async function mount () {
  app = await platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err))
}

// 👇 将卸载操作放入 unmount 函数 -- 必填
function unmount () {
  // angular在部分场景下执行destroy时会删除根元素app-root，此时可删除app.destroy()以避免这个问题
  app.destroy();
  app = null;
}

// 微前端环境下，注册mount和unmount方法
if (window.__MICRO_APP_ENVIRONMENT__) {
  window[`micro-app-${window.__MICRO_APP_NAME__}`] = { mount, unmount }
} else {
  // 非微前端环境直接渲染
  mount();
}
```


#### ** Vite **
因为vite作为子应用时关闭了沙箱，导致`__MICRO_APP_ENVIRONMENT__`和`__MICRO_APP_NAME__`两个变量失效，所以需要自行判断是否微前端环境以及手动填写应用name值。

这里以 vue3 + vue-router4 为例：
```js
// main.js
import { createApp } from 'vue'
import * as VueRouter from 'vue-router'
import routes from './router'
import App from './App.vue'

let app = null
let router = null
let history = null
// 👇 将渲染操作放入 mount 函数 -- 必填
function mount () {
  history = VueRouter.createWebHashHistory()
  router = VueRouter.createRouter({
    history,
    routes,
  })

  app = createApp(App)
  app.use(router)
  app.mount('#app')
}

// 👇 将卸载操作放入 unmount 函数 -- 必填
function unmount () {
  app.unmount()
  history.destroy()
  app = null
  router = null
  history = null
}

// 微前端环境下，注册mount和unmount方法
if (如果是微前端环境) {
  // 应用的name值，即 <micro-app> 元素的name属性值
  window[`micro-app-${应用的name值}`] = { mount, unmount }
} else {
  // 非微前端环境直接渲染
  mount()
}
```

#### ** 其它 **
```js
// entry.js

// 👇 将渲染操作放入 mount 函数 -- 必填
function mount () {
  ...
}

// 👇 将卸载操作放入 unmount 函数 -- 必填
function unmount () {
  ...
}

// 微前端环境下，注册mount和unmount方法
if (window.__MICRO_APP_ENVIRONMENT__) {
  window[`micro-app-${window.__MICRO_APP_NAME__}`] = { mount, unmount }
} else {
  // 非微前端环境直接渲染
  mount()
}
```
<!-- tabs:end -->

#### 自定义名称

通常注册函数的形式为 `window['micro-app-${window.__MICRO_APP_NAME__}'] = {}`，但也支持自定义名称，`window['自定义的名称'] = {}`

自定义的值需要在`<micro-app>`标签中通过`library`属性指定。

```html
<micro-app
  name='xxx'
  url='xxx'
  library='自定义的名称' 👈
></micro-app>
```

> [!NOTE]
>
> 1、mount和unmount方法都是必须的
>
> 2、nextjs, nuxtjs等ssr框架作为子应用时暂不支持umd模式
>
> 3、因为注册了`unmount`函数，所以卸载监听事件 `window.addEventListener('unmount', () => {})` 就不需要了
>
> 4、umd模式下，因为初次渲染和后续渲染逻辑不同，可能会出现一些问题，如：[#138](https://github.com/micro-zoe/micro-app/issues/138)
