### `__MICRO_APP_ENVIRONMENT__`

**描述：判断应用是否在微前端环境中**

在子应用中通过 `window.__MICRO_APP_ENVIRONMENT__` 判断是否在微前端环境中。

```js
if (window.__MICRO_APP_ENVIRONMENT__) {
  console.log('我在微前端环境中')
}
```

### `__MICRO_APP_NAME__`

**描述：应用名称**

在子应用中通过 `window.__MICRO_APP_NAME__` 获取应用的name值，即`<micro-app>`标签的name值。

### `__MICRO_APP_PUBLIC_PATH__`

**描述：子应用的静态资源前缀**

用于设置webpack动态[public-path](https://webpack.docschina.org/guides/public-path/#on-the-fly)，将子应用的静态资源补全为 http 开头的绝对地址。

**步骤1:** 在`子应用`src目录下创建名称为`public-path.js`的文件，并添加如下内容
```js
if (window.__MICRO_APP_ENVIRONMENT__) {
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__
}
```

**步骤2:** 在子应用的入口文件的`最顶部`引入`public-path.js`
```js
import './public-path'
```

### `__MICRO_APP_BASE_ROUTE__`

**描述：子应用的基础路由**

详情见[路由-基础路由](/zh-cn/route?id=基础路由)一章。

### `__MICRO_APP_BASE_APPLICATION__`

**描述：判断应用是否是基座应用**

在执行`microApp.start()`后此值才会生效

```js
if (window.__MICRO_APP_BASE_APPLICATION__) {
  console.log('我是基座应用')
}
```
