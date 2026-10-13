本篇以`React 16、17`作为案例介绍react的接入方式，其它版本react的接入方式以此类推。我们默认开发者掌握了各版本react的开发技巧，如示例中useEffect，在不支持hooks的版本中转换为componentDidMount。

## 作为主应用 :id=main

#### 1、安装依赖
```bash
npm i @micro-zoe/micro-app --save
```

#### 2、初始化micro-app
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

#### 3、在页面中加载子应用

通过注册的自定义元素`<micro-app>`加载子应用

```js
export function MyPage () {
  return (
    <div>
      // name：应用名称, url：应用地址
      <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
    </div>
  )
}
```

> [!NOTE]
> 1、name：必传参数，必须以字母开头，且不可以带特殊符号(中划线、下划线除外)
>
> 2、url：必传参数，必须指向子应用的index.html，如：http://localhost:3000/ 或 http://localhost:3000/index.html

## 作为子应用 :id=child

#### 1、设置跨域支持 :id=Access-Control-Allow-Origin

使用`create-react-app`脚手架创建的项目，在 `config/webpackDevServer.config.js` 文件中添加headers。

其它项目在`webpack-dev-server`中添加headers。

```js
headers: {
  'Access-Control-Allow-Origin': '*',
}
```

#### 2、注册卸载函数 :id=unmount
子应用卸载时会自动执行`window.unmount`，在此可以进行卸载相关操作。

```js
// index.js
window.unmount = () => {
  ReactDOM.unmountComponentAtNode(document.getElementById('root'))
}
```

完成以上步骤微前端即可正常渲染。

### 可选设置 :id=options
以下配置是针对子应用的，它们是可选的，建议根据实际情况选择设置。

#### 1、开启umd模式，优化内存和性能 :id=umd
详情参考[umd模式](/zh-cn/umd)章节。

#### 2、设置 webpack.jsonpFunction :id=webpackJsonpFunction
如果微前端正常运行，可以忽略这一步。

如果子应用资源加载混乱导致渲染失败，可以尝试设置`jsonpFunction`来解决，因为相同的`jsonpFunction`名称会导致资源污染。

这种情况常见于主应用和子应用都是通过`create-react-app`等脚手架创建的项目。

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

#### 4、切换到iframe沙箱 :id=iframe
MicroApp有两种沙箱方案：`with沙箱`和`iframe沙箱`。

默认开启with沙箱，如果with沙箱无法正常运行，可以尝试切换到iframe沙箱。

```html
<micro-app name='xxx' url='xxx' iframe></micro-app>
```

## 常见问题
无
