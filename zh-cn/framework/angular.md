本篇以`angular 11`作为案例介绍angular的接入方式，其它版本angular接入方式会在后续补充，如果你在使用时出现问题，请在github上提issue告知我们。

## 作为主应用 :id=main

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、初始化micro-app
```js
// main.ts
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

#### 4、在页面中加载子应用

通过注册的自定义元素`<micro-app>`加载子应用

```html
<!-- app/my-page/my-page.component.html -->
<div>
  <!-- name：应用名称, url：应用地址 -->
  <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
</div>
```

> [!NOTE]
> 1、name：必传参数，必须以字母开头，且不可以带特殊符号(中划线、下划线除外)
>
> 2、url：必传参数，必须指向子应用的index.html，如：http://localhost:3000/ 或 http://localhost:3000/index.html


## 作为子应用 :id=child

#### 1、在主应用中引入`zone.js` :id=zone
如果主应用非angular，那么主应用需要引入`zone.js`才能正确加载angular子应用。

步骤1、安装依赖
```
npm i zone.js --save
```

步骤2、在主应用中引入zone.js
```js
import 'zone.js'
```

#### 2、设置跨域支持 :id=Access-Control-Allow-Origin
angular官方脚手架创建的项目在开发环境下默认支持跨域访问，不需要特殊处理。

其它项目在`webpack-dev-server`中添加headers。

```js
headers: {
  'Access-Control-Allow-Origin': '*',
}
```

#### 3、注册卸载函数 :id=unmount
子应用卸载时会自动执行`window.unmount`，在此可以进行卸载相关操作。

```js
// main.ts
let app: void | NgModuleRef<AppModule>
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then((res: NgModuleRef<AppModule>) => {
    app = res
  })


// 监听卸载操作
window.unmount = () => {
  app && app.destroy();
  app = undefined;
}
```

完成以上步骤微前端即可正常渲染。

### 可选设置 :id=options
以下配置是针对子应用的，它们是可选的，建议根据实际情况选择设置。

#### 1、开启umd模式，优化内存和性能 :id=umd
详情参考[umd模式](/zh-cn/umd)章节。


#### 2、设置 webpack.jsonpFunction :id=webpackJsonpFunction
如果微前端正常运行，则可以忽略这一步。

如果子应用资源加载混乱导致渲染失败，可以尝试设置`jsonpFunction`来解决，因为相同的`jsonpFunction`名称会导致资源污染。

这种情况常见于主应用和子应用都是通过`create-react-app`等脚手架创建的react项目，vue项目中并不常见。

**解决方式：修改子应用的webpack配置**
<!-- tabs:start -->

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


#### 3、设置 publicPath :id=public-path
如果子应用出现静态资源地址404(js、css、图片)，建议设置`publicPath`来尝试解决这个问题。

`publicPath`是webpack提供的功能，vite应用是不支持的，它可以补全静态资源的地址，详情参考webpack文档 [publicPath](https://webpack.docschina.org/guides/public-path/#on-the-fly)

**步骤1:** 在子应用src目录下创建名称为`public-path.ts`的文件，并添加如下内容
```js
// __MICRO_APP_ENVIRONMENT__和__MICRO_APP_PUBLIC_PATH__是由micro-app注入的全局变量
if (window.__MICRO_APP_ENVIRONMENT__) {
  // eslint-disable-next-line
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__
}
```

**步骤2:** 在子应用入口文件的**最顶部**引入`public-path.ts`
```js
// entry
import './public-path'
```

#### 4、切换到iframe沙箱 :id=iframe
MicroApp有两种沙箱方案：`with沙箱`和`iframe沙箱`。

默认开启with沙箱，如果with沙箱无法正常运行，可以尝试切换到iframe沙箱。

```html
<micro-app name='xxx' url='xxx' iframe></micro-app>
```


## 常见问题
#### 1、通过micro-app数据通信修改angular组件数据后视图不更新 :id=question-1

**原因：**因为在angular区域外调用了内部的代码(主应用和子应用属于不同的angular区域)，angular无法知道状态发生了变化。

**解决方式：**通过`ngZone.run()`触发更改检测，具体方式如下：

![angular-question3](https://img14.360buyimg.com/imagetools/jfs/t1/207551/36/34684/49729/6523aee1F5efef0be/e50e6d782a223dc9.png ':size=800')

#### 2、主应用是react、nextjs应用，引入zone.js后导致micro-app元素生命周期异常 :id=question-2
目前无法解决，请暂停使用生命周期函数。
