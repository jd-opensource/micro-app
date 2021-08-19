/* eslint-disable no-new-func */
import type { Func } from '@micro-app/types'

type RequestIdleCallbackOptions = {
  timeout: number
}

type RequestIdleCallbackInfo = {
  readonly didTimeout: boolean
  timeRemaining: () => number
}

declare global {
  interface Window {
    requestIdleCallback (
      callback: (info: RequestIdleCallbackInfo) => void,
      opts?: RequestIdleCallbackOptions,
    ): number
    _babelPolyfill: boolean
    proxyWindow: WindowProxy
    __MICRO_APP_ENVIRONMENT__: boolean
  }
}

export const rawWindow = new Function('return window')()
export const rawDocument = new Function('return document')()
export const version = '__VERSION__'

/**
 * Format log msg
 * @param msg log msg
 */
export function formatLogMessage (msg: string): string {
  if (typeof msg === 'string') {
    return `[micro-app] ${msg}`
  }

  return msg
}

/**
 * async execution
 * @param fn callback
 * @param args params
 */
export function defer (fn: Func, ...args: any[]): void {
  Promise.resolve().then(fn.bind(null, ...args))
}

/**
 * Add address protocol
 * @param url address
 */
export function addProtocol (url: string): string {
  return url.startsWith('//') ? `${location.protocol}${url}` : url
}

/**
 * Format URL address
 * @param url address
 */
export function formatURL (url: string | null): string {
  if (typeof url !== 'string' || !url) return ''

  try {
    const { origin, pathname, search, hash } = new URL(addProtocol(url))
    // If it ends with .html/.node/.php/.net/.etc, don’t need to add /
    if (/\.(\w+)$/.test(pathname)) {
      return `${origin}${pathname}${search}${hash}`
    }
    const fullPath = `${origin}${pathname}/`.replace(/\/\/$/, '/')
    return /^https?:\/\//.test(fullPath) ? `${fullPath}${search}${hash}` : ''
  } catch (e) {
    console.error('[micro-app]', e)
    return ''
  }
}

/**
 * Get valid address, such as https://xxx/xx/xx.html to https://xxx/xx/
 * @param url app.url
 */
export function getEffectivePath (url: string): string {
  const { origin, pathname } = new URL(url)
  if (/\.(\w+)$/.test(pathname)) {
    const fullPath = `${origin}${pathname}`
    const pathArr = fullPath.split('/')
    pathArr.pop()
    return pathArr.join('/') + '/'
  }

  return url
}

/**
 * Complete address
 * @param path address
 * @param baseURI base url(app.url)
 */
export function CompletionPath (path: string, baseURI: string): string {
  if (/^((((ht|f)tps?)|file):)?\/\//.test(path)) return path

  baseURI = addProtocol(baseURI)

  return new URL(path, getEffectivePath(baseURI)).toString()
}

/**
 * Get the folder where the link resource is located,
 * which is used to complete the relative address in the css
 * @param linkpath full link address
 */
export function getLinkFileDir (linkpath: string): string {
  const pathArr = linkpath.split('/')
  pathArr.pop()
  return addProtocol(pathArr.join('/') + '/')
}

/**
 * promise stream
 * @param promiseList promise list
 * @param successsCb success callback
 * @param errorCb failed callback
 * @param finallyCb finally callback
 */
export function promiseStream <T> (
  promiseList: Array<Promise<T> | T>,
  successsCb: CallableFunction,
  errorCb: CallableFunction,
  finallyCb?: CallableFunction,
): void {
  let finishedNum = 0

  function isFinished () {
    if (++finishedNum === promiseList.length && finallyCb) finallyCb()
  }

  promiseList.forEach((p, i) => {
    if (toString.call(p) === '[object Promise]') {
      (p as Promise<T>).then((res: T) => {
        successsCb({
          data: res,
          index: i,
        })
        isFinished()
      }).catch((err: Error) => {
        errorCb({
          error: err,
          index: i,
        })
        isFinished()
      })
    } else {
      successsCb({
        data: p,
        index: i,
      })
      isFinished()
    }
  })
}

// Check whether the browser supports module script
export function isSupportModuleScript (): boolean {
  const s = document.createElement('script')
  return 'noModule' in s
}

// Create a random symbol string
export function createNonceStr (): string {
  return Math.random().toString(36).substr(2, 15)
}

// Array deduplication
export function unique (array: any[]): any[] {
  return array.filter(function (this: Record<PropertyKey, unknown>, item) {
    return item in this ? false : (this[item] = true)
  }, Object.create(null))
}

// requestIdleCallback polyfill
export const requestIdleCallback = window.requestIdleCallback ||
  function (fn: CallableFunction) {
    const lastTime = Date.now()
    return setTimeout(function () {
      fn({
        didTimeout: false,
        timeRemaining () {
          return Math.max(0, 50 - (Date.now() - lastTime))
        },
      })
    }, 1)
  }

/**
 * Record the currently running app.name
 */
let currentMicroAppName: string | null = null
export function setCurrentAppName (appName: string | null): void {
  currentMicroAppName = appName
}

// get the currently running app.name
export function getCurrentAppName (): string | null {
  return currentMicroAppName
}

// Clear appName
export function removeDomScope (): void {
  setCurrentAppName(null)
}

// is safari browser
export function isSafari (): boolean {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
}

// is function
export function isFunction (target: unknown): boolean {
  return typeof target === 'function'
}

/**
 * Create pure elements
 */
export function pureCreateElement<K extends keyof HTMLElementTagNameMap> (tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K] {
  const element = rawDocument.createElement(tagName, options)
  if (element.__MICRO_APP_NAME__) delete element.__MICRO_APP_NAME__
  return element
}
