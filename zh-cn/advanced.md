## 1、自定义fetch :id=custom-fetch
通过自定义fetch替换框架自带的fetch，可以修改fetch配置(添加cookie或header信息等等)，或拦截HTML、JS、CSS等静态资源。

自定义的fetch必须是一个返回string类型的Promise。

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  /**
   * 自定义fetch
   * @param {string} url 静态资源地址
   * @param {object} options fetch请求配置项
   * @param {string|null} appName 应用名称
   * @returns Promise<string>
  */
  fetch (url, options, appName) {
    if (url === 'http://localhost:3001/error.js') {
      // 删除 http://localhost:3001/error.js 的内容
      return Promise.resolve('')
    }
    
    const config = {
      // fetch 默认不带cookie，如果需要添加cookie需要配置credentials
      credentials: 'include', // 请求时带上cookie
    }

    return window.fetch(url, Object.assign(options, config)).then((res) => {
      return res.text()
    })
  }
})
```

## 2、excludeRunScriptFilter: 自定义屏蔽JS加载异常 
通过`excludeRunScriptFilter`钩子，可选择性屏蔽JS加载异常。
注意：全局捕获异常，将无法感知自定义屏蔽部分。

```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  /**
   * 自定义 excludeRunScriptFilter
   * @param {string} address js地址
   * @param {Error} error fetch请求配置项
   * @param {string|null} appName 应用名称
   * @param {string|null} appUrl 应用地址
   * @returns {boolean|any} true: 屏蔽异常, false及其他: 不屏蔽
  */
  excludeRunScriptFilter (address: string, error: Error, appName: string, appUrl: string) {
    if (address === 'http://localhost:3001/non-block-script.js') {
      // 自行处理异常，如上报等功能
      // 非阻塞性功能js
      return true
    }
    return false
  }
})
```

## 3、inheritBaseBody: 子应用body标签是否采用基座标签，默认不采用
```js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  inheritBaseBody: true // true: 采用基座标签 作为子应用的标签， false: 不采用

})
```



> [!NOTE]
> 需要注意的是，如果跨域请求带cookie，那么`Access-Control-Allow-Origin`不能设置为`*`，必须指定域名，同时设置`Access-Control-Allow-Credentials: true`
