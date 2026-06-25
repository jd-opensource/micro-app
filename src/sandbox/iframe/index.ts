import type {
  Func,
  microAppWindowType,
  MicroLocation,
  SandBoxStartParams,
  CommonEffectHook,
  SandBoxStopParams,
  releaseGlobalEffectParams,
  plugins,
} from '@micro-app/types'
import globalEnv from '../../libs/global_env'
import microApp from '../../micro_app'
import {
  getEffectivePath,
  removeDomScope,
  pureCreateElement,
  assign,
  clearDOM,
  isPlainObject,
  isArray,
  defer,
  createURL,
  rawDefineProperties,
  isFunction,
} from '../../libs/utils'
import {
  EventCenterForMicroApp,
  rebuildDataCenterSnapshot,
  recordDataCenterSnapshot,
  resetDataCenterSnapshot,
} from '../../interact'
import {
  patchRouter,
} from './router'
import {
  router,
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
  patchElementAndDocument,
  releasePatchElementAndDocument,
} from '../../source/patch'
import {
  patchWindow,
} from './window'
import {
  patchDocument,
} from './document'
import {
  patchElement,
} from './element'
import {
  patchElementTree
} from '../adapter'
import { releaseWorkersByApp } from '../../proxies/worker'

interface IOption {
  container: HTMLElement | ShadowRoot | null,
  [key: string]: any
}

export default class IframeSandbox {
  static activeCount = 0 // number of active sandbox
  private active = false
  private windowEffect!: CommonEffectHook
  private documentEffect!: CommonEffectHook
  private removeHistoryListener!: CallableFunction
  // Properties that can be escape to rawWindow
  public escapeProperties: PropertyKey[] = []
  public deleteIframeElement: () => void
  public iframe!: HTMLIFrameElement | null
  // Promise used to mark whether the sandbox is initialized
  public sandboxReady!: Promise<void>
  public proxyWindow: WindowProxy & microAppWindowType
  public microAppWindow: microAppWindowType
  public proxyLocation!: MicroLocation
  public baseElement!: HTMLBaseElement
  public microHead!: HTMLHeadElement
  public microBody!: HTMLBodyElement
  // TODO: 放到 super中定义，super(appName, url)，with沙箱也需要简化
  public appName: string
  public url: string
  public options: IOption
  // reset mount, unmount when stop in default mode
  public clearHijackUmdHooks!: () => void

  constructor (appName: string, url: string, options: IOption) {
    this.appName = appName
    this.url = url
    this.options = options
    const rawLocation = globalEnv.rawWindow.location
    const browserHost = rawLocation.protocol + '//' + rawLocation.host

    this.deleteIframeElement = this.createIframeElement(appName, browserHost + rawLocation.pathname, options)
    this.microAppWindow = this.iframe!.contentWindow

    this.patchIframe(this.microAppWindow, (resolve: CallableFunction) => {
      // refresh
      this.microAppWindow = this.iframe!.contentWindow
      // create new html to iframe
      this.createIframeTemplate(this.microAppWindow)
      // get escapeProperties from plugins
      this.getSpecialProperties(appName)
      // patch location & history of child app
      this.proxyLocation = patchRouter(appName, url, this.microAppWindow, browserHost)
      // patch window of child app
      this.windowEffect = patchWindow(appName, this.microAppWindow, this)
      // patch document of child app
      this.documentEffect = patchDocument(appName, this.microAppWindow, this)
      // patch Node & Element of child app
      patchElement(appName, url, this.microAppWindow, this)
      /**
       * create static properties
       * NOTE:
       *  1. execute as early as possible
       *  2. run after patchRouter & createProxyWindow
       */
      this.initStaticGlobalKeys(appName, url, this.microAppWindow)
      resolve()
    })
  }

  /**
   * create iframe for sandbox
   * @param appName app name
   * @param browserPath browser origin
   * @returns release callback
   */
  createIframeElement (
    appName: string,
    browserPath: string,
    options?: Record<string, any>
  ): () => void {
    this.iframe = pureCreateElement('iframe')

    const iframeAttrs: Record<string, string> = {
      ...options?.attrs,
      id: appName,
      src: microApp.options.iframeSrc || browserPath,
      style: 'display: none',
      'powered-by': 'micro-app',
    }

    Object.keys(iframeAttrs).forEach((key) => this.iframe!.setAttribute(key, iframeAttrs[key]))

    // effect action during construct
    globalEnv.rawDocument.body.appendChild(this.iframe)

    /**
     * If dom operated async when unmount, premature deletion of iframe will cause unexpected problems
     * e.g.
     *  1. antd: notification.destroy()
     * WARNING:
     *  If async operation time is too long, defer cannot avoid the problem
     * TODO: more test
     */
    return () => defer(() => {
      // default mode or destroy, iframe will be deleted when unmount
      this.iframe?.parentNode?.removeChild(this.iframe)
      this.iframe = null
    })
  }

  public start ({
    baseroute,
    defaultPage,
    disablePatchRequest,
  }: SandBoxStartParams): void {
    if (this.active) return
    this.active = true
    /* --- memory router part --- start */
    /**
     * Sync router info to iframe when exec sandbox.start with disable or enable memory-router
     * e.g.:
     *  vue-router@4.x get target path by remove the base section from rawLocation.pathname
     *  code: window.location.pathname.slice(base.length) || '/'; (base is baseroute)
     * NOTE:
     *  1. iframe router and browser router are separated, we should update iframe router manually
     *  2. withSandbox location is browser location when disable memory-router, so no need to do anything
     */
    this.initRouteState(defaultPage)

    // unique listener of popstate event for child app
    this.removeHistoryListener = addHistoryListener(
      this.microAppWindow.__MICRO_APP_NAME__,
    )

    if (isRouterModeCustom(this.microAppWindow.__MICRO_APP_NAME__)) {
      this.microAppWindow.__MICRO_APP_BASE_ROUTE__ = this.microAppWindow.__MICRO_APP_BASE_URL__ = baseroute
    }
    /* --- memory router part --- end */

    /**
     * create base element to iframe
     * WARNING: This will also affect a, image, link and script
     */
    if (!disablePatchRequest) {
      this.createIframeBase()
    }

    if (++globalEnv.activeSandbox === 1) {
      patchElementAndDocument()
      patchHistory()
    }

    if (++IframeSandbox.activeCount === 1) {
      // TODO: 多层嵌套兼容
    }
  }

  public stop ({
    umdMode,
    keepRouteState,
    destroy,
    clearData,
  }: SandBoxStopParams): void {
    // sandbox.stop may exec before sandbox.start, e.g: iframe sandbox + default mode + remount
    if (!this.active) return

    this.recordAndReleaseEffect({ clearData }, !umdMode || destroy)

    /* --- memory router part --- start */
    // if keep-route-state is true, preserve microLocation state
    this.clearRouteState(keepRouteState)

    // release listener of popstate for child app
    this.removeHistoryListener?.()
    /* --- memory router part --- end */

    if (!umdMode || destroy) {
      this.deleteIframeElement()
      this.clearHijackUmdHooks()
      releaseWorkersByApp(this.microAppWindow.__MICRO_APP_NAME__)
    }

    if (--globalEnv.activeSandbox === 0) {
      releasePatchElementAndDocument()
      releasePatchHistory()
    }

    if (--IframeSandbox.activeCount === 0) {
      // TODO: Is there anything to do?
    }

    this.active = false
  }

  /**
   * create static properties
   * NOTE:
   *  1. execute as early as possible
   *  2. run after patchRouter & createProxyWindow
   * TODO: 设置为只读变量
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
    microAppWindow.__MICRO_APP_SANDBOX_TYPE__ = 'iframe'
    microAppWindow.rawWindow = globalEnv.rawWindow
    microAppWindow.rawDocument = globalEnv.rawDocument
    microAppWindow.microApp = assign(new EventCenterForMicroApp(appName), {
      removeDomScope,
      pureCreateElement,
      location: this.proxyLocation,
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
   * @param preventRecord prevent record effect events (default or destroy)
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
    this.windowEffect?.reset()
    this.documentEffect?.reset()
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
    this.windowEffect?.record()
    this.documentEffect?.record()
    recordDataCenterSnapshot(this.microAppWindow.microApp)
  }

  // rebuild umd snapshot before remount umd app
  public rebuildEffectSnapshot (): void {
    this.windowEffect?.rebuild()
    this.documentEffect?.rebuild()
    rebuildDataCenterSnapshot(this.microAppWindow.microApp)
  }

  /**
   * clear global event, timeout, data listener
   * Scenes:
   * 1. unmount of normal/umd app
   * 2. hidden keep-alive app
   * 3. after init prerender app
   * @param clearData clear data from base app
   * @param isPrerender is prerender app
   * @param keepAlive is keep-alive app
   */
  public releaseGlobalEffect ({ clearData = false }: releaseGlobalEffectParams): void {
    this.windowEffect?.release()
    this.documentEffect?.release()
    this.microAppWindow.microApp?.clearDataListener()
    this.microAppWindow.microApp?.clearGlobalDataListener()
    if (clearData) {
      microApp.clearData(this.microAppWindow.__MICRO_APP_NAME__)
      this.microAppWindow.microApp?.clearData()
    }
  }

  // set __MICRO_APP_PRE_RENDER__ state
  public setPreRenderState (state: boolean): void {
    this.microAppWindow.__MICRO_APP_PRE_RENDER__ = state
  }

  // record umdMode
  public markUmdMode (state: boolean): void {
    this.microAppWindow.__MICRO_APP_UMD_MODE__ = state
  }

  // TODO: RESTRUCTURE
  private patchIframe (microAppWindow: microAppWindowType, cb: CallableFunction): void {
    const oldMicroDocument = microAppWindow.document
    this.sandboxReady = new Promise<void>((resolve) => {
      (function iframeLocationReady () {
        setTimeout(() => {
          try {
            /**
             * NOTE:
             *  1. In browser, iframe document will be recreated after iframe initial
             *  2. In jest, iframe document is always the same
             */
            if (microAppWindow.document === oldMicroDocument && !__TEST__) {
              iframeLocationReady()
            } else {
              /**
               * NOTE:
               *  1. microAppWindow will not be recreated
               *  2. the properties of microAppWindow may be recreated, such as document
               *  3. the variables added to microAppWindow may be cleared
               */
              microAppWindow.stop()
              cb(resolve)
            }
          } catch (e) {
            iframeLocationReady()
          }
        }, 0)
      })()
    })
  }

  // TODO: RESTRUCTURE
  private createIframeTemplate (microAppWindow: microAppWindowType): void {
    const microDocument = microAppWindow.document
    clearDOM(microDocument)
    const html = microDocument.createElement('html')
    html.innerHTML = '<head></head><body></body>'
    microDocument.appendChild(html)

    // 记录iframe原生body
    this.microBody = microDocument.body
    this.microHead = microDocument.head
  }

  /**
   * baseElement will complete the relative address of element according to the URL
   * e.g: a image link script fetch ajax EventSource
   */
  private createIframeBase (): void {
    this.baseElement = pureCreateElement('base')
    this.updateIframeBase()
    this.microHead.appendChild(this.baseElement)
  }

  // Update the base.href when initial and each redirect
  public updateIframeBase = (): void => {
    // origin must be child app origin
    this.baseElement?.setAttribute('href', createURL(this.url).origin + this.proxyLocation.pathname)
  }

  /**
   * get escapeProperties from plugins & adapter
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
          if (isArray(plugin.escapeProperties)) {
            this.escapeProperties = this.escapeProperties.concat(plugin.escapeProperties)
          }
        }
      }
    }
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
