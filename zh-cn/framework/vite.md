本篇介绍了`vite`的接入方式，如果在使用时出现问题，请在github上联系我们。

## 作为主应用 :id=base
vite作为主应用时没有特殊之处，具体方式参考各框架接入文档。

## 作为子应用 :id=child
vite作为子应用只需`切换到iframe沙箱`，其它操作参考各框架接入文档。

##### 切换到iframe沙箱 :id=iframe

```html
<micro-app name='xxx' url='xxx' iframe></micro-app>
```

## 常见问题

### 1、子应用中操作location异常 :id=question-1

**原因：**vite构建script的type为module，导致无法拦截location操作。

**解决方式：** 使用MicroApp提供的location进行操作

如：
```js
window.microApp.location.host
window.microApp.location.origin
window.microApp.location.href = 'xxx'
window.microApp.location.pathname = 'xxx'
window.microApp.location.reload()
...
```

### 2、iframe沙箱加载了主应用的资源 :id=question-2
参考[JS沙箱常见问题-5](/zh-cn/sandbox?id=iframe-source)
