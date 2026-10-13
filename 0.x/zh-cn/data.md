`micro-app`提供了一套灵活的数据通信机制，方便基座应用和子应用之间的数据传输。

正常情况下，基座应用和子应用之间的通信是绑定的，基座应用只能向指定的子应用发送数据，子应用只能向基座发送数据，这种方式可以有效的避免数据污染，防止多个子应用之间相互影响。

同时我们也提供了全局通信，方便跨应用之间的数据通信。


## 一、子应用获取来自基座应用的数据
`micro-app`会向子应用注入名称为`microApp`的全局对象，子应用通过这个对象和基座应用进行数据交互。

有两种方式获取来自基座应用的数据：

#### 方式1：直接获取数据
```js
const data = window.microApp.getData() // 返回基座下发的data数据
```

#### 方式2：绑定监听函数
```js
function dataListener (data) {
  console.log('来自基座应用的数据', data)
}

/**
 * 绑定监听函数，监听函数只有在数据变化时才会触发
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 * !!!重要说明: 因为子应用是异步渲染的，而基座发送数据是同步的，
 * 如果在子应用渲染结束前基座应用发送数据，则在绑定监听函数前数据已经发送，在初始化后不会触发绑定函数，
 * 但这个数据会放入缓存中，此时可以设置autoTrigger为true主动触发一次监听函数来获取数据。
 */
window.microApp.addDataListener(dataListener: Function, autoTrigger?: boolean)

// 解绑监听函数
window.microApp.removeDataListener(dataListener: Function)

// 清空当前子应用的所有绑定函数(全局数据函数除外)
window.microApp.clearDataListener()
```


## 二、子应用向基座应用发送数据
```js
// dispatch只接受对象作为参数
window.microApp.dispatch({type: '子应用发送的数据'})
```

## 三、基座应用向子应用发送数据
基座应用向子应用发送数据有两种方式：

#### 方式1: 通过data属性发送数据

<!-- tabs:start -->

#### ** React **
在React中我们需要引入一个polyfill。

在`<micro-app>`元素所在的文件顶部添加polyfill`(注释也要复制)`。
```js
/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
```

**开始使用**
```js
<micro-app
  name='my-app'
  url='xx'
  data={this.state.dataForChild} // data只接受对象类型，采用严格对比(===)，当传入新的data对象时会重新发送
/>
```

#### ** Vue **
vue中和绑定普通属性方式一致。
```js
<template>
  <micro-app
    name='my-app'
    url='xx'
    :data='dataForChild' // data只接受对象类型，数据变化时会重新发送
  />
</template>

<script>
export default {
  data () {
    return {
      dataForChild: {type: '发送给子应用的数据'}
    }
  }
}
</script>
```
<!-- tabs:end -->

#### 方式2: 手动发送数据

手动发送数据需要通过`name`指定接受数据的子应用，此值和`<micro-app>`元素中的`name`一致。
```js
import microApp from '@micro-zoe/micro-app'

// 发送数据给子应用 my-app，setData第二个参数只接受对象类型
microApp.setData('my-app', {type: '新的数据'})
```

## 四、基座应用获取来自子应用的数据
基座应用获取来自子应用的数据有三种方式：

#### 方式1：直接获取数据
```js
import microApp from '@micro-zoe/micro-app'

const childData = microApp.getData(appName) // 返回子应用的data数据
```

#### 方式2: 监听自定义事件 (datachange)

<!-- tabs:start -->

#### ** React **
在React中我们需要引入一个polyfill。

在`<micro-app>`元素所在的文件顶部添加polyfill`(注释也要复制)`。
```js
/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
```

**开始使用**
```js
<micro-app
  name='my-app'
  url='xx'
  // 数据在event.detail.data字段中，子应用每次发送数据都会触发datachange
  onDataChange={(e) => console.log('来自子应用的数据：', e.detail.data)}
/>
```

#### ** Vue **
vue中监听方式和普通事件一致。
```js
<template>
  <micro-app
    name='my-app'
    url='xx'
    // 数据在事件对象的detail.data字段中，子应用每次发送数据都会触发datachange
    @datachange='handleDataChange'
  />
</template>

<script>
export default {
  methods: {
    handleDataChange (e) {
      console.log('来自子应用的数据：', e.detail.data)
    }
  }
}
</script>
```
<!-- tabs:end -->

#### 方式3: 绑定监听函数

绑定监听函数需要通过`name`指定子应用，此值和`<micro-app>`元素中的`name`一致。
```js
import microApp from '@micro-zoe/micro-app'

function dataListener (data) {
  console.log('来自子应用my-app的数据', data)
}

/**
 * 绑定监听函数
 * appName: 应用名称
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
microApp.addDataListener(appName: string, dataListener: Function, autoTrigger?: boolean)

// 解绑监听my-app子应用的函数
microApp.removeDataListener(appName: string, dataListener: Function)

// 清空所有监听appName子应用的函数
microApp.clearDataListener(appName: string)
```


## 全局数据通信
全局数据通信会向基座应用和所有子应用发送数据，在跨应用通信的场景中适用。

#### 发送全局数据

<!-- tabs:start -->

#### ** 基座应用 **
```js
import microApp from '@micro-zoe/micro-app'

// setGlobalData只接受对象作为参数
microApp.setGlobalData({type: '全局数据'})
```

#### ** 子应用 **

```js
// setGlobalData只接受对象作为参数
window.microApp.setGlobalData({type: '全局数据'})
```
<!-- tabs:end -->


#### 获取全局数据

<!-- tabs:start -->

#### ** 基座应用 **
```js
import microApp from '@micro-zoe/micro-app'

// 直接获取数据
const globalData = microApp.getGlobalData() // 返回全局数据

function dataListener (data) {
  console.log('全局数据', data)
}

/**
 * 绑定监听函数
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
microApp.addGlobalDataListener(dataListener: Function, autoTrigger?: boolean)

// 解绑监听函数
microApp.removeGlobalDataListener(dataListener: Function)

// 清空基座应用绑定的所有全局数据监听函数
microApp.clearGlobalDataListener()
```

#### ** 子应用 **

```js
// 直接获取数据
const globalData = window.microApp.getGlobalData() // 返回全局数据

function dataListener (data) {
  console.log('全局数据', data)
}

/**
 * 绑定监听函数
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
window.microApp.addGlobalDataListener(dataListener: Function, autoTrigger?: boolean)

// 解绑监听函数
window.microApp.removeGlobalDataListener(dataListener: Function)

// 清空当前子应用绑定的所有全局数据监听函数
window.microApp.clearGlobalDataListener()
```
<!-- tabs:end -->


## 关闭沙箱后的通信方式
沙箱关闭后，子应用默认的通信功能失效，此时可以通过手动注册通信对象实现一致的功能。

**注册方式：在基座应用中为子应用初始化通信对象**

```js
import { EventCenterForMicroApp } from '@micro-zoe/micro-app'

// 注意：每个子应用根据appName单独分配一个通信对象
window.eventCenterForAppxx = new EventCenterForMicroApp(appName)
```

子应用就可以通过注册的`eventCenterForAppxx`对象进行通信，其api和`window.microApp`一致，*基座通信方式没有任何变化。*

**子应用通信方式：**
```js
// 直接获取数据
const data = window.eventCenterForAppxx.getData() // 返回data数据

function dataListener (data) {
  console.log('来自基座应用的数据', data)
}

/**
 * 绑定监听函数
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
window.eventCenterForAppxx.addDataListener(dataListener: Function, autoTrigger?: boolean)

// 解绑监听函数
window.eventCenterForAppxx.removeDataListener(dataListener: Function)

// 清空当前子应用的所有绑定函数(全局数据函数除外)
window.eventCenterForAppxx.clearDataListener()

// 子应用向基座应用发送数据，只接受对象作为参数
window.eventCenterForAppxx.dispatch({type: '子应用发送的数据'})
```


> [!TIP]
>
> 1、data只接受对象类型
>
> 2、数据变化时会进行严格对比(===)，相同的data对象不会触发更新。
>
> 3、在子应用卸载时，子应用中所有的数据绑定函数会自动解绑，基座应用中的数据解绑需要开发者手动处理。
