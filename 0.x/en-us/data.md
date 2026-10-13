`micro-app` provides a flexible data communication mechanism to facilitate data transmission between the main application and the child application.

The communication between the main application and the child application is bound. The main application can only send data to the specified child application, and the child application can only send data to the main application. This method can effectively avoid data pollution and prevent multiple child applications from affecting each other.

At the same time, we also provide global communication to facilitate data communication between applications.


## I. Child Application Gets Data from Main Application

There are two ways to get data from the main application:

#### Method 1: Get Data Directly
```js
const data = window.microApp.getData() // Return data sent by the main application
```

#### Method 2: Bind Listener Function
```js
/**
 * Bind listener function, the listener function will only be triggered when the data changes
 * dataListener: Bound function
 * autoTrigger: Whether to actively trigger once if there is cached data when binding the listener function for the first time, default is false
 * !!!Important Note: Because the child application is rendered asynchronously, while the main application sends data synchronously,
 * if the main application sends data before the child application finishes rendering, the data has already been sent before binding the listener function.
 * It will not trigger the bound function after initialization, but this data will be put into the cache. 
 * At this time, you can set autoTrigger to true to actively trigger the listener function once to get data.
 */
window.microApp.addDataListener(dataListener: (data: Object) => any, autoTrigger?: boolean)

// Unbind listener function
window.microApp.removeDataListener(dataListener: (data: Object) => any)

// Clear all bound functions of the current child application (except global data functions)
window.microApp.clearDataListener()
```

**Usage:**
```js
// Listener function
function dataListener (data) {
  console.log('Data from main application', data)
}

// Listen for data changes
window.microApp.addDataListener(dataListener)

// Listen for data changes, trigger once actively if there is data during initialization
window.microApp.addDataListener(dataListener, true)

// Unbind listener function
window.microApp.removeDataListener(dataListener)

// Clear all bound functions of the current child application (except global data functions)
window.microApp.clearDataListener()
```


## II. Child Application Sends Data to Main Application
```js
// dispatch only accepts object as parameter
window.microApp.dispatch({type: 'Data sent by child application to main application'})
```

dispatch only accepts an object as a parameter, and the data sent by it will be cached.

micro-app will traverse each key in the new and old values to judge whether the value has changed. If all data are the same, it will not be sent (Note: only traverse the first layer of keys). If the data changes, the **new and old values will be merged** and then sent.

For example:
```js
// Send data for the first time, record cache value {name: 'jack'}, then send
window.microApp.dispatch({name: 'jack'})
```

```js
// Send data for the second time, merge new and old values into {name: 'jack', age: 20}, record cache value, then send
window.microApp.dispatch({age: 20})
```

```js
// Send data for the third time, merge new and old values into {name: 'jack', age: 20}, same as cache value, do not send again
window.microApp.dispatch({age: 20})
```

##### dispatch is executed asynchronously, multiple dispatches will be merged into one execution in the next frame

For example:
```js
window.microApp.dispatch({name: 'jack'})
window.microApp.dispatch({age: 20})

// The above data will be merged into object {name: 'jack', age: 20} in the next frame and sent to the main application at once
```

##### The second parameter of dispatch is a callback function, which will be executed after the data sending ends

For example:
```js
window.microApp.dispatch({city: 'HK'}, () => {
  console.log('Data has been sent')
})
```

##### When the data listener function has a return value, it will be used as the input parameter of the dispatch callback function

For example:

*Main Application:*
```js
import microApp from '@micro-zoe/micro-app'

microApp.addDataListener('my-app', (data) => {
  console.log('Data from child application my-app', data)

  return 'Return Value 1'
})

microApp.addDataListener('my-app', (data) => {
  console.log('Data from child application my-app', data)

  return 'Return Value 2'
})
```

*Child Application:*
```js
// The return value will be put into the array and passed to the callback function of dispatch
window.microApp.dispatch({city: 'HK'}, (res: any[]) => {
  console.log(res) // ['Return Value 1', 'Return Value 2']
})
```


##### forceDispatch: Force Send

The forceDispatch method has the same parameters and behavior as dispatch. The only difference is that forceDispatch will force data sending regardless of whether the data changes.

For example:
```js
// Force send data regardless of whether the value name: 'jack' already exists in the cache
window.microApp.forceDispatch({name: 'jack'}, () => {
  console.log('Data has been sent')
})
```


## III. Main Application Sends Data to Child Application
There are two ways for the main application to send data to the child application:

#### Method 1: Send data via data property

<!-- tabs:start -->

#### ** React **
In React, we need to import a polyfill.

Add the polyfill `at the top of the file where the <micro-app> element is located` (copy the comments as well).
```js
/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
```

**Usage**
```js
<micro-app
  name='my-app'
  url='xx'
  data={this.state.dataForChild} // data only accepts object type, strictly compared (===), resent when new data object is passed
/>
```

#### ** Vue **
Consistent with binding common properties in Vue.
```js
<template>
  <micro-app
    name='my-app'
    url='xx'
    :data='dataForChild' // data only accepts object type, resent when data changes
  />
</template>

<script>
export default {
  data () {
    return {
      dataForChild: {type: 'Data sent to child application'}
    }
  }
}
</script>
```
<!-- tabs:end -->

#### Method 2: Manually Send Data

Manually sending data requires specifying the child application receiving data via `name`, which is consistent with the `name` in the `<micro-app>` element.
```js
import microApp from '@micro-zoe/micro-app'

// Send data to child application my-app, the second parameter of setData only accepts object type
microApp.setData('my-app', {type: 'New Data'})
```

The first parameter of setData is the name of the child application, and the second parameter is the data passed. All data sent by it will be cached.

micro-app will traverse each key in the new and old values to judge whether the value has changed. If all data are the same, it will not be sent (Note: only traverse the first layer of keys). If the data changes, the **new and old values will be merged** and then sent.

For example:
```js
// Send data for the first time, record cache value {name: 'jack'}, then send
microApp.setData('my-app', {name: 'jack'})
```

```js
// Send data for the second time, merge new and old values into {name: 'jack', age: 20}, record cache value, then send
microApp.setData('my-app', {age: 20})
```

```js
// Send data for the third time, merge new and old values into {name: 'jack', age: 20}, same as cache value, do not send again
microApp.setData('my-app', {age: 20})
```

##### setData is executed asynchronously, multiple setDatas will be merged into one execution in the next frame

For example:
```js
microApp.setData('my-app', {name: 'jack'})
microApp.setData('my-app', {age: 20})

// The above data will be merged into object {name: 'jack', age: 20} in the next frame and sent to child application my-app at once
```

##### The third parameter of setData is a callback function, which will be executed after the data sending ends

For example:
```js
microApp.setData('my-app', {city: 'HK'}, () => {
  console.log('Data has been sent')
})
```

##### When the data listener function has a return value, it will be used as the input parameter of the setData callback function

For example:

*Child Application:*
```js
window.microApp.addDataListener((data) => {
  console.log('Data from main application', data)

  return 'Return Value 1'
})

window.microApp.addDataListener((data) => {
  console.log('Data from main application', data)

  return 'Return Value 2'
})
```

*Main Application:*
```js
// The return value will be put into the array and passed to the callback function of setData
microApp.setData('my-app', {city: 'HK'}, (res: any[]) => {
  console.log(res) // ['Return Value 1', 'Return Value 2']
})
```

##### forceSetData: Force Send

The forceSetData method has the same parameters and behavior as setData. The only difference is that forceSetData will force data sending regardless of whether the data changes.

For example:
```js
// Force send data regardless of whether the value name: 'jack' already exists in the cache
microApp.forceSetData('my-app', {name: 'jack'}, () => {
  console.log('Data has been sent')
})
```


## IV. Main Application Gets Data from Child Application
There are three ways for the main application to get data from the child application:

#### Method 1: Get Data Directly
```js
import microApp from '@micro-zoe/micro-app'

const childData = microApp.getData(appName) // Return data of child application
```

#### Method 2: Listen to Custom Event (datachange)

<!-- tabs:start -->

#### ** React **
In React, we need to import a polyfill.

Add the polyfill `at the top of the file where the <micro-app> element is located` (copy the comments as well).
```js
/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
```

**Usage**
```js
<micro-app
  name='my-app'
  url='xx'
  // Data is in event.detail.data field, child application triggers datachange every time it sends data
  onDataChange={(e) => console.log('Data from child application:', e.detail.data)}
/>
```

#### ** Vue **
The listening method in Vue is consistent with ordinary events.
```js
<template>
  <micro-app
    name='my-app'
    url='xx'
    // Data is in detail.data field of event object, child application triggers datachange every time it sends data
    @datachange='handleDataChange'
  />
</template>

<script>
export default {
  methods: {
    handleDataChange (e) {
      console.log('Data from child application:', e.detail.data)
    }
  }
}
</script>
```
<!-- tabs:end -->

Note: The return value of the `datachange` binding function will not be used as the input parameter of the child application dispatch callback function. Its return value has no effect.

#### Method 3: Bind Listener Function

Binding the listener function requires specifying the child application via `name`, which is consistent with the `name` in the `<micro-app>` element.
```js
import microApp from '@micro-zoe/micro-app'

/**
 * Bind listener function
 * appName: Application Name
 * dataListener: Bound function
 * autoTrigger: Whether to actively trigger once if there is cached data when binding the listener function for the first time, default is false
 */
microApp.addDataListener(appName: string, dataListener: (data: Object) => any, autoTrigger?: boolean)

// Unbind function listening to specified child application
microApp.removeDataListener(appName: string, dataListener: (data: Object) => any)

// Clear all functions listening to specified child application
microApp.clearDataListener(appName: string)
```

**Usage:**
```js
import microApp from '@micro-zoe/micro-app'

// Listener function
function dataListener (data) {
  console.log('Data from child application my-app', data)
}

// Listen to data from child application my-app
microApp.addDataListener('my-app', dataListener)

// Unbind function listening to my-app child application
microApp.removeDataListener('my-app', dataListener)

// Clear all functions listening to my-app child application
microApp.clearDataListener('my-app')
```

## V. Clear Data
Since the communication data will be cached, even if the child application is unmounted, it will not be cleared, which may cause some confusion. At this time, you can actively clear the cached data to solve it.

<!-- tabs:start -->
#### ** Main Application **

#### Method 1: Configuration Item - clear-data
- Usage: `<micro-app clear-data></micro-app>`

When `clear-data` is set, the data sent by the main application to the current child application and the data sent by the current child application to the main application will be cleared simultaneously when the child application is unmounted.

[destroy](/0.x/en-us/configure?id=destroy) has the same effect.

#### Method 2: Manually Clear - clearData
```js
import microApp from '@micro-zoe/micro-app'

// Clear data sent by main application to child application my-app
microApp.clearData('my-app')
```

#### ** Child Application **

#### Method 1: Manually Clear - clearData
```js
// Clear data sent by current child application to main application
window.microApp.clearData()
```
<!-- tabs:end -->

## Global Data Communication
Global data communication sends data to the main application and all child applications, which is applicable in cross-application communication scenarios.

#### Send Global Data

<!-- tabs:start -->
#### ** Main Application **
```js
import microApp from '@micro-zoe/micro-app'

// setGlobalData only accepts object as parameter
microApp.setGlobalData({type: 'Global Data'})
```

#### ** Child Application **

```js
// setGlobalData only accepts object as parameter
window.microApp.setGlobalData({type: 'Global Data'})
```
<!-- tabs:end -->


setGlobalData only accepts an object as a parameter, and the data sent by it will be cached.

micro-app will traverse each key in the new and old values to judge whether the value has changed. If all data are the same, it will not be sent (Note: only traverse the first layer of keys). If the data changes, the **new and old values will be merged** and then sent.

For example:

<!-- tabs:start -->
#### ** Main Application **
```js
// Send data for the first time, record cache value {name: 'jack'}, then send
microApp.setGlobalData({name: 'jack'})
```

```js
// Send data for the second time, merge new and old values into {name: 'jack', age: 20}, record cache value, then send
microApp.setGlobalData({age: 20})
```

```js
// Send data for the third time, merge new and old values into {name: 'jack', age: 20}, same as cache value, do not send again
microApp.setGlobalData({age: 20})
```

#### ** Child Application **

```js
// Send data for the first time, record cache value {name: 'jack'}, then send
window.microApp.setGlobalData({name: 'jack'})
```

```js
// Send data for the second time, merge new and old values into {name: 'jack', age: 20}, record cache value, then send
window.microApp.setGlobalData({age: 20})
```

```js
// Send data for the third time, merge new and old values into {name: 'jack', age: 20}, same as cache value, do not send again
window.microApp.setGlobalData({age: 20})
```
<!-- tabs:end -->


##### setGlobalData is executed asynchronously, multiple setGlobalDatas will be merged into one execution in the next frame

For example:
<!-- tabs:start -->
#### ** Main Application **
```js
microApp.setGlobalData({name: 'jack'})
microApp.setGlobalData({age: 20})

// The above data will be merged into object {name: 'jack', age: 20} in the next frame and sent to the main application at once
```

#### ** Child Application **

```js
window.microApp.setGlobalData({name: 'jack'})
window.microApp.setGlobalData({age: 20})

// The above data will be merged into object {name: 'jack', age: 20} in the next frame and sent to the main application at once
```
<!-- tabs:end -->


##### The second parameter of setGlobalData is a callback function, which will be executed after the data sending ends

For example:
<!-- tabs:start -->
#### ** Main Application **
```js
microApp.setGlobalData({city: 'HK'}, () => {
  console.log('Data has been sent')
})
```

#### ** Child Application **

```js
window.microApp.setGlobalData({city: 'HK'}, () => {
  console.log('Data has been sent')
})
```
<!-- tabs:end -->

##### When the global data listener function has a return value, it will be used as the input parameter of the setGlobalData callback function

For example:
<!-- tabs:start -->
#### ** Main Application **
```js
microApp.addGlobalDataListener((data) => {
  console.log('Global Data', data)

  return 'Return Value 1'
})

microApp.addGlobalDataListener((data) => {
  console.log('Global Data', data)

  return 'Return Value 2'
})
```

```js
// The return value will be put into the array and passed to the callback function of setGlobalData
microApp.setGlobalData({city: 'HK'}, (res: any[]) => {
  console.log(res) // ['Return Value 1', 'Return Value 2']
})
```

#### ** Child Application **
```js
window.microApp.addGlobalDataListener((data) => {
  console.log('Global Data', data)

  return 'Return Value 1'
})

window.microApp.addGlobalDataListener((data) => {
  console.log('Global Data', data)

  return 'Return Value 2'
})
```

```js
// The return value will be put into the array and passed to the callback function of setGlobalData
window.microApp.setGlobalData({city: 'HK'}, (res: any[]) => {
  console.log(res) // ['Return Value 1', 'Return Value 2']
})
```
<!-- tabs:end -->


##### forceSetGlobalData: Force Send

The forceSetGlobalData method has the same parameters and behavior as setGlobalData. The only difference is that forceSetGlobalData will force data sending regardless of whether the data changes.

For example:
<!-- tabs:start -->
#### ** Main Application **
```js
// Force send data regardless of whether the value name: 'jack' already exists in the cache
microApp.forceSetGlobalData({name: 'jack'}, () => {
  console.log('Data has been sent')
})
```

#### ** Child Application **

```js
// Force send data regardless of whether the value name: 'jack' already exists in the cache
window.microApp.forceSetGlobalData({name: 'jack'}, () => {
  console.log('Data has been sent')
})
```
<!-- tabs:end -->



#### Get Global Data

<!-- tabs:start -->

#### ** Main Application **
```js
import microApp from '@micro-zoe/micro-app'

// Get data directly
const globalData = microApp.getGlobalData() // Return global data

function dataListener (data) {
  console.log('Global Data', data)
}

/**
 * Bind listener function
 * dataListener: Bound function
 * autoTrigger: Whether to actively trigger once if there is cached data when binding the listener function for the first time, default is false
 */
microApp.addGlobalDataListener(dataListener: (data: Object) => any, autoTrigger?: boolean)

// Unbind listener function
microApp.removeGlobalDataListener(dataListener: (data: Object) => any)

// Clear all global data listener functions bound to the main application
microApp.clearGlobalDataListener()
```

#### ** Child Application **

```js
// Get data directly
const globalData = window.microApp.getGlobalData() // Return global data

function dataListener (data) {
  console.log('Global Data', data)
}

/**
 * Bind listener function
 * dataListener: Bound function
 * autoTrigger: Whether to actively trigger once if there is cached data when binding the listener function for the first time, default is false
 */
window.microApp.addGlobalDataListener(dataListener: (data: Object) => any, autoTrigger?: boolean)

// Unbind listener function
window.microApp.removeGlobalDataListener(dataListener: (data: Object) => any)

// Clear all global data listener functions bound to the current child application
window.microApp.clearGlobalDataListener()
```
<!-- tabs:end -->

#### Clear Global Data
<!-- tabs:start -->
#### ** Main Application **
```js
import microApp from '@micro-zoe/micro-app'

// Clear global data
microApp.clearGlobalData()
```

#### ** Child Application **

```js
// Clear global data
window.microApp.clearGlobalData()
```
<!-- tabs:end -->

## Communication Method After Closing Sandbox
After the sandbox is closed, the default communication function of the child application fails. At this time, consistent functions can be achieved by manually registering communication objects.

**Registration method: Initialize communication object for child application in main application**

```js
import { EventCenterForMicroApp } from '@micro-zoe/micro-app'

// Note: Each child application allocates a communication object separately according to appName
window.eventCenterForAppxx = new EventCenterForMicroApp(appName)
```

The child application can communicate through the registered `eventCenterForAppxx` object. Its api is consistent with `window.microApp`, and *there is no change in the main application communication method.*

**Child Application Communication Method:**
```js
// Get data directly
const data = window.eventCenterForAppxx.getData() // Return data

function dataListener (data) {
  console.log('Data from main application', data)
}

/**
 * Bind listener function
 * dataListener: Bound function
 * autoTrigger: Whether to actively trigger once if there is cached data when binding the listener function for the first time, default is false
 */
window.eventCenterForAppxx.addDataListener(dataListener: (data: Object) => any, autoTrigger?: boolean)

// Unbind listener function
window.eventCenterForAppxx.removeDataListener(dataListener: (data: Object) => any)

// Clear all bound functions of the current child application (except global data functions)
window.eventCenterForAppxx.clearDataListener()

// Child application sends data to main application, only accepts object as parameter
window.eventCenterForAppxx.dispatch({type: 'Data sent by child application'})