## 1、我需要用到微前端吗？
在此之前建议你先阅读[Why Not Iframe](https://www.yuque.com/kuitos/gky7yw/gesexv)。

相比于iframe，微前端拥有更好的用户体验，同时它也要求开发者对于前端框架和路由原理具有一定的理解。

微前端的本质是将两个不相关的页面强行合并为一，这其中不可避免会出现各种冲突，虽然微前端框架解决了几乎所有的冲突，但偶尔也会有特殊情况出现，这需要开发者具有处理特殊情况的能力和心态。

微前端不是万能的，它的实现原理注定无法像iframe一样简单稳定。

如果你不知道自己是否需要用微前端，那么大概率是不需要。

## 2、子应用一定要支持跨域吗？
是的！

如果是开发环境，可以在webpack-dev-server中设置headers支持跨域。
```js
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
},
```

如果是线上环境，可以通过[配置nginx](https://segmentfault.com/a/1190000012550346)支持跨域。

## 3、兼容性如何
micro-app依赖于CustomElements和Proxy两个较新的API。

对于不支持CustomElements的浏览器，可以通过引入polyfill进行兼容，详情可参考：[webcomponents/polyfills](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements)。

但是Proxy暂时没有做兼容，所以对于不支持Proxy的浏览器无法运行micro-app。

浏览器兼容性可以查看：[Can I Use](https://caniuse.com/?search=Proxy)

总体如下：
- PC端：除了IE浏览器，其它浏览器基本兼容。
- 移动端：ios10+、android5+

## 4、微应用无法渲染但没有报错
请检查路由配置是否正确，详情查看[路由](/zh-cn/route)一章，或者[下面第5条：jsonpFunction是否冲突](/zh-cn/questions?id=_5、webpack-jsonpfunction-冲突导致渲染失败)

## 5、webpack-jsonpfunction-冲突导致渲染失败
这种情况常见于多个应用都是通过create-react-app等类似脚手架创建的项目，或一个应用多次重复渲染。

因为相同的jsonpFunction名称会导致资源加载混乱。

**解决方式：修改子应用的webpack配置**
<!-- tabs:start -->

#### ** webpack4 **
```js
// webpack.config.js
module.exports = {
  output: {
    ...
    jsonpFunction: `webpackJsonp_custom_app_name`,
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
    chunkLoadingGlobal: 'webpackJsonp_custom_app_name',
    globalObject: 'window',
  },
}
```
<!-- tabs:end -->


## 6、开发时每次保存文件时报错 (热更新导致报错)
在一些场景下，热更新会导致保存时报错，请关闭热更新来解决这个问题，同时我们也在尝试更好的解决方案。

## 7、vue3的问题
**1、样式失效**

通过[禁用样式隔离](/zh-cn/configure?id=disablescopecss)解决。

**2、图片等静态资源无法正常加载**

vue3中需要配置publicPath补全资源路径，详情请查看[publicPath](/zh-cn/static-source?id=publicpath)


## 8、开发环境中渲染angular子应用报错
目前需要关闭angular的热更新来解决这个问题，同时我们也在尝试更好的解决方案。
```bash
"scripts": {
  "start": "ng serve --live-reload false",
},
```

## 9、micro-app 报错 an app named xx already exists
这是`name`名称冲突导致的，请确保每个子应用的`name`值是唯一的。

## 10、基座应用的样式影响到子应用
虽然我们将子应用的样式进行隔离，但基座应用的样式依然会影响到子应用，如果发生冲突，推荐通过约定前缀或CSS Modules方式解决。

如果你使用的是`ant-design`等组件库，一般会提供添加前缀进行样式隔离的功能。

## 11、子应用在沙箱环境中如何获取到外部真实window？
  目前有3种方式在子应用中获取外部真实window
  - 1、new Function("return window")() 或 Function("return window")()
  - 2、(0, eval)('window')
  - 3、window.rawWindow

## 12、错误信息：xxx 未定义

**包括：**
- `xxx is not defined`
- `xxx is not a function`
- `Cannot read properties of undefined`

**原因：**

在微前端的沙箱环境中，顶层变量不会泄漏为全局变量。

例如在正常情况下，通过 var name 或 function name () {} 定义的顶层变量会泄漏为全局变量，通过window.name或name就可以全局访问。

但是在沙箱环境下这些顶层变量无法泄漏为全局变量，window.name或name为undefined，导致出现问题。

**解决方式**：

*方式一：手动修改*

将 var name 或 function name () {} 修改为 window.name = xx

*方式二：通过插件系统修改子应用代码*

比如常见的加载webpack打包的dll文件失败的问题，因为dll文件的内容和js地址相对固定，可以直接进行全局查找和修改。
```js
microApp.start({
  plugins: {
    modules: {
      应用名称: [{
        loader(code, url) {
          if (url === 'xxx.js') {
            code = code.replace('var xx_dll=', 'window.xx_dll=')
          }
          return code
        }
      }]
    }
  }
})
```

## 13、子应用加载sockjs-node失败
  这个问题常见于create-react-app创建的子应用，推荐通过插件系统来解决。
```js
microApp.start({
  plugins: {
    modules: {
      '子应用name': [{
        loader(code) {
          if (code.indexOf('sockjs-node') > -1) {
            code = code.replace('window.location.port', '子应用端口').replace('window.location.hostname', '子应用host，如果和基座相同则不需要替换hostname')
          }
          return code
        }
      }],
    }
  }
})
```
实际情况可能更加复杂，上面只是一种解决思路。


## 14、子应用请求接口失败
  - 1、请确保接口请求没有跨域问题，因为子应用被加载到基座渲染，所以请求接口是从基座发送。

  - 2、请求的接口为相对地址，会以基座域名进行补全，导致报错。
    
    如：`fetch('/api/data')`，在请求时会自动被浏览器补全为`fetch(基座域名 + '/api/data')`

    为了避免这个问题，子应用需要使用完整的地址：`fetch(子应用域名 + '/api/data')`

## 15、子应用反向代理失败
  **解决方式：**子应用使用完整的地址发送请求

  如：`fetch('/api/data')` 改为 `fetch(子应用域名 + '/api/data')`

  如果还是报跨域问题，则是服务端做了限制，此时需要撤除上述操作，并将子应用的代理放到基座应用中。

## 16、子应用多次渲染后内存越来越大
  参考[内存优化](/zh-cn/advanced?id=_3、内存优化)一章

## 17、子应用之间如何跳转
  参考[应用之间如何跳转](/zh-cn/route?id=应用之间如何跳转)一章

## 18、jsonp请求如何处理？
  参考[ignore](/zh-cn/configure?id=ignore忽略元素)


## 19、子应用通过a标签下载文件失败
  **原因：**当跨域时(基座和文件在不同域名下)，无法通过a标签的download属性实现下载。

  **解决方式：**
  
  **方式1：**转换为blob形式下载
  ```html
  <a href='xxx.png' download="filename.png" @click='downloadFile'>下载</a>
  ```
  ```js
  // 通过blob下载文件
  function downloadFile (e) {
    // 微前端环境下转换为blob下载，子应用单独运行时依然使用a标签下载
    if (window.__MICRO_APP_ENVIRONMENT__) {
      e.preventDefault()
      // 注意href必须是绝对地址
      fetch(e.target.href).then((res) => {
        res.blob().then((blob) => {
          const blobUrl = window.URL.createObjectURL(blob)
          // 转化为blobURL后再通过a标签下载
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = 'filename.png'
          a.click()
          window.URL.revokeObjectURL(blobUrl)
        })
      })
    }
  }
  ```

  **方式2：**将文件放到基座域名下，判断微前端环境下a标签href属性设置为基座的文件地址

