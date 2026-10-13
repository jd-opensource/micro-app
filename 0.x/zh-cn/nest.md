`micro-app`支持多层嵌套，即子应用可以嵌入其它子应用，但为了防止标签名冲突，子应用中需要做一些修改。

在`子应用`中设置`tagName`：

```js
microApp.start({
  tagName: 'micro-app-xxx', // 标签名称必须以 `micro-app-` 开头
})
```

在子应用中使用新定义的标签进行渲染，如：
```html
<micro-app-xxx name='xx' url='xx'></micro-app-xxx>
```

> [!WARNING]
> 无论嵌套多少层，name都要保证全局唯一。
