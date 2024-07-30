## pureCreateElement
**描述：**创建无绑定的纯净元素，该元素可以逃离元素隔离的边界，不受子应用沙箱的控制

**版本限制：** 0.8.2及以上版本

**使用方式：**
```js
const pureDiv = window.microApp.pureCreateElement('div')

document.body.appendChild(pureDiv)
```


## removeDomScope
**描述：**解除元素绑定，通常用于受子应用元素绑定影响，导致主应用元素错误绑定到子应用的情况

**版本限制：** 0.8.2及以上版本

**介绍：**
```js
/**
 * @param force 解除元素绑定，并且一定时间内(一个微任务Promise时间)阻止再次绑定。
 */
function removeDomScope(force?: boolean): void
```

**使用方式：**
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

## rawWindow
**描述：**获取真实的window

**使用方式：**
```js
window.rawWindow
```

## rawDocument
**描述：**获取真实的document

**使用方式：**
```js
window.rawDocument
```


## getData
**描述：**获取主应用下发的data数据

**使用方式：**
```js
const data = window.microApp.getData() // 返回主应用下发的data数据
```

## addDataListener
**描述：**绑定数据监听函数

**介绍：**
```js
/**
 * 绑定监听函数，监听函数只有在数据变化时才会触发
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 * !!!重要说明: 因为子应用是异步渲染的，而主应用发送数据是同步的，
 * 如果在子应用渲染结束前主应用发送数据，则在绑定监听函数前数据已经发送，在初始化后不会触发绑定函数，
 * 但这个数据会放入缓存中，此时可以设置autoTrigger为true主动触发一次监听函数来获取数据。
 */
window.microApp.addDataListener(dataListener: Function, autoTrigger?: boolean)
```

**使用方式：**
```js
function dataListener (data) {
  console.log('来自主应用的数据', data)
}

window.microApp.addDataListener(dataListener)
```

## removeDataListener
**描述：**解绑数据监听函数

**使用方式：**

```js
function dataListener (data) {
  console.log('来自主应用的数据', data)
}

window.microApp.removeDataListener(dataListener)
```

## clearDataListener
**描述：**清空当前子应用的所有数据监听函数(全局数据函数除外)

**使用方式：**

```js
window.microApp.clearDataListener()
```

## dispatch
**描述：**向主应用发送数据

**使用方式：**

```js
// dispatch只接受对象作为参数
window.microApp.dispatch({type: '子应用发送的数据'})
```


## getGlobalData
**描述：**获取全局数据

**使用方式：**
```js
const globalData = window.microApp.getGlobalData() // 返回全局数据
```


## addGlobalDataListener
**描述：**绑定数据监听函数

**介绍：**
```js
/**
 * 绑定监听函数
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
 */
window.microApp.addGlobalDataListener(dataListener: Function, autoTrigger?: boolean)

```

**使用方式：**
```js
function dataListener (data) {
  console.log('全局数据', data)
}

window.microApp.addGlobalDataListener(dataListener)
```

## removeGlobalDataListener
**描述：**解绑全局数据监听函数

**使用方式：**

```js
function dataListener (data) {
  console.log('全局数据', data)
}

window.microApp.removeGlobalDataListener(dataListener)
```

## clearGlobalDataListener
**描述：**清空当前子应用绑定的所有全局数据监听函数

**使用方式：**

```js
window.microApp.clearGlobalDataListener()
```

## setGlobalData
**描述：**发送全局数据

**使用方式：**

```js
// setGlobalData只接受对象作为参数
window.microApp.setGlobalData({type: '全局数据'})
```
