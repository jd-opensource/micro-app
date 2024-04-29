元素隔离的概念来自ShadowDom，即ShadowDom中的元素可以和外部的元素重复但不会冲突，micro-app模拟实现了类似ShadowDom的功能，元素不会逃离`<micro-app>`元素边界，子应用只能对自身的元素进行增、删、改、查的操作。

**举个栗子🌰 :**

主应用和子应用都有一个元素`<div id='root'></div>`，此时子应用通过`document.querySelector('#root')`获取到的是自己内部的`#root`元素，而不是主应用的。

**主应用可以获取子应用的元素吗？**

可以的！

这一点和ShadowDom不同，在微前端下主应用拥有统筹全局的作用，所以我们没有对主应用操作子应用元素的行为进行限制。

### 解除元素绑定
默认情况下，当子应用操作元素时会绑定元素作用域，而解绑过程是异步的，这可能会导致操作元素异常，此时有两种方式可以解决这个问题。

**方式一：执行removeDomScope**

[removeDomScope](/zh-cn/api?id=removedomscope)方法可以解除元素绑定，通常用于受子应用元素绑定影响，导致主应用元素错误绑定到子应用的情况。

**具体方式如下：**
<!-- tabs:start -->
#### ** 主应用 **
```js
import { removeDomScope } from '@micro-zoe/micro-app'

// 解除元素绑定，并且一定时间内阻止再次绑定(一个微任务Promise时间)
removeDomScope(true) // 或者 removeDomScope()

const div = window.document.createElement('div')
// 插入到主应用body中
document.body.appendChild(div) 
```

#### ** 子应用 **
```js
// 解除元素绑定，并且一定时间内阻止再次绑定(一个微任务Promise时间)
window.microApp.removeDomScope(true) // 或者 window.microApp.removeDomScope()

const div = window.rawDocument.createElement('div')
// 插入到主应用body中
document.body.appendChild(div) 
```
<!-- tabs:end -->


**方式二：使用setTimeout**
<!-- tabs:start -->
#### ** 主应用 **
```js
// 等待解绑结束后操作元素
setTimeout(() => {
  const div = window.document.createElement('div')
  // 插入到主应用body中
  document.body.appendChild(div) 
}, 0)
```

#### ** 子应用 **
```js
// 记录主应用document
const rawDocument = window.rawDocument

// 等待解绑结束后操作元素
setTimeout(() => {
  const div = rawDocument.createElement('div')
  // 插入到主应用body中
  rawDocument.body.appendChild(div) 
}, 0)
```
<!-- tabs:end -->
