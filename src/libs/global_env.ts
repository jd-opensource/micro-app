import { isSupportModuleScript, isBrowser } from './utils'

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
    proxyWindow?: WindowProxy
    __MICRO_APP_ENVIRONMENT__?: boolean
    __MICRO_APP_UMD_MODE__?: boolean
    __MICRO_APP_BASE_APPLICATION__?: boolean
  }
  interface Element {
    __MICRO_APP_NAME__?: string
    data?: any
  }
  interface Node {
    __MICRO_APP_NAME__?: string
  }
  interface HTMLStyleElement {
    linkpath?: string
  }
}

const globalEnv: Record<string, any> = {}

export function initGlobalEnv (): void {
  if (isBrowser) {
    /**
     * save patch raw methods
     * pay attention to this binding
     */
    const rawSetAttribute = Element.prototype.setAttribute
    const rawAppendChild = Node.prototype.appendChild
    const rawInsertBefore = Node.prototype.insertBefore
    const rawReplaceChild = Node.prototype.replaceChild
    const rawRemoveChild = Node.prototype.removeChild
    const rawAppend = Element.prototype.append
    const rawPrepend = Element.prototype.prepend

    const rawCreateElement = Document.prototype.createElement
    const rawCreateElementNS = Document.prototype.createElementNS
    const rawCreateDocumentFragment = Document.prototype.createDocumentFragment
    const rawQuerySelector = Document.prototype.querySelector
    const rawQuerySelectorAll = Document.prototype.querySelectorAll
    const rawGetElementById = Document.prototype.getElementById
    const rawGetElementsByClassName = Document.prototype.getElementsByClassName
    const rawGetElementsByTagName = Document.prototype.getElementsByTagName
    const rawGetElementsByName = Document.prototype.getElementsByName

    const rawWindow = Function('return window')()
    const rawDocument = Function('return document')()
    const supportModuleScript = isSupportModuleScript()
    const templateStyle: HTMLStyleElement = rawDocument.body.querySelector('#micro-app-template-style')

    /**
     * save effect raw methods
     * pay attention to this binding, especially setInterval, setTimeout, clearInterval, clearTimeout
     */
    const rawWindowAddEventListener = rawWindow.addEventListener
    const rawWindowRemoveEventListener = rawWindow.removeEventListener
    const rawSetInterval = rawWindow.setInterval
    const rawSetTimeout = rawWindow.setTimeout
    const rawClearInterval = rawWindow.clearInterval
    const rawClearTimeout = rawWindow.clearTimeout

    const rawDocumentAddEventListener = rawDocument.addEventListener
    const rawDocumentRemoveEventListener = rawDocument.removeEventListener

    // mark current application as base application
    window.__MICRO_APP_BASE_APPLICATION__ = true

    Object.assign(globalEnv, {
      // source/patch
      rawSetAttribute,
      rawAppendChild,
      rawInsertBefore,
      rawReplaceChild,
      rawRemoveChild,
      rawAppend,
      rawPrepend,
      rawCreateElement,
      rawCreateElementNS,
      rawCreateDocumentFragment,
      rawQuerySelector,
      rawQuerySelectorAll,
      rawGetElementById,
      rawGetElementsByClassName,
      rawGetElementsByTagName,
      rawGetElementsByName,

      // common global vars
      rawWindow,
      rawDocument,
      supportModuleScript,
      templateStyle,

      // sandbox/effect
      rawWindowAddEventListener,
      rawWindowRemoveEventListener,
      rawSetInterval,
      rawSetTimeout,
      rawClearInterval,
      rawClearTimeout,
      rawDocumentAddEventListener,
      rawDocumentRemoveEventListener,
    })
  }
}

export default globalEnv
