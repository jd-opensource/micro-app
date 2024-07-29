元素隔离的概念来自ShadowDom，即ShadowDom中的元素可以和外部的元素重复但不会冲突，micro-app模拟实现了类似ShadowDom的功能，元素不会逃离`<micro-app>`元素边界，子应用只能对自身的元素进行增、删、改、查的操作。

**举个栗子🌰 :**

主应用和子应用都有一个元素`<div id='root'></div>`，此时子应用通过`document.querySelector('#root')`获取到的是自己内部的`#root`元素，而不是主应用的。

**主应用可以获取子应用的元素吗？**

可以的！

这一点和ShadowDom不同，在微前端下主应用拥有统筹全局的作用，所以我们没有对主应用操作子应用元素的行为进行限制。

### 解除元素绑定
默认情况下，当子应用操作元素时会绑定元素作用域，而解绑过程是异步的，这可能会导致操作元素异常。

**常见问题：**主应用元素错误插入到子应用`<micro-app>`元素内部。

**解决方法：**使用`removeDomScope`方法解除元素绑定。

具体方式如下：
<!-- tabs:start -->
#### ** 主应用 **
```js
import { removeDomScope } from '@micro-zoe/micro-app'

removeDomScope(true) // 解除元素绑定
/**
 * 中间区域的元素操作都指向主应用
 * 例如：
 * document.body.appendChild(document.createElement('div')) 
 * div元素将插入到主应用body中
 */
removeDomScope(false) // 恢复元素绑定
```

#### ** 子应用 **
```js
window.microApp.removeDomScope(true) // 解除元素绑定
/**
 * 中间区域的元素操作都指向主应用
 * 例如：
 * document.body.appendChild(document.createElement('div')) 
 * div元素将插入到主应用body中
 */
window.microApp.removeDomScope(false) // 恢复元素绑定
```
<!-- tabs:end -->
