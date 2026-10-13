*0.6.0及以上版本支持*

在应用之间切换时，你有时会想保留这些应用的状态，以便恢复用户的操作行为和提升重复渲染的性能，此时开启keep-alive模式可以达到这样的效果。

开启keep-alive后，应用卸载时不会销毁，而是推入后台运行。

## 使用方式
```html
<micro-app name='xx' url='xx' keep-alive></micro-app>
```

## 生命周期
keep-alive模式与普通模式最大的不同是生命周期，因为它不会被真正的卸载，也就不会触发 `unmount` 事件。

在基座和子应用中的生命周期如下：

### 基座应用

#### 1. created
`<micro-app>`标签初始化后，加载资源前触发。

#### 2. beforemount
加载资源完成后，开始渲染之前触发`(只在初始化时执行一次)`。

#### 3. mounted
子应用渲染结束后触发`(只在初始化时执行一次)`。

#### 4. error
子应用渲染出错时触发，只有会导致渲染终止的错误才会触发此生命周期。

#### 5. afterhidden
子应用卸载时触发。

#### 6. beforeshow
子应用再次渲染之前触发`(初始化时不执行)`。

#### 7. aftershow
子应用再次渲染之后触发`(初始化时不执行)`。


#### 监听生命周期
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
  onBeforemount={() => console.log('即将被渲染，只在初始化时执行一次')}
  onMounted={() => console.log('已经渲染完成，只在初始化时执行一次')}
  onAfterhidden={() => console.log('已卸载')}
  onBeforeshow={() => console.log('即将重新渲染，初始化时不执行')}
  onAftershow={() => console.log('已经重新渲染，初始化时不执行')}
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
    @afterhidden='afterhidden'
    @beforeshow='beforeshow'
    @aftershow='aftershow'
    @error='error'
  />
</template>

<script>
export default {
  methods: {
    created () {
      console.log('micro-app元素被创建'),
    },
    beforemount () {
      console.log('即将被渲染，只在初始化时执行一次'),
    },
    mounted () {
      console.log('已经渲染完成，只在初始化时执行一次'),
    },
    afterhidden () {
      console.log('已卸载'),
    },
    beforeshow () {
      console.log('即将重新渲染，初始化时不执行'),
    },
    aftershow () {
      console.log('已经重新渲染，初始化时不执行'),
    },
    error () {
      console.log('渲染出错'),
    }
  }
}
</script>
```
<!-- tabs:end -->

### 子应用
keep-alive模式下，在子应用卸载、重新渲染时，micro-app都会向子应用发送名为`appstate-change`的自定义事件，子应用可以通过监听该事件获取当前状态，状态值可以通过事件对象属性`e.detail.appState`获取。

`e.detail.appState`的值有三个：afterhidden、beforeshow、aftershow，分别对应卸载、即将渲染、已经渲染。

```js
// 监听keep-alive模式下的应用状态
window.addEventListener('appstate-change', function (e) {
  if (e.detail.appState === 'afterhidden') {
    console.log('已卸载')
  } else if (e.detail.appState === 'beforeshow') {
    console.log('即将重新渲染')
  } else if (e.detail.appState === 'aftershow') {
    console.log('已经重新渲染')
  }
})
```

应用初始化时不会触发`appstate-change`事件。


## 常见问题
#### 1、再次渲染时url和页面不匹配
keep-alive的应用在卸载时会保留页面状态，再次渲染时直接恢复，当应用再次渲染时的url与离开时不一致，则出现url和页面不匹配的问题。

如果这个问题对你造成了困扰，可以通过监听`appstate-change`事件，在`beforeshow`时进行修复，根据url跳转对应的页面。

#### 2、如何恢复页面滚动位置？
micro-app不会记录页面滚动位置，应用再次渲染时也不会进行恢复，需要开发者进行记录和恢复。

#### 3、子应用内部页面切换后状态丢失
micro-app的keep-alive是应用级别的，它只会保留当前正在活动的页面状态，以保证应用被卸载和重新渲染时的状态保留，如果想要缓存具体的页面或组件，需要使用子应用框架的能力，如：vue的keep-alive。
