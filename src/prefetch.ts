import type { prefetchParamList, prefetchParam, globalAssetsType } from '@micro-app/types'
import CreateApp, { appInstanceMap } from './create_app'
import { requestIdleCallback, formatURL, promiseStream, logError, isBrowser, isArray, isPlainObject, isString } from './libs/utils'
import { fetchSource } from './source/fetch'
import { globalLinks } from './source/links'
import { globalScripts } from './source/scripts'
import microApp from './micro_app'

function filterPreFetchTarget<T extends prefetchParam> (apps: T[]): T[] {
  const validApps: T[] = []

  if (isArray(apps)) {
    apps.forEach((item) => {
      item.url = formatURL(item.url)
      if (
        isPlainObject(item) &&
        isString(item.name) &&
        item.url &&
        !appInstanceMap.has(item.name)
      ) {
        validApps.push(item)
      }
    })
  }

  return validApps
}

/**
 * preFetch([
 *  {
 *    name: string,
 *    url: string,
 *    disableScopecss?: boolean,
 *    disableSandbox?: boolean,
 *    macro?: boolean,
 *  },
 *  ...
 * ])
 * Note:
 *  1: preFetch is asynchronous and is performed only when the browser is idle
 *  2: disableScopecss, disableSandbox, macro must be same with micro-app element, if conflict, the one who executes first shall prevail
 * @param apps micro apps
 */
export default function preFetch (apps: prefetchParamList): void {
  if (!isBrowser) {
    return logError('preFetch is only supported in browser environment')
  }
  requestIdleCallback(() => {
    if (typeof apps === 'function') apps = apps()

    filterPreFetchTarget(apps).forEach((item) => {
      const app = new CreateApp({
        name: item.name,
        url: item.url,
        scopecss: !(item.disableScopecss ?? microApp.disableScopecss),
        useSandbox: !(item.disableSandbox ?? microApp.disableSandbox),
        macro: item.macro ?? microApp.macro,
      })

      app.isPrefetch = true
      appInstanceMap.set(item.name, app)
    })
  })
}

/**
 * load global assets into cache
 * @param assets global assets of js, css
 */
export function getGlobalAssets (assets: globalAssetsType): void {
  if (isPlainObject(assets)) {
    requestIdleCallback(() => {
      if (isPlainObject(assets.js)) {
        const effectiveJs = assets.js!.filter((path) => isString(path) && path.includes('.js') && !globalScripts.has(path))

        const fetchJSPromise: Array<Promise<string>> = []
        effectiveJs.forEach((path) => {
          fetchJSPromise.push(fetchSource(path))
        })

        // fetch js with stream
        promiseStream<string>(fetchJSPromise, (res: {data: string, index: number}) => {
          const path = effectiveJs[res.index]
          if (!globalScripts.has(path)) {
            globalScripts.set(path, res.data)
          }
        }, (err: {error: Error, index: number}) => {
          logError(err)
        })
      }

      if (isArray(assets.css)) {
        const effectiveCss = assets.css!.filter((path) => isString(path) && path.includes('.css') && !globalLinks.has(path))

        const fetchCssPromise: Array<Promise<string>> = []
        effectiveCss.forEach((path) => {
          fetchCssPromise.push(fetchSource(path))
        })

        // fetch css with stream
        promiseStream<string>(fetchCssPromise, (res: {data: string, index: number}) => {
          const path = effectiveCss[res.index]
          if (!globalLinks.has(path)) {
            globalLinks.set(path, res.data)
          }
        }, (err: {error: Error, index: number}) => {
          logError(err)
        })
      }
    })
  }
}
