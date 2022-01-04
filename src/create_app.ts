import type {
  AppInterface,
  sourceType,
  SandBoxInterface,
  sourceLinkInfo,
  sourceScriptInfo,
  Func,
} from '@micro-app/types'
import extractHtml from './source'
import { execScripts } from './source/scripts'
import { appStates, lifeCycles, keepAliveStates } from './constants'
import SandBox from './sandbox'
import {
  isFunction,
  cloneContainer,
  isBoolean,
  isPromise,
  logError,
  logWarn,
  getRootContainer,
  formatAppName,
} from './libs/utils'
import dispatchLifecyclesEvent, { dispatchCustomEventToMicroApp } from './interact/lifecycles_event'
import globalEnv from './libs/global_env'

// micro app instances
export const appInstanceMap = new Map<string, AppInterface>()

// params of CreateApp
export interface CreateAppParam {
  name: string
  url: string
  ssrUrl?: string
  scopecss: boolean
  useSandbox: boolean
  macro?: boolean
  inline?: boolean
  baseroute?: string
  container?: HTMLElement | ShadowRoot
  suffix?: string
}

export default class CreateApp implements AppInterface {
  private state: string = appStates.NOT_LOADED
  private keepAliveState: string | null = null
  private keepAliveContainer: HTMLElement | null = null
  private loadSourceLevel: -1|0|1|2 = 0
  private umdHookMount: Func | null = null
  private umdHookUnmount: Func | null = null
  private libraryName: string | null = null
  umdMode = false
  isPrefetch = false
  name: string
  url: string
  ssrUrl: string
  container: HTMLElement | ShadowRoot | null = null
  inline: boolean
  scopecss: boolean
  useSandbox: boolean
  macro = false
  baseroute = ''
  source: sourceType
  sandBox: SandBoxInterface | null = null
  suffix = ''

  constructor ({
    name,
    url,
    ssrUrl,
    container,
    inline,
    scopecss,
    useSandbox,
    macro,
    baseroute,
    suffix,
  }: CreateAppParam) {
    this.container = container ?? null
    this.inline = inline ?? false
    this.baseroute = baseroute ?? ''
    this.ssrUrl = ssrUrl ?? ''
    // optional during init👆
    this.name = name
    this.url = url
    this.useSandbox = useSandbox
    this.scopecss = this.useSandbox && scopecss
    this.macro = macro ?? false
    this.source = {
      links: new Map<string, sourceLinkInfo>(),
      scripts: new Map<string, sourceScriptInfo>(),
    }
    this.suffix = suffix || ''
    this.loadSourceCode()
    this.useSandbox && (this.sandBox = new SandBox(name, url, this.macro))
  }

  // Load resources
  loadSourceCode (): void {
    this.state = appStates.LOADING_SOURCE_CODE
    extractHtml(this)
  }

  /**
   * When resource is loaded, mount app if it is not prefetch or unmount
   */
  onLoad (html: HTMLElement): void {
    if (++this.loadSourceLevel === 2) {
      this.source.html = html

      if (this.isPrefetch || appStates.UNMOUNT === this.state) return

      this.state = appStates.LOAD_SOURCE_FINISHED

      this.mount()
    }
  }

  /**
   * Error loading HTML
   * @param e Error
   */
  onLoadError (e: Error): void {
    this.loadSourceLevel = -1
    if (appStates.UNMOUNT !== this.state) {
      this.onerror(e)
      this.state = appStates.LOAD_SOURCE_ERROR
    }
  }

  /**
   * mount app
   * @param container app container
   * @param inline js runs in inline mode
   * @param baseroute route prefix, default is ''
   */
  mount (
    container?: HTMLElement | ShadowRoot,
    inline?: boolean,
    baseroute?: string,
  ): void {
    if (isBoolean(inline) && inline !== this.inline) {
      this.inline = inline
    }

    this.container = this.container ?? container!
    this.baseroute = baseroute ?? this.baseroute

    if (this.loadSourceLevel !== 2) {
      this.state = appStates.LOADING_SOURCE_CODE
      return
    }

    dispatchLifecyclesEvent(
      this.container,
      this.name,
      lifeCycles.BEFOREMOUNT,
    )

    this.state = appStates.MOUNTING

    cloneContainer(this.source.html as Element, this.container as Element, !this.umdMode)

    this.sandBox?.start(this.baseroute)

    let umdHookMountResult: any // result of mount function

    if (!this.umdMode) {
      let hasDispatchMountedEvent = false
      // if all js are executed, param isFinished will be true
      execScripts(this.source.scripts, this, (isFinished: boolean) => {
        if (!this.umdMode) {
          const { mount, unmount } = this.getUmdLibraryHooks()
          // if mount & unmount is function, the sub app is umd mode
          if (isFunction(mount) && isFunction(unmount)) {
            this.umdHookMount = mount as Func
            this.umdHookUnmount = unmount as Func
            this.umdMode = true
            this.sandBox?.recordUmdSnapshot()
            try {
              umdHookMountResult = this.umdHookMount()
            } catch (e) {
              logError('an error occurred in the mount function \n', this.name, e)
            }
          }
        }

        if (!hasDispatchMountedEvent && (isFinished === true || this.umdMode)) {
          hasDispatchMountedEvent = true
          this.handleMounted(umdHookMountResult)
        }
      })
    } else {
      this.sandBox?.rebuildUmdSnapshot()
      try {
        umdHookMountResult = this.umdHookMount!()
      } catch (e) {
        logError('an error occurred in the mount function \n', this.name, e)
      }
      this.handleMounted(umdHookMountResult)
    }
  }

  /**
   * handle for promise umdHookMount
   * @param umdHookMountResult result of umdHookMount
   */
  private handleMounted (umdHookMountResult: any): void {
    if (isPromise(umdHookMountResult)) {
      umdHookMountResult
        .then(() => this.dispatchMountedEvent())
        .catch((e: Error) => this.onerror(e))
    } else {
      this.dispatchMountedEvent()
    }
  }

  /**
   * dispatch mounted event when app run finished
   */
  private dispatchMountedEvent (): void {
    if (appStates.UNMOUNT !== this.state) {
      this.state = appStates.MOUNTED
      dispatchLifecyclesEvent(
        this.container!,
        this.name,
        lifeCycles.MOUNTED,
      )
    }
  }

  /**
   * unmount app
   * @param destroy completely destroy, delete cache resources
   * @param unmountcb callback of unmount
   */
  unmount (destroy: boolean, unmountcb?: CallableFunction): void {
    if (this.state === appStates.LOAD_SOURCE_ERROR) {
      destroy = true
    }

    this.state = appStates.UNMOUNT
    this.keepAliveState = null
    this.keepAliveContainer = null

    // result of unmount function
    let umdHookUnmountResult: any
    /**
     * send an unmount event to the micro app or call umd unmount hook
     * before the sandbox is cleared
     */
    if (this.umdHookUnmount) {
      try {
        umdHookUnmountResult = this.umdHookUnmount()
      } catch (e) {
        logError('an error occurred in the unmount function \n', this.name, e)
      }
    }

    // dispatch unmount event to micro app
    dispatchCustomEventToMicroApp('unmount', this.name)

    this.handleUnmounted(destroy, umdHookUnmountResult, unmountcb)
  }

  /**
   * handle for promise umdHookUnmount
   * @param destroy completely destroy, delete cache resources
   * @param umdHookUnmountResult result of umdHookUnmount
   * @param unmountcb callback of unmount
   */
  private handleUnmounted (
    destroy: boolean,
    umdHookUnmountResult: any,
    unmountcb?: CallableFunction,
  ): void {
    if (isPromise(umdHookUnmountResult)) {
      umdHookUnmountResult
        .then(() => this.actionsForUnmount(destroy, unmountcb))
        .catch(() => this.actionsForUnmount(destroy, unmountcb))
    } else {
      this.actionsForUnmount(destroy, unmountcb)
    }
  }

  /**
   * actions for unmount app
   * @param destroy completely destroy, delete cache resources
   * @param unmountcb callback of unmount
   */
  private actionsForUnmount (destroy: boolean, unmountcb?: CallableFunction): void {
    this.sandBox?.stop()
    if (destroy) {
      this.actionsForCompletelyDestory()
    } else if (this.umdMode && (this.container as Element).childElementCount) {
      cloneContainer(this.container as Element, this.source.html as Element, false)
    }

    // dispatch unmount event to base app
    dispatchLifecyclesEvent(
      this.container!,
      this.name,
      lifeCycles.UNMOUNT,
    )

    this.container!.innerHTML = ''
    this.container = null

    unmountcb && unmountcb()
  }

  // actions for completely destroy
  actionsForCompletelyDestory (): void {
    if (!this.useSandbox && this.umdMode) {
      delete window[this.libraryName as any]
    }
    appInstanceMap.delete(this.name)
  }

  // hidden app when disconnectedCallback called with keep-alive
  hiddenKeepAliveApp (): void {
    const oldContainer = this.container

    cloneContainer(
      this.container as Element,
      this.keepAliveContainer ? this.keepAliveContainer : (this.keepAliveContainer = document.createElement('div')),
      false,
    )

    this.container = this.keepAliveContainer

    this.keepAliveState = keepAliveStates.KEEP_ALIVE_HIDDEN

    // event should dispatch before clone node
    // dispatch afterhidden event to micro-app
    dispatchCustomEventToMicroApp('appstate-change', this.name, {
      appState: 'afterhidden',
    })

    // dispatch afterhidden event to base app
    dispatchLifecyclesEvent(
      oldContainer!,
      this.name,
      lifeCycles.AFTERHIDDEN,
    )
  }

  // show app when connectedCallback called with keep-alive
  showKeepAliveApp (container: HTMLElement | ShadowRoot): void {
    // dispatch beforeshow event to micro-app
    dispatchCustomEventToMicroApp('appstate-change', this.name, {
      appState: 'beforeshow',
    })

    // dispatch beforeshow event to base app
    dispatchLifecyclesEvent(
      container,
      this.name,
      lifeCycles.BEFORESHOW,
    )

    cloneContainer(
      this.container as Element,
      container as Element,
      false,
    )

    this.container = container

    this.keepAliveState = keepAliveStates.KEEP_ALIVE_SHOW

    // dispatch aftershow event to micro-app
    dispatchCustomEventToMicroApp('appstate-change', this.name, {
      appState: 'aftershow',
    })

    // dispatch aftershow event to base app
    dispatchLifecyclesEvent(
      this.container,
      this.name,
      lifeCycles.AFTERSHOW,
    )
  }

  /**
   * app rendering error
   * @param e Error
   */
  onerror (e: Error): void {
    dispatchLifecyclesEvent(
      this.container!,
      this.name,
      lifeCycles.ERROR,
      e,
    )
  }

  // get app state
  getAppState (): string {
    return this.state
  }

  // get keep-alive state
  getKeepAliveState (): string | null {
    return this.keepAliveState
  }

  // get umd library, if it not exist, return empty object
  private getUmdLibraryHooks (): Record<string, unknown> {
    // after execScripts, the app maybe unmounted
    if (appStates.UNMOUNT !== this.state) {
      const global = (this.sandBox?.proxyWindow ?? globalEnv.rawWindow) as any
      this.libraryName = getRootContainer(this.container!).getAttribute('library') || `micro-app-${this.name}`
      // do not use isObject
      return typeof global[this.libraryName] === 'object' ? global[this.libraryName] : {}
    }

    return {}
  }
}

// if app not prefetch & not unmount, then app is active
export function getActiveApps (): string[] {
  const activeApps: string[] = []
  appInstanceMap.forEach((app: AppInterface, appName: string) => {
    if (appStates.UNMOUNT !== app.getAppState() && !app.isPrefetch) {
      activeApps.push(appName)
    }
  })

  return activeApps
}

// get all registered apps
export function getAllApps (): string[] {
  return Array.from(appInstanceMap.keys())
}

export interface unmountAppParams {
  destroy?: boolean // destory app, default is false
  clearAliveState?: boolean // clear keep-alive app state, default is false
}

/**
 * unmount app by appname
 * @param appName
 * @param options unmountAppParams
 * @returns Promise<void>
 */
export function unmountApp (appName: string, options?: unmountAppParams): Promise<void> {
  const app = appInstanceMap.get(formatAppName(appName))
  return new Promise((reslove) => { // eslint-disable-line
    if (app) {
      if (app.getAppState() === appStates.UNMOUNT || app.isPrefetch) {
        if (options?.destroy) {
          app.actionsForCompletelyDestory()
        }
        reslove()
      } else if (app.getKeepAliveState() === keepAliveStates.KEEP_ALIVE_HIDDEN) {
        if (options?.destroy) {
          app.unmount(true, reslove)
        } else if (options?.clearAliveState) {
          app.unmount(false, reslove)
        } else {
          reslove()
        }
      } else {
        const container = getRootContainer(app.container!)
        const unmountHandler = () => {
          container.removeEventListener('unmount', unmountHandler)
          container.removeEventListener('afterhidden', afterhiddenHandler)
          reslove()
        }

        const afterhiddenHandler = () => {
          container.removeEventListener('unmount', unmountHandler)
          container.removeEventListener('afterhidden', afterhiddenHandler)
          reslove()
        }

        container.addEventListener('unmount', unmountHandler)
        container.addEventListener('afterhidden', afterhiddenHandler)

        if (options?.destroy) {
          let destroyAttrValue, destoryAttrValue
          container.hasAttribute('destroy') && (destroyAttrValue = container.getAttribute('destroy'))
          container.hasAttribute('destory') && (destoryAttrValue = container.getAttribute('destory'))

          container.setAttribute('destroy', 'true')
          container.parentNode!.removeChild(container)
          container.removeAttribute('destroy')

          typeof destroyAttrValue === 'string' && container.setAttribute('destroy', destroyAttrValue)
          typeof destoryAttrValue === 'string' && container.setAttribute('destory', destoryAttrValue)
        } else if (options?.clearAliveState && container.hasAttribute('keep-alive')) {
          const keepAliveAttrValue = container.getAttribute('keep-alive')!

          container.removeAttribute('keep-alive')
          container.parentNode!.removeChild(container)

          container.setAttribute('keep-alive', keepAliveAttrValue)
        } else {
          container.parentNode!.removeChild(container)
        }
      }
    } else {
      logWarn(`app ${appName} does not exist`)
      reslove()
    }
  })
}

// unmount all apps in turn
export function unmountAllApps (options?: unmountAppParams): Promise<void> {
  return Array.from(appInstanceMap.keys()).reduce((pre, next) => pre.then(() => unmountApp(next, options)), Promise.resolve())
}
