import type {
  OptionsType,
  MicroAppBaseType,
  AppInterface,
  Router,
  AppName,
  Func,
  lifeCyclesType,
  MicroAppConfig,
  GetActiveAppsParam,
} from '@micro-app/types'
import { defineElement } from './micro_app_element'
import preFetch, { getGlobalAssets } from './prefetch'
import {
  logError,
  logWarn,
  isBrowser,
  isPlainObject,
  formatAppName,
  getRootContainer,
  isString,
  pureCreateElement,
  isElement,
  isFunction,
} from './libs/utils'
import { EventCenterForBaseApp } from './interact'
import { initGlobalEnv } from './libs/global_env'
import { appInstanceMap } from './create_app'
import { lifeCycles } from './constants'
import { router } from './sandbox/router'

/**
 * if app not prefetch & not unmount, then app is active
 * @param excludeHiddenApp exclude hidden keep-alive app, default is false
 * @param excludePreRender exclude pre render app
 * @returns active apps
 */
export function getActiveApps ({
  excludeHiddenApp = false,
  excludePreRender = false,
}: GetActiveAppsParam = {}): AppName[] {
  const activeApps: AppName[] = []
  appInstanceMap.forEach((app: AppInterface, appName: AppName) => {
    if (
      !app.isUnmounted() &&
      (
        !app.isPrefetch || (
          app.isPrerender && !excludePreRender
        )
      ) &&
      (
        !excludeHiddenApp ||
        !app.isHidden()
      )
    ) {
      activeApps.push(appName)
    }
  })

  return activeApps
}

// get all registered apps
export function getAllApps (): string[] {
  return Array.from(appInstanceMap.keys())
}

type unmountAppOptions = {
  destroy?: boolean // destroy app, default is false
  clearAliveState?: boolean // clear keep-alive app state, default is false
  clearData?: boolean // clear data from base app & child app
}

/**
 * unmount app by appName
 * @param appName
 * @param options unmountAppOptions
 * @returns Promise<void>
 */
export function unmountApp (appName: string, options?: unmountAppOptions): Promise<boolean> {
  const app = appInstanceMap.get(formatAppName(appName))
  return new Promise((resolve) => {
    if (app) {
      if (app.isUnmounted() || app.isPrefetch) {
        if (app.isPrerender) {
          app.unmount({
            destroy: !!options?.destroy,
            clearData: !!options?.clearData,
            keepRouteState: false,
            unmountcb: resolve.bind(null, true)
          })
        } else {
          if (options?.destroy) app.actionsForCompletelyDestroy()
          resolve(true)
        }
      } else if (app.isHidden()) {
        if (options?.destroy) {
          app.unmount({
            destroy: true,
            clearData: true,
            keepRouteState: true,
            unmountcb: resolve.bind(null, true)
          })
        } else if (options?.clearAliveState) {
          app.unmount({
            destroy: false,
            clearData: !!options.clearData,
            keepRouteState: true,
            unmountcb: resolve.bind(null, true)
          })
        } else {
          resolve(true)
        }
      } else {
        const container = getRootContainer(app.container!)
        const unmountHandler = () => {
          container.removeEventListener(lifeCycles.UNMOUNT, unmountHandler)
          container.removeEventListener(lifeCycles.AFTERHIDDEN, afterhiddenHandler)
          resolve(true)
        }

        const afterhiddenHandler = () => {
          container.removeEventListener(lifeCycles.UNMOUNT, unmountHandler)
          container.removeEventListener(lifeCycles.AFTERHIDDEN, afterhiddenHandler)
          resolve(true)
        }

        container.addEventListener(lifeCycles.UNMOUNT, unmountHandler)
        container.addEventListener(lifeCycles.AFTERHIDDEN, afterhiddenHandler)

        if (options?.destroy) {
          let destroyAttrValue, destoryAttrValue
          container.hasAttribute('destroy') && (destroyAttrValue = container.getAttribute('destroy'))
          container.hasAttribute('destory') && (destoryAttrValue = container.getAttribute('destory'))

          container.setAttribute('destroy', 'true')
          container.parentNode!.removeChild(container)

          container.removeAttribute('destroy')

          isString(destroyAttrValue) && container.setAttribute('destroy', destroyAttrValue)
          isString(destoryAttrValue) && container.setAttribute('destory', destoryAttrValue)
        } else if (options?.clearAliveState && container.hasAttribute('keep-alive')) {
          const keepAliveAttrValue = container.getAttribute('keep-alive')!
          container.removeAttribute('keep-alive')

          let clearDataAttrValue = null
          if (options.clearData) {
            clearDataAttrValue = container.getAttribute('clear-data')
            container.setAttribute('clear-data', 'true')
          }

          container.parentNode!.removeChild(container)

          container.setAttribute('keep-alive', keepAliveAttrValue)
          isString(clearDataAttrValue) && container.setAttribute('clear-data', clearDataAttrValue)
        } else {
          let clearDataAttrValue = null
          if (options?.clearData) {
            clearDataAttrValue = container.getAttribute('clear-data')
            container.setAttribute('clear-data', 'true')
          }

          container.parentNode!.removeChild(container)

          isString(clearDataAttrValue) && container.setAttribute('clear-data', clearDataAttrValue)
        }
      }
    } else {
      logWarn(`app ${appName} does not exist when unmountApp`)
      resolve(false)
    }
  })
}

// unmount all apps in turn
export function unmountAllApps (options?: unmountAppOptions): Promise<boolean> {
  return Array.from(appInstanceMap.keys()).reduce((pre, next) => pre.then(() => unmountApp(next, options)), Promise.resolve(true))
}

/**
 * Re render app from the command line
 * microApp.reload(destroy)
 * @param appName app.name
 * @param destroy unmount app with destroy mode
 * @returns Promise<boolean>
 */
export function reload (appName: string, destroy?: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const app = appInstanceMap.get(formatAppName(appName))
    if (app) {
      const rootContainer = app.container && getRootContainer(app.container)
      if (rootContainer) {
        const currentData = microApp.getData(appName)
        app.isReloading = true
        rootContainer.reload(destroy).then(() => {
          if (currentData) {
            microApp.setData(appName, currentData)
          }
          app.isReloading = false
          resolve(true)
        })
      } else {
        logWarn(`app ${appName} is not rendered, cannot use reload`)
        resolve(false)
      }
    } else {
      logWarn(`app ${appName} does not exist when reload app`)
      resolve(false)
    }
  })
}

interface RenderAppOptions extends MicroAppConfig {
  name: string,
  url: string,
  container: string | Element,
  baseroute?: string,
  'default-page'?: string,
  data?: Record<PropertyKey, unknown>,
  onDataChange?: Func,
  lifeCycles?: lifeCyclesType,
  [key: string]: unknown,
}

/**
 * Manually render app
 * @param options RenderAppOptions
 * @returns Promise<boolean>
 */
export function renderApp (options: RenderAppOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isPlainObject<RenderAppOptions>(options)) return logError('renderApp options must be an object')
    const container: Element | null = isElement(options.container) ? options.container : isString(options.container) ? document.querySelector(options.container) : null
    if (!isElement(container)) return logError('Target container is not a DOM element.')

    const microAppElement = pureCreateElement<any>(microApp.tagName)

    for (const attr in options) {
      if (attr === 'onDataChange') {
        if (isFunction(options[attr])) {
          microAppElement.addEventListener('datachange', options[attr])
        }
      } else if (attr === 'lifeCycles') {
        const lifeCycleConfig = options[attr]
        if (isPlainObject(lifeCycleConfig)) {
          for (const lifeName in lifeCycleConfig) {
            if (lifeName.toUpperCase() in lifeCycles && isFunction(lifeCycleConfig[lifeName])) {
              microAppElement.addEventListener(lifeName.toLowerCase(), lifeCycleConfig[lifeName])
            }
          }
        }
      } else if (attr !== 'container') {
        microAppElement.setAttribute(attr, options[attr])
      }
    }

    const handleMount = () => {
      releaseListener()
      resolve(true)
    }

    const handleError = () => {
      releaseListener()
      resolve(false)
    }

    const releaseListener = () => {
      microAppElement.removeEventListener(lifeCycles.MOUNTED, handleMount)
      microAppElement.removeEventListener(lifeCycles.ERROR, handleError)
    }

    microAppElement.addEventListener(lifeCycles.MOUNTED, handleMount)
    microAppElement.addEventListener(lifeCycles.ERROR, handleError)

    container.appendChild(microAppElement)
  })
}

export class MicroApp extends EventCenterForBaseApp implements MicroAppBaseType {
  tagName = 'micro-app'
  hasInit = false
  options: OptionsType = {}
  router: Router = router
  preFetch = preFetch
  unmountApp = unmountApp
  unmountAllApps = unmountAllApps
  getActiveApps = getActiveApps
  getAllApps = getAllApps
  reload = reload
  renderApp = renderApp
  start (options?: OptionsType): void {
    if (!isBrowser || !window.customElements) {
      return logError('micro-app is not supported in this environment')
    }

    /**
     * TODO: 优化代码和逻辑
     *  1、同一个基座中initGlobalEnv不能被多次执行，否则会导致死循环
     *  2、判断逻辑是否放在initGlobalEnv中合适？--- 不合适
     */
    if (this.hasInit) {
      return logError('microApp.start executed repeatedly')
    }

    this.hasInit = true

    if (options?.tagName) {
      if (/^micro-app(-\S+)?/.test(options.tagName)) {
        this.tagName = options.tagName
      } else {
        return logError(`${options.tagName} is invalid tagName`)
      }
    }

    initGlobalEnv()

    if (window.customElements.get(this.tagName)) {
      return logWarn(`element ${this.tagName} is already defined`)
    }

    if (isPlainObject<OptionsType>(options)) {
      this.options = options
      options['disable-scopecss'] = options['disable-scopecss'] ?? options.disableScopecss
      options['disable-sandbox'] = options['disable-sandbox'] ?? options.disableSandbox

      // load app assets when browser is idle
      options.preFetchApps && preFetch(options.preFetchApps)

      // load global assets when browser is idle
      options.globalAssets && getGlobalAssets(options.globalAssets)

      if (isPlainObject(options.plugins)) {
        const modules = options.plugins.modules
        if (isPlainObject(modules)) {
          for (const appName in modules) {
            const formattedAppName = formatAppName(appName)
            if (formattedAppName && appName !== formattedAppName) {
              modules[formattedAppName] = modules[appName]
              delete modules[appName]
            }
          }
        }
      }
    }

    // define customElement after init
    defineElement(this.tagName)
  }
}

const microApp = new MicroApp()

export default microApp
