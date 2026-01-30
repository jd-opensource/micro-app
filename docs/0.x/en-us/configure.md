Through configuration items, we can decide to enable or disable certain features.

## name
- Desc: `Application Name`
- Type: `string`
- Default: `Required`
- Usage: `<micro-app name='xx'></micro-app>`
- Note: Must start with a letter and cannot contain special characters (except hyphens and underscores).

Each `name` corresponds to a child application. When multiple applications are rendered simultaneously, names cannot be duplicated.

When the value of `name` changes, the current application will be unmounted and re-rendered.

## url
- Desc: `Application Address`
- Type: `string`
- Default: `Required`
- Usage: `<micro-app name='xx' url='xx'></micro-app>`

`url` must point to the `index.html` of the child application, e.g., http://localhost:3000/ or http://localhost:3000/index.html

MicroApp will automatically complete the static resources of the child application, such as js, css, images, etc., based on the url address.

When the value of `url` changes, the current application will be unmounted and re-rendered based on the new `url` value.

## iframe
- Desc: `Enable iframe sandbox`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' iframe></micro-app>`

MicroApp has two sandbox solutions: `with sandbox` and `iframe sandbox`.

The with sandbox is enabled by default. If the with sandbox cannot run normally, you can try switching to the iframe sandbox, such as with vite.


## inline
- Desc: `Use inline script`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' inline></micro-app>`

By default, the js of the child application will be extracted and run in the background, and a comment will be left at the original position of the script element: `<!--script with src='xxx' extract by micro-app-->`

After enabling inline mode, the script element will be preserved, which is convenient for viewing and debugging code, but it will slightly compromise performance. It is recommended to use it only in the development environment.


## clear-data
- Desc: `Clear cached data in data communication when unmounting`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' clear-data></micro-app>`

By default, the cached data in data communication will be retained after the child application is unmounted. If you want to clear these data, just set `clear-data`.

When the child application is unmounted, the data sent by the main application to the current child application and the data sent by the current child application to the main application will be cleared simultaneously.

[destroy](/0.x/en-us/configure?id=destroy) has the same effect.

## destroy
- Desc: `Delete cached resources when unmounting`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' destroy></micro-app>`

By default, cached static resources and sandbox data will not be deleted after the child application is unmounted, so as to obtain better performance when re-rendering.

Enable destroy, and the child application will clear cached static resources and sandbox data after unmounting.

However, destroy is only suitable for child applications rendered once. Since each initialization of the child application may increase some memory that cannot be released, if rendering and unmounting occur frequently, setting destroy will increase memory consumption instead. Please use it with caution.


## disable-scopecss
- Desc: `Disable style isolation`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' disable-scopecss></micro-app>`

Disabling style isolation can improve page rendering speed. Before doing this, please ensure that styles between applications will not pollute each other.

## disable-sandbox
- Desc: `Disable JS sandbox`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' disable-sandbox></micro-app>`

Closing the sandbox may lead to some unpredictable problems, and it is generally not recommended to do so.

> [!NOTE]
> The following functions will fail after closing the sandbox:
> 
> 1. Style isolation
>
> 2. Element isolation
>
> 3. Route isolation
>
> 4. Global variables such as `__MICRO_APP_ENVIRONMENT__`, `__MICRO_APP_PUBLIC_PATH__`
>
> 5. baseroute


## ssr
- Desc: `Enable SSR mode`
- Type: `string(boolean)`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' ssr></micro-app>`
- Version Requirement: `0.5.3 and above`

When the child application is an SSR application, the ssr property needs to be set. At this time, micro-app will load the child application according to the SSR mode.

## keep-alive
- Desc: `Enable keep-alive mode`
- Type: `string(boolean)`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' keep-alive></micro-app>`
- Version Requirement: `0.6.0 and above`

After enabling keep-alive, the application will enter the cache instead of being destroyed when unmounted, so as to preserve the state of the application and improve the performance of repeated rendering.

The priority of keep-alive is lower than [destroy](/0.x/en-us/configure?id=destroy). When both exist at the same time, keep-alive will fail.


## default-page
- Desc: `Specify the page rendered by default`
- Type: `string`
- Default: `''`
- Usage: `<micro-app name='xx' url='xx' default-page='page address'></micro-app>`

By default, the child application will display the home page after rendering. Setting `default-page` can specify the page rendered by the child application.


## router-mode
- Desc: `Routing Mode`
- Type: `string`
- Default: `search`
- Usage: `<micro-app name='xx' url='xx' router-mode='search/native/native-scope/pure'></micro-app>`

Routing modes are divided into: `search`, `native`, `native-scope`, `pure`, `state`. Each mode corresponds to different functions to meet as many project requirements as possible. For details, refer to [Virtual Routing System](/0.x/en-us/router).


## baseroute
- Desc: `Set the base route of the child application`
- Type: `string`
- Default: `''`
- Usage: `<micro-app name='xx' url='xx' baseroute='/my-page/'></micro-app>`

In a micro-frontend environment, the child application can get the value of baseroute from window.__MICRO_APP_BASE_ROUTE__ to set the base route.

We only need to set baseroute when the routing mode is native or native-scope. For details, refer to [Virtual Routing System](/0.x/en-us/router).


## keep-router-state
- Desc: `Keep Router State`
- Type: `string(boolean)`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' keep-router-state></micro-app>`

By default, after the child application is unmounted and re-rendered, it will render the page of the child application just like loading for the first time.

Setting `keep-router-state` can preserve the router state of the child application. When re-rendering after unmounting, the page before unmounting will be restored (states in the page are not preserved).

Note:
  1. If the virtual routing system is turned off, `keep-router-state` will also fail.
  2. When `default-page` is set, `keep-router-state` will fail because its priority is lower than `default-page`.


## disable-memory-router
- Desc: `Disable Virtual Routing System`
- Type: `string(boolean)`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' disable-memory-router></micro-app>`

By default, the child application will run in the virtual routing system and be isolated from the routing system of the main application to avoid mutual influence.

The routing information of the child application will be synchronized to the browser address as a query parameter, as follows:

![alt](https://img12.360buyimg.com/imagetools/jfs/t1/204018/30/36539/9736/6523add2F41753832/31f5ad7e48ea6570.png ':size=700')

After setting `disable-memory-router`, the child application will render based on the browser's routing system and have a simpler and more elegant browser address. For details, refer to [Virtual Routing System](/0.x/en-us/router).


## disable-patch-request
- Desc: `Disable auto-completion of child application requests`
- Type: `string(boolean)`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' disable-patch-request></micro-app>`

By default, MicroApp rewrites fetch, XMLHttpRequest, and EventSource of the child application. When requesting a relative address, it will automatically complete it using the child application domain name.

For example: `fetch('/api/data')` is completed as `fetch(child application domain name + '/api/data')`

If such completion is not needed, you can configure `disable-patch-request` to disable it. At this time, the relative address will fallback to the main application domain name.

For example: `fetch('/api/data')` falls back to `fetch(main application domain name + '/api/data')`

## fiber
- Desc: `Enable fiber mode`
- Type: `string(boolean)`
- Default: `false`
- Usage: `<micro-app name='xx' url='xx' fiber></micro-app>`

By default, the JS of the child application is executed synchronously, which will block the rendering thread of the main application. When fiber is enabled, micro-app will lower the priority of the child application and execute the JS files of the child application asynchronously to reduce the impact on the main application and respond to user operations quickly.

> [!NOTE]
> Enabling fiber will reduce the rendering speed of the child application.


<!-- ## shadowDOM
- Desc: `Enable shadowDOM`
- Type: `string(boolean)`
- Default: `false`
- Usage: 
```html 
<micro-app name='xx' url='xx' shadowDOM></micro-app>
```

shadowDOM has stronger style isolation capability. After enabling it, the `<micro-app>` tag will become a real WebComponent.

However, shadowDOM compatibility is not very good in React framework and some UI libraries, and unpredictable problems often occur. Unless you are very clear about the problems it will bring and confident to solve them, it is not recommended to use it. -->


## Global Configuration :id=global
Global configuration will affect every child application, please use it with caution!

**Usage**

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  iframe: true, // Globally enable iframe sandbox, default is false
  inline: true, // Globally enable inline script mode to run js, default is false
  destroy: true, // Globally enable destroy mode, force delete cached resources when unmounting, default is false
  ssr: true, // Globally enable ssr mode, default is false
  'disable-scopecss': true, // Globally disable style isolation, default is false
  'disable-sandbox': true, // Globally disable sandbox, default is false
  'keep-alive': true, // Globally enable keep-alive mode, default is false
  'disable-memory-router': true, // Globally disable virtual routing system, default is false
  'keep-router-state': true, // Child application retains routing state when unmounting, default is false
  'disable-patch-request': true, // Disable auto-completion of child application requests, default is false
  iframeSrc: location.origin, // Set the src address of the iframe in the iframe sandbox, default is the page address where the child application is located
  inheritBaseBody: true, // true: Use base tag as child app tag, false: Do not use
  aHrefResolver: (hrefValue: string, appName: string, appUrl: string) => string, // Custom handling of href concatenation for all child app a tags
})
```

If you want to disable global configuration in a certain application, you can configure it separately:
```html
<micro-app 
  name='xx' 
  url='xx' 
  iframe='false'
  inline='false'
  destroy='false'
  ssr='false'
  disable-scopecss='false'
  disable-sandbox='false'
  keep-alive='false'
  disable-memory-router='false'
  keep-router-state='false'
  disable-patch-request='false'
></micro-app>
```

## Other Configurations
### globalAssets :id=globalAssets
globalAssets is used to set global shared resources. It shares the same idea as preloading, loading resources and putting them into cache when the browser is idle to improve rendering efficiency.

When a child application loads JS or CSS resources with the same address, it will extract data directly from the cache, thereby improving rendering speed.

**Usage**
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  globalAssets: {
    js: ['js address 1', 'js address 2', ...], // js address
    css: ['css address 1', 'css address 2', ...], // css address
  }
})
```

### exclude (Filter Elements) :id=exclude
When a child application does not need to load a certain JS or CSS, you can set the exclude attribute in link, script, or style. When micro-app encounters an element with the exclude attribute, it will delete it.

**Usage**
```html
<link rel="stylesheet" href="xx.css" exclude>
<script src="xx.js" exclude></script>
<style exclude></style>
```

### ignore (Ignore Elements) :id=ignore
When link, script, or style elements have the ignore attribute, micro-app will not process them, and the elements will be rendered as is.

Usage scenario e.g.: jsonp

jsonp creates a script element to load data. Normally, the script will be intercepted, causing the jsonp request to fail. In this case, you can add the ignore attribute to the script element to skip interception.

```js
// Modify jsonp method, add ignore attribute after creating script element
const script = document.createElement('script')
script.setAttribute('ignore', 'true')