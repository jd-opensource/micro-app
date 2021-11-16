import type {
  AppInterface,
  sourceType,
  SandBoxInterface,
  sourceLinkInfo,
  sourceScriptInfo,
  Func,
} from '@micro-app/types'
import extractHtml from './source'
import { commonElementHander } from './source/patch'
import { execScripts } from './source/scripts'
import { appStatus, lifeCycles } from './constants'
import SandBox from './sandbox'
import {
  isFunction,
  cloneNode,
  isBoolean,
  isPromise,
  logError,
  isShadowRoot,
  CompletionPath,
} from './libs/utils'
import dispatchLifecyclesEvent, { dispatchUnmountToMicroApp } from './interact/lifecycles_event'
import globalEnv from './libs/global_env'

// micro app instances
export const appInstanceMap = new Map<string, AppInterface>()

// params of CreateApp
export interface CreateAppParam {
  name: string
  url: string
  scopecss: boolean
  useSandbox: boolean
  macro?: boolean
  inline?: boolean
  baseroute?: string
  container?: HTMLElement | ShadowRoot
  ssr?: boolean
}

export default class CreateApp implements AppInterface {
  private status: string = appStatus.NOT_LOADED
  private loadSourceLevel: -1|0|1|2 = 0
  private umdHookMount: Func | null = null
  private umdHookUnmount: Func | null = null
  private libraryName: string | null = null
  umdMode = false
  isPrefetch = false
  name: string
  url: string
  container: HTMLElement | ShadowRoot | null = null
  inline: boolean
  scopecss: boolean
  useSandbox: boolean
  macro = false
  baseroute = ''
  source: sourceType
  sandBox: SandBoxInterface | null = null
  ssr: boolean // by awesomedevin

  constructor ({ name, url, container, inline, scopecss, useSandbox, macro, baseroute, ssr }: CreateAppParam) {
    this.container = container ?? null
    this.inline = inline ?? false
    this.baseroute = baseroute ?? ''
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
    this.ssr = !!ssr  // by awesomedevin
    this.loadSourceCode()
    if (this.useSandbox) {
      this.sandBox = new SandBox(name, url, this.macro)
    }
  }

  // Load resources
  loadSourceCode (): void {
    this.status = appStatus.LOADING_SOURCE_CODE
    extractHtml(this)
  }

  /**
   * When resource is loaded, mount app if it is not prefetch or unmount
   */
  onLoad (html: HTMLElement): void {
    if (++this.loadSourceLevel === 2) {
      this.source.html = html

      if (this.isPrefetch || appStatus.UNMOUNT === this.status) return

      this.status = appStatus.LOAD_SOURCE_FINISHED

      this.mount()
    }
  }

  /**
   * Error loading HTML
   * @param e Error
   */
  onLoadError (e: Error): void {
    this.loadSourceLevel = -1
    if (appStatus.UNMOUNT !== this.status) {
      this.onerror(e)
      this.status = appStatus.LOAD_SOURCE_ERROR
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
      this.status = appStatus.LOADING_SOURCE_CODE
      return
    }

    dispatchLifecyclesEvent(
      this.container as HTMLElement,
      this.name,
      lifeCycles.BEFOREMOUNT,
    )

    this.status = appStatus.MOUNTING

    cloneNode(this.source.html as Element, this.container as Element, !this.umdMode)

    this.sandBox?.start(this.baseroute)

    // Compatible with next dynamic resource loading - by awesomedevin
    const observeTarget = this.container.querySelector('micro-app-head')
    observeTarget?.addEventListener('DOMNodeInserted',(data)=>{
      const child = data.target
      const { origin } = new URL(this.url)
      if(child){
          // Style tags with data-n-href attributes require special handling
          if(child && child instanceof HTMLStyleElement && child.getAttribute('data-n-href')){
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.type = 'text/css'
              link.href = CompletionPath(child.getAttribute('data-n-href') || '', this.url)
              commonElementHander(observeTarget, link, child, globalEnv.rawReplaceChild)
          }else if(child && child instanceof HTMLLinkElement && child.getAttribute('href') && !child.getAttribute('href')?.match(origin)){
              const href = child.getAttribute('href')
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.type = 'text/css'
              link.href = CompletionPath(href || '', this.url)
              commonElementHander(observeTarget, link, child, globalEnv.rawReplaceChild)
          }
      }
  })

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
    if (appStatus.UNMOUNT !== this.status) {
      this.status = appStatus.MOUNTED
      // remove defer in v0.4.2
      // defer(() => {
      //   if (appStatus.UNMOUNT !== this.status) {
      dispatchLifecyclesEvent(
        this.container as HTMLElement,
        this.name,
        lifeCycles.MOUNTED,
      )
      //   }
      // })
    }
  }

  /**
   * unmount app
   * @param destroy completely destroy, delete cache resources
   */
  unmount (destroy: boolean): void {
    if (this.status === appStatus.LOAD_SOURCE_ERROR) {
      destroy = true
    }

    this.status = appStatus.UNMOUNT

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
    dispatchUnmountToMicroApp(this.name)

    this.handleUnmounted(destroy, umdHookUnmountResult)
  }

  /**
   * handle for promise umdHookUnmount
   * @param umdHookUnmountResult result of umdHookUnmount
   */
  private handleUnmounted (destroy: boolean, umdHookUnmountResult: any): void {
    if (isPromise(umdHookUnmountResult)) {
      umdHookUnmountResult
        .then(() => this.actionsForUnmount(destroy))
        .catch(() => this.actionsForUnmount(destroy))
    } else {
      this.actionsForUnmount(destroy)
    }
  }

  /**
   * actions for unmount app
   * @param destroy completely destroy, delete cache resources
   */
  private actionsForUnmount (destroy: boolean): void {
    // dispatch unmount event to base app
    dispatchLifecyclesEvent(
      this.container as HTMLElement,
      this.name,
      lifeCycles.UNMOUNT,
    )

    this.sandBox?.stop()

    // actions for completely destroy
    if (destroy) {
      if (!this.useSandbox && this.umdMode) {
        delete window[this.libraryName as any]
      }
      appInstanceMap.delete(this.name)
    } else if (this.umdMode && (this.container as Element).childElementCount) {
      /**
      * In umd mode, ui frameworks will no longer create style elements to head in lazy load page when render again, so we should save container to keep these elements
      */
      cloneNode(this.container as Element, this.source.html as Element, false)
    }

    this.container = null
  }

  /**
   * app rendering error
   * @param e Error
   */
  onerror (e: Error): void {
    dispatchLifecyclesEvent(
      this.container as HTMLElement,
      this.name,
      lifeCycles.ERROR,
      e,
    )
  }

  // get app status
  getAppStatus (): string {
    return this.status
  }

  // get umd library, if it not exist, return empty object
  private getUmdLibraryHooks (): Record<string, unknown> {
    // after execScripts, the app maybe unmounted
    if (appStatus.UNMOUNT !== this.status) {
      const global = (this.sandBox?.proxyWindow ?? globalEnv.rawWindow) as any
      this.libraryName = (isShadowRoot(this.container) ? (this.container as ShadowRoot).host : this.container as Element).getAttribute('library') || `micro-app-${this.name}`
      // do not use isObject
      return typeof global[this.libraryName] === 'object' ? global[this.libraryName] : {}
    }

    return {}
  }
}
