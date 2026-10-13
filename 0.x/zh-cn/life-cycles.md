`micro-app`通过`CustomEvent`定义生命周期，在组件渲染过程中会触发相应的生命周期事件。

## 生命周期列表

#### 1. created
`<micro-app>`标签初始化后，加载资源前触发。

#### 2. beforemount
加载资源完成后，开始渲染之前触发。

#### 3. mounted
子应用渲染结束后触发。

#### 4. unmount
子应用卸载时触发。

#### 5. error
子应用渲染出错时触发，只有会导致渲染终止的错误才会触发此生命周期。


## 监听生命周期
<!-- tabs:start -->

#### ** React **
因为React不支持自定义事件，所以我们需要引入一个polyfill。

`在<micro-app>标签所在的文件顶部`添加polyfill，注释也要复制。
```js
/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
```

**开始使用**
```js
<micro-app
  name='xx'
  url='xx'
  onCreated={() => console.log('micro-app元素被创建')}
  onBeforemount={() => console.log('即将被渲染')}
  onMounted={() => console.log('已经渲染完成')}
  onUnmount={() => console.log('已经卸载')}
  onError={() => console.log('渲染出错')}
/>
```

#### ** Vue **
vue中监听方式和普通事件一致。
```html
<template>
  <micro-app
    name='xx'
    url='xx'
    @created='created'
    @beforemount='beforemount'
    @mounted='mounted'
    @unmount='unmount'
    @error='error'
  />
</template>

<script>
export default {
  methods: {
    created () {
      console.log('micro-app元素被创建')
    },
    beforemount () {
      console.log('即将被渲染')
    },
    mounted () {
      console.log('已经渲染完成')
    },
    unmount () {
      console.log('已经卸载')
    },
    error () {
      console.log('渲染出错')
    }
  }
}
</script>
```
#### ** 自定义 **
我们可以手动监听生命周期事件。

```js
const myApp = document.querySelector('micro-app[name=my-app]')

myApp.addEventListener('created', () => {
  console.log('created')
})

myApp.addEventListener('beforemount', () => {
  console.log('beforemount')
})

myApp.addEventListener('mounted', () => {
  console.log('mounted')
})

myApp.addEventListener('unmount', () => {
  console.log('unmount')
})

myApp.addEventListener('error', () => {
  console.log('error')
})
```

<!-- tabs:end -->

## 全局监听
全局监听会在每个应用的生命周期执行时都会触发。
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  lifeCycles: {
    created (e) {
      console.log('created')
    },
    beforemount (e) {
      console.log('beforemount')
    },
    mounted (e) {
      console.log('mounted')
    },
    unmount (e) {
      console.log('unmount')
    },
    error (e) {
      console.log('error')
    }
  }
})
```

## 子应用卸载
对于子应用只有两个生命周期，挂载和卸载。

**挂载**：子应用的js被执行则为挂载，所以不需要特殊的监听，一般在入口js文件中进行挂载相关操作。

**卸载**：子应用被卸载时会接受到一个名为`unmount`的事件，开发者可以在此进行卸载相关操作。

```js
// 子应用卸载
window.addEventListener('unmount', function () {
  // 执行卸载相关操作
})
```
