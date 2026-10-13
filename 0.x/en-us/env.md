### `__MICRO_APP_ENVIRONMENT__`

**Description: Determine whether the application is in a micro-frontend environment**

In a child application, check if it is in the micro-frontend environment via `window.__MICRO_APP_ENVIRONMENT__`.

```js
if (window.__MICRO_APP_ENVIRONMENT__) {
  console.log('I am in a micro-frontend environment')
}
```

### `__MICRO_APP_NAME__`

**Description: Application Name**

In a child application, get the application name via `window.__MICRO_APP_NAME__`, which is the name value of the `<micro-app>` tag.

### `__MICRO_APP_PUBLIC_PATH__`

**Description: Static resource prefix of the child application**

Used to set webpack's dynamic [public-path](https://webpack.docschina.org/guides/public-path/#on-the-fly) to complete the static resources of the child application into absolute addresses starting with http.

**Usage:**

**Step 1:** Create a file named `public-path.js` in the `src` directory of the `child application` and add the following content:
```js
if (window.__MICRO_APP_ENVIRONMENT__) {
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__
}
```

**Step 2:** Import `public-path.js` at the **very top** of the entry file of the child application.
```js
import './public-path'
```

### `__MICRO_APP_BASE_ROUTE__`

**Description: Base route of the child application**

See the [Routing - Base Route](/0.x/en-us/native-mode?id=base-route) chapter for details.

### `__MICRO_APP_BASE_APPLICATION__`

**Description: Determine if the current application is the main application**

This value will only take effect after executing `microApp.start()`.

```js
if (window.__MICRO_APP_BASE_APPLICATION__) {
  console.log('I am the main application')
}
```


### `rawWindow`

**Description: Get the real window (i.e., the main application window)**

By default, the child application window points to a proxy object. You can get the real window through `rawWindow`.

**Usage:**
```js
window.rawWindow
```

### `rawDocument`

**Description: Get the real document (i.e., the main application document)**

By default, the child application document points to a proxy object. You can get the real document through `rawDocument`.

**Usage:**
```js
window.rawDocument