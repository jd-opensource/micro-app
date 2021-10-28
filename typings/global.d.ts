declare module '@micro-app/types' {
  type AttrType = string | null

  type Func = (...rest: any[]) => void

  type microWindowType = Window & any

  interface SandBoxInterface {
    active: boolean // sandbox state
    proxyWindow: WindowProxy
    recordUmdEffect: CallableFunction
    rebuildUmdEffect: CallableFunction
    releaseEffect: CallableFunction
    // Scoped global Properties(Properties that can only get and set in microWindow, will not escape to rawWindow)
    scopeProperties: Array<PropertyKey>
    // Properties that can be escape to rawWindow
    escapeProperties: Array<PropertyKey>
    microWindow: Window // Proxy target
    injectedKeys: Set<PropertyKey> // Properties newly added to microWindow
    escapeKeys: Set<PropertyKey> // Properties escape to rawWindow, cleared when unmount
    start(baseroute: string): void
    stop(): void
    recordUmdSnapshot(): void
    rebuildUmdSnapshot(): void
    inject(microWindow: microWindowType, appName: string, url: string): void
  }

  type sourceLinkInfo = {
    code: string // code
    placeholder?: Comment | null // placeholder comment
    isGlobal: boolean // is global asset
  }

  type sourceScriptInfo = {
    code: string // code
    isExternal: boolean // external script
    isDynamic: boolean // dynamic create script
    async: boolean // async script
    defer: boolean // defer script
    module: boolean // module type script
    isGlobal?: boolean // share js to global
  }

  interface sourceType {
    html?: HTMLElement
    links: Map<string, sourceLinkInfo>
    scripts: Map<string, sourceScriptInfo>
  }

  // app instance
  interface AppInterface {
    isPrefetch: boolean // whether prefetch app, default is false
    name: string // app name
    url: string // app url
    container: HTMLElement | ShadowRoot | null // app container
    inline: boolean //  whether js runs in inline script mode, default is false
    scopecss: boolean // whether use css scoped, default is true
    useSandbox: boolean // whether use js sandbox, default is true
    macro: boolean // used to solve the async render problem of vue3, default is false
    baseroute: string // route prefix, default is ''
    source: sourceType // sources of css, js, html
    sandBox: SandBoxInterface | null // sanxbox
    loadSourceCode(): void // Load resources
    onLoad(html: HTMLElement): void // resource is loaded
    onLoadError(e: Error): void // Error loading HTML
    mount(
      container?: HTMLElement | ShadowRoot,
      inline?: boolean,
      baseroute?: string,
    ): void // mount app
    dispatchMountedEvent(): void // dispatch mounted event when app run finished
    unmount(destroy: boolean): void // unmount app
    onerror(e: Error): void // app rendering error
    getAppStatus(): string // get app status
  }

  interface MicroAppElementType {
    appName: AttrType // app name
    appUrl: AttrType // app url
    isWating: boolean // combine action of set attribute name, url
    cacheData: Record<PropertyKey, unknown> | null // Cache data
    hasConnected: boolean // element has run connectedCallback
    connectedCallback(): void // Hooks for element append to documents
    disconnectedCallback(): void // Hooks for element delete from documents
    attributeChangedCallback(a: 'name' | 'url', o: string, n: string): void // Hooks for element attributes change
    handleAttributeUpdate(): void // handle for change of attribute name, url after inited
    legalAttribute(name: string, val: AttrType): boolean // judge the attribute is legal
    handleAppMount(app: AppInterface): void // mount app
    handleCreate(): void // create app
    handleUnmount (destroy: boolean): void // unmount app
    getDisposeResult (name: string): boolean // Get configuration
  }

  type prefetchParam = {
    name: string,
    url: string,
    disableScopecss?: boolean
    disableSandbox?: boolean
    macro?: boolean
    shadowDOM?: boolean
  }

  // prefetch params
  type prefetchParamList = Array<prefetchParam> | (() => Array<prefetchParam>)

  // lifeCycles
  interface lifeCyclesType {
    created?(e?: CustomEvent): void
    beforemount?(e?: CustomEvent): void
    mounted?(e?: CustomEvent): void
    unmount?(e?: CustomEvent): void
    error?(e?: CustomEvent): void
  }

  type plugins = {
    // global plugin
    global?: Array<{
      // Scoped global Properties
      scopeProperties?: Array<PropertyKey>
      // Properties that can be escape to rawWindow
      escapeProperties?: Array<PropertyKey>
      // options for plugin as the third parameter of loader
      options?: unknown
      // handle function
      loader?: (code: string, url: string, options: unknown) => string
    }>

    // plugin for special app
    modules?: {
      [name: string]: Array<{
        // Scoped global Properties
        scopeProperties?: Array<PropertyKey>
        // Properties that can be escape to rawWindow
        escapeProperties?: Array<PropertyKey>
        // options for plugin as the third parameter of loader
        options?: unknown
        // handle function
        loader?: (code: string, url: string, options: unknown) => string
      }>
    }
  }

  type fetchType = (url: string, options: Record<string, unknown>, appName: string | null) => Promise<string>

  type globalAssetsType = {
    js?: string[],
    css?: string[],
  }

  type OptionsType = {
    tagName?: string
    shadowDOM?: boolean
    destroy?: boolean
    inline?: boolean
    disableScopecss?: boolean
    disableSandbox?: boolean
    macro?: boolean
    lifeCycles?: lifeCyclesType
    preFetchApps?: prefetchParamList
    plugins?: plugins
    fetch?: fetchType
    globalAssets?: globalAssetsType,
  }

  // MicroApp config
  interface MicroAppConfigType {
    tagName: string
    shadowDOM?: boolean
    destroy?: boolean
    inline?: boolean
    disableScopecss?: boolean
    disableSandbox?: boolean
    macro?: boolean
    lifeCycles?: lifeCyclesType
    plugins?: plugins
    fetch?: fetchType
    preFetch(apps: prefetchParamList): void
    start(options?: OptionsType): void
  }

  // special CallableFunction for interact
  type CallableFunctionForInteract = CallableFunction & { __APP_NAME__?: string, __AUTO_TRIGGER__?: boolean }
}

declare namespace JSX {
  interface IntrinsicElements {
    'micro-app': any
  }
}

declare module '@micro-zoe/micro-app/polyfill/jsx-custom-event'
