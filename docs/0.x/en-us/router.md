MicroApp implements a virtual routing system by intercepting browser routing events and custom location and history. The child application runs in this virtual routing system and is isolated from the routing of the main application to avoid mutual influence.

The virtual routing system also provides rich functions to help users improve development efficiency and user experience.

## Routing Mode :id=router-mode
The modes of the virtual routing system are: `search`, `native`, `native-scope`, `pure`, `state`. Each mode corresponds to different performance and functions to meet as many project needs as possible. You can switch to different routing modes by configuring `router-mode`.

<!-- tabs:start -->
#### ** search Mode **
Search is the default mode, usually no special setting is required. In search mode, the routing information of the child application will be synchronized to the browser address as a query parameter, as follows:

![alt](https://img12.360buyimg.com/imagetools/jfs/t1/204018/30/36539/9736/6523add2F41753832/31f5ad7e48ea6570.png ':size=700')

**Switch Method:**

- Set single child application:

```html
<micro-app name='xx' url='xx' router-mode='search'></micro-app>
```

- Global setting:

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'search', // Set all child applications to search mode
})
```

**Common Problem:** When the main application is Vue, the page refreshes repeatedly (page flashing) after embedding the child application. Refer to [Vue Common Problems-2](/0.x/en-us/framework/vue?id=question-2) for the solution.

#### ** native Mode **
Native mode refers to releasing routing isolation. The child application and the main application are rendered based on the browser routing together. It has a more intuitive and friendly routing experience, but the configuration method is more complicated. For details, refer to [native-mode](/0.x/en-us/native-mode)

**Switch Method:**

- Set single child application:

```html
<micro-app name='xx' url='xx' router-mode='native'></micro-app>
```

- Global setting:

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'native', // Set all child applications to native mode
})
```
**Common Problem:** When the main application is Vue, the child application unmounts and renders frequently after routing jump. Refer to [Vue Common Problems-2](/0.x/en-us/framework/vue?id=question-2) for the solution.

#### ** native-scope Mode **
The function and usage of native-scope mode are the same as native mode. The only difference is that in native-scope mode, the domain name of the child application points to itself rather than the main application.

**Switch Method:**

- Set single child application:

```html
<micro-app name='xx' url='xx' router-mode='native-scope'></micro-app>
```

- Global setting:

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'native-scope', // Set all child applications to native-scope mode
})
```

**Common Problem:** When the main application is Vue, the child application unmounts and renders frequently after routing jump. Refer to [Vue Common Problems-2](/0.x/en-us/framework/vue?id=question-2) for the solution.

#### ** pure Mode **
Pure mode means that the child application renders independently of the browser routing system, that is, it does not modify the browser address or increase the routing stack. The child application in pure mode is more like a component. (Still in testing, not recommended for complex child application situations)

**Switch Method:**

- Set single child application:

```html
<micro-app name='xx' url='xx' router-mode='pure'></micro-app>
```

- Global setting:

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'pure', // Set all child applications to pure mode
})
```

#### ** state Mode **
State mode refers to a routing mode rendered based on browser history.state, which simulates routing behavior without modifying the browser address. Compared with other routing modes, it is more concise and elegant. (Still in testing, not recommended for complex child application situations)

The performance of state mode is similar to the iframe routing system, but it does not have the problems of iframe routing.

**Switch Method:**

- Set single child application:

```html
<micro-app name='xx' url='xx' router-mode='state'></micro-app>
```

- Global setting:

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'router-mode': 'state', // Set all child applications to state mode
})
```

<!-- tabs:end -->


## Configuration Items :id=configuration
#### 1. Disable Virtual Routing System :id=disable-memory-router
In fact, the virtual routing system cannot be closed. The configuration here is only for backward compatibility with older versions. Its performance is consistent with native routing mode.

**Usage:**

1. Set single child application
```html
<micro-app name='xx' url='xx' disable-memory-router></micro-app>
```

2. Global setting
```js
import microApp from '@micro-zoe/micro-app'

// Add configuration in start
microApp.start({
  'disable-memory-router': true, // Disable virtual routing
})
```

#### 2. Keep Router State :id=keep-router-state
By default, after the child application is unmounted and re-rendered, it will render the home page of the child application just like loading for the first time.

Setting `keep-router-state` can preserve the router state of the child application. When re-rendering after unmounting, the page before unmounting will be restored (states in the page are not preserved).

**Usage:**

1. Keep router state of a child application
```html
<micro-app name='xx' url='xx' keep-router-state></micro-app>
```

2. Keep router state of all child applications
```js
import microApp from '@micro-zoe/micro-app'

// Add configuration in start
microApp.start({
  'keep-router-state': true, // Keep router state
})
```

Note:
  1. If the virtual routing system is turned off, `keep-router-state` will also fail.
  2. When `default-page` is set, `keep-router-state` will fail because its priority is lower than `default-page`.



## Navigation :id=navigation
Through the virtual routing system, we can easily perform cross-application jumps, such as:
1. Main application controls child application jump
2. Child application controls main application jump
3. Child application controls other child applications jump

Since the routing system of nextjs is very special, when the child application is nextjs, it cannot directly control the jump. Refer to [Control jump via data communication](/0.x/en-us/jump?id=method-2-control-jump-via-data-communication)

<!-- tabs:start -->
#### ** Main Application **


### router.push
**Introduction:** Control child application jump and add a new record to the routing stack
```js
/**
 * @param {string} name Required, name of child application
 * @param {string} path Required, full address of child application excluding domain name (can also include domain name)
 * @param {boolean} replace Optional, whether to use replace mode, do not add stack record, default is false
 */
router.push({ name: 'Child App Name', path: 'Page Address', replace: Whether to use replace mode })
```

**Example:**
```js
import microApp from '@micro-zoe/micro-app'

// Address without domain name, control child application my-app jump to /page1
microApp.router.push({name: 'my-app', path: '/page1'})

// Address with domain name, control child application my-app jump to /page1
microApp.router.push({name: 'my-app', path: 'http://localhost:3000/page1'})

// With query parameters, control child application my-app jump to /page1?id=9527
microApp.router.push({name: 'my-app', path: '/page1?id=9527'})

// With hash, control child application my-app jump to /page1#hash
microApp.router.push({name: 'my-app', path: '/page1#hash'})

// Use replace mode, equivalent to router.replace({name: 'my-app', path: '/page1'})
microApp.router.push({name: 'my-app', path: '/page1', replace: true })
```


### router.replace
**Introduction:** Control child application jump, but do not add new record to routing stack, replace the latest stack record.
```js
/**
 * @param {string} name Required, name of child application
 * @param {string} path Required, full address of child application excluding domain name (can also include domain name)
 * @param {boolean} replace Optional, whether to use replace mode, default is true
 */
router.replace({ name: 'Child App Name', path: 'Page Address', replace: Whether to use replace mode })
```

**Example:**
```js
import microApp from '@micro-zoe/micro-app'

// Address without domain name
microApp.router.replace({name: 'my-app', path: '/page1'})

// Address with domain name
microApp.router.replace({name: 'my-app', path: 'http://localhost:3000/page1'})

// With query parameters
microApp.router.replace({name: 'my-app', path: '/page1?id=9527'})

// With hash
microApp.router.replace({name: 'my-app', path: '/page1#hash'})

// Close replace mode, equivalent to router.push({name: 'my-app', path: '/page1'})
microApp.router.replace({name: 'my-app', path: '/page1', replace: false })
```


### router.go
**Introduction:** Its function is consistent with window.history.go(n), indicating how many steps to move forward or backward in the history stack.
```js
/**
 * @param {number} n Steps to move forward or backward
 */
router.go(n)
```

**Example:**
```js
import microApp from '@micro-zoe/micro-app'

// Go back one record
microApp.router.go(-1)

// Go forward 3 records
microApp.router.go(3)
```


### router.back
**Introduction:** Its function is consistent with window.history.back(), indicating moving back one step in the history stack.
```js
router.back()
```

**Example:**
```js
import microApp from '@micro-zoe/micro-app'

// Go back one record
microApp.router.back()
```


### router.forward
**Introduction:** Its function is consistent with window.history.forward(), indicating moving forward one step in the history stack.
```js
router.forward()
```

**Example:**
```js
import microApp from '@micro-zoe/micro-app'

// Go forward one record
microApp.router.forward()
```

#### ** Child Application **
The routing API of the child application is consistent with the main application, the difference is that `microApp` is mounted on window.

### Child Application Controls Main Application Jump
By default, the child application cannot directly control the jump of the main application. For this reason, we provide an API to pass the routing object of the main application to the child application.

**Main Application** 
```js
import microApp from '@micro-zoe/micro-app'

// Register main application router
microApp.router.setBaseAppRouter(Main Application Router Object)
```
**Child Application** 
```js
// Get main application router
const baseRouter = window.microApp.router.getBaseAppRouter() 

// Control main application jump
baseRouter.MainAppRouterMethod(...) 
```

### Control Other Child Applications Jump

### router.push
**Introduction:** Control other child applications jump, and add a new record to the routing stack
```js
/**
 * @param {string} name Required, name of child application
 * @param {string} path Required, full address of child application excluding domain name (can also include domain name)
 * @param {boolean} replace Optional, whether to use replace mode, do not add stack record, default is false
 */
window.microApp.router.push({ name: 'Child App Name', path: 'Page Address', replace: Whether to use replace mode })
```

**Example:**
```js
// Address without domain name, control child application my-app jump to /page1
window.microApp.router.push({name: 'my-app', path: '/page1'})

// Address with domain name, control child application my-app jump to /page1
window.microApp.router.push({name: 'my-app', path: 'http://localhost:3000/page1'})

// With query parameters, control child application my-app jump to /page1?id=9527
window.microApp.router.push({name: 'my-app', path: '/page1?id=9527'})

// With hash, control child application my-app jump to /page1#hash
window.microApp.router.push({name: 'my-app', path: '/page1#hash'})

// Use replace mode, equivalent to router.replace({name: 'my-app', path: '/page1'})
window.microApp.router.push({name: 'my-app', path: '/page1', replace: true })
```


### router.replace
**Introduction:** Control other child applications jump, but do not add new record to routing stack, replace the latest stack record.
```js
/**
 * @param {string} name Required, name of child application
 * @param {string} path Required, full address of child application excluding domain name (can also include domain name)
 * @param {boolean} replace Optional, whether to use replace mode, default is true
 */
window.microApp.router.replace({ name: 'Child App Name', path: 'Page Address', replace: Whether to use replace mode })
```

**Example:**
```js
// Address without domain name
window.microApp.router.replace({name: 'my-app', path: '/page1'})

// Address with domain name
window.microApp.router.replace({name: 'my-app', path: 'http://localhost:3000/page1'})

// With query parameters
window.microApp.router.replace({name: 'my-app', path: '/page1?id=9527'})

// With hash
window.microApp.router.replace({name: 'my-app', path: '/page1#hash'})

// Close replace mode, equivalent to router.push({name: 'my-app', path: '/page1'})
window.microApp.router.replace({name: 'my-app', path: '/page1', replace: false })
```


### router.go
**Introduction:** Its function is consistent with window.history.go(n), indicating how many steps to move forward or backward in the history stack.
```js
/**
 * @param {number} n Steps to move forward or backward
 */
window.microApp.router.go(n)
```

**Example:**
```js
// Go back one record
window.microApp.router.go(-1)

// Go forward 3 records
window.microApp.router.go(3)
```


### router.back
**Introduction:** Its function is consistent with window.history.back, indicating moving back one step in the history stack.

**Example:**
```js
// Go back one record
window.microApp.router.back()
```


### router.forward
**Introduction:** Its function is consistent with window.history.forward, indicating moving forward one step in the history stack.

**Example:**
```js
// Go forward one record
window.microApp.router.forward()
```
<!-- tabs:end -->



## Set Default Page :id=default-page

The child application renders the home page by default, but you can render the specified default page by setting `defaultPage`.

**Precautions:**
- 1. defaultPage is only valid during initial rendering. To control child application jump, please refer to [Navigation](/0.x/en-us/router?id=navigation)
- 2. defaultPage must be the absolute address of the child application page. To prevent errors, it is recommended to open the child application separately, jump to the target page, copy and paste the browser address, including hash and search, and set this value as `defaultPage`. You can also remove the domain name to simplify the code.
- 3. Since `native` and `native-scope` modes are rendered based on the browser, `defaultPage` is invalid in these two modes. Just control the default page of the child application through the browser url.


#### Usage

**Method 1: Set via default-page property**
```html
<micro-app default-page='Page Address'></micro-app>
```

**Example:**

```html
<!-- Address without domain name -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='/page1'></micro-app>

<!-- Address with domain name -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='http://localhost:3000/page1'></micro-app>

<!-- With query parameters -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='/page1?id=9527'></micro-app>

<!-- With hash -->
<micro-app name='my-app' url='http://localhost:3000/' default-page='/page1#hash'></micro-app>
```

**Method 2: Set via router API**
```js
/**
 * Set child application default page
 * @param {string} name Required, name of child application
 * @param {string} path Required, page address
 */
router.setDefaultPage({ name: 'Child App Name', path: 'Page Address' })

/**
 * Delete child application default page
 * @param {string} name Required, name of child application
 */
router.removeDefaultPage(name: 'Child App Name')

/**
 * Get child application default page
 * @param {string} name Required, name of child application
 */
router.getDefaultPage(name: 'Child App Name')
```

**Example:**

```js
import microApp from '@micro-zoe/micro-app'

// Address without domain name
microApp.router.setDefaultPage({name: 'my-app', path: '/page1'})

// Address with domain name
microApp.router.setDefaultPage({name: 'my-app', path: 'http://localhost:3000/page1'})

// With query parameters
microApp.router.setDefaultPage({name: 'my-app', path: '/page1?id=9527'})

// With hash
microApp.router.setDefaultPage({name: 'my-app', path: '/page1#hash'})

// Delete default page of child application my-app
router.removeDefaultPage('my-app')

// Get default page of child application my-app
const defaultPage = router.getDefaultPage('my-app')
```



## Navigation Guards :id=router-guards
Navigation guards are used to listen to routing changes of child applications, similar to vue-router's global guards. The difference is that MicroApp's navigation guards cannot cancel jumps.

#### Global Before Guards
**Introduction:** Listen to routing changes of all or some child applications, executed before child application page rendering.

**Scope:** Main Application
```js
/**
 * @param {object} to Route about to enter
 * @param {object} from Route about to leave
 * @param {string} name Name of child application
 * @return cancel function Unbind route listener function
 */
router.beforeEach((to, from, name) => {} | { name: (to, from) => {} })
```

**Example:**
```js
import microApp from '@micro-zoe/micro-app'

// Listen to routing changes of all child applications
microApp.router.beforeEach((to, from, appName) => {
  console.log('Global Before Guard beforeEach: ', to, from, appName)
})

// Listen to routing changes of specific child application
microApp.router.beforeEach({
  ChildApp1name (to, from) {
    console.log('Specific Child App Before Guard beforeEach ', to, from)
  },
  ChildApp2name (to, from) {
    console.log('Specific Child App Before Guard beforeEach ', to, from)
  }
})

// beforeEach will return an unbind function
const cancelCallback = microApp.router.beforeEach((to, from, appName) => {
  console.log('Global Before Guard beforeEach: ', to, from, appName)
})

// Unbind route listener
cancelCallback()
```


#### Global After Guards
**Introduction:** Listen to routing changes of all or some child applications, executed after child application page rendering.

**Scope:** Main Application
```js
/**
 * @param {object} to Route already entered
 * @param {object} from Route already left
 * @param {string} name Name of child application
 * @return cancel function Unbind route listener function
 */
router.afterEach((to, from, name) => {} | { name: (to, from) => {} })
```

**Example:**
```js
import microApp from '@micro-zoe/micro-app'

// Listen to routing changes of all child applications
microApp.router.afterEach((to, from, appName) => {
  console.log('Global After Guard afterEach: ', to, from, appName)
})

// Listen to routing changes of specific child application
microApp.router.afterEach({
  ChildApp1name (to, from) {
    console.log('Specific Child App After Guard afterEach ', to, from)
  },
  ChildApp2name (to, from) {
    console.log('Specific Child App After Guard beforeEach ', to, from)
  }
})

// afterEach will return an unbind function
const cancelCallback = microApp.router.afterEach((to, from, appName) => {
  console.log('Global After Guard afterEach: ', to, from, appName)
})

// Unbind route listener
cancelCallback()
```

## Get Routing Information :id=information
**Introduction:** Get the routing information of the child application, the return value is the same as the location of the child application.
```js
/**
 * @param {string} name Required, name of child application
 */
router.current.get(name)
```

**Example:**

<!-- tabs:start -->
#### ** Main Application **

```js
import microApp from '@micro-zoe/micro-app'

// Get routing information of child application my-app, return value is the same as location of child application
const routeInfo = microApp.router.current.get('my-app')
```

#### ** Child Application **

```js
// Get routing information of child application my-app, return value is the same as location of child application
const routeInfo = window.microApp.router.current.get('my-app')
```
<!-- tabs:end -->


## Encoding and Decoding :id=code
**Introduction:** The routing information synchronized by the child application to the browser is specially encoded (encodeURIComponent + special character translation). If users want to encode or decode the routing information of the child application, they can use the encoding and decoding API.

![alt](https://img12.360buyimg.com/imagetools/jfs/t1/204018/30/36539/9736/6523add2F41753832/31f5ad7e48ea6570.png ':size=700')

```js
/**
 * Encode
 * @param {string} path Required, page address
 */
router.encode(path: string)

/**
 * Decode
 * @param {string} path Required, page address
 */
router.decode(path: string)
```

**Example:**

<!-- tabs:start -->
#### ** Main Application **

```js
import microApp from '@micro-zoe/micro-app'

// Return %2Fpage1%2F
const encodeResult = microApp.router.encode('/page1/')

// Return /page1/
const encodeResult = microApp.router.decode('%2Fpage1%2F')
```

#### ** Child Application **

```js
// Return %2Fpage1%2F
const encodeResult = window.microApp.router.encode('/page1/')

// Return /page1/
const encodeResult = window.microApp.router.decode('%2Fpage1%2F')
```
<!-- tabs:end -->

## Synchronize Routing Information :id=attach-router
In some special cases, the jump of the main application will cause the loss of child application information on the browser address. At this time, you can actively call the method to synchronize the routing information of the child application to the browser address.

**Introduction:** Actively synchronize the routing information of the child application to the browser address

**Scope:** Main Application
```js
/**
 * Synchronize routing information of specified child application to browser address
 * Method is invalid if application is not rendered or has been unmounted
 * @param {string} name Name of child application
 */
router.attachToURL(name: string)

/**
 * Synchronize routing information of all running child applications to browser address
 * It accepts an object as parameter, details as follows:
 * @param {boolean} includeHiddenApp Whether to include hidden keep-alive applications, default is false
 * @param {boolean} includePreRender Whether to include pre-rendered applications, default is false
 */
router.attachAllToURL({
  includeHiddenApp?: boolean,
  includePreRender?: boolean,
})
```

**Example:**

```js
import microApp from '@micro-zoe/micro-app'

// Synchronize routing information of my-app to browser address
microApp.router.attachToURL('my-app')

// Synchronize routing information of all running child applications to browser address, excluding hidden keep-alive applications and pre-rendered applications
microApp.router.attachAllToURL()

// Synchronize routing information of all running child applications to browser address, including hidden keep-alive applications
microApp.router.attachAllToURL({ includeHiddenApp: true })

// Synchronize routing information of all running child applications to browser address, including pre-rendered applications
microApp.router.attachAllToURL({ includePreRender: true })