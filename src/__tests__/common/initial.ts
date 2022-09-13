/* eslint-disable promise/param-names */
import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter'
import { setCurrentAppName, defer } from '../../libs/utils'
const liveServer = require('../../../scripts/test_server')
global.fetch = require('node-fetch')
jest.useRealTimers()

declare global {
  interface Element {
    ssrUrl: string
  }
  interface Window {
    keepAliveListener: (...rest: any[]) => void
  }
}

export const ports = {
  main: 9000,
  create_app: 9001,
  micro_app_element: 9002,
  lifecycles_event: 9003,
  sandbox: 9004,
  effect: 9005,
  effect2: 9006,
  source_index: 9007,
  source_links: 9008,
  load_event: 9009,
  scoped_css: 9010,
  source_scripts: 9011,
  source_scripts2: 9012,
  source_patch: 9013,
  prefetch: 9014,
}

// 启动服务
export function startServer (port?: number): void {
  if (typeof port === 'number') {
    liveServer.params.port = port
  }

  liveServer.start(liveServer.params)
}

// 重写console.warn和console.error
const rawWarn = global.console.warn
const rawError = global.console.error
export function rewriteConsole (): void {
  global.console.warn = jest.fn()
  global.console.error = jest.fn()
}

// 释放console
export function releaseConsole (): void {
  global.console.warn = rawWarn
  global.console.error = rawError
}

// 初始基座页面的内容
export function initDocument (): void {
  const baseStyle = document.createElement('style')
  baseStyle.id = 'base-app-style'
  baseStyle.textContent = `
    body {
      background: #fff;
    }
    .test-color {
      color: green;
    }
  `
  const baseScript = document.createElement('script')
  baseScript.textContent = `
    window.testBindFunction = function () {console.log('testBindFunction 被执行了')};
    testBindFunction.prototype = {a: 1};
    testBindFunction.abc = 11;

    document.onclick = function onClickOfBase () { console.warn('基座的onclick') }
  `
  document.head.append(baseStyle)
  document.head.append(baseScript)
  document.body.innerHTML = `
    <div id='root'>
      <div class='test-color'>text1</div>
      <div id='app-container'></div>
    </div>
  `
}

export function commonStartEffect (port?: number): void {
  startServer(port)
  rewriteConsole()
  initDocument()
}

export function releaseAllEffect (): Promise<boolean> {
  // 所有test结束后，jest会自动清空document及其内容，从而导致出错，所以要主动卸载所有应用
  document.querySelector('#app-container')!.innerHTML = ''

  return new Promise((resolve) => {
    // 处理动态添加的资源
    setTimeout(() => {
      liveServer.shutdown()
      releaseConsole()
      resolve(true)
    }, 200)
  })
}

/**
 * 绑定应用
 * @param appName 应用名称
 */
export function setAppName (appName: string): void {
  setCurrentAppName(appName)
  defer(() => setCurrentAppName(null))
}

// 清空当前绑定的应用
export function clearAppName (): void {
  setCurrentAppName(null)
}
