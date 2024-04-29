MicroApp通过拦截浏览器路由事件以及自定义的location、history，实现了一套虚拟路由系统，子应用运行在这套虚拟路由系统中，和主应用的路由进行隔离，避免相互影响。

虚拟路由系统还提供了丰富的功能，帮助用户提升开发效率和使用体验。

## 路由模式
虚拟路由系统分为四种模式：`search`、`native`、`native-scope`、`pure`

<!-- tabs:start -->
#### ** search模式 **
search是默认模式，通常不需要特意设置，search模式下子应用的路由信息会作为query参数同步到浏览器地址上，如下：

![alt](https://img12.360buyimg.com/imagetools/jfs/t1/204018/30/36539/9736/6523add2F41753832/31f5ad7e48ea6570.png ':size=700')

**切换方式：**

设置单个子应用：
```html
<!-- 单个子应用设置为search模式 -->
<micro-app name='xx' url='xx' router-mode='search'></micro-app>
```
全局设置：
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'search', // 所有子应用都设置为search模式
})
```

**注意：search模式可能会导致Vue主应用循环刷新**

**解决方式：**将router-view或者包含微前端的上层组件中`:key="route.fullPath"`改为`:key="route.path"`或者`:key="route.name"`

**例如：**

```html
<!-- bad 😭 -->
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.fullPath" />
  </transition>
</router-view>

<!-- good 😊 -->
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

```html
<!-- bad 😭 -->
<router-view :key="$route.fullPath"></router-view>

<!-- good 😊 -->
<router-view :key="$route.path"></router-view>
```

#### ** native模式 **
native模式是指放开路由隔离，子应用和主应用共同基于浏览器路由进行渲染，它拥有更加直观和友好的路由体验，但更容易导致主应用和子应用的路由冲突，且需要更加复杂的路由配置，详情参考[native-mode](/zh-cn/native-mode)

**切换方式：**

设置单个子应用：
```html
<!-- 单个子应用设置为native模式 -->
<micro-app name='xx' url='xx' router-mode='native'></micro-app>
```
全局设置：
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'native', // 所有子应用都设置为native模式
})
```

#### ** native-scope模式 **
native-scope模式的功能和用法和native模式一样，唯一不同点在于native-scope模式下子应用的域名指向自身而非主应用。

**切换方式：**

设置单个子应用：
```html
<!-- 单个子应用设置为native-scope模式 -->
<micro-app name='xx' url='xx' router-mode='native-scope'></micro-app>
```
全局设置：
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'native-scope', // 所有子应用都设置为native-scope模式
})
```

#### ** pure模式 **
pure模式是指子应用独立于浏览器进行渲染，即不修改浏览器地址，也不增加路由堆栈，pure模式下的子应用更像是一个组件。

**切换方式：**

设置单个子应用：
```html
<!-- 单个子应用设置为pure模式 -->
<micro-app name='xx' url='xx' router-mode='pure'></micro-app>
```
全局设置：
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'pure', // 所有子应用都设置为pure模式
})
```

#### ** state模式 **
state模式是指基于浏览器history.state进行渲染的路由模式，在不修改浏览器地址的情况下模拟各种路由行为，相比其它路由模式更加简洁优雅。

state模式的表现和iframe类似，但却没有iframe存在的问题。

**切换方式：**

设置单个子应用：
```html
<!-- 单个子应用设置为state模式 -->
<micro-app name='xx' url='xx' router-mode='state'></micro-app>
```
全局设置：
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'state', // 所有子应用都设置为state模式
})
```

<!-- tabs:end -->


## 配置项
#### 1、关闭虚拟路由系统
实际上虚拟路由系统是无法关闭的，这里的配置只是为了向下兼容旧版本，它的表现和native路由模式一致。

**使用方式：**

1、设置单个子应用
```html
<micro-app name='xx' url='xx' disable-memory-router></micro-app>
```

2、全局设置
```js
import microApp from '@micro-zoe/micro-app'

// 在start中增加配置
microApp.start({
  'disable-memory-router': true, // 关闭虚拟路由
})
```

#### 2、保留路由状态
默认情况下，子应用卸载后重新渲染，将和首次加载一样渲染子应用的首页。

设置`keep-router-state`可以保留子应用路由状态，在卸载后重新渲染时将恢复卸载前的页面（页面中的状态不保留）。

**使用方式：**

1、保留某个子应用的路由状态
```html
<micro-app name='xx' url='xx' keep-router-state></micro-app>
```

2、保留所有子应用的路由状态
```js
import microApp from '@micro-zoe/micro-app'

// 在start中增加配置
microApp.start({
  'keep-router-state': true, // 保留路由状态
})
```

注意：
  1. 如果关闭了虚拟路由系统，`keep-router-state`也将失效。
  2. 当设置了`default-page`时`keep-router-state`将失效，因为它的优先级小于`default-page`



## 导航
通过虚拟路由系统，我们可以方便的进行跨应用的跳转，如：
1. 主应用控制子应用跳转
2. 子应用控制主应用跳转
3. 子应用控制其它子应用跳转

由于nextjs的路由系统非常特殊，当子应用是nextjs时无法直接控制跳转，参考[通过数据通信控制跳转](/zh-cn/jump?id=方式二、通过数据通信控制跳转)

<!-- tabs:start -->
#### ** 主应用 **


### router.push
**介绍：**控制子应用跳转，并向路由堆栈添加一条新的记录
```js
/**
 * @param {string} name 必填，子应用的name
 * @param {string} path 必填，子应用除域名外的全量地址(也可以带上域名)
 * @param {boolean} replace 可选，是否使用replace模式，不新增堆栈记录，默认为false
 */
router.push({ name: '子应用名称', path: '页面地址', replace: 是否使用replace模式 })
```

**示例：**
```js
import microApp from '@micro-zoe/micro-app'

// 不带域名的地址，控制子应用my-app跳转/page1
microApp.router.push({name: 'my-app', path: '/page1'})

// 带域名的地址，控制子应用my-app跳转/page1
microApp.router.push({name: 'my-app', path: 'http://localhost:3000/page1'})

// 带查询参数，控制子应用my-app跳转/page1?id=9527
microApp.router.push({name: 'my-app', path: '/page1?id=9527'})

// 带hash，控制子应用my-app跳转/page1#hash
microApp.router.push({name: 'my-app', path: '/page1#hash'})

// 使用replace模式，等同于 router.replace({name: 'my-app', path: '/page1'})
microApp.router.push({name: 'my-app', path: '/page1', replace: true })
```


### router.replace
**介绍：**控制子应用跳转，但不会向路由堆栈添加新的记录，而是替换最新的堆栈记录。
```js
/**
 * @param {string} name 必填，子应用的name
 * @param {string} path 必填，子应用除域名外的全量地址(也可以带上域名)
 * @param {boolean} replace 可选，是否使用replace模式，默认为true
 */
router.replace({ name: '子应用名称', path: '页面地址', replace: 是否使用replace模式 })
```

**示例：**
```js
import microApp from '@micro-zoe/micro-app'

// 不带域名的地址
microApp.router.replace({name: 'my-app', path: '/page1'})

// 带域名的地址
microApp.router.replace({name: 'my-app', path: 'http://localhost:3000/page1'})

// 带查询参数
microApp.router.replace({name: 'my-app', path: '/page1?id=9527'})

// 带hash
microApp.router.replace({name: 'my-app', path: '/page1#hash'})

// 关闭replace模式，等同于 router.push({name: 'my-app', path: '/page1'})
microApp.router.replace({name: 'my-app', path: '/page1', replace: false })
```


### router.go
**介绍：**它的功能和window.history.go(n)一致，表示在历史堆栈中前进或后退多少步。
```js
/**
 * @param {number} n 前进或后退多少步
 */
router.go(n)
```

**示例：**
```js
import microApp from '@micro-zoe/micro-app'

// 返回一条记录
microApp.router.go(-1)

// 前进 3 条记录
microApp.router.go(3)
```


### router.back
**介绍：**它的功能和window.history.back()一致，表示在历史堆栈中后退一步。
```js
router.back()
```

**示例：**
```js
import microApp from '@micro-zoe/micro-app'

// 返回一条记录
microApp.router.back()
```


### router.forward
**介绍：**它的功能和window.history.forward()一致，表示在历史堆栈中前进一步。
```js
router.forward()
```

**示例：**
```js
import microApp from '@micro-zoe/micro-app'

// 前进一条记录
microApp.router.forward()
```


#### ** 子应用 **
子应用的路由API和主应用保持一致，不同点是`microApp`挂载在window上。

### 子应用控制主应用跳转
默认情况下，子应用无法直接控制主应用的跳转，为此我们提供了一个API，将主应用的路由对象传递给子应用。

**主应用** 
```js
import microApp from '@micro-zoe/micro-app'

// 注册主应用路由
microApp.router.setBaseAppRouter(主应用的路由对象)
```
**子应用** 
```js
// 获取主应用路由
const baseRouter = window.microApp.router.getBaseAppRouter() 

// 控制主应用跳转
baseRouter.主应用路由的方法(...) 
```

### 控制其他子应用跳转

### router.push
**介绍：**控制其它子应用跳转，并向路由堆栈添加一条新的记录
```js
/**
 * @param {string} name 必填，子应用的name
 * @param {string} path 必填，子应用除域名外的全量地址(也可以带上域名)
 * @param {boolean} replace 可选，是否使用replace模式，不新增堆栈记录，默认为false
 */
router.push({ name: '子应用名称', path: '页面地址', replace: 是否使用replace模式 })
```

**示例：**
```js
// 不带域名的地址，控制子应用my-app跳转/page1
window.microApp.router.push({name: 'my-app', path: '/page1'})

// 带域名的地址，控制子应用my-app跳转/page1
window.microApp.router.push({name: 'my-app', path: 'http://localhost:3000/page1'})

// 带查询参数，控制子应用my-app跳转/page1?id=9527
window.microApp.router.push({name: 'my-app', path: '/page1?id=9527'})

// 带hash，控制子应用my-app跳转/page1#hash
window.microApp.router.push({name: 'my-app', path: '/page1#hash'})

// 使用replace模式，等同于 router.replace({name: 'my-app', path: '/page1'})
window.microApp.router.push({name: 'my-app', path: '/page1', replace: true })
```


### router.replace
**介绍：**控制其它子应用跳转，但不会向路由堆栈添加新的记录，而是替换最新的堆栈记录。
```js
/**
 * @param {string} name 必填，子应用的name
 * @param {string} path 必填，子应用除域名外的全量地址(也可以带上域名)
 * @param {boolean} replace 可选，是否使用replace模式，默认为true
 */
router.replace({ name: '子应用名称', path: '页面地址', replace: 是否使用replace模式 })
```

**示例：**
```js
// 不带域名的地址
window.microApp.router.replace({name: 'my-app', path: '/page1'})

// 带域名的地址
window.microApp.router.replace({name: 'my-app', path: 'http://localhost:3000/page1'})

// 带查询参数
window.microApp.router.replace({name: 'my-app', path: '/page1?id=9527'})

// 带hash
window.microApp.router.replace({name: 'my-app', path: '/page1#hash'})

// 关闭replace模式，等同于 router.push({name: 'my-app', path: '/page1'})
window.microApp.router.replace({name: 'my-app', path: '/page1', replace: false })
```


### router.go
**介绍：**它的功能和window.history.go(n)一致，表示在历史堆栈中前进或后退多少步。
```js
/**
 * @param {number} n 前进或后退多少步
 */
router.go(n)
```

**示例：**
```js
// 返回一条记录
window.microApp.router.go(-1)

// 前进 3 条记录
window.microApp.router.go(3)
```


### router.back
**介绍：**它的功能和window.history.back()一致，表示在历史堆栈中后退一步。
```js
router.back()
```

**示例：**
```js
// 返回一条记录
window.microApp.router.back()
```


### router.forward
**介绍：**它的功能和window.history.forward()一致，表示在历史堆栈中前进一步。
```js
router.forward()
```

**示例：**
```js
// 前进一条记录
window.microApp.router.forward()
```
<!-- tabs:end -->



## 设置默认页面

子应用默认渲染首页，但可以通过设置`defaultPage`渲染指定的默认页面。

**注意事项：**
- 1、defaultPage只在初始化渲染时有效，控制子应用跳转请参考[导航](/zh-cn/router?id=导航)
- 2、defaultPage必须是子应用页面的绝对地址，为了防止设置错误，建议单独打开子应用，跳转目标页面，复制粘贴浏览器地址，包括hash和search，将此值设置为`defaultPage`，也可以去掉域名，简化代码
- 3、由于`native`、`native-scope`模式是基于浏览器进行渲染，通过浏览器url控制子应用渲染的页面，`defaultPage`在这两种模式下无效


#### 使用方式

**方式一：通过default-page属性设置**
```html
<micro-app default-page='页面地址'></micro-app>
```

**示例：**

```html
<!-- 不带域名的地址 -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='/page1'></micro-app>

<!-- 带域名的地址 -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='http://localhost:3000/page1'></micro-app>

<!-- 带查询参数 -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='/page1?id=9527'></micro-app>

<!-- 带hash -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='/page1#hash'></micro-app>
```

**方式二：通过router API设置**
```js
/**
 * 设置子应用默认页面
 * @param {string} name 必填，子应用的name
 * @param {string} path 必填，页面地址
 */
router.setDefaultPage({ name: '子应用名称', path: '页面地址' })

/**
 * 删除子应用默认页面
 * @param {string} name 必填，子应用的name
 */
router.removeDefaultPage(name: '子应用名称')

/**
 * 获取子应用默认页面
 * @param {string} name 必填，子应用的name
 */
router.getDefaultPage(name: '子应用名称')
```

**示例：**

```js
import microApp from '@micro-zoe/micro-app'

// 不带域名的地址
microApp.router.setDefaultPage({name: 'my-app', path: '/page1'})

// 带域名的地址
microApp.router.setDefaultPage({name: 'my-app', path: 'http://localhost:3000/page1'})

// 带查询参数
microApp.router.setDefaultPage({name: 'my-app', path: '/page1?id=9527'})

// 带hash
microApp.router.setDefaultPage({name: 'my-app', path: '/page1#hash'})

// 删除子应用my-app的默认页面
router.removeDefaultPage('my-app')

// 获取子应用my-app的默认页面
const defaultPage = router.getDefaultPage('my-app')
```



## 导航守卫
导航守卫用于监听子应用的路由变化，类似于vue-router的全局守卫，不同点是MicroApp的导航守卫无法取消跳转。

#### 全局前置守卫
**介绍：**监听所有或某个子应用的路由变化，在子应用页面渲染前执行。

**使用范围：**主应用
```js
/**
 * @param {object} to 即将要进入的路由
 * @param {object} from 正要离开的路由
 * @param {string} name 子应用的name
 * @return cancel function 解绑路由监听函数
 */
router.beforeEach((to, from, name) => {} | { name: (to, from) => {} })
```

**示例：**
```js
import microApp from '@micro-zoe/micro-app'

// 监听所有子应用的路由变化
microApp.router.beforeEach((to, from, appName) => {
  console.log('全局前置守卫 beforeEach: ', to, from, appName)
})

// 监听某个子应用的路由变化
microApp.router.beforeEach({
  子应用1name (to, from) {
    console.log('指定子应用的前置守卫 beforeEach ', to, from)
  },
  子应用2name (to, from) {
    console.log('指定子应用的前置守卫 beforeEach ', to, from)
  }
})

// beforeEach会返回一个解绑函数
const cancelCallback = microApp.router.beforeEach((to, from, appName) => {
  console.log('全局前置守卫 beforeEach: ', to, from, appName)
})

// 解绑路由监听
cancelCallback()
```


#### 全局后置守卫
**介绍：**监听所有或某个子应用的路由变化，在子应用页面渲染后执行。

**使用范围：**主应用
```js
/**
 * @param {object} to 已经进入的路由
 * @param {object} from 已经离开的路由
 * @param {string} name 子应用的name
 * @return cancel function 解绑路由监听函数
 */
router.afterEach((to, from, name) => {} | { name: (to, from) => {} })
```

**示例：**
```js
import microApp from '@micro-zoe/micro-app'

// 监听所有子应用的路由变化
microApp.router.afterEach((to, from, appName) => {
  console.log('全局后置守卫 afterEach: ', to, from, appName)
})

// 监听某个子应用的路由变化
microApp.router.afterEach({
  子应用1name (to, from) {
    console.log('指定子应用的后置守卫 afterEach ', to, from)
  },
  子应用2name (to, from) {
    console.log('指定子应用的后置守卫 beforeEach ', to, from)
  }
})

// afterEach会返回一个解绑函数
const cancelCallback = microApp.router.afterEach((to, from, appName) => {
  console.log('全局后置守卫 afterEach: ', to, from, appName)
})

// 解绑路由监听
cancelCallback()
```

## 获取路由信息
**介绍：**获取子应用的路由信息，返回值与子应用的location相同
```js
/**
 * @param {string} name 必填，子应用的name
 */
router.current.get(name)
```

**示例：**

<!-- tabs:start -->
#### ** 主应用 **

```js
import microApp from '@micro-zoe/micro-app'

// 获取子应用my-app的路由信息，返回值与子应用的location相同
const routeInfo = microApp.router.current.get('my-app')
```

#### ** 子应用 **

```js
// 获取子应用my-app的路由信息，返回值与子应用的location相同
const routeInfo = window.microApp.router.current.get('my-app')
```
<!-- tabs:end -->


## 编解码
**介绍：**子应用同步到浏览器的路由信息是经过特殊编码的(encodeURIComponent + 特殊字符转译)，如果用户想要编码或解码子应用的路由信息，可以使用编解码的API。

![alt](https://img12.360buyimg.com/imagetools/jfs/t1/204018/30/36539/9736/6523add2F41753832/31f5ad7e48ea6570.png ':size=700')

```js
/**
 * 编码
 * @param {string} path 必填，页面地址
 */
router.encode(path: string)

/**
 * 解码
 * @param {string} path 必填，页面地址
 */
router.decode(path: string)
```

**示例：**

<!-- tabs:start -->
#### ** 主应用 **

```js
import microApp from '@micro-zoe/micro-app'

// 返回 %2Fpage1%2F
const encodeResult = microApp.router.encode('/page1/')

// 返回 /page1/
const encodeResult = microApp.router.decode('%2Fpage1%2F')
```

#### ** 子应用 **

```js
// 返回 %2Fpage1%2F
const encodeResult = window.microApp.router.encode('/page1/')

// 返回 /page1/
const encodeResult = window.microApp.router.decode('%2Fpage1%2F')
```
<!-- tabs:end -->

## 同步路由信息
在一些特殊情况下，主应用的跳转会导致浏览器地址上子应用信息丢失，此时可以主动调用方法，将子应用的路由信息同步到浏览器地址上。

**介绍：**主动将子应用的路由信息同步到浏览器地址上

**使用范围：**主应用
```js
/**
 * 将指定子应用的路由信息同步到浏览器地址上
 * 如果应用未渲染或已经卸载，则方法无效
 * @param {string} name 子应用的名称
 */
router.attachToURL(name: string)

/**
 * 将所有正在运行的子应用路由信息同步到浏览器地址上
 * 它接受一个对象作为参数，详情如下：
 * @param {boolean} includeHiddenApp 是否包含已经隐藏的keep-alive应用，默认为false
 * @param {boolean} includePreRender 是否包含预渲染应用，默认为false
 */
router.attachAllToURL({
  includeHiddenApp?: boolean,
  includePreRender?: boolean,
})
```

**示例：**

```js
import microApp from '@micro-zoe/micro-app'

// 将my-app的路由信息同步到浏览器地址上
microApp.router.attachToURL('my-app')

// 将所有正在运行的子应用路由信息同步到浏览器地址上，不包含处于隐藏状态的keep-alive应用和预渲染应用
microApp.router.attachAllToURL()

// 将所有正在运行的子应用路由信息同步到浏览器地址上，包含处于隐藏状态的keep-alive应用
microApp.router.attachAllToURL({ includeHiddenApp: true })

// 将所有正在运行的子应用路由信息同步到浏览器地址上，包含预渲染应用
microApp.router.attachAllToURL({ includePreRender: true })
```
