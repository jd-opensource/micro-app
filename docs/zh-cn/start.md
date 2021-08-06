我们分别列出基座应用和子应用需要进行的修改，具体介绍`micro-app`的使用方式。

### 基座应用

1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

2、在入口处引入依赖
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

3、分配一个路由给子应用
<!-- tabs:start -->

#### ** React **
```js
// router.js
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import MyPage from './my-page'

export default function AppRoute () {
  return (
    <BrowserRouter>
      <Switch>
        // 👇👇 非严格匹配，/my-page/* 都将匹配到 MyPage 组件
        <Route path='/my-page'>
          <MyPage />
        </Route>
        ...
      </Switch>
    </BrowserRouter>
  )
}

export default routes
```

#### ** Vue **

```js
// router.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import MyPage from './my-page.vue'

Vue.use(VueRouter)

const routes = [
  {
    // 👇👇 非严格匹配，/my-page/* 都将匹配到 MyPage 组件
    path: '/my-page/*', 
    name: 'my-page',
    component: MyPage,
  },
]

export default routes
```
<!-- tabs:end -->

4、在`my-page`页面中使用组件
<!-- tabs:start -->

#### ** React **
```js
// my-page.js
export function MyPage () {
  return (
    <div>
      <h1>子应用</h1>
      // url为html地址 (基座应用和子应用本质是在同一个页面，这里的url只是html地址，子应用的路由还是基于浏览器地址的)
      <micro-app name='app1' url='http://localhost:3000/' baseurl='/my-page'></micro-app>
    </div>
  )
}
```

#### ** Vue **
```html
<!-- my-page.vue -->
<template>
  <div>
    <h1>子应用</h1>
    <!-- url为html地址 (基座应用和子应用本质是在同一个页面，这里的url只是html地址，子应用的路由还是基于浏览器地址的) -->
    <micro-app name='app1' url='http://localhost:3000/' baseurl='/my-page'></micro-app>
  </div>
</template>
```
<!-- tabs:end -->

### 子应用

1、添加路由前缀

<!-- tabs:start -->

#### ** React **
```js
// router.js
import { BrowserRouter, Switch, Route } from 'react-router-dom'

export default function AppRoute () {
  return (
    // 👇👇 添加路由前缀，子应用可以通过window.__MICRO_APP_BASE_URL__获取基座下发的baseurl
    <BrowserRouter basename={window.__MICRO_APP_BASE_URL__ || '/'}>
      <Switch>
        ...
      </Switch>
    </BrowserRouter>
  )
}
```

#### ** Vue **
```js
// main.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './router'

const router = new VueRouter({
  options: {
    // 👇👇 添加路由前缀，子应用可以通过window.__MICRO_APP_BASE_URL__获取基座下发的baseurl
    base: window.__MICRO_APP_BASE_URL__ || '/',
  },
  routes,
})

let app = new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
```
<!-- tabs:end -->


2、在webpack-dev-server的headers中设置跨域支持。
```js
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
},
```

完成以上步骤微前端即可正常渲染。

上面列出了react和vue框架的使用方式，它们是可以自由组合的，比如基座应用是react，子应用是vue，或者基座应用是vue，子应用是react，或者基座应用和子应用都是react、vue。 `micro-app`对前端框架没有限制，任何框架都可以作为基座应用嵌入任何类型框架的子应用。


> [!NOTE]
> 1、`name`和`url`属性必传，`name`值不可以重复。
>
> 2、`url`属性和子应用路由的关系请查看[这里](/zh-cn/route)
>
> 3、`baseurl`是基座应用分配给子应用的路由前缀，非必传，默认值为空字符串。
> 
> 4、子应用必须支持跨域访问，跨域配置参考[这里](/zh-cn/questions?id=_2、子应用静态资源一定要支持跨域吗？)
