native模式是指放开路由隔离，主应用和子应用同时基于浏览器路由进行渲染，共用同一套location和history，拥有更好的用户体验，但更容易导致主应用和子应用的路由冲突，具体原理参考[关于native模式的原理解析](/zh-cn/native-mode?id=关于native模式的原理解析)。

native模式需要更加复杂的路由配置，主应用和子应用的路由都要进行一些改造。

### 路由类型约束
native模式下主、子应用需要遵循以下约束：
- 1、主应用是hash路由，子应用也必须是hash路由
- 2、主应用是history路由，子应用可以是hash或history路由

### 基础路由
**作用：**

通常主应用和子应用各有一套路由系统，为了防止冲突，主应用需要分配一个路由给子应用，称之为基础路由，子应用可以在这个路由下渲染，但不能超出这个路由的范围，这就是基础路由的作用。

**使用方式**

主应用中通过设置 `<micro-app>`的`baseroute`属性下发，子应用通过`window.__MICRO_APP_BASE_ROUTE__`获取此值并设置基础路由。

**注意点：**
- 1、如果主应用是history路由，子应用是hash路由，不需要设置基础路由baseroute
- 2、如果子应用只有一个页面，没有使用`react-router`，`vue-router`之类，也不需要设置基础路由baseroute
- 3、vue-router在hash模式下无法通过base设置基础路由，需要创建一个空的路由页面，将其它路由作为它的children，具体设置如下：

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


**示例**

**React**

<!-- tabs:start -->

#### ** 主应用 **

```js
// router.js
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import ChildPage from './child-page'

export default function AppRoute () {
  return (
    <BrowserRouter>
      <Switch>
        // 非严格匹配，/child/* 都指向ChildPage组件
        // /child 就是分配给子应用的基础路由baseroute
        <Route path='/child'>
          <ChildPage />
        </Route>
      </Switch>
    </BrowserRouter>
  )
}

// child-page.js
export function ChildPage () {
  return (
    <div>
      <h1>子应用</h1>
      <micro-app name='child-app' url='http://localhost:3000/' baseroute='/child'></micro-app>
    </div>
  )
}
```

#### ** 子应用 **
```js
import { BrowserRouter, Switch, Route } from 'react-router-dom'

export default function AppRoute () {
  return (
    // 👇 设置基础路由，子应用可以通过window.__MICRO_APP_BASE_ROUTE__获取主应用下发的baseroute，如果没有设置baseroute属性，则此值默认为空字符串
    <BrowserRouter basename={window.__MICRO_APP_BASE_ROUTE__ || '/'}>
      ...
    </BrowserRouter>
  )
}
```
<!-- tabs:end -->

**Vue**

<!-- tabs:start -->

#### ** 主应用 **

```js
// router.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import ChildPage from './child-page.vue'

Vue.use(VueRouter)

const routes = [
  {
    // /child/* 都指向ChildPage组件
    path: '/child/*',  // vue-router@4.x path的写法为：'/child/:page*'
    name: 'child',
    component: ChildPage,
  },
]

export default routes

// child-page.vue
<template>
  <div>
    <h1>子应用</h1>
    <micro-app name='child-app' url='http://localhost:3000/' baseroute='/child'></micro-app>
  </div>
</template>
```

#### ** 子应用 **
```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './router'

const router = new VueRouter({
  // 👇 设置基础路由，子应用可以通过window.__MICRO_APP_BASE_ROUTE__获取主应用下发的baseroute，如果没有设置baseroute属性，则此值默认为空字符串
  base: window.__MICRO_APP_BASE_ROUTE__ || '/',
  routes,
})

let app = new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
```
<!-- tabs:end -->

> [!TIP]
> vue-router@4.x设置base的方式请查看 https://next.router.vuejs.org/

### 关于native模式的原理解析
**原理：**子应用根据浏览器地址渲染对应的页面，而不是micro-app的url属性

##### 例1:

浏览器地址为：`http://localhost:3000/page1?id=1#hash`，此时pathname为`/page1`，search为`?id=1`，hash为`#hash`。

主应用匹配`/page1`并渲染对应的页面，路由参数为`id=1`，hash为`#hash`，子应用也是一样，浏览器地址会同时影响到主应用和子应用。

每个应用都有一套自己的路由系统，它们是可以共存的，不会冲突。

假设我们要渲染子应用的`page1`页面，参数为`id=1`，hash为`#hash`，那么正确的形式是：1、micro-app的url属性设置为`http://子应用域名/` 2、浏览器地址为`http://主应用域名/page1?id=1#hash`。

```html
<!-- ❌ 这里 /page1?id=1#hash 是错误的，应该添加到浏览器地址上 -->
<micro-app url='http://子应用域名/page1?id=1#hash'></micro-app>

<!-- ✔️ 这个url才是正确的 -->
<micro-app url='http://子应用域名/'></micro-app>
```
子应用加载完成后会根据浏览器的地址匹配并渲染对应的页面。


##### 例2:

场景：主应用是history路由，子应用也是history路由，我们要跳转主应用的`my-app`页面，`my-app`页面中嵌入子应用，我们要展现子应用的`page1`页面。

那么浏览器地址应该为：`http://主应用域名/my-page/page1`，我们在主应用中跳转的参数为：`router.push('/my-page/page1')`

原理：主应用匹配到`/my-page`路径并渲染`my-app`页面，因为`my-app`页面中嵌入了子应用，此时子应用开始加载并渲染，子应用在渲染时会匹配到`/my-page/page1`并渲染`page1`页面。

micro-app配置如下：
```html
<!-- 子应用通过baseroute设置基础路由/my-page -->
<micro-app url='http://子应用域名/index.html' baseroute='/my-page'></micro-app>
```


##### 例3:

场景：主应用是hash路由，子应用也是hash路由，我们要跳转主应用的`my-app`页面，`my-app`页面中嵌入子应用，我们要展现子应用的`page1`页面。

那么浏览器地址应该为：`http://主应用域名/#/my-page/page1`，我们在主应用中跳转的参数为：`router.push('/my-page/page1')`

原理：主应用匹配到`#/my-page`路径并渲染`my-app`页面，因为`my-app`页面中嵌入了子应用，此时子应用开始加载并渲染，子应用在渲染时会匹配到`#/my-page/page1`并渲染`page1`页面。

```html
<!-- 子应用通过baseroute设置基础路由/my-page -->
<micro-app url='http://子应用域名/index.html' baseroute='/my-page'></micro-app>
```

##### 例4:

场景：主应用是history路由，子应用是hash路由，我们要跳转主应用的`my-app`页面，页面中嵌入子应用，我们要展现子应用的`page1`页面。

那么浏览器地址应该为：`http://主应用域名/my-page/#/page1`，我们在主应用中跳转`my-app`页面的参数为：`router.push('/my-page/#/page1')`

原理：主应用匹配到`/my-page`路径并渲染`my-app`页面，因为`my-app`页面中嵌入了子应用，此时子应用开始加载并渲染，子应用在渲染时会匹配到`#/page1`并渲染`page1`页面。

micro-app配置如下：
```html
<!-- 此时不需要设置baseroute -->
<micro-app url='http://子应用域名/index.html'></micro-app>
```

> [!TIP]
> 如果你看到这里还是无法正确设置路由，不妨试试其它路由模式
