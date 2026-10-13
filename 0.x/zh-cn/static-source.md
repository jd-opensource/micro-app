## 资源路径自动补全

是指对子应用相对地址的资源路径进行补全，以确保所有资源正常加载，它是`micro-app`默认提供的功能。

如：子应用中引用图片`/myapp/test.png`，在最终渲染时会补全为`http://localhost:8080/myapp/test.png`

资源路径补全分为两个方面：

**1、针对资源标签**

如 `link、script、img`

**2、针对css的远程资源**

如 `background-image、@font-face`

<!-- 资源路径补全功能和沙箱、样式隔离绑定，当这两个功能被关闭时会受到影响。

当关闭样式隔离或沙箱时，所有资源路径补全功能都将失效。 -->

自动补全有时会失效，因为一些框架和库在特定场景下创建的元素无法被拦截和处理，或者当关闭样式隔离和沙箱时，也会导致自动补全失效。

此时推荐使用下面`publicPath`方案解决。


## publicPath
**如果自动补全失败，可以采用运行时publicPath方案解决。**

这是由webpack提供的功能，会在运行时动态设置webpack.publicPath，详细配置参考webpack文档 [publicPath](https://webpack.docschina.org/guides/public-path/#on-the-fly)

*如果你已经设置了publicPath为带域名的绝对地址(如：https://xxx)，则忽略此章节*

#### 设置方式

**步骤1:** 在子应用src目录下创建名称为`public-path.js`的文件，并添加如下内容
```js
// __MICRO_APP_ENVIRONMENT__和__MICRO_APP_PUBLIC_PATH__是由micro-app注入的全局变量
if (window.__MICRO_APP_ENVIRONMENT__) {
  // eslint-disable-next-line
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__
}
```

**步骤2:** 在子应用入口文件的`最顶部`引入`public-path.js`
```js
// entry
import './public-path'
```

## 资源共享
当多个子应用拥有相同的js或css资源，可以指定这些资源在多个子应用之间共享，在子应用加载时直接从缓存中提取数据，从而提高渲染效率和性能。

设置资源共享的方式有两种：
#### 方式一、globalAssets
globalAssets用于设置全局共享资源，它和预加载的思路相同，在浏览器空闲时加载资源并放入缓存。

当子应用加载相同地址的js或css资源时，会直接从缓存中提取数据，从而提升渲染速度。

**使用方式**
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  globalAssets: {
    js: ['js地址1', 'js地址2', ...], // js地址
    css: ['css地址1', 'css地址2', ...], // css地址
  }
})
```

#### 方式二、global 属性
在link、script设置`global`属性会将文件提取为公共文件，共享给其它应用。

设置`global`属性后文件第一次加载会放入公共缓存，其它子应用加载相同的资源时直接从缓存中读取内容，从而提升渲染速度。

**使用方式**
```html
<link rel="stylesheet" href="xx.css" global>
<script src="xx.js" global></script>
```

## 资源过滤
当子应用不需要加载某个js或css，可以通过在link、script、style设置exclude属性过滤这些资源，当micro-app遇到带有exclude属性的元素会进行删除。

**使用方式**
```html
<link rel="stylesheet" href="xx.css" exclude>
<script src="xx.js" exclude></script>
<style exclude></style>
```
