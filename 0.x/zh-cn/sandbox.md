### 沙箱介绍
我们使用`Proxy`拦截了用户全局操作的行为，防止对window的访问和修改，避免全局变量污染。`micro-app`中的每个子应用都运行在沙箱环境，以获取相对纯净的运行空间。

沙箱是默认开启的，正常情况下不建议关闭，以避免出现不可预知的问题。

如何关闭沙箱请查看：[disableSandbox](/zh-cn/configure?id=disablesandbox)

### 注意事项

#### 1、子应用在沙箱环境中如何获取到真实window
目前有3种方式在子应用中获取外部真实window
- 1、new Function("return window")() 或 Function("return window")()
- 2、(0, eval)('window')
- 3、window.rawWindow

#### 2、子应用抛出错误信息：xxx 未定义
**包括：**
- `xxx is not defined`
- `xxx is not a function`
- `Cannot read properties of undefined`

**原因：**

在沙箱环境中，顶层变量不会泄漏为全局变量。

例如在正常情况下，通过 var name 或 function name () {} 定义的顶层变量会泄漏为全局变量，通过window.name或name就可以全局访问。

但是在沙箱环境下这些顶层变量无法泄漏为全局变量，window.name或name的值为undefined，导致出现问题。

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
