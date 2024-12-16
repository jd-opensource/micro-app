本篇以`angular 11`作为案例介绍angular的接入方式，其它版本angular接入方式会在后续补充，如果你在使用时出现问题，请在github上提issue告知我们。

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

#### 3、增加对WebComponent的支持

在`app/app.module.ts`中添加 `CUSTOM_ELEMENTS_SCHEMA` 到 @NgModule.schemas
```js
// app/app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
```

#### 4、分配一个路由给子应用

```js
// app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyPage } from './my-page/my-page.component';

const routes: Routes = [
  {
    // 👇 非严格匹配，/my-page/* 都指向 MyPage 页面
    path: 'my-page',
    children: [{
      path: '**',
      component: MyPage
    }]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})

export class AppRoutingModule { }
```

#### 4、在页面中嵌入子应用

```html
<!-- app/my-page/my-page.component.html -->
<div>
  <h1>子应用</h1>
  <!-- 
    name(必传)：应用名称
    url(必传)：应用地址，会被自动补全为http://localhost:3000/index.html
    baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的 `/my-page`
    -->
  <micro-app name='app1' url='http://localhost:3000/' baseroute='/my-page'></micro-app>
</div>
```

## 作为子应用

#### 1、在基座应用中引入`zone.js`
如果基座应用非angular，那么基座应用需要引入`zone.js`才能正确加载angular子应用。

步骤1、安装依赖
```
npm i zone.js --save
```

步骤2、在基座应用中引入zone.js
```js
import 'zone.js'
```

#### 2、设置跨域支持
angular官方脚手架创建的项目在开发环境下默认支持跨域访问，不需要特殊处理。

其它项目在`webpack-dev-server`中添加headers。

```js
headers: {
  'Access-Control-Allow-Origin': '*',
}
```

#### 3、关闭热更新
```bash
"scripts": {
  "start": "ng serve --live-reload false",
},
```

#### 4、设置基础路由`(如果基座是history路由，子应用是hash路由，这一步可以省略)`

```js
// app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

const routes: Routes = [...];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  // 👇 设置基础路由
  providers: [{
    provide: APP_BASE_HREF,
    // @ts-ignore __MICRO_APP_BASE_ROUTE__ 为micro-app传入的基础路由
    useValue: window.__MICRO_APP_BASE_ROUTE__ || '/',
  }]
})

export class AppRoutingModule { }
```

#### 5、设置 publicPath

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

#### 6、监听卸载
子应用被卸载时会接受到一个名为`unmount`的事件，在此可以进行卸载相关操作。

```js
// main.ts

let app = null;
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then((res: NgModuleRef<AppModule>) => {
    app = res
  })


// 监听卸载操作
window.addEventListener('unmount', function () {
  app.destroy();
  app = null;
})
```


## 实战案例
以上介绍了angular如何接入微前端，但在实际使用中会涉及更多功能，如数据通信、路由跳转、打包部署，为此我们提供了一套案例，用于展示angular作为基座嵌入(或作为子应用被嵌入) react、vue、angular、vite、nextjs、nuxtjs等框架，在案例中我们使用尽可能少的代码实现尽可能多的功能。

案例地址：https://github.com/micro-zoe/micro-app-demo-0.x

## 常见问题
#### 1、基座是react、nextjs应用，引入zone.js后导致micro-app元素生命周期异常
**解决方式：** 在micro-app元素上设置destroy

#### 2、@angular/material组件库样式失效
**解决方式：** 关闭样式隔离
```html
<micro-app name='xx' url='xx' disableScopecss></micro-app>
```

#### 3、通过micro-app数据通信修改angular组件数据后视图不更新

**原因：**因为在angular区域外调用了内部的代码(基座和子应用属于不同的angular区域)，angular无法知道状态发生了变化。

**解决方式：**通过`ngZone.run()`触发更改检测，具体方式如下：

![angular-question3](https://img14.360buyimg.com/imagetools/jfs/t1/207551/36/34684/49729/6523aee1F5efef0be/e50e6d782a223dc9.png ':size=800')
