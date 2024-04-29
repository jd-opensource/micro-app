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


## 4、micro-app 报错 an app named xx already exists
这是`name`名称冲突导致的，请确保每个子应用的`name`值是唯一的。

## 5、主应用的样式影响到子应用
虽然我们将子应用的样式进行隔离，但主应用的样式依然会影响到子应用，如果发生冲突，推荐通过约定前缀或CSS Modules方式解决。

如果你使用的是`ant-design`等组件库，一般会提供添加前缀进行样式隔离的功能。

## 6、子应用在沙箱环境中如何获取到外部真实window？
  目前有3种方式在子应用中获取外部真实window
  - 1、new Function("return window")() 或 Function("return window")()
  - 2、(0, eval)('window')
  - 3、window.rawWindow

## 7、错误信息：xxx undefined

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

## 8、jsonp请求如何处理？
  参考[ignore](/zh-cn/configure?id=ignore忽略元素)


## 9、子应用通过a标签下载文件失败
  **原因：**当跨域时(主应用和文件在不同域名下)，无法通过a标签的download属性实现下载。

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

  **方式2：**将文件放到主应用域名下，判断微前端环境下a标签href属性设置为主应用的文件地址

## 10、iconfont 图标冲突了如何处理？

| 产生原因                                        | 解决方案                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| 主应用和子应用 unicode 使用同一编码导致图标冲突 | 选择冲突图标，在iconfont中修改对应的unicode编码并重新生成文件进行替换 |
| 主应用和子应用 class/fontFamily 冲突            | 修改冲突应用下使用iconfont的的相关类名和对应的font-face下fontFamily |

**主应用和子应用 class/fontFamily 冲突 解决示例**

```css
@font-face {
-  font-family: "iconfont";
+  font-family: "iconfont1";
   src: url('iconfont.woff2?t=1704871404008') format('woff2'),
       url('iconfont.woff?t=1704871404008') format('woff'),
       url('iconfont.ttf?t=1704871404008') format('truetype');
}

-.iconfont {
+.iconfont1 {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.right:before {
  content: "\e7eb";
}
```

```html
- <i className="iconfont right"></i>
+ <i className="iconfont1 right"></i>
```

## 11、Vue主应用接入微前端时循环刷新（页面闪烁）

**解决方式：**将主应用router-view或者包含微前端的上层组件中`:key="route.fullPath"`改为`:key="route.path"`或者`:key="route.name"`

**例如：**

```html
<!-- bad 😭 -->
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.fullPath" />
  </transition>
</router-view>

<!-- good 😊 -->
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

```html
<!-- bad 😭 -->
<router-view :key="$route.fullPath"></router-view>

<!-- good 😊 -->
<router-view :key="$route.path"></router-view>
```

## 12、iframe沙箱加载了主应用的资源

**解决方式：**如果主应用不会作为iframe嵌入，可以在主应用head最前面插入下面js
```html
<script>if(window.parent !== window) {window.stop()}</script>
```
