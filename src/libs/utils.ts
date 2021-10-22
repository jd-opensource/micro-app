/* eslint-disable no-new-func, indent */
import type { Func } from '@micro-app/types'

export const version = '__VERSION__'

export const isBrowser = typeof window !== 'undefined'

export const globalThis = (typeof global !== 'undefined')
  ? global
  : (
    (typeof window !== 'undefined')
      ? window
      : (
        (typeof self !== 'undefined') ? self : Function('return this')()
      )
  )

/**
 * format error log
 * @param msg message
 */
export function logError (msg: unknown, ...rest: any[]): void {
  if (isString(msg)) {
    console.error(`[micro-app] ${msg}`, ...rest)
  } else {
    console.error('[micro-app]', msg, ...rest)
  }
}

/**
 * format warn log
 * @param msg message
 */
export function logWarn (msg: unknown, ...rest: any[]): void {
  if (isString(msg)) {
    console.warn(`[micro-app] ${msg}`, ...rest)
  } else {
    console.warn('[micro-app]', msg, ...rest)
  }
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
  if (!isString(url) || !url) return ''

  try {
    const { origin, pathname, search } = new URL(addProtocol(url))
    // If it ends with .html/.node/.php/.net/.etc, don’t need to add /
    if (/\.(\w+)$/.test(pathname)) {
      return `${origin}${pathname}${search}`
    }
    const fullPath = `${origin}${pathname}/`.replace(/\/\/$/, '/')
    return /^https?:\/\//.test(fullPath) ? `${fullPath}${search}` : ''
  } catch (e) {
    logError(e)
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

  return `${origin}${pathname}/`.replace(/\/\/$/, '/')
}

/**
 * Complete address
 * @param path address
 * @param baseURI base url(app.url)
 */
export function CompletionPath (path: string, baseURI: string): string {
  if (/^((((ht|f)tps?)|file):)?\/\//.test(path) || /^(data|blob):/.test(path)) return path

  return new URL(path, getEffectivePath(addProtocol(baseURI))).toString()
}

/**
 * Get the folder where the link resource is located,
 * which is used to complete the relative address in the css
 * @param linkPath full link address
 */
export function getLinkFileDir (linkPath: string): string {
  const pathArr = linkPath.split('/')
  pathArr.pop()
  return addProtocol(pathArr.join('/') + '/')
}

/**
 * promise stream
 * @param promiseList promise list
 * @param successCb success callback
 * @param errorCb failed callback
 * @param finallyCb finally callback
 */
export function promiseStream <T> (
  promiseList: Array<Promise<T> | T>,
  successCb: CallableFunction,
  errorCb: CallableFunction,
  finallyCb?: CallableFunction,
): void {
  let finishedNum = 0

  function isFinished () {
    if (++finishedNum === promiseList.length && finallyCb) finallyCb()
  }

  promiseList.forEach((p, i) => {
    if (isPromise(p)) {
      (p as Promise<T>).then((res: T) => {
        successCb({
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
      successCb({
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
export const requestIdleCallback = globalThis.requestIdleCallback ||
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

// is Array
export function isArray(target: unknown): boolean {
  return Array.isArray(target)
}

// is PlainObject
export function isPlainObject(target: unknown): boolean {
  return toString.call(target) === '[object Object]'
}

// is String
export function isString(target: unknown): boolean {
  return typeof target === 'string' || toString.call(target) === '[object String]'
}

// is Promise
export function isPromise(target: unknown): boolean{
  return toString.call(target) === '[object Promise]'
}

/**
 * Create pure elements
 */
export function pureCreateElement<K extends keyof HTMLElementTagNameMap> (tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName, options)
  if (element.__MICRO_APP_NAME__) delete element.__MICRO_APP_NAME__
  return element
}

/**
 * clone origin elements to target
 * @param origin Cloned element
 * @param target Accept cloned elements
 */
export function cloneNode <T extends Element, Q extends Element> (origin: T, target: Q): void {
  target.innerHTML = ''
  const clonedNode = origin.cloneNode(true)
  const fragment = document.createDocumentFragment()
  Array.from(clonedNode.childNodes).forEach((node: Node) => {
    fragment.appendChild(node)
  })
  target.appendChild(fragment)
}
