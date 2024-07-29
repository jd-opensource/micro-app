MicroApp支持两种渲染微前端的模式，默认模式和umd模式。

- **默认模式：**子应用在初次渲染和后续渲染时会顺序执行所有js，以保证多次渲染的一致性。
- **umd模式：**子应用暴露出`mount`、`unmount`方法，此时只在初次渲染时执行所有js，后续渲染只会执行这两个方法，在多次渲染时具有更好的性能和内存表现。

通常情况下，我们推荐使用umd模式，以获得更好的性能和内存表现，默认模式更适合渲染和卸载不频繁的子应用。

**开启umd方式：**
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
import { createRouter, createWebHistory } from 'vue-router'
import routes from './router'
import App from './App.vue'

let app = null
let router = null
let history = null
// 👇 将渲染操作放入 mount 函数，子应用初始化时会自动执行
window.mount = () => {
  history = createWebHistory()
  router = createRouter({
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

#### ** React **
```js
// index.js
import React from "react"
import ReactDOM from "react-dom"
import App from './App'

// 👇 将渲染操作放入 mount 函数，子应用初始化时会自动执行
window.mount = () => {
  ReactDOM.render(<App />, document.getElementById("root"))
}

// 👇 将卸载操作放入 unmount 函数，就是上面步骤2中的卸载函数
window.unmount = () => {
  ReactDOM.unmountComponentAtNode(document.getElementById("root"))
}

// 如果不在微前端环境，则直接执行mount渲染
if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount()
}
```

#### ** Angular **
```js
// main.ts
import { NgModuleRef  } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

declare global {
  interface Window {
    microApp: any
    mount: CallableFunction
    unmount: CallableFunction
    __MICRO_APP_ENVIRONMENT__: string
  }
}

let app: void | NgModuleRef<AppModule>
// 👇 将渲染操作放入 mount 函数，子应用初始化时会自动执行
window.mount = () => {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .then((res: NgModuleRef<AppModule>) => {
      app = res
    })
    .catch(err => console.error(err))
}

// 👇 将卸载操作放入 unmount 函数，就是上面步骤2中的卸载函数
window.unmount = () => {
  // angular在部分场景下执行destroy时会删除根元素app-root，导致在此渲染时报错，此时可删除app.destroy()来避免这个问题
  app && app.destroy();
  app = undefined;
}

// 如果不在微前端环境，则直接执行mount渲染
if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount();
}
```
<!-- tabs:end -->
