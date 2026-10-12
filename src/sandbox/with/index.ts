import type {
  Func,
  microAppWindowType,
  WithSandBoxInterface,
  plugins,
  MicroLocation,
  SandBoxStartParams,
  SandBoxStopParams,
  CommonEffectHook,
  releaseGlobalEffectParams,
} from '@micro-app/types'
import globalEnv from '../../libs/global_env'
import microApp from '../../micro_app'
import {
  EventCenterForMicroApp,
  rebuildDataCenterSnapshot,
  recordDataCenterSnapshot,
  resetDataCenterSnapshot,
} from '../../interact'
import {
  initEnvOfNestedApp,
} from '../../libs/nest_app'
import {
  GLOBAL_KEY_TO_WINDOW
} from '../../constants'
import {
  getEffectivePath,
  isArray,
  isPlainObject,
  removeDomScope,
  throttleDeferForSetAppName,
  rawDefineProperty,
  rawDefineProperties,
  rawHasOwnProperty,
  pureCreateElement,
  assign,
  isFunction,
} from '../../libs/utils'
import {
  patchDocument,
} from './document'
import {
  patchWindow,
} from './window'
import {
  patchElementAndDocument,
  releasePatchElementAndDocument,
} from '../../source/patch'
import {
  router,
  createMicroRouter,
  initRouteStateWithURL,
  clearRouteStateFromURL,
  addHistoryListener,
  removePathFromBrowser,
  updateBrowserURLWithLocation,
  patchHistory,
  releasePatchHistory,
  isRouterModeCustom,
} from '../router'
import {
  BaseSandbox,
  CustomWindow,
  fixBabelPolyfill6,
  patchElementTree,
} from '../adapter'
import {
  createMicroFetch,
  useMicroEventSource,
  createMicroXMLHttpRequest,
} from '../request'
import { releaseWorkersByApp } from '../../proxies/worker'

// TODO: 放到global.d.ts
export type MicroAppWindowDataType = {
  __MICRO_APP_ENVIRONMENT__: boolean,
  __MICRO_APP_NAME__: string,
  __MICRO_APP_URL__: string,
  __MICRO_APP_PUBLIC_PATH__: string,
  __MICRO_APP_BASE_URL__: string,
  __MICRO_APP_BASE_ROUTE__: string,
  __MICRO_APP_UMD_MODE__: boolean,
  __MICRO_APP_PRE_RENDER__: boolean
  __MICRO_APP_STATE__: string
  microApp: EventCenterForMicroApp,
  rawWindow: Window,
  rawDocument: Document,
  removeDomScope: () => void,
}

export type MicroAppWindowType = Window & MicroAppWindowDataType
export type proxyWindow = WindowProxy & MicroAppWindowDataType

const { createMicroEventSource, clearMicroEventSource } = useMicroEventSource()

export default class WithSandBox extends BaseSandbox implements WithSandBoxInterface {
  static activeCount = 0 // number of active sandbox
  private active = false
  private windowEffect!: CommonEffectHook
  private documentEffect!: CommonEffectHook
  private removeHistoryListener!: CallableFunction
  public proxyWindow!: proxyWindow // Proxy
  public microAppWindow = new CustomWindow() as MicroAppWindowType // Proxy target

  constructor (appName: string, url: string) {
    super(appName, url)
    this.patchWith((resolve: CallableFunction) => {
      // get scopeProperties and escapeProperties from plugins
      this.getSpecialProperties(appName)
      // create location, history for child app
      this.patchRouter(appName, url, this.microAppWindow)
      // patch window of child app
      this.windowEffect = patchWindow(appName, this.microAppWindow, this)
      // patch document of child app
      this.documentEffect = patchDocument(appName, this.microAppWindow, this)
      // properties associated with the native window
      this.setMappingPropertiesWithRawDescriptor(this.microAppWindow)
      // inject global properties
      this.initStaticGlobalKeys(appName, url, this.microAppWindow)
      resolve()
    })
  }

  /**
   * open sandbox and perform some initial actions
   * @param umdMode is umd mode
   * @param baseroute base route for child
   * @param defaultPage default page when mount child base on virtual router
   * @param disablePatchRequest prevent patchRequestApi
   */
  public start ({
    umdMode,
    baseroute,
    defaultPage,
    disablePatchRequest,
  }: SandBoxStartParams): void {
    if (this.active) return
    this.active = true

    /* --- memory router part --- start */
    // update microLocation, attach route info to browser url
    this.initRouteState(defaultPage)

    // unique listener of popstate event for sub app
    this.removeHistoryListener = addHistoryListener(
      this.microAppWindow.__MICRO_APP_NAME__,
    )

    if (isRouterModeCustom(this.microAppWindow.__MICRO_APP_NAME__)) {
      this.microAppWindow.__MICRO_APP_BASE_ROUTE__ = this.microAppWindow.__MICRO_APP_BASE_URL__ = baseroute
    }
    /* --- memory router part --- end */

    /**
     * Target: Ensure default mode action exactly same to first time when render again
     * 1. The following globalKey maybe modified when render, reset them when render again in default mode
     * 2. Umd mode will not delete any keys during sandBox.stop, ignore umd mode
     * 3. When sandbox.start called for the first time, it must be the default mode
     */
    if (!umdMode) {
      this.initGlobalKeysWhenStart(
        this.microAppWindow.__MICRO_APP_NAME__,
        this.microAppWindow.__MICRO_APP_URL__,
        this.microAppWindow,
        disablePatchRequest,
      )
    }

    if (++globalEnv.activeSandbox === 1) {
      patchElementAndDocument()
      patchHistory()
    }

    if (++WithSandBox.activeCount === 1) {
      // effectDocumentEvent()
      initEnvOfNestedApp()
    }

    fixBabelPolyfill6()
  }

  /**
   * close sandbox and perform some clean up actions
   * @param umdMode is umd mode
   * @param keepRouteState prevent reset route
   * @param destroy completely destroy, delete cache resources
   * @param clearData clear data from base app
   */
  public stop ({
    umdMode,
    keepRouteState,
    destroy,
    clearData,
  }: SandBoxStopParams): void {
    if (!this.active) return
    this.recordAndReleaseEffect({ umdMode, clearData, destroy }, !umdMode || destroy)

    /* --- memory router part --- start */
    // rest url and state of browser
    this.clearRouteState(keepRouteState)

    // release listener of popstate for child app
    this.removeHistoryListener?.()
    /* --- memory router part --- end */

    /**
     * NOTE:
     *  1. injectedKeys and escapeKeys must be placed at the back
     *  2. if key in initial microAppWindow, and then rewrite, this key will be delete from microAppWindow when stop, and lost when restart
     *  3. umd mode will not delete global keys
     *  4. mount & unmount hook should delete in default mode when stop
     */
    if (!umdMode || destroy) {
      clearMicroEventSource(this.microAppWindow.__MICRO_APP_NAME__)
      releaseWorkersByApp(this.microAppWindow.__MICRO_APP_NAME__)

      this.injectedKeys.forEach((key: PropertyKey) => {
        Reflect.deleteProperty(this.microAppWindow, key)
      })
      this.injectedKeys.clear()

      this.escapeKeys.forEach((key: PropertyKey) => {
        Reflect.deleteProperty(globalEnv.rawWindow, key)
      })
      this.escapeKeys.clear()

      this.clearHijackUmdHooks()
    }

    if (--globalEnv.activeSandbox === 0) {
      releasePatchElementAndDocument()
      releasePatchHistory()
    }

    if (--WithSandBox.activeCount === 0) {
      // releaseEffectDocumentEvent()
    }

    this.active = false
  }

  /**
   * inject global properties to microAppWindow
   * TODO: 设置为只读变量
   * @param appName app name
   * @param url app url
   * @param microAppWindow micro window
   */
  private initStaticGlobalKeys (
    appName: string,
    url: string,
    microAppWindow: microAppWindowType,
  ): void {
    microAppWindow.__MICRO_APP_ENVIRONMENT__ = true
    microAppWindow.__MICRO_APP_NAME__ = appName
    microAppWindow.__MICRO_APP_URL__ = url
    microAppWindow.__MICRO_APP_PUBLIC_PATH__ = getEffectivePath(url)
    microAppWindow.__MICRO_APP_BASE_ROUTE__ = ''
    microAppWindow.__MICRO_APP_WINDOW__ = microAppWindow
    microAppWindow.__MICRO_APP_PRE_RENDER__ = false
    microAppWindow.__MICRO_APP_UMD_MODE__ = false
    microAppWindow.__MICRO_APP_PROXY_WINDOW__ = this.proxyWindow
    microAppWindow.__MICRO_APP_SANDBOX__ = this
    microAppWindow.__MICRO_APP_SANDBOX_TYPE__ = 'with'
    microAppWindow.rawWindow = globalEnv.rawWindow
    microAppWindow.rawDocument = globalEnv.rawDocument
    microAppWindow.microApp = assign(new EventCenterForMicroApp(appName), {
      removeDomScope,
      pureCreateElement,
      location: microAppWindow.location,
      router,
    })
  }

  /**
   * Record global effect and then release (effect: global event, timeout, data listener)
   * Scenes:
   * 1. unmount of default/umd app
   * 2. hidden keep-alive app
   * 3. after init prerender app
   * @param options {
   *  @param clearData clear data from base app
   *  @param isPrerender is prerender app
   *  @param keepAlive is keep-alive app
   * }
   * @param preventRecord prevent record effect events
   */
  public recordAndReleaseEffect (
    options: releaseGlobalEffectParams,
    preventRecord = false,
  ): void {
    if (preventRecord) {
      this.resetEffectSnapshot()
    } else {
      this.recordEffectSnapshot()
    }
    this.releaseGlobalEffect(options)
  }

  /**
   * reset effect snapshot data in default mode or destroy
   * Scenes:
   *  1. unmount hidden keep-alive app manually
   *  2. unmount prerender app manually
   */
  public resetEffectSnapshot (): void {
    this.windowEffect.reset()
    this.documentEffect.reset()
    resetDataCenterSnapshot(this.microAppWindow.microApp)
  }

  /**
   * record umd snapshot before the first execution of umdHookMount
   * Scenes:
   * 1. exec umdMountHook in umd mode
   * 2. hidden keep-alive app
   * 3. after init prerender app
   */
  public recordEffectSnapshot (): void {
    this.windowEffect.record()
    this.documentEffect.record()
    recordDataCenterSnapshot(this.microAppWindow.microApp)
  }

  // rebuild umd snapshot before remount umd app
  public rebuildEffectSnapshot (): void {
    this.windowEffect.rebuild()
    this.documentEffect.rebuild()
    rebuildDataCenterSnapshot(this.microAppWindow.microApp)
  }

  /**
   * clear global event, timeout, data listener
   * Scenes:
   * 1. unmount of default/umd app
   * 2. hidden keep-alive app
   * 3. after init prerender app
   * @param umdMode is umd mode
   * @param clearData clear data from base app
   * @param isPrerender is prerender app
   * @param keepAlive is keep-alive app
   * @param destroy completely destroy
   */
  public releaseGlobalEffect ({
    umdMode = false,
    clearData = false,
    isPrerender = false,
    keepAlive = false,
    destroy = false,
  }: releaseGlobalEffectParams): void {
    // default mode(not keep-alive or isPrerender)
    this.windowEffect.release((!umdMode && !keepAlive && !isPrerender) || destroy)
    this.documentEffect.release()
    this.microAppWindow.microApp?.clearDataListener()
    this.microAppWindow.microApp?.clearGlobalDataListener()
    if (clearData) {
      microApp.clearData(this.microAppWindow.__MICRO_APP_NAME__)
      this.microAppWindow.microApp?.clearData()
    }
  }

  /**
   * get scopeProperties and escapeProperties from plugins & adapter
   * @param appName app name
   */
  private getSpecialProperties (appName: string): void {
    if (isPlainObject(microApp.options.plugins)) {
      this.commonActionForSpecialProperties(microApp.options.plugins.global)
      this.commonActionForSpecialProperties(microApp.options.plugins.modules?.[appName])
    }
  }

  // common action for global plugins and module plugins
  private commonActionForSpecialProperties (plugins: plugins['global']) {
    if (isArray(plugins)) {
      for (const plugin of plugins) {
        if (isPlainObject(plugin)) {
          if (isArray(plugin.scopeProperties)) {
            this.scopeProperties = this.scopeProperties.concat(plugin.scopeProperties)
          }
          if (isArray(plugin.escapeProperties)) {
            this.escapeProperties = this.escapeProperties.concat(plugin.escapeProperties)
          }
        }
      }
    }
  }

  // set __MICRO_APP_PRE_RENDER__ state
  public setPreRenderState (state: boolean): void {
    this.microAppWindow.__MICRO_APP_PRE_RENDER__ = state
  }

  public markUmdMode (state: boolean): void {
    this.microAppWindow.__MICRO_APP_UMD_MODE__ = state
  }

  private patchWith (cb: CallableFunction): void {
    this.sandboxReady = new Promise<void>((resolve) => cb(resolve))
  }

  // properties associated with the native window
  private setMappingPropertiesWithRawDescriptor (microAppWindow: microAppWindowType): void {
    let topValue: Window, parentValue: Window
    const rawWindow = globalEnv.rawWindow
    if (rawWindow === rawWindow.parent) { // not in iframe
      topValue = parentValue = this.proxyWindow
    } else { // in iframe
      topValue = rawWindow.top
      parentValue = rawWindow.parent
    }

    rawDefineProperties(microAppWindow, {
      top: this.createDescriptorForMicroAppWindow('top', topValue),
      parent: this.createDescriptorForMicroAppWindow('parent', parentValue),
    })

    GLOBAL_KEY_TO_WINDOW.forEach((key: PropertyKey) => {
      rawDefineProperty(
        microAppWindow,
        key,
        this.createDescriptorForMicroAppWindow(key, this.proxyWindow)
      )
    })
  }

  private createDescriptorForMicroAppWindow (key: PropertyKey, value: unknown): PropertyDescriptor {
    const { configurable = true, enumerable = true, writable, set } = Object.getOwnPropertyDescriptor(globalEnv.rawWindow, key) || { writable: true }
    const descriptor: PropertyDescriptor = {
      value,
      configurable,
      enumerable,
      writable: writable ?? !!set
    }

    return descriptor
  }

  /**
   * init global properties of microAppWindow when exec sandBox.start
   * @param microAppWindow micro window
   * @param appName app name
   * @param url app url
   * @param disablePatchRequest prevent rewrite request method of child app
   */
  private initGlobalKeysWhenStart (
    appName: string,
    url: string,
    microAppWindow: microAppWindowType,
    disablePatchRequest: boolean,
  ): void {
    microAppWindow.hasOwnProperty = (key: PropertyKey) => rawHasOwnProperty.call(microAppWindow, key) || rawHasOwnProperty.call(globalEnv.rawWindow, key)
    this.setHijackProperty(appName, microAppWindow)
    if (!disablePatchRequest) this.patchRequestApi(appName, url, microAppWindow)
    this.setScopeProperties(microAppWindow)
  }

  // set hijack Properties to microAppWindow
  private setHijackProperty (appName: string, microAppWindow: microAppWindowType): void {
    let modifiedEval: unknown, modifiedImage: unknown
    rawDefineProperties(microAppWindow, {
      eval: {
        configurable: true,
        enumerable: false,
        get () {
          throttleDeferForSetAppName(appName)
          return modifiedEval || globalEnv.rawWindow.eval
        },
        set: (value) => {
          modifiedEval = value
        },
      },
      Image: {
        configurable: true,
        enumerable: false,
        get () {
          throttleDeferForSetAppName(appName)
          return modifiedImage || globalEnv.ImageProxy
        },
        set: (value) => {
          modifiedImage = value
        },
      },
    })
  }

  // rewrite fetch, XMLHttpRequest, EventSource
  private patchRequestApi (appName: string, url: string, microAppWindow: microAppWindowType): void {
    let microFetch = createMicroFetch(url)
    let microXMLHttpRequest = createMicroXMLHttpRequest(url)
    let microEventSource = createMicroEventSource(appName, url)

    rawDefineProperties(microAppWindow, {
      fetch: {
        configurable: true,
        enumerable: true,
        get () {
          return microFetch
        },
        set (value) {
          microFetch = createMicroFetch(url, value)
        },
      },
      XMLHttpRequest: {
        configurable: true,
        enumerable: true,
        get () {
          return microXMLHttpRequest
        },
        set (value) {
          microXMLHttpRequest = createMicroXMLHttpRequest(url, value)
        },
      },
      EventSource: {
        configurable: true,
        enumerable: true,
        get () {
          return microEventSource
        },
        set (value) {
          microEventSource = createMicroEventSource(appName, url, value)
        },
      },
    })
  }

  /**
   * Init scope keys to microAppWindow, prevent fall to rawWindow from with(microAppWindow)
   * like: if (!xxx) {}
   * NOTE:
   * 1. Symbol.unscopables cannot affect undefined keys
   * 2. Doesn't use for window.xxx because it fall to proxyWindow
   */
  setScopeProperties (microAppWindow: microAppWindowType): void {
    this.scopeProperties.forEach((key: PropertyKey) => {
      Reflect.set(microAppWindow, key, microAppWindow[key])
    })
  }

  // set location & history for memory router
  private patchRouter (appName: string, url: string, microAppWindow: microAppWindowType): void {
    const { microLocation, microHistory } = createMicroRouter(appName, url)
    rawDefineProperties(microAppWindow, {
      location: {
        configurable: false,
        enumerable: true,
        get () {
          return microLocation
        },
        set: (value) => {
          globalEnv.rawWindow.location = value
        },
      },
      history: {
        configurable: true,
        enumerable: true,
        get () {
          return microHistory
        },
      },
    })
  }

  private initRouteState (defaultPage: string): void {
    initRouteStateWithURL(
      this.microAppWindow.__MICRO_APP_NAME__,
      this.microAppWindow.location as MicroLocation,
      defaultPage,
    )
  }

  private clearRouteState (keepRouteState: boolean): void {
    clearRouteStateFromURL(
      this.microAppWindow.__MICRO_APP_NAME__,
      this.microAppWindow.__MICRO_APP_URL__,
      this.microAppWindow.location as MicroLocation,
      keepRouteState,
    )
  }

  public setRouteInfoForKeepAliveApp (): void {
    updateBrowserURLWithLocation(
      this.microAppWindow.__MICRO_APP_NAME__,
      this.microAppWindow.location as MicroLocation,
    )
  }

  public removeRouteInfoForKeepAliveApp (): void {
    removePathFromBrowser(this.microAppWindow.__MICRO_APP_NAME__)
  }

  /**
   * Format all html elements when init
   * @param container micro app container
   */
  public patchStaticElement (container: Element | ShadowRoot): void {
    patchElementTree(container, this.microAppWindow.__MICRO_APP_NAME__)
  }

  /**
   * action before exec scripts when mount
   * Actions:
   * 1. patch static elements from html
   * 2. hijack umd hooks -- mount, unmount, micro-app-appName
   * @param container micro app container
   */
  public actionsBeforeExecScripts (container: Element | ShadowRoot, handleUmdHooks: Func): void {
    this.patchStaticElement(container)
    this.clearHijackUmdHooks = this.hijackUmdHooks(this.appName, this.microAppWindow, handleUmdHooks)
  }

  // hijack mount, unmount, micro-app-appName hook to microAppWindow
  private hijackUmdHooks (
    appName: string,
    microAppWindow: microAppWindowType,
    handleUmdHooks: Func,
  ): () => void {
    let mount: Func | null, unmount: Func | null, microAppLibrary: Record<string, unknown> | null
    rawDefineProperties(microAppWindow, {
      mount: {
        configurable: true,
        get: () => mount,
        set: (value) => {
          if (this.active && isFunction(value) && !mount) {
            handleUmdHooks(mount = value, unmount)
          }
        }
      },
      unmount: {
        configurable: true,
        get: () => unmount,
        set: (value) => {
          if (this.active && isFunction(value) && !unmount) {
            handleUmdHooks(mount, unmount = value)
          }
        }
      },
      [`micro-app-${appName}`]: {
        configurable: true,
        get: () => microAppLibrary,
        set: (value) => {
          if (this.active && isPlainObject(value) && !microAppLibrary) {
            microAppLibrary = value
            handleUmdHooks(microAppLibrary.mount, microAppLibrary.unmount)
          }
        }
      }
    })

    return () => {
      mount = unmount = microAppLibrary = null
    }
  }

  public setStaticAppState (state: string): void {
    this.microAppWindow.__MICRO_APP_STATE__ = state
  }
}
