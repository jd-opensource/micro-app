## 1、我需要用到微前端吗？ :id=1
在此之前建议你先阅读[Why Not Iframe](https://www.yuque.com/kuitos/gky7yw/gesexv)。

相比于iframe，微前端拥有更好的用户体验，同时它也要求开发者对于前端框架和路由原理具有一定的理解。

微前端的本质是将两个不相关的页面强行合并为一，这其中不可避免会出现各种冲突，虽然微前端框架解决了几乎所有的冲突，但偶尔也会有特殊情况出现，这需要开发者具有处理特殊情况的能力和心态。

微前端不是万能的，它的实现原理注定无法像iframe一样简单稳定。

如果你不知道自己是否需要用微前端，那么大概率是不需要。

## 2、子应用一定要支持跨域吗？ :id=2
是的！

micro-app从主应用通过fetch加载子应用的静态资源，由于主应用与子应用的域名不一定相同，所以子应用必须支持跨域。

## 3、兼容性如何 :id=3
micro-app依赖于CustomElements和Proxy两个较新的API。

对于不支持CustomElements的浏览器，可以通过引入polyfill进行兼容，详情可参考：[webcomponents/polyfills](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements)。

但是Proxy暂时没有做兼容，所以对于不支持Proxy的浏览器无法运行micro-app。

浏览器兼容性可以查看：[Can I Use](https://caniuse.com/?search=Proxy)

总体如下：
- PC端：除了IE浏览器，其它浏览器基本兼容。
- 移动端：ios10+、android5+


## 4、micro-app 报错 an app named xx already exists :id=4
这是`name`名称冲突导致的，请确保每个子应用的`name`值是唯一的。

## 5、主应用的样式影响到子应用 :id=5
虽然我们将子应用的样式进行隔离，但主应用的样式依然会影响到子应用，如果发生冲突，推荐通过约定前缀或CSS Modules方式解决。

如果你使用的是`ant-design`等组件库，一般会提供添加前缀进行样式隔离的功能。

## 6、子应用如何获取到真实window、document :id=6
子应用通过：`window.rawWindow`、`window.rawDocument` 可以获取真实的window、document

## 7、子应用抛出错误信息：xxx 未定义 :id=7
参考[JS沙箱常见问题-1](/zh-cn/sandbox?id=undefined)

## 8、jsonp请求如何处理？ :id=8
参考[ignore](/zh-cn/configure?id=ignore忽略元素)


## 9、子应用通过a标签下载文件失败 :id=9
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

## 10、iconfont 图标冲突了如何处理？ :id=10

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

## 11、子应用script元素被注释、消失 :id=11
默认情况下，子应用的js会被提取并在后台运行，script元素原位置会留下注释：`<!--script with src='xxx' extract by micro-app-->`

如果想要保留script元素，可以开启inline模式，配置方式参考：[inline](/zh-cn/configure?id=inline)

## 12、Vue主应用接入微前端时循环刷新（页面闪烁） :id=12
参考[Vue常见问题-2](/zh-cn/framework/vue?id=question-2)

## 13、子应用使用`Module Federation`模块联邦时报错 :id=13
参考[JS沙箱常见问题-2](/zh-cn/sandbox?id=module-federation)

## 14、子应用`DllPlugin`拆分的文件加载失败 :id=14
参考[JS沙箱常见问题-3](/zh-cn/sandbox?id=dllplugin)

## 15、iframe沙箱加载了主应用的资源 :id=15
参考[JS沙箱常见问题-4](/zh-cn/sandbox?id=iframe-source)

## 16、内存泄漏 :id=16
参考[JS沙箱常见问题-5](/zh-cn/sandbox?id=memory)

## 17、一个页面加载过多个微前端 :id=17
微前端在过多加载和深度嵌套时，要谨慎使用，尤其同个页面在不同版本微前端之间可能会有相互影响，使用者要酌情处理。

## 18、子应用加载资源或请求接口时没有带上cookie :id=18

<!-- tabs:start -->
#### ** 场景1：加载子应用的静态资源时没有带上cookie **

**原因：**MicroApp加载子应用的html、js等静态资源时默认不带cookie

**解决方式：**通过自定义MicroApp的fetch方法，修改fetch的credentials配置，具体步骤参考[自定义fetch](/zh-cn/advanced?id=custom-fetch)

> [!NOTE]
> 需要注意的是，由于带了cookie，那么子应用的跨域配置`Access-Control-Allow-Origin`不能设置为`*`，必须指定域名，同时设置`Access-Control-Allow-Credentials: true`



#### ** 场景2：子应用请求接口时没有带上cookie **

**原因：**常见于子应用域名与接口域名相同，而与主应用域名不同的场景，主应用域名与cookie Domain不匹配，导致无法携带cookie

**解决方式：**让后端在写入cookie时设置SameSite为None

<!-- tabs:end -->
