import type {
  Func,
  AppInterface,
  sourceType,
  WithSandBoxInterface,
  MountParam,
  UnmountParam,
  OnLoadParam,
} from '@micro-app/types'
import { HTMLLoader } from './source/loader/html'
import { extractSourceDom } from './source/index'
import { execScripts } from './source/scripts'
import WithSandBox from './sandbox/with'
import IframeSandbox from './sandbox/iframe'
import { router, isRouterModeSearch } from './sandbox/router'
import {
  appStates,
  lifeCycles,
  keepAliveStates,
  microGlobalEvent,
  DEFAULT_ROUTER_MODE,
} from './constants'
import {
  isFunction,
  isPromise,
  logError,
  getRootContainer,
  execMicroAppGlobalHook,
  pureCreateElement,
  isDivElement,
  removeDomScope,
} from './libs/utils'
import dispatchLifecyclesEvent, {
  dispatchCustomEventToMicroApp,
} from './interact/lifecycles_event'
import globalEnv from './libs/global_env'
import microApp from './micro_app'
import sourceCenter from './source/source_center'

// micro app instances
export const appInstanceMap = new Map<string, AppInterface>()

// params of CreateApp
export interface CreateAppParam {
  name: string
  url: string
  scopecss: boolean
  useSandbox: boolean
  inline?: boolean
  iframe?: boolean
  container?: HTMLElement | ShadowRoot
  ssrUrl?: string
  isPrefetch?: boolean
  prefetchLevel?: number
  attrs?: Record<string, string>,
  routerMode?: string
}

export default class CreateApp implements AppInterface {
  private state: string = appStates.CREATED
  private keepAliveState: string | null = null
  private loadSourceLevel: -1|0|1|2 = 0
  private umdHookMount: Func | null = null
  private umdHookUnmount: Func | null = null
  private preRenderEvents?: CallableFunction[] | null
  public umdMode = false
  public source: sourceType
  // TODO: 类型优化，加上iframe沙箱
  public sandBox: WithSandBoxInterface | IframeSandbox | null = null
  public name: string
  public url: string
  public container: HTMLElement | ShadowRoot | null
  public scopecss: boolean
  public useSandbox: boolean
  public inline: boolean
  public iframe: boolean
  public ssrUrl: string
  public isPrefetch: boolean
  public isPrerender: boolean
  public prefetchLevel?: number
  public fiber = false
  public routerMode: string
  public attrs?: Record<string, string>
  public isReloading = false

  constructor ({
    name,
    url,
    container,
    scopecss,
    useSandbox,
    inline,
    iframe,
    ssrUrl,
    isPrefetch,
    prefetchLevel,
    routerMode,
    attrs,
  }: CreateAppParam) {
    appInstanceMap.set(name, this)
    // init actions
    this.name = name
    this.url = url
    this.useSandbox = useSandbox
    this.scopecss = this.useSandbox && scopecss
    this.attrs = attrs
    // exec before getInlineModeState
    this.iframe = iframe ?? false
    this.inline = this.getInlineModeState(inline)
    this.isReloading = false
    /**
     * NOTE:
     *  1. Navigate after micro-app created, before mount
     */
    this.routerMode = routerMode || DEFAULT_ROUTER_MODE

    // not exist when prefetch 👇
    this.container = container ?? null
    this.ssrUrl = ssrUrl ?? ''

    // exist only prefetch 👇
    this.isPrefetch = isPrefetch ?? false
    this.isPrerender = prefetchLevel === 3
    this.prefetchLevel = prefetchLevel

    this.source = { html: null, links: new Set(), scripts: new Set() }
    this.loadSourceCode()
    this.createSandbox()
  }

  // Load resources
  public loadSourceCode (): void {
    this.setAppState(appStates.LOADING)
    HTMLLoader.getInstance().run(this, extractSourceDom)
  }

  /**
   * When resource is loaded, mount app if it is not prefetch or unmount
   * defaultPage disablePatchRequest routerMode baseroute is only for prerender app
   */
  public onLoad ({
    html,
    // below params is only for prerender app
    defaultPage,
    routerMode,
    baseroute,
    disablePatchRequest,
  }: OnLoadParam): void {
    if (++this.loadSourceLevel === 2) {
      this.source.html = html
      if (this.isUnmounted()) return
      if (!this.isPrefetch) {
        getRootContainer(this.container!).mount(this)
      } else if (this.isPrerender) {
        /**
         * PreRender is an option of prefetch, it will render app during prefetch
         * Limit:
         * 1. fiber forced on
         * 2. only virtual router support
         *
         * NOTE: (Don't update browser url, dispatch popstateEvent, reload window, dispatch lifecycle event)
         * 1. pushState/replaceState in child can update microLocation, but will not attach router info to browser url
         * 2. prevent dispatch popstate/hashchange event to browser
         * 3. all navigation actions of location are invalid (In the future, we can consider update microLocation without trigger browser reload)
         * 4. lifecycle event will not trigger when prerender
         *
         * Special scenes
         * 1. unmount prerender app when loading
         * 2. unmount prerender app when exec js
         * 2. unmount prerender app after exec js
         */
        const container = pureCreateElement('div')
        container.setAttribute('prerender', 'true')
        this.sandBox?.setPreRenderState(true)
        this.mount({
          container,
          inline: this.inline,
          fiber: true,
          defaultPage: defaultPage || '',
          disablePatchRequest: disablePatchRequest ?? false,
          routerMode: routerMode!,
          baseroute: baseroute || '',
        })
      }
    }
  }

  /**
   * Error loading HTML
   * @param e Error
   */
  public onLoadError (e: Error): void {
    this.loadSourceLevel = -1

    if (!this.isUnmounted()) {
      this.onerror(e)
      this.setAppState(appStates.LOAD_FAILED)
    }
  }

  /**
   * mount app
   * @param container app container
   * @param inline run js in inline mode
   * @param routerMode virtual router mode
   * @param defaultPage default page of virtual router
   * @param baseroute route prefix, default is ''
   * @param disablePatchRequest prevent rewrite request method of child app
   * @param fiber run js in fiber mode
   */
  public mount ({
    container,
    inline,
    routerMode,
    defaultPage,
    baseroute,
    disablePatchRequest,
    fiber,
  }: MountParam): void {
    if (this.loadSourceLevel !== 2) {
      /**
       * container cannot be null when load end
       * NOTE:
       *  1. render prefetch app before load end
       *  2. unmount prefetch app and mount again before load end
       */
      this.container = container
      // mount before prerender exec mount (loading source), set isPrerender to false
      this.isPrerender = false

      // dispatch state event to micro app
      // TODO: statechange 还是 state-change，保持一致
      dispatchCustomEventToMicroApp(this, 'statechange', {
        appState: appStates.LOADING
      })

      // reset app state to LOADING
      return this.setAppState(appStates.LOADING)
    }

    this.createSandbox()

    const nextAction = () => {
      // place inside of nextAction, make sure iframe ready
      this.setAppState(appStates.BEFORE_MOUNT)
      /**
       * Special scenes:
       * 1. mount before prerender exec mount (loading source)
       * 2. mount when prerender js executing
       * 3. mount after prerender js exec end
       * 4. mount after prerender unmounted
       *
       * TODO: test shadowDOM
       */
      if (
        this.isPrerender &&
        isDivElement(this.container) &&
        this.container.hasAttribute('prerender')
      ) {
        /**
         * current this.container is <div prerender='true'></div>
         * set this.container to <micro-app></micro-app>
         * NOTE:
         *  1. must exec before this.sandBox.rebuildEffectSnapshot
         *  2. must exec before this.preRenderEvents?.forEach((cb) => cb())
         */
        this.container = this.cloneContainer(container, this.container, false)
        /**
         * rebuild effect event of window, document, data center
         * explain:
         * 1. rebuild before exec mount, do nothing
         * 2. rebuild when js executing, recovery recorded effect event, because prerender fiber mode
         * 3. rebuild after js exec end, normal recovery effect event
         */
        this.sandBox?.rebuildEffectSnapshot()
        this.preRenderEvents?.forEach((cb) => cb())
        // reset isPrerender config
        this.isPrerender = false
        this.preRenderEvents = null
        // attach router info to browser url
        router.attachToURL(this.name)
        this.sandBox?.setPreRenderState(false)
      } else {
        this.container = container
        this.inline = this.getInlineModeState(inline)
        this.fiber = fiber
        this.routerMode = routerMode

        const dispatchBeforeMount = () => {
          dispatchLifecyclesEvent(
            this.container,
            this.name,
            lifeCycles.BEFOREMOUNT,
          )
        }

        if (this.isPrerender) {
          (this.preRenderEvents ??= []).push(dispatchBeforeMount)
        } else {
          dispatchBeforeMount()
        }

        this.setAppState(appStates.MOUNTING)

        // dispatch state event to micro app
        dispatchCustomEventToMicroApp(this, 'statechange', {
          appState: appStates.MOUNTING
        })

        // TODO: 兼容shadowRoot的场景
        this.cloneContainer(this.container, this.source.html, !this.umdMode)

        this.sandBox?.start({
          umdMode: this.umdMode,
          baseroute,
          defaultPage,
          disablePatchRequest,
        })

        if (!this.umdMode) {
          // patch element info of html
          this.sandBox?.actionsBeforeExecScripts(this.container, (mount, unmount) => {
            if (!this.umdMode && !this.isUnmounted()) {
              this.umdHookMount = isFunction(mount) ? mount : null
              // umdHookUnmount can works in default mode, register by window.unmount
              this.umdHookUnmount = isFunction(unmount) ? unmount : null
              // if mount & unmount is function, the sub app is umd mode
              if (isFunction(this.umdHookMount) && isFunction(this.umdHookUnmount)) {
                this.sandBox?.markUmdMode(this.umdMode = true)
                try {
                  // if appState is mounted, it means that isFinished is true and this.handleMounted has already been executed, just exec this.umdHookMount
                  if (this.getAppState() === appStates.MOUNTED) {
                    this.umdHookMount(microApp.getData(this.name, true))
                  } else {
                    this.handleMounted(this.umdHookMount(microApp.getData(this.name, true)))
                  }
                } catch (e) {
                  logError('An error occurred when mount \n', this.name, e)
                  this.onerror(e)
                }
              }
            }
          })

          // if all js are executed, param isFinished will be true
          execScripts(this, (isFinished: boolean) => {
            if (!this.umdMode && isFinished === true) {
              this.handleMounted()
            }
          })
        } else {
          this.sandBox?.rebuildEffectSnapshot()
          try {
            this.handleMounted(this.umdHookMount!(microApp.getData(this.name, true)))
          } catch (e) {
            logError('An error occurred when mount \n', this.name, e)
            this.onerror(e)
          }
        }
      }
    }

    /**
     * Initialization of sandbox is async, especially iframe sandbox are macro tasks
     * when child apps switch quickly, we need to pay attention to the following points:
     * NOTE:
     *  1. unmount app before exec nextAction (especially: iframe sandbox + default mode + remount)
     *     this.container is null, this.sandBox will not start
     *  2. remount app of note 1
     *  3. unmount app during exec js
     */
    // TODO: 可优化？
    this.sandBox ? this.sandBox.sandboxReady.then(() => !this.isUnmounted() && nextAction()) : nextAction()
  }

  /**
   * handle for promise umdHookMount
   * @param umdHookMountResult result of umdHookMount
   */
  private handleMounted (umdHookMountResult?: unknown): void {
    const dispatchAction = () => {
      const nextAction = () => this.actionsAfterMounted()
      if (isPromise(umdHookMountResult)) {
        umdHookMountResult
          .then(nextAction)
          .catch((e) => {
            logError('An error occurred in window.mount \n', this.name, e)
            this.onerror(e)
            // TODO: 为什么 error 还要继续 nextAction?
            nextAction()
          })
      } else {
        nextAction()
      }
    }

    if (this.isPrerender) {
      this.preRenderEvents?.push(dispatchAction)
      this.sandBox?.recordAndReleaseEffect({ isPrerender: true })
    } else {
      dispatchAction()
    }
  }

  /**
   * dispatch mounted event when app run finished
   */
  private actionsAfterMounted (): void {
    if (!this.isUnmounted()) {
      this.setAppState(appStates.MOUNTED)
      // call window.onmount of child app
      execMicroAppGlobalHook(
        this.getMicroAppGlobalHook(microGlobalEvent.ONMOUNT),
        this.name,
        microGlobalEvent.ONMOUNT,
        microApp.getData(this.name, true)
      )

      // dispatch state event to micro app
      dispatchCustomEventToMicroApp(this, 'statechange', {
        appState: appStates.MOUNTED
      })

      // dispatch mounted event to micro app
      dispatchCustomEventToMicroApp(this, 'mounted')

      // dispatch event mounted to parent
      dispatchLifecyclesEvent(
        this.container,
        this.name,
        lifeCycles.MOUNTED,
      )

      /**
       * Hidden Keep-alive app during resource loading, render normally to ensure their liveliness (running in the background) characteristics.
       * Actions:
       *  1. Record & release all global events after mount
       */
      if (this.isHidden()) {
        this.sandBox?.recordAndReleaseEffect({ keepAlive: true })
      }
    }
    /**
     * TODO: 这里增加一个处理，如果渲染完成时已经卸载，则进行一些操作
     * 如果是默认模式：删除所有事件和定时器
     * 如果是umd模式：重新记录和清空事件
     * 补充：非必需，优先级低
     */
  }

  /**
   * unmount app
   * NOTE:
   *  1. do not add any params on account of unmountApp
   *  2. this.container maybe null: Initialization of sandbox is async, child app may unmount before exec nextAction of mount
   *  3. unmount app when loading files (this.container is not null)
   * @param destroy completely destroy, delete cache resources
   * @param clearData clear data of dateCenter
   * @param keepRouteState keep route state when unmount, default is false
   * @param unmountcb callback of unmount
   */
  public unmount ({
    destroy,
    clearData,
    keepRouteState,
    unmountcb,
  }: UnmountParam): void {
    destroy = destroy || this.state === appStates.LOAD_FAILED

    this.setAppState(appStates.UNMOUNT)

    try {
      this.handleUnmounted(
        destroy,
        clearData,
        keepRouteState,
        unmountcb,
        this.umdHookUnmount?.(microApp.getData(this.name, true)),
      )
    } catch (e) {
      logError('An error occurred when unmount \n', this.name, e)
    }
  }

  /**
   * handle for promise umdHookUnmount
   * @param destroy completely destroy, delete cache resources
   * @param clearData clear data of dateCenter
   * @param keepRouteState keep route state when unmount, default is false
   * @param unmountcb callback of unmount
   * @param umdHookUnmountResult result of umdHookUnmount
   */
  private handleUnmounted (
    destroy: boolean,
    clearData: boolean,
    keepRouteState: boolean,
    unmountcb?: CallableFunction,
    umdHookUnmountResult?: unknown,
  ): void {
    // dispatch state event to micro app
    dispatchCustomEventToMicroApp(this, 'statechange', {
      appState: appStates.UNMOUNT
    })

    // dispatch unmount event to micro app
    dispatchCustomEventToMicroApp(this, 'unmount')

    // call window.onunmount of child app
    execMicroAppGlobalHook(
      this.getMicroAppGlobalHook(microGlobalEvent.ONUNMOUNT),
      this.name,
      microGlobalEvent.ONUNMOUNT,
    )

    const nextAction = () => this.actionsAfterUnmounted({
      destroy,
      clearData,
      keepRouteState,
      unmountcb,
    })

    if (isPromise(umdHookUnmountResult)) {
      // async window.unmount will cause appName bind error in nest app
      removeDomScope()
      umdHookUnmountResult
        .then(nextAction)
        .catch((e) => {
          logError('An error occurred in window.unmount \n', this.name, e)
          nextAction()
        })
    } else {
      nextAction()
    }
  }

  /**
   * actions for unmount app
   * @param destroy completely destroy, delete cache resources
   * @param clearData clear data of dateCenter
   * @param keepRouteState keep route state when unmount, default is false
   * @param unmountcb callback of unmount
   */
  private actionsAfterUnmounted ({
    destroy,
    clearData,
    keepRouteState,
    unmountcb,
  }: UnmountParam): void {
    if (this.umdMode && this.container && !destroy) {
      this.cloneContainer(this.source.html, this.container as HTMLElement, false)
    }
    const shouldClearData = this.isReloading ? false : (clearData || destroy)
    /**
     * this.container maybe contains micro-app element, stop sandbox should exec after cloneContainer
     * NOTE:
     * 1. if destroy is true, clear route state
     * 2. umd mode and keep-alive will not clear EventSource
     */
    this.sandBox?.stop({
      umdMode: this.umdMode,
      keepRouteState: keepRouteState && !destroy,
      destroy,
      clearData: shouldClearData,
    })

    // dispatch unmount event to base app
    dispatchLifecyclesEvent(
      this.container,
      this.name,
      lifeCycles.UNMOUNT,
    )

    this.clearOptions(destroy)

    unmountcb?.()
  }

  private clearOptions (destroy: boolean): void {
    this.isPrerender = false
    this.preRenderEvents = null
    this.setKeepAliveState(null)
    if (this.container) {
      this.container.innerHTML = ''
      this.container = null
    } else if (!this.umdMode) {
      /**
       * this.container is null means sandBox.start has not exec, so sandBox.stop won't exec either
       * we should remove iframeElement in default mode manually
       */
      this.sandBox?.deleteIframeElement?.()
    }
    // in iframe sandbox & default mode, delete the sandbox & iframeElement
    /**
     * TODO:
     *  1. with沙箱与iframe沙箱保持一致：with沙箱默认模式下删除 或者 iframe沙箱umd模式下保留
     *  2. 接1.0，this.sandBox置空，还需要注意后续app.sandBox相关操作，比如 scripts.ts --> app.iframe ? app.sandBox!.microBody : app.querySelector('micro-app-body')，如果是fiber或者预加载，会存在卸载后js还在处理的情况
     */
    if (this.iframe && !this.umdMode) this.sandBox = null
    if (destroy) this.actionsForCompletelyDestroy()
    removeDomScope()
  }

  // actions for completely destroy
  public actionsForCompletelyDestroy (): void {
    this.sandBox?.deleteIframeElement?.()
    sourceCenter.script.deleteInlineInfo(this.source.scripts)
    appInstanceMap.delete(this.name)
  }

  // hidden app when disconnectedCallback called with keep-alive
  public hiddenKeepAliveApp (callback?: CallableFunction): void {
    this.setKeepAliveState(keepAliveStates.KEEP_ALIVE_HIDDEN)
    /**
     * afterhidden事件需要提前发送，原因如下：
     *  1. 此时发送this.container还指向micro-app元素，而不是临时div元素
     *  2. 沙箱执行recordAndReleaseEffect后会将appstate-change方法也清空，之后再发送子应用也接受不到了
     *  3. 对于this.loadSourceLevel !== 2的情况，unmount是同步执行的，所以也会出现2的问题
     * TODO: 有可能导致的问题
     *  1. 在基座接受到afterhidden方法后立即执行unmount，彻底destroy应用时，因为unmount时同步执行，所以this.container为null后才执行cloneContainer
     */
    dispatchCustomEventToMicroApp(this, 'appstate-change', {
      appState: 'afterhidden',
    })

    // dispatch afterHidden event to base app
    dispatchLifecyclesEvent(
      this.container,
      this.name,
      lifeCycles.AFTERHIDDEN,
    )

    if (isRouterModeSearch(this.name)) {
      // called after lifeCyclesEvent
      this.sandBox?.removeRouteInfoForKeepAliveApp()
    }

    /**
     * Hidden app before the resources are loaded, then unmount the app
     */
    if (this.loadSourceLevel !== 2) {
      getRootContainer(this.container!).unmount()
    } else {
      this.container = this.cloneContainer(
        pureCreateElement('div'),
        this.container,
        false,
      )

      this.sandBox?.recordAndReleaseEffect({ keepAlive: true })
    }

    callback?.()
  }

  // show app when connectedCallback called with keep-alive
  public showKeepAliveApp (container: HTMLElement | ShadowRoot): void {
    /**
     * NOTE:
     *  1. this.container must set to container(micro-app element) before exec rebuildEffectSnapshot
     *    ISSUE: https://github.com/jd-opensource/micro-app/issues/1115
     *  2. rebuildEffectSnapshot must exec before dispatch beforeshow event
     */
    const oldContainer = this.container
    this.container = container
    this.sandBox?.rebuildEffectSnapshot()

    // dispatch beforeShow event to micro-app
    dispatchCustomEventToMicroApp(this, 'appstate-change', {
      appState: 'beforeshow',
    })

    // dispatch beforeShow event to base app
    dispatchLifecyclesEvent(
      container,
      this.name,
      lifeCycles.BEFORESHOW,
    )

    this.setKeepAliveState(keepAliveStates.KEEP_ALIVE_SHOW)

    this.cloneContainer(
      this.container,
      oldContainer,
      false,
    )

    /**
     * TODO:
     *  问题：当路由模式为custom时，keep-alive应用在重新展示，是否需要根据子应用location信息更新浏览器地址？
     *  暂时不这么做，因为无法确定二次展示时新旧地址是否相同，是否带有特殊信息
     */
    if (isRouterModeSearch(this.name)) {
      // called before lifeCyclesEvent
      this.sandBox?.setRouteInfoForKeepAliveApp()
    }

    // dispatch afterShow event to micro-app
    dispatchCustomEventToMicroApp(this, 'appstate-change', {
      appState: 'aftershow',
    })

    // dispatch afterShow event to base app
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
  public onerror (e: Error): void {
    // dispatch state event to micro app
    dispatchCustomEventToMicroApp(this, 'statechange', {
      appState: appStates.LOAD_FAILED
    })

    dispatchLifecyclesEvent(
      this.container,
      this.name,
      lifeCycles.ERROR,
      e,
    )
  }

  /**
   * Parse htmlString to DOM
   * NOTE: iframe sandbox will use DOMParser of iframeWindow, with sandbox will use DOMParser of base app
   * @param htmlString DOMString
   * @returns parsed DOM
   */
  public parseHtmlString (htmlString: string): HTMLElement {
    const DOMParser = this.sandBox?.proxyWindow
      ? this.sandBox.proxyWindow.DOMParser
      : globalEnv.rawWindow.DOMParser
    return (new DOMParser()).parseFromString(htmlString, 'text/html').body
  }

  /**
   * clone origin elements to target
   * @param target Accept cloned elements
   * @param origin Cloned element
   * @param deep deep clone or transfer dom
   */
  private cloneContainer <T extends HTMLElement | ShadowRoot | null> (
    target: T,
    origin: T,
    deep: boolean,
  ): T {
    // 在基座接受到afterhidden方法后立即执行unmount，彻底destroy应用时，因为unmount时同步执行，所以this.container为null后才执行cloneContainer
    if (origin && target) {
      target.innerHTML = ''
      Array.from(deep ? this.parseHtmlString(origin.innerHTML).childNodes : origin.childNodes).forEach((node) => {
        target.appendChild(node)
      })
    }
    return target
  }

  /**
   * Scene:
   *  1. create app
   *  2. remount of default mode with iframe sandbox
   *    In default mode with iframe sandbox, unmount app will delete iframeElement & sandBox, and create sandBox when mount again, used to solve the problem that module script cannot be execute when append it again
   */
  private createSandbox (): void {
    if (this.useSandbox && !this.sandBox) {
      const iframeOption = {
        attrs: this.attrs,
        container: this.container
      }
      this.sandBox = this.iframe ? new IframeSandbox(this.name, this.url, iframeOption) : new WithSandBox(this.name, this.url)
    }
  }

  // set app state
  public setAppState (state: string): void {
    this.state = state

    // set window.__MICRO_APP_STATE__
    this.sandBox?.setStaticAppState(state)
  }

  // get app state
  public getAppState (): string {
    return this.state
  }

  // set keep-alive state
  private setKeepAliveState (state: string | null): void {
    this.keepAliveState = state
  }

  // get keep-alive state
  public getKeepAliveState (): string | null {
    return this.keepAliveState
  }

  // is app unmounted
  public isUnmounted (): boolean {
    return appStates.UNMOUNT === this.state
  }

  // is app already hidden
  public isHidden (): boolean {
    return keepAliveStates.KEEP_ALIVE_HIDDEN === this.keepAliveState
  }

  private getMicroAppGlobalHook (eventName: string): Func | null {
    const listener = (this.sandBox?.proxyWindow as Record<string, any>)?.[eventName]
    return isFunction(listener) ? listener : null
  }

  public querySelector (selectors: string): Node | null {
    return this.container ? globalEnv.rawElementQuerySelector.call(this.container, selectors) : null
  }

  public querySelectorAll (selectors: string): NodeListOf<Node> {
    return this.container ? globalEnv.rawElementQuerySelectorAll.call(this.container, selectors) : []
  }

  /**
   * NOTE:
   * 1. If the iframe sandbox no longer enforces the use of inline mode in the future, the way getElementsByTagName retrieves the script from the iframe by default needs to be changed, because in non inline mode, the script in the iframe may be empty
   * @param inline inline mode config
   */
  private getInlineModeState (inline?: boolean): boolean {
    return (this.iframe || inline) ?? false
  }
}

// iframe route mode
export function isIframeSandbox (appName: string): boolean {
  return appInstanceMap.get(appName)?.iframe ?? false
}
