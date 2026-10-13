`micro-app`支持多层嵌套，即子应用可以嵌入其它子应用，但需要做一些修改。

例如：A嵌套B，B嵌套C，B作为中间层应用需要做出如下修改：

#### 步骤1：

为了防止标签名冲突，在B应用中自定义`tagName`。

```js
import microApp from '@micro-zoe/micro-app';

microApp.start({
  // 必须是以`micro-app-`开头的小写字母，例如：micro-app-b、micro-app-b-c
  tagName: 'micro-app-xxx', 
})
```

在B中使用新定义的标签加载C：
```html
<micro-app-xxx name='...' url='...'></micro-app-xxx>
```

#### 步骤2：

将B应用切换为umd模式，详情参考[umd](/zh-cn/umd)。


> [!NOTE]
>
> 1、无论嵌套多少层，name都要保证全局唯一。
>
> 2、确保micro-app的版本一致，不同版本可能会导致冲突。
