/* eslint-disable no-void */
import type {
  MicroState,
  MicroLocation,
  MicroHistory,
  HistoryProxyValue,
  HandleMicroPathResult,
} from '@micro-app/types'
import globalEnv from '../../libs/global_env'
import bindFunctionToRawTarget from '../bind_function'
import {
  isString,
  createURL,
  isPlainObject,
  isURL,
  assign,
  removeDomScope,
  isUndefined,
  isNull,
} from '../../libs/utils'
import {
  setMicroPathToURL,
  setMicroState,
  getMicroState,
  getMicroRouterInfoState,
  getMicroPathFromURL,
  isEffectiveApp,
  isRouterModePure,
  isRouterModeSearch,
  isRouterModeState,
  isRouterModeCustom,
} from './core'
import {
  dispatchNativeEvent,
  dispatchPopStateEventToMicroApp,
} from './event'
import {
  updateMicroLocation,
} from './location'
import {
  getActiveApps,
} from '../../micro_app'
import {
  appInstanceMap,
  isIframeSandbox,
} from '../../create_app'

interface HistoryStack {
  [appName: string]: {
    stack: Array<{ path: string, state: any }>,
    currentIndex: number
  }
}
const pureHistoryStack: HistoryStack = {}

function initPureHistory(appName: string): void {
  if (!pureHistoryStack[appName]) {
    pureHistoryStack[appName] = {
      stack: [],
      currentIndex: -1
    }
  }
}

function addToPureHistory(appName: string, path: string, state: any): void {
  if (!pureHistoryStack[appName]) {
    pureHistoryStack[appName] = {
      stack: [],
      currentIndex: -1
    }
  }
  const history = pureHistoryStack[appName]
  // 处理路径，移除基础路径
  const basePath = `/${appName}/`
  const cleanPath = path.startsWith(basePath) ? path.slice(basePath.length - 1) : path

  // 检查是否与当前路径相同
  const currentEntry = history.stack[history.currentIndex]
  if (currentEntry && currentEntry.path === cleanPath) {
    // 如果路径相同，只更新状态
    currentEntry.state = state
    return
  }

  if (history.currentIndex < history.stack.length - 1) {
    history.stack = history.stack.slice(0, history.currentIndex + 1)
  }

  history.stack.push({
    path: cleanPath,
    state
  })
  history.currentIndex++
}

export function clearPureHistory(appName: string): void {
  delete pureHistoryStack[appName]
}

/**
 * create proxyHistory for microApp
 * MDN https://developer.mozilla.org/en-US/docs/Web/API/History
 * @param appName app name
 * @param microLocation microApp location(with: proxyLocation iframe: iframeWindow.location)
 */
export function createMicroHistory(appName: string, microLocation: MicroLocation): MicroHistory {
  const rawHistory = globalEnv.rawWindow.history
  initPureHistory(appName)
  function getMicroHistoryMethod(methodName: string): CallableFunction {
    return function (...rests: any[]): void {
      // TODO: 测试iframe的URL兼容isURL的情况
      rests[2] = isUndefined(rests[2]) || isNull(rests[2]) || ('' + rests[2] === '') ? microLocation.href : '' + rests[2]
      const targetLocation = createURL(rests[2], microLocation.href)
      const targetFullPath = targetLocation.pathname + targetLocation.search + targetLocation.hash
      if (!isRouterModePure(appName)) {
        navigateWithNativeEvent(
          appName,
          methodName,
          setMicroPathToURL(appName, targetLocation),
          true,
          setMicroState(appName, rests[0], targetLocation),
          rests[1],
        )
      } else {
        addToPureHistory(appName, targetFullPath, rests[0])
      }
      if (targetFullPath !== microLocation.fullPath) {
        updateMicroLocation(appName, targetFullPath, microLocation)
      }
      appInstanceMap.get(appName)?.sandBox.updateIframeBase?.()
    }
  }

  const originalHistory = {
    pushState: getMicroHistoryMethod('pushState'),
    replaceState: getMicroHistoryMethod('replaceState'),
  }

  if (isIframeSandbox(appName)) {
    return assign({
      go(delta?: number) {
        if (!isRouterModePure(appName)) {
          return rawHistory.go(delta)
        }
        const history = pureHistoryStack[appName]
        const targetIndex = history.currentIndex + (delta || 0)
        if (targetIndex === history.currentIndex) {
          return
        }
        const target = history.stack[targetIndex]
        history.currentIndex = targetIndex
        updateMicroLocation(
          appName,
          target.path,
          microLocation,
          'pure-history'
        )
        const app = appInstanceMap.get(appName)
        if (app?.sandBox) {
          // 最后触发事件
          dispatchPopStateEventToMicroApp(
            appName,
            app.sandBox.proxyWindow,
            app.sandBox.microAppWindow
          )
        }
      },
      back() {
        this.go(-1)
      },
      forward() {
        this.go(1)
      },
    }, originalHistory) as MicroHistory
  }

  return new Proxy(rawHistory, {
    get(target: History, key: PropertyKey): HistoryProxyValue {
      if (key === 'pushState' || key === 'replaceState') {
        return originalHistory[key]
      } else if (key === 'state') {
        return getMicroState(appName)
      }
      return bindFunctionToRawTarget<History, HistoryProxyValue>(Reflect.get(target, key), target, 'HISTORY')
    },
    set(target: History, key: PropertyKey, value: unknown): boolean {
      if (key === 'pushState' || key === 'replaceState') {
        originalHistory[key] = value as CallableFunction
      } else {
        Reflect.set(target, key, value)
      }
      /**
       * If the set() method returns false, and the assignment happened in strict-mode code, a TypeError will be thrown.
       * e.g. history.state = {}
       * TypeError: 'set' on proxy: trap returned false for property 'state'
       */
      return true
    }
  })
}

/**
 * navigate to new path base on native method of history
 * @param appName app.name
 * @param methodName pushState/replaceState
 * @param fullPath full path
 * @param state history.state, default is null
 * @param title history.title, default is ''
 */
export function nativeHistoryNavigate(
  appName: string,
  methodName: string,
  fullPath: string,
  state: unknown = null,
  title: unknown = '',
): void {
  if (isEffectiveApp(appName)) {
    const method = methodName === 'pushState' ? globalEnv.rawPushState : globalEnv.rawReplaceState
    method.call(globalEnv.rawWindow.history, state, title, fullPath)
  }
}

/**
 * Navigate to new path, and dispatch native popStateEvent/hashChangeEvent to browser
 * Use scenes:
 * 1. mount/unmount through attachRouteToBrowserURL with limited popstateEvent
 * 2. proxyHistory.pushState/replaceState with limited popstateEvent
 * 3. api microApp.router.push/replace
 * 4. proxyLocation.hash = xxx
 * NOTE:
 *  1. hidden keep-alive app can jump internally, but will not synchronize to browser
 * @param appName app.name
 * @param methodName pushState/replaceState
 * @param result result of add/remove microApp path on browser url
 * @param onlyForBrowser only dispatch event to browser
 * @param state history.state, not required
 * @param title history.title, not required
 */
export function navigateWithNativeEvent(
  appName: string,
  methodName: string,
  result: HandleMicroPathResult,
  onlyForBrowser: boolean,
  state?: unknown,
  title?: string,
): void {
  if (isEffectiveApp(appName)) {
    const rawLocation = globalEnv.rawWindow.location
    const oldFullPath = rawLocation.pathname + rawLocation.search + rawLocation.hash
    // oldHref use for hashChangeEvent of base app
    const oldHref = result.isAttach2Hash && oldFullPath !== result.fullPath ? rawLocation.href : null
    // navigate with native history method
    nativeHistoryNavigate(appName, methodName, result.fullPath, state, title)
    // just search mode will dispatch native event
    if (oldFullPath !== result.fullPath && isRouterModeSearch(appName)) {
      dispatchNativeEvent(appName, onlyForBrowser, oldHref)
    }
  }
}

/**
 * update browser url when mount/unmount/hidden/show/attachToURL/attachAllToURL
 * just attach microRoute info to browser, dispatch event to base app(exclude child)
 * @param appName app.name
 * @param result result of add/remove microApp path on browser url
 * @param state history.state
 */
export function attachRouteToBrowserURL(
  appName: string,
  result: HandleMicroPathResult,
  state: MicroState,
): void {
  navigateWithNativeEvent(appName, 'replaceState', result, true, state)
}

/**
 * When path is same, keep the __MICRO_APP_STATE__ in history.state
 * Fix bug of missing __MICRO_APP_STATE__ when base app is next.js or angular
 * @param method history.pushState/replaceState
 */
function reWriteHistoryMethod(method: History['pushState' | 'replaceState']): CallableFunction {
  const rawWindow = globalEnv.rawWindow
  return function (...rests: [data: any, unused: string, url?: string]): void {
    if (
      rawWindow.history.state?.__MICRO_APP_STATE__ &&
      (!isPlainObject(rests[0]) || !rests[0].__MICRO_APP_STATE__) &&
      (isString(rests[2]) || isURL(rests[2]))
    ) {
      const currentHref = rawWindow.location.href
      const targetLocation = createURL(rests[2], currentHref)
      if (targetLocation.href === currentHref) {
        rests[0] = assign({}, rests[0], {
          __MICRO_APP_STATE__: rawWindow.history.state.__MICRO_APP_STATE__,
        })
      }
    }

    method.apply(rawWindow.history, rests)
    /**
     * Attach child router info to browser url when base app navigate with pushState/replaceState
     * NOTE:
     *  1. Exec after apply pushState/replaceState
     *  2. Unable to catch when base app navigate with location
     *  3. When in nest app, rawPushState/rawReplaceState has been modified by parent
     */
    getActiveApps({
      excludeHiddenApp: true,
      excludePreRender: true,
    }).forEach(appName => {
      if ((isRouterModeSearch(appName) || isRouterModeState(appName)) && !getMicroPathFromURL(appName)) {
        const app = appInstanceMap.get(appName)!
        attachRouteToBrowserURL(
          appName,
          setMicroPathToURL(appName, app.sandBox.proxyWindow.location),
          setMicroState(appName, getMicroState(appName), app.sandBox.proxyWindow.location),
        )
      }

      if (isRouterModeCustom(appName) && !getMicroRouterInfoState(appName)) {
        nativeHistoryNavigate(
          appName,
          'replaceState',
          rawWindow.location.href,
          setMicroState(appName)
        )
      }

      // if (isRouterModeCustom(appName) || isRouterModeSearch(appName)) {
      /**
         * history.pushState/replaceState后主动触发子应用响应
         * 问题：子应用的卸载可能是异步的，而跳转的地址不一定在基础路径中，太快响应pushState可能会导致url地址被子应用改变或者子应用404，Promise太快卸载时出问题、setTimeout太慢keep-alive二次渲染后出问题
         *  1、history.pushState/replaceState执行后，子应用以异步的形式被主应用卸载，Promise响应时子应用还在，导致子应用跳转404后者浏览器url被子应用修改，产生异常
         *  2、keep-alive应用二次渲染时，由于setTimeout响应过慢，子应用在渲染后才接受到popstate事件，响应新的url，从而导致状态丢失
         *  3、同一个页面多个子应用，修改地址响应
         *  4、vue3跳转前会执行一次replace，有没有影响？
         */

      // }
    })

    // fix bug for nest app
    removeDomScope()
  }
}

/**
 * rewrite history.pushState/replaceState
 * used to fix the problem that the __MICRO_APP_STATE__ maybe missing when mainApp navigate to same path
 * e.g: when nextjs, angular receive popstate event, they will use history.replaceState to update browser url with a new state object
 */
export function patchHistory(): void {
  const rawWindow = globalEnv.rawWindow
  rawWindow.history.pushState = reWriteHistoryMethod(
    globalEnv.rawPushState,
  )
  rawWindow.history.replaceState = reWriteHistoryMethod(
    globalEnv.rawReplaceState,
  )
}

export function releasePatchHistory(): void {
  const rawWindow = globalEnv.rawWindow
  rawWindow.history.pushState = globalEnv.rawPushState
  rawWindow.history.replaceState = globalEnv.rawReplaceState
}
