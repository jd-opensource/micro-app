JS沙箱通过自定义的window、document拦截子应用的JS操作，实现一个相对独立的运行空间，避免全局变量污染，让每个子应用都拥有一个相对纯净的运行环境。

`micro-app`有两种沙箱模式：with沙箱和iframe沙箱，它们覆盖不同的使用场景且可以随意切换，默认情况下使用with沙箱，如果无法正常运行可以切换到iframe沙箱。

## 知识点

#### 1、子应用如何获取到真实window、document :id=rawWindow

子应用通过：`window.rawWindow`、`window.rawDocument` 可以获取真实的window、document（即最外层主应用的window和document）。
<!-- 
#### 2、对子应用 document 的属性进行自定义代理拦截 :id=custom-document

微前端环境下，MicroApp代理了document的大部分操作，如事件监听、元素的增删改查，也有一部分属性会兜底到原生document上，如document.body、document.head、document.title。

但有时我们希望对某些特定的属性进行自定义代理拦截，进行一些特殊操作，这时需要使用`customProxyDocumentProps`。

例如：子应用通过 `document.title = 'xxx'` 意外改变了主应用的站点标题。

**解决方式**：

*通过 customProxyDocumentProps 对 document 的属性进行自定义代理扩展*

通过给title设置一个空函数，来忽略 document.title 执行
```js
microApp.start({
  customProxyDocumentProps: new Map([
    ['title', (value) => {}]
  ]),
})
``` -->

## 常见问题

### 1、子应用抛出错误信息：xxx 未定义 :id=undefined
**包括：**
- `xxx is not defined`
- `xxx is not a function`
- `Cannot read properties of undefined`

**常见场景：**
  - 1、webpack DllPlugin 拆分的独立文件
  - 2、通过script引入的第三方js文件

**原因：**

在沙箱环境中，顶层变量不会泄漏为全局变量。

例如：在正常情况下，通过 var name 或 function name () {} 定义的顶层变量会泄漏为全局变量，通过window.name或name就可以全局访问，但是在沙箱环境下这些顶层变量无法泄漏为全局变量，window.name或name的值为undefined，导致出现问题。

**解决方式**：

##### 方式一：修改子应用webpack dll配置

子应用webpack dll配置文件中[output.library.type](https://webpack.docschina.org/configuration/output/#outputlibrarytype)设置为`window`，这种方式适合DllPlugin拆分的独立文件。
```js
// webpack.dll.config.js
module.exports = {
  // ...
  output: {
    library: {
      type: 'window',
    },
  },
}
```

##### 方式二：手动修改

将 var name 或 function name () {} 修改为 window.name = xx

##### 方式三：通过插件系统修改子应用代码

通过插件系统，将 var name 或 function name () {} 修改为 window.name = xx，不同项目的代码形式并不统一，根据实际情况调整。

```js
microApp.start({
  plugins: {
    modules: {
      应用名称: [{
        loader(code, url) {
          if (url === 'xxx.js') {
            // 根据实际情况调整
            code = code.replace('var xxx=', 'window.xxx=')
          }
          return code
        }
      }]
    }
  }
})
```

### 2、子应用使用`Module Federation`模块联邦时报错 :id=module-federation
**原因：**与上述[常见问题1](/zh-cn/sandbox?id=undefined)相同，在沙箱环境中，顶层变量不会泄漏为全局变量导致的。

**解决方式：**将`ModuleFederationPlugin`插件中`library.type`设置为`window`。

```js
new ModuleFederationPlugin({
  // ...
  name: "app1",
  library: { 
    type: "window", 
    name: "app1",
  },
})
```

### 3、子应用`DllPlugin`拆分的文件加载失败 :id=DllPlugin

**原因：**与上述[常见问题1](/zh-cn/sandbox?id=undefined)相同，在沙箱环境中，顶层变量不会泄漏为全局变量导致的。

**解决方式：**修改子应用webpack dll配置

子应用webpack dll配置文件中[output.library.type](https://webpack.docschina.org/configuration/output/#outputlibrarytype)设置为`window`。
```js
// webpack.dll.config.js
module.exports = {
  // ...
  output: {
    library: {
      type: 'window',
    },
  },
}
```

### 4、iframe沙箱加载了主应用的资源 :id=iframe-source

![iframe-source](https://img12.360buyimg.com/imagetools/jfs/t1/233529/17/19491/20911/667027a9F8cfada1e/7cf9213644e14b24.png ':size=700')

**原因：**由于iframe的src必须指向主应用域名，导致沙箱在初始化时有几率加载主应用的静态资源。

**解决方式：**

**方案一：**在主应用创建一个空的empty.html文件，将iframe的src指向它

- 步骤1：在静态资源文件夹中创建一个空的empty.html文件
```
静态资源文件夹：即vue、react项目的public文件夹，angular项目的assets文件夹，不同项目可能会不同，根据实际情况调整。
```

- 步骤2：设置iframeSrc，指向empty.html文件
```js
microApp.start({
    iframeSrc: 'http://主应用域名/基础路径(如果有)/empty.html',
})
```
如果是多层嵌套，中间层的iframeSrc也要指向最外层主应用的empty.html


**方案二：**使用window.stop()阻止脚本执行

- 在主应用head最前面插入下面js：
```html
<script>if(window.parent !== window) {window.stop()}</script>
```
window.stop虽然可以阻止脚本执行，但对于已经发送的js请求无法撤回，所以network中会看到canceled请求，但不影响正常功能，如果无法接受推荐使用方案一。


### 5、内存优化 :id=memory
为了优化性能，沙箱在子应用初始化时会缓存静态资源和数据，在子应用卸载后不会自动清除，以提升二次渲染速度，这是正常现象。

初始化时占用的内存是一次性的，不会一直增长。

如果在切换子应用时内存一直增长，造成内存泄漏风险，需要检查以下操作：
  
- 1、将子应用切换到umd模式，切换方式参考[umd模式](/zh-cn/umd)
- 2、不要设置[destroy](/zh-cn/configure?id=destroy)属性，destroy只适合一次性渲染的子应用。
- 3、不要频繁使用新的[name](/zh-cn/configure?id=name)，因为内存是基于name进行缓存的，新的name会重新初始化应用，导致内存不断增长。

    推荐的方式：一个子应用对应一个name，通过路由控制子应用渲染哪一个页面。
    

做到以上几点基本上不会有内存泄漏问题，如果问题依然存在，可以试着切换到[iframe](/zh-cn/configure?id=iframe)沙箱。
