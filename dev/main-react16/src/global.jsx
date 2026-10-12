import 'babel-polyfill'
import microApp, { unmountApp, unmountAllApps } from '@micro-zoe/micro-app'
import config from './config'

const prefetchConfig = [
  // {
  //   name: 'vite2',
  //   url: `${config.vite2}micro-app/vite2`,
  //   level: 3,
  //   // inline: true,
  //   // 'disable-sandbox': true,
  //   'default-page': '/micro-app/vite2/element-plus',
  //   iframe: true,
  // },
  // {
  //   name: 'vite4',
  //   url: `${config.vite4}micro-app/vite4/`,
  //   level: 3,
  //   // inline: true,
  //   // 'default-page': '/micro-app/vite2/element-plus',
  //   iframe: true,
  // },
  {
    name: 'vue2',
    url: `${config.vue2}micro-app/vue2/`,
    // 'disable-scopecss': true,
    level: 3,
    // 'default-page': '/micro-app/vue2/#/page2',
    // 'disable-patch-request': false,
    iframe: true,
  },
  // {
  //   name: 'react16',
  //   url: `${config.react16}micro-app/react16?a=1`,
  //   level: 3,
  //   iframe: true,
  // },
  // {
  //   name: 'react17',
  //   url: `${config.react17}micro-app/react17`,
  //   // level: 1,
  // },
  // {
  //   name: 'vue3',
  //   url: `${config.vue3}micro-app/vue3`,
  //   level: 3,
  //   iframe: true,
  // },
  // {
  //   name: 'angular11',
  //   url: `${config.angular11}micro-app/angular11`,
  //   // level: 1,
  // },
  // {
  //   name: 'angular14',
  //   url: `${config.angular14}micro-app/angular14`,
  //   // level: 1,
  // },
]

// microApp.preFetch(prefetchConfig)

window['escapeKey1'] = 'escapeKey1 from base app by global plugin'
window['escapeKey3'] = 'escapeKey3 from base app'
window['scopeKey-vite-1'] = 'scopeKey-vite-1 from base app'
window['escapeKey-vite-1'] = 'escapeKey-vite-1 from base app'
window['escapeKey-vite-func'] = function () {
  console.log('escapeKey-vite-func', this)
  return this
}
window.Vue = { tip: 'Vue from base' }

microApp.start({
  // shadowDOM: true,
  // inline: true,
  // destroy: true,
  // disableScopecss: true,
  // disableSandbox: true,
  // 'disable-scopecss': true,
  // 'disable-sandbox': true,
  // 'disable-memory-router': true,
  // 'disable-patch-request': true,
  // 'keep-router-state': true,
  // 'hidden-router': true,
  // 'router-mode': 'state',
  // esmodule: true,
  // ssr: true,
  // preFetchApps: prefetchConfig,
  // prefetchLevel: 3,
  // prefetchDelay: 10000,
  // iframe: true,
  // getRootElementParentNode (node, appName) {
  //   return node.parentElement
  // },
  // iframeSrc: 'http://localhost:3000/',
  optionCss: ['isolation-root'],//有isolation-root（子应用:root 中定义的变量不起作用，默认用基座的）
  lifeCycles: {
    created (e, appName) {
      console.log(`子应用${appName}被创建 -- 全局监听`)
    },
    beforemount (e, appName) {
      console.log(`子应用${appName}即将渲染 -- 全局监听`)
    },
    mounted (e, appName) {
      console.log(`子应用${appName}已经渲染完成 -- 全局监听`)
    },
    unmount (e, appName) {
      console.log(`子应用${appName}已经卸载 -- 全局监听`)
    },
    error (e, appName) {
      console.log(`子应用${appName}加载出错 -- 全局监听`)
    },
    beforeshow (e, appName) {
      console.log(`子应用${appName} beforeshow -- 全局监听`)
    },
    aftershow (e, appName) {
      console.log(`子应用${appName} aftershow -- 全局监听`)
    },
    afterhidden (e, appName) {
      console.log(`子应用${appName} afterhidden -- 全局监听`)
    },
  },
  plugins: {
    global: [
      {
        scopeProperties: ['scopeKeyPure1', 'scopeKey1', 'scopeKey2'],
        escapeProperties: ['escapeKey1', 'escapeKey2'],
        options: {a: 1,},
        loader(code, url, options) {
          // console.log('vue2插件', url, options)
          return code
        }
      }
    ],
    modules: {
      react16: [{
        scopeProperties: ['scopeKeyPure2', 'scopeKey3', 'scopeKey4'],
        escapeProperties: ['escapeKey3', 'escapeKey4'],
        // loader(code, url) {
        //   if (process.env.NODE_ENV === 'development' && code.indexOf('sockjs-node') > -1) {
        //     console.log('react16插件', url)
        //     code = code.replace('window.location.port', '3001')
        //   }
        //   return code
        // }
      }],
      vue2: [{
        scopeProperties: ['scopeKey5', 'scopeKey6'],
        escapeProperties: ['escapeKey5', 'escapeKey6'],
        loader(code, url) {
          // console.log('vue2插件', url)
          return code
        }
      }],
      vite2: [{
        escapeProperties: ['escapeKey3', 'escapeKey4'],
      }],
      vite4: [{
        scopeProperties: ['scopeKey-vite-1', 'scopeKey-vite-2'],
        escapeProperties: ['escapeKey-vite-1', 'escapeKey-vite-2', 'escapeKey-vite-func'],
      }],
    }
  },
  /**
   * 自定义fetch
   * @param url 静态资源地址
   * @param options fetch请求配置项
   * @returns Promise<string>
  */
  fetch (url, options, appName) {
    if (url === 'http://localhost:3001/error.js') {
      return Promise.resolve('')
    }

    let config = null
    if (url === 'http://localhost:3001/micro-app/react16/?a=1') {
      config = {
        // headers: {
        //   'custom-head': 'custom-head',
        // },
        // micro-app默认不带cookie，如果需要添加cookie需要设置credentials
        // credentials: 'include',
      }
    }

    return fetch(url, Object.assign(options, config)).then((res) => {
      return res.text()
    })
  },
  excludeAssetFilter (assetUrl) {
    if (assetUrl === 'http://127.0.0.1:8080/js/defer.js') {
      return true
    } else if (assetUrl === 'http://127.0.0.1:8080/facefont.css') {
      return true
    }
    return false
  },
  // globalAssets: {
  //   js: ['http://127.0.0.1:8080/a.js'], // js地址
  //   css: ['http://127.0.0.1:8080/test.css'], // css地址
  // }
})

// microApp.start({
//   plugins: {
//     global: [
//       {
//         scopeProperties: ['AMap'],
//       }
//     ],
//   },
// })

// ----------------------分割线--测试全局方法--------------------- //
// setTimeout(() => {
//   unmountAllApps({
//     destroy: false,
//     clearAliveState: true,
//   }).then(() => {
//     console.log('unmountAllApps方法 -- 主动卸载所有应用成功')
//   })
// }, 10000)

window.addEventListener('hashchange', (e) => {
  // const a = document.createElement('div')
  //   a.innerHTML = '666666666'
  //   document.body.appendChild(a)
  console.log('基座 hashchange', e,)
})

window.addEventListener('popstate', (e) => {
  // const a = document.createElement('div')
  //   a.innerHTML = '55555555'
  //   document.body.appendChild(a)
  console.log('基座 popstate', 'state:', e.state)
  // history.replaceState(history.state, '', location.href)
})

window.onpopstate = function () {
  console.log('基座 window.onpopstate 触发')
}

window.onhashchange = function () {
  console.log('基座 window.onhashchange 触发')
}

window.onclick = function () {
  console.log(`基座 window.onclick`)
}

// window.addEventListener('click', function (event) {
//   console.log(`基座`, event instanceof PointerEvent, this)
// }, false)


/* ---------------------- 测试unhandledrejection --------------------- */
// window.addEventListener('unhandledrejection', (event) => {
//   console.error(`基座Promise报错监听 -- window.addEventListener(unhandledrejection): `, event)
//   event.preventDefault()
// })

// window.onunhandledrejection = (event) => {
//   console.error(`基座Promise报错监听 -- window.onunhandledrejection: `, event);
// }

/* ---------------------- 测试message, postMessage --------------------- */
// window.addEventListener('message', function(event) {
//   console.log('基座监听的message事件', event.data, event)
// })

window.insertNodeFromBaseApp = function () {
  const div = window.document.createElement('div')
  div.innerHTML = 'insertNodeFromBaseApp'
  document.body.appendChild(div)
}
