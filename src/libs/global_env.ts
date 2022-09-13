import { isSupportModuleScript, isBrowser, getCurrentAppName } from './utils'
import { rejectMicroAppStyle } from '../source/patch'
import { listenUmountOfNestedApp, releaseUnmountOfNestedApp } from '../libs/additional'

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
    __MICRO_APP_ENVIRONMENT__?: boolean
    __MICRO_APP_UMD_MODE__?: boolean
    __MICRO_APP_BASE_APPLICATION__?: boolean
  }

  interface Node {
    __MICRO_APP_NAME__?: string | null
    data?: any
  }

  interface HTMLStyleElement {
    __MICRO_APP_LINK_PATH__?: string
    __MICRO_APP_HAS_SCOPED__?: boolean
  }
}

const globalEnv: Record<string, any> = {}

/**
 * Note loop nesting
 * Only prototype or unique values can be put here
 */
export function initGlobalEnv (): void {
  if (isBrowser) {
    /**
     * save patch raw methods
     * pay attention to this binding
     */
    const rawSetAttribute = Element.prototype.setAttribute
    const rawAppendChild = Element.prototype.appendChild
    const rawInsertBefore = Element.prototype.insertBefore
    const rawReplaceChild = Element.prototype.replaceChild
    const rawRemoveChild = Element.prototype.removeChild
    const rawAppend = Element.prototype.append
    const rawPrepend = Element.prototype.prepend
    const rawCloneNode = Element.prototype.cloneNode
    const rawElementQuerySelector = Element.prototype.querySelector
    const rawElementQuerySelectorAll = Element.prototype.querySelectorAll
    // const rawGetBoundingClientRect = Element.prototype.getBoundingClientRect

    const rawCreateElement = Document.prototype.createElement
    const rawCreateElementNS = Document.prototype.createElementNS
    const rawCreateDocumentFragment = Document.prototype.createDocumentFragment
    const rawQuerySelector = Document.prototype.querySelector
    const rawQuerySelectorAll = Document.prototype.querySelectorAll
    const rawGetElementById = Document.prototype.getElementById
    const rawGetElementsByClassName = Document.prototype.getElementsByClassName
    const rawGetElementsByTagName = Document.prototype.getElementsByTagName
    const rawGetElementsByName = Document.prototype.getElementsByName

    const ImageProxy = new Proxy(Image, {
      construct (Target, args): HTMLImageElement {
        const elementImage = new Target(...args)
        elementImage.__MICRO_APP_NAME__ = getCurrentAppName()
        return elementImage
      },
    })

    const rawWindow = Function('return window')()
    const rawDocument = Function('return document')()
    const supportModuleScript = isSupportModuleScript()

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
      rawCloneNode,
      rawElementQuerySelector,
      rawElementQuerySelectorAll,
      // rawGetBoundingClientRect,
      rawCreateElement,
      rawCreateElementNS,
      rawCreateDocumentFragment,
      rawQuerySelector,
      rawQuerySelectorAll,
      rawGetElementById,
      rawGetElementsByClassName,
      rawGetElementsByTagName,
      rawGetElementsByName,
      ImageProxy,

      // common global vars
      rawWindow,
      rawDocument,
      supportModuleScript,

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

    // global effect
    rejectMicroAppStyle()
    releaseUnmountOfNestedApp()
    listenUmountOfNestedApp()
  }
}

export default globalEnv
