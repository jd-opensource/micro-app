我们分别列出基座应用和子应用需要进行的修改，具体介绍`micro-app`的使用方式。

### 基座应用

1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

2、在入口处引入
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
        // 👇 非严格匹配，/my-page/* 都指向 MyPage 页面
        <Route path='/my-page'>
          <MyPage />
        </Route>
      </Switch>
    </BrowserRouter>
  )
}
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
    // 👇 非严格匹配，/my-page/* 都指向 MyPage 页面
    path: '/my-page/*', // vue-router@4.x path的写法为：'/my-page/:page*'
    name: 'my-page',
    component: MyPage,
  },
]

export default routes
```
<!-- tabs:end -->

4、在`MyPage`页面中嵌入子应用
<!-- tabs:start -->

#### ** React **
```js
// my-page.js
export function MyPage () {
  return (
    <div>
      <h1>子应用</h1>
      // name(必传)：应用名称
      // url(必传)：应用地址，会被自动补全为http://localhost:3000/index.html
      // baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的 `/my-page`
      <micro-app name='app1' url='http://localhost:3000/' baseroute='/my-page'></micro-app>
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
    <!-- 
      name(必传)：应用名称
      url(必传)：应用地址，会被自动补全为http://localhost:3000/index.html
      baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的 `/my-page`
     -->
    <micro-app name='app1' url='http://localhost:3000/' baseroute='/my-page'></micro-app>
  </div>
</template>
```
<!-- tabs:end -->

### 子应用

1、设置基础路由`(如果基座应用是history路由，子应用是hash路由，这一步可以省略)`

<!-- tabs:start -->

#### ** React **
```js
// router.js
import { BrowserRouter, Switch, Route } from 'react-router-dom'

export default function AppRoute () {
  return (
    // 👇 设置基础路由，子应用可以通过window.__MICRO_APP_BASE_ROUTE__获取基座下发的baseroute，如果没有设置baseroute属性，则此值默认为空字符串
    <BrowserRouter basename={window.__MICRO_APP_BASE_ROUTE__ || '/'}>
      ...
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
  // 👇 设置基础路由，子应用可以通过window.__MICRO_APP_BASE_ROUTE__获取基座下发的baseroute，如果没有设置baseroute属性，则此值默认为空字符串
  base: window.__MICRO_APP_BASE_ROUTE__ || '/',
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
  }
},
```

完成以上步骤微前端即可正常渲染。


> [!NOTE]
> 1、name必须以字母开头，且不可以带有除中划线和下划线外的特殊符号
>
> 2、url只是html地址，子应用的页面渲染还是基于浏览器地址的，关于这点请查看[路由一章](/zh-cn/route)
>
> 3、baseroute的作用请查看[路由配置](/zh-cn/route?id=路由配置)
>
> 4、子应用必须支持跨域访问，跨域配置参考[这里](/zh-cn/questions?id=_2、子应用静态资源一定要支持跨域吗？)
