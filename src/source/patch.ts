import type {
  Func,
  AppInterface,
} from '@micro-app/types'
import {
  appInstanceMap,
  isIframeSandbox,
} from '../create_app'
import {
  CompletionPath,
  getCurrentAppName,
  pureCreateElement,
  removeDomScope,
  isInvalidQuerySelectorKey,
  isUniqueElement,
  isProxyDocument,
  isFunction,
  isElement,
  isNode,
  rawDefineProperty,
  rawDefineProperties,
  isLinkElement,
  isStyleElement,
  isScriptElement,
  isIFrameElement,
  isMicroAppBody,
  isMicroAppHead,
  isNull,
  getIframeCurrentAppName,
  isDocumentFragment,
  isDocumentShadowRoot,
  isImageElement,
  isVideoElement,
  isAudioElement,
  defer,
} from '../libs/utils'
import scopedCSS from '../sandbox/scoped_css'
import {
  extractLinkFromHtml,
  formatDynamicLink,
  getAutoRemoveObserver,
} from './links'
import {
  extractScriptElement,
  runDynamicInlineScript,
  runDynamicRemoteScript,
  checkExcludeUrl,
  checkIgnoreUrl,
} from './scripts'
import {
  fixReactHMRConflict,
  updateElementInfo,
} from '../sandbox/adapter'
import microApp from '../micro_app'
import globalEnv from '../libs/global_env'

// Record element and map element
const dynamicElementInMicroAppMap = new WeakMap<Node, Element | Comment>()

// Get the map element
function getMappingNode(node: Node): Node {
  return dynamicElementInMicroAppMap.get(node) ?? node
}

/**
 * Process the new node and format the style, link and script element
 * @param child new node
 * @param app app
 */
function handleNewNode(child: Node, app: AppInterface): Node {
  if (dynamicElementInMicroAppMap.has(child)) {
    return dynamicElementInMicroAppMap.get(child)!
  } else if (isStyleElement(child)) {
    if (child.hasAttribute('exclude')) {
      const replaceComment = document.createComment('style element with exclude attribute ignored by micro-app')
      dynamicElementInMicroAppMap.set(child, replaceComment)
      return replaceComment
    } else if (app.scopecss && !child.hasAttribute('ignore')) {
      return scopedCSS(child, app)
    }
    return child
  } else if (isLinkElement(child)) {
    if (child.hasAttribute('exclude') || checkExcludeUrl(child.getAttribute('href'), app.name)) {
      const linkReplaceComment = document.createComment('link element with exclude attribute ignored by micro-app')
      dynamicElementInMicroAppMap.set(child, linkReplaceComment)
      return linkReplaceComment
    } else if (
      child.hasAttribute('ignore') ||
      checkIgnoreUrl(child.getAttribute('href'), app.name) ||
      (
        child.href &&
        isFunction(microApp.options.excludeAssetFilter) &&
        microApp.options.excludeAssetFilter(child.href)
      )
    ) {
      return child
    }

    const { address, linkInfo, replaceComment } = extractLinkFromHtml(
      child,
      null,
      app,
      true,
    )

    if (address && linkInfo) {
      const replaceStyle = formatDynamicLink(address, app, linkInfo, child)
      dynamicElementInMicroAppMap.set(child, replaceStyle)

      // mini-css-extract-plugin in hmr mode updates css by finding the <link /> element and replacing it.
      // so we need to insert the disabled link after the convertStyle
      defer(() => {
        globalEnv.rawSetAttribute.call(child, 'disabled', 'true')
        globalEnv.rawInsertAdjacentElement.call(replaceStyle, 'afterend', child)
        const observer = getAutoRemoveObserver(replaceStyle, child)
        if (replaceStyle.parentElement) {
          observer.observe(replaceStyle.parentElement, { childList: true })
        }
      })
      return replaceStyle
    } else if (replaceComment) {
      dynamicElementInMicroAppMap.set(child, replaceComment)
      return replaceComment
    }

    return child
  } else if (isScriptElement(child)) {
    if (
      child.src &&
      isFunction(microApp.options.excludeAssetFilter) &&
      microApp.options.excludeAssetFilter(child.src)
    ) {
      return child
    }

    const { replaceComment, address, scriptInfo } = extractScriptElement(
      child,
      null,
      app,
      true,
    ) || {}

    if (address && scriptInfo) {
      // remote script or inline script
      const replaceElement: HTMLScriptElement | Comment = scriptInfo.isExternal ? runDynamicRemoteScript(address, app, scriptInfo, child) : runDynamicInlineScript(address, app, scriptInfo)
      dynamicElementInMicroAppMap.set(child, replaceElement)
      return replaceElement
    } else if (replaceComment) {
      dynamicElementInMicroAppMap.set(child, replaceComment)
      return replaceComment
    }

    return child
  }

  return child
}

/**
 * Handle the elements inserted into head and body, and execute normally in other cases
 * @param app app
 * @param method raw method
 * @param parent parent node
 * @param targetNode target node
 * @param passiveNode second param of insertBefore and replaceChild
 */
function invokePrototypeMethod(
  app: AppInterface,
  rawMethod: Func,
  parent: Node,
  targetNode: Node,
  passiveNode?: Node | null,
): any {
  const hijackParent = getHijackParent(parent, targetNode, app)
  if (hijackParent) {
    /**
     * If parentNode is <micro-app-body>, return rawDocument.body
     * Scenes:
     *  1. element-ui@2/lib/utils/vue-popper.js
     *    if (this.popperElm.parentNode === document.body) ...
     * WARNING:
     *  1. When operate child from parentNode async, may have been unmount
     *    e.g. target.parentNode.remove(target)
     * ISSUE:
     *  1. https://github.com/jd-opensource/micro-app/issues/739
     *    Solution: Return the true value when node not in document
     */
    if (
      !isIframeSandbox(app.name) &&
      isMicroAppBody(hijackParent) &&
      rawMethod !== globalEnv.rawRemoveChild
    ) {
      const descriptor = Object.getOwnPropertyDescriptor(targetNode, 'parentNode')
      if ((!descriptor || descriptor.configurable) && !targetNode.__MICRO_APP_HAS_DPN__) {
        rawDefineProperties(targetNode, {
          parentNode: {
            configurable: true,
            get() {
              const result: ParentNode = globalEnv.rawParentNodeDesc.get.call(this)
              if (isMicroAppBody(result) && app.container) {
                // TODO: remove getRootElementParentNode
                return microApp.options.getRootElementParentNode?.(this, app.name) || document.body
              }
              return result
            },
          },
          __MICRO_APP_HAS_DPN__: {
            configurable: true,
            get: () => true,
          }
        })
      }
    }

    if (
      __DEV__ &&
      isIFrameElement(targetNode) &&
      rawMethod === globalEnv.rawAppendChild
    ) {
      fixReactHMRConflict(app)
    }

    /**
     * 1. If passiveNode exists, it must be insertBefore or replaceChild
     * 2. When removeChild, targetNode may not be in microAppHead or head
     * NOTE:
     *  1. If passiveNode not in hijackParent, insertBefore replaceChild will be degraded to appendChild
     *    E.g: document.head.replaceChild(targetNode, document.scripts[0])
     *  2. If passiveNode not in hijackParent but in parent and method is insertBefore, try insert it into the position corresponding to hijackParent
     *    E.g: document.head.insertBefore(targetNode, document.head.childNodes[0])
     *    ISSUE: https://github.com/jd-opensource/micro-app/issues/1071
     */
    if (passiveNode && !hijackParent.contains(passiveNode)) {
      if (rawMethod === globalEnv.rawInsertBefore && parent.contains(passiveNode)) {
        const indexOfParent = Array.from(parent.childNodes).indexOf(passiveNode as ChildNode)
        if (hijackParent.childNodes[indexOfParent]) {
          return invokeRawMethod(rawMethod, hijackParent, targetNode, hijackParent.childNodes[indexOfParent], app)
        }
      }
      return globalEnv.rawAppendChild.call(hijackParent, targetNode)
    } else if (rawMethod === globalEnv.rawRemoveChild && !hijackParent.contains(targetNode)) {
      if (parent.contains(targetNode)) {
        return rawMethod.call(targetNode.parentElement, targetNode)
      }
      return targetNode
    }

    return invokeRawMethod(rawMethod, hijackParent, targetNode, passiveNode, app)
  }

  return invokeRawMethod(rawMethod, parent, targetNode, passiveNode, app)
}

// head/body map to micro-app-head/micro-app-body
function getHijackParent(
  parent: Node,
  targetNode: Node,
  app: AppInterface,
): HTMLElement | null | undefined {
  if (app) {
    if (parent === document.head) {
      if (app.iframe && isScriptElement(targetNode)) {
        return app.sandBox.microHead
      }
      return app.querySelector<HTMLElement>('micro-app-head')
    }
    if (parent === document.body || parent === document.body.parentNode) {
      if (app.iframe && isScriptElement(targetNode)) {
        return app.sandBox.microBody
      }
      return app.querySelector<HTMLElement>('micro-app-body')
    }
    if (app.iframe && isScriptElement(targetNode)) {
      return app.sandBox.microBody
    }
  }
  return null
}

function invokeRawMethod(
  rawMethod: Func,
  parent: Node,
  targetNode: Node,
  passiveNode?: Node | null,
  app?: AppInterface,
) {
  if (isPendMethod(rawMethod)) {
    /**
     * In iframe sandbox, script will pend to iframe.body, so we should reset rawMethod, because:
     * Element.prototype.append === DocumentFragment.prototype.append ==> false
     * Element.prototype.prepend === DocumentFragment.prototype.prepend ==> false
     */
    if (app?.iframe && isScriptElement(targetNode)) {
      if (rawMethod === globalEnv.rawFragmentAppend) {
        rawMethod = globalEnv.rawAppend
      } else if (rawMethod === globalEnv.rawFragmentPrepend) {
        rawMethod = globalEnv.rawPrepend
      }
    }
    return rawMethod.call(parent, targetNode)
  }

  return rawMethod.call(parent, targetNode, passiveNode)
}

function isPendMethod(method: CallableFunction) {
  return (
    method === globalEnv.rawAppend ||
    method === globalEnv.rawPrepend ||
    method === globalEnv.rawFragmentAppend ||
    method === globalEnv.rawFragmentPrepend
  )
}

/**
 * Attempt to complete the static resource address again before insert the node
 * @param app app instance
 * @param newChild target node
 */
function completePathDynamic(app: AppInterface, newChild: Node): void {
  if (isElement(newChild)) {
    if (/^(img|script)$/i.test(newChild.tagName)) {
      if (newChild.hasAttribute('src')) {
        globalEnv.rawSetAttribute.call(newChild, 'src', CompletionPath(newChild.getAttribute('src')!, app.url))
      }
      if (newChild.hasAttribute('srcset')) {
        globalEnv.rawSetAttribute.call(newChild, 'srcset', CompletionPath(newChild.getAttribute('srcset')!, app.url))
      }
    } else if ((/^(link|image)$/i.test(newChild.tagName) && newChild.hasAttribute('href')) ||
          // If it is the anchor tag,eg. <a href="#xxx"/>, the path will not be completed
          (/^(a)$/i.test(newChild.tagName) && newChild.hasAttribute('href') && !/^#/.test(newChild.getAttribute('href') || ''))
    ) {
      const aHrefResolver = microApp?.options?.aHrefResolver
      const hrefValue = newChild.getAttribute('href')!
      let nextHrefValue
      if ((/^(a)$/i.test(newChild.tagName) && typeof aHrefResolver === 'function')) {
        nextHrefValue = aHrefResolver(hrefValue, app.name, app.url)
      } else {
        nextHrefValue = CompletionPath(hrefValue, app.url)
      }
      globalEnv.rawSetAttribute.call(newChild, 'href', nextHrefValue)
    }
  }
}

/**
 * method of handle new node
 * @param parent parent node
 * @param newChild new node
 * @param passiveNode passive node
 * @param rawMethod method
 */
function commonElementHandler(
  parent: Node,
  newChild: Node,
  passiveNode: Node | null,
  rawMethod: Func,
) {
  const currentAppName = getCurrentAppName()
  if (
    isNode(newChild) &&
    !newChild.__PURE_ELEMENT__ &&
    (
      newChild.__MICRO_APP_NAME__ ||
      currentAppName
    )
  ) {
    updateElementInfo(newChild, newChild.__MICRO_APP_NAME__ || currentAppName)
    const app = appInstanceMap.get(newChild.__MICRO_APP_NAME__!)
    if (app?.container) {
      if (isStyleElement(newChild)) {
        parent.getRootNode() instanceof ShadowRoot && newChild.setAttribute('ignore', 'true')
      }
      completePathDynamic(app, newChild)
      return invokePrototypeMethod(
        app,
        rawMethod,
        parent,
        handleNewNode(newChild, app),
        passiveNode && getMappingNode(passiveNode),
      )
    }
  }

  return invokeRawMethod(rawMethod, parent, newChild, passiveNode)
}

/**
 * Rewrite element prototype method
 */
export function patchElementAndDocument(): void {
  patchDocument()

  const rawRootElement = globalEnv.rawRootElement
  const rawRootNode = globalEnv.rawRootNode
  const rawDocumentFragment = globalEnv.rawDocumentFragment

  // prototype methods of add element👇
  rawRootNode.prototype.appendChild = function appendChild<T extends Node>(newChild: T): T {
    return commonElementHandler(this, newChild, null, globalEnv.rawAppendChild)
  }

  rawRootNode.prototype.insertBefore = function insertBefore<T extends Node>(newChild: T, refChild: Node | null): T {
    return commonElementHandler(this, newChild, refChild, globalEnv.rawInsertBefore)
  }

  rawRootNode.prototype.replaceChild = function replaceChild<T extends Node>(newChild: Node, oldChild: T): T {
    return commonElementHandler(this, newChild, oldChild, globalEnv.rawReplaceChild)
  }

  // prototype methods of delete element👇
  rawRootNode.prototype.removeChild = function removeChild<T extends Node>(oldChild: T): T {
    if (oldChild?.__MICRO_APP_NAME__) {
      const app = appInstanceMap.get(oldChild.__MICRO_APP_NAME__)
      if (app?.container) {
        return invokePrototypeMethod(
          app,
          globalEnv.rawRemoveChild,
          this,
          getMappingNode(oldChild),
        )
      }
      try {
        return globalEnv.rawRemoveChild.call(this, oldChild) as T
      } catch {
        return (oldChild?.parentNode && globalEnv.rawRemoveChild.call(oldChild.parentNode, oldChild)) as T
      }
    }

    return globalEnv.rawRemoveChild.call(this, oldChild) as T
  }

  rawDocumentFragment.prototype.append = rawRootElement.prototype.append = function append(...nodes: (Node | string)[]): void {
    let i = 0
    while (i < nodes.length) {
      let node = nodes[i]
      node = isNode(node) ? node : globalEnv.rawCreateTextNode.call(globalEnv.rawDocument, node)
      commonElementHandler(
        this,
        markElement(node as Node),
        null,
        isDocumentFragment(this) ? globalEnv.rawFragmentAppend : globalEnv.rawAppend,
      )
      i++
    }
  }

  rawDocumentFragment.prototype.prepend = rawRootElement.prototype.prepend = function prepend(...nodes: (Node | string)[]): void {
    let i = nodes.length
    let target = globalEnv.rawPrepend
    if (isDocumentFragment(this) || isDocumentShadowRoot(this)) {
      target = globalEnv.rawFragmentPrepend
    }

    while (i > 0) {
      let node = nodes[i - 1]
      node = isNode(node) ? node : globalEnv.rawCreateTextNode.call(globalEnv.rawDocument, node)
      commonElementHandler(
        this,
        markElement(node as Node),
        null,
        target,
      )
      i--
    }
  }

  /**
   * The insertAdjacentElement method of the Element interface inserts a given element node at a given position relative to the element it is invoked upon.
   * NOTE:
   *  1. parameter 2 of insertAdjacentElement must type 'Element'
   */
  rawRootElement.prototype.insertAdjacentElement = function (where: InsertPosition, element: Element): Element | null {
    if (element?.__MICRO_APP_NAME__ && isElement(element)) {
      const app = appInstanceMap.get(element.__MICRO_APP_NAME__)
      if (app?.container) {
        const processedEle = handleNewNode(element, app) as Element
        if (!isElement(processedEle)) return element
        const realParent = getHijackParent(this, processedEle, app) ?? this
        return globalEnv.rawInsertAdjacentElement.call(realParent, where, processedEle)
      }
    }
    return globalEnv.rawInsertAdjacentElement.call(this, where, element)
  }

  /**
   * document.body(head).querySelector(querySelectorAll) hijack to microAppBody(microAppHead).querySelector(querySelectorAll)
   * NOTE:
   *  1. May cause some problems!
   *  2. Add config options?
   */
  function getElementQueryTarget(targetNode: Node): Node | null {
    const currentAppName = getIframeCurrentAppName() || getCurrentAppName()
    if ((targetNode === document.body || targetNode === document.head) && currentAppName) {
      const app = appInstanceMap.get(currentAppName)
      if (app?.container) {
        if (targetNode === document.body) {
          return app.querySelector<HTMLElement>('micro-app-body')
        } else if (targetNode === document.head) {
          return app.querySelector<HTMLElement>('micro-app-head')
        }
      }
    }
    return targetNode
  }

  /**
   * In iframe sandbox, script will render to iframe instead of micro-app-body
   * So when query elements, we need to search both micro-app and iframe
   * @param isEmpty get empty result
   * @param targetNode targetNode element
   * @param result origin result
   * @param selectors selectors
   * @param methodName querySelector or querySelectorAll
   */
  function getElementQueryResult<T>(
    isEmpty: boolean,
    targetNode: Node,
    result: T,
    selectors: string,
    methodName: string,
  ): T {
    if (isEmpty) {
      const currentAppName = getIframeCurrentAppName() || getCurrentAppName()
      if (currentAppName && isIframeSandbox(currentAppName)) {
        const app = appInstanceMap.get(currentAppName)!
        if (isMicroAppHead(targetNode)) {
          return app.sandBox.microHead[methodName](selectors)
        }
        if (isMicroAppBody(targetNode)) {
          return app.sandBox.microBody[methodName](selectors)
        }
      }
    }
    return result
  }

  rawRootElement.prototype.querySelector = function querySelector(selectors: string): Node | null {
    const _this = getElementQueryTarget(this) ?? this
    const result = globalEnv.rawElementQuerySelector.call(_this, selectors)
    return getElementQueryResult<Node | null>(
      isNull(result) && _this !== this,
      _this,
      result,
      selectors,
      'querySelector',
    )
  }

  rawRootElement.prototype.querySelectorAll = function querySelectorAll(selectors: string): NodeListOf<Node> {
    const _this = getElementQueryTarget(this) ?? this
    const result = globalEnv.rawElementQuerySelectorAll.call(_this, selectors)
    return getElementQueryResult<NodeListOf<Node>>(
      !result.length && _this !== this,
      _this,
      result,
      selectors,
      'querySelectorAll',
    )
  }

  // rewrite setAttribute, complete resource address
  rawRootElement.prototype.setAttribute = function setAttribute(key: string, value: any): void {
    if (
      /^micro-app(-\S+)?/i.test(this.tagName) &&
      key === 'data' &&
      this.setAttribute !== rawRootElement.prototype.setAttribute
    ) {
      this.setAttribute(key, value)
    } else {
      const appName = this.__MICRO_APP_NAME__ || getCurrentAppName()
      if (
        appName &&
        appInstanceMap.has(appName) &&
        (
          ((key === 'src' || key === 'srcset') && /^(img|script|video|audio|source|embed)$/i.test(this.tagName)) ||
          (key === 'href' && /^(link|image)$/i.test(this.tagName)) ||
          // If it is the anchor tag,eg. <a href="#xxx"/>, the path will not be completed
          (key === 'href' && /^(a)$/i.test(this.tagName) && !/^#/.test(value))
        )

      ) {
        const app = appInstanceMap.get(appName)
        const aHrefResolver = microApp?.options?.aHrefResolver
        if (key === 'href' && /^a$/i.test(this.tagName) && typeof aHrefResolver === 'function') {
          value = aHrefResolver(value, appName, app!.url)
        } else {
          value = CompletionPath(value, app!.url)
        }
      }
      globalEnv.rawSetAttribute.call(this, key, value)
      if (isImageElement(this) || isVideoElement(this) || isAudioElement(this)) {
        let includeCrossOrigin = false
        if (microApp?.options?.includeCrossOrigin && isFunction(microApp.options.includeCrossOrigin)) {
          includeCrossOrigin = microApp.options.includeCrossOrigin(value)
        }
        // @ts-ignore
        includeCrossOrigin && (node.crossOrigin = 'anonymous')
      }
    }
  }

  /**
   * TODO: 兼容直接通过img.src等操作设置的资源
   * NOTE:
   *  1. 卸载时恢复原始值
   *  2. 循环嵌套的情况
   *  3. 放在global_env中统一处理
   *  4. 是否和completePathDynamic的作用重复？
   */
  // const protoAttrList: Array<[HTMLElement, string]> = [
  //   [HTMLImageElement.prototype, 'src'],
  //   [HTMLScriptElement.prototype, 'src'],
  //   [HTMLLinkElement.prototype, 'href'],
  // ]

  // protoAttrList.forEach(([target, attr]) => {
  //   const { enumerable, configurable, get, set } = Object.getOwnPropertyDescriptor(target, attr) || {
  //     enumerable: true,
  //     configurable: true,
  //   }

  //   rawDefineProperty(target, attr, {
  //     enumerable,
  //     configurable,
  //     get: function () {
  //       return get?.call(this)
  //     },
  //     set: function (value) {
  //       const currentAppName = this.__MICRO_APP_NAME__ || getCurrentAppName()
  //       if (currentAppName && appInstanceMap.has(currentAppName)) {
  //         const app = appInstanceMap.get(currentAppName)
  //         value = CompletionPath(value, app!.url)
  //       }
  //       set?.call(this, value)
  //     },
  //   })
  // })

  rawDefineProperty(rawRootNode.prototype, 'parentNode', {
    configurable: true,
    enumerable: true,
    get() {
      /**
       * hijack parentNode of html for with sandbox
       * Scenes:
       *  1. element-ui@2/lib/utils/popper.js
       *    // root is child app window, so root.document is proxyDocument or microDocument
       *    if (element.parentNode === root.document) ...
      */
      const currentAppName = getIframeCurrentAppName() || getCurrentAppName()
      if (currentAppName && this === globalEnv.rawDocument.firstElementChild) {
        const microDocument = appInstanceMap.get(currentAppName)?.sandBox?.proxyWindow?.document
        if (microDocument) return microDocument
      }
      // NOTE: run after hijack html.parentNode
      const result = globalEnv.rawParentNodeDesc.get.call(this)
      /**
       * If parentNode is <micro-app-body>, return rawDocument.body
       * Scenes:
       *  1. element-ui@2/lib/utils/vue-popper.js
       *    if (this.popperElm.parentNode === document.body) ...
       * WARNING:
       *  Will it cause other problems ?
       *  e.g. target.parentNode.remove(target)
       * BUG:
       *  1. vue2 umdMode, throw error when render again (<div id='app'></div> will be deleted when render again ) -- Abandon this way at 2023.2.28 before v1.0.0-beta.0, it will cause vue2 throw error when render again
       */
      // if (isMicroAppBody(result) && appInstanceMap.get(this.__MICRO_APP_NAME__)?.container) {
      //   return document.body
      // }
      return result
    },
  })

  rawDefineProperty(rawRootElement.prototype, 'innerHTML', {
    configurable: true,
    enumerable: true,
    get() {
      return globalEnv.rawInnerHTMLDesc.get.call(this)
    },
    set(code: string) {
      globalEnv.rawInnerHTMLDesc.set.call(this, code)
      const currentAppName = this.__MICRO_APP_NAME__ || getIframeCurrentAppName() || getCurrentAppName()
      Array.from(this.children).forEach((child) => {
        if (isElement(child) && currentAppName) {
          updateElementInfo(child, currentAppName)
        }
      })
    }
  })

  // patch cloneNode
  rawRootNode.prototype.cloneNode = function cloneNode(deep?: boolean): Node {
    const clonedNode = globalEnv.rawCloneNode.call(this, deep)
    return updateElementInfo(clonedNode, this.__MICRO_APP_NAME__)
  }
}

/**
 * Mark the newly created element in the micro application
 * @param element new element
 */
function markElement<T extends Node>(element: T): T {
  return updateElementInfo(element, getCurrentAppName())
}

// methods of document
function patchDocument() {
  const rawDocument = globalEnv.rawDocument
  const rawRootDocument = globalEnv.rawRootDocument

  function getBindTarget(target: Document): Document {
    return isProxyDocument(target) ? rawDocument : target
  }

  // create element 👇
  rawRootDocument.prototype.createElement = function createElement(
    tagName: string,
    options?: ElementCreationOptions,
  ): HTMLElement {
    const element = globalEnv.rawCreateElement.call(getBindTarget(this), tagName, options)
    return markElement(element)
  }

  rawRootDocument.prototype.createElementNS = function createElementNS(
    namespaceURI: string,
    name: string,
    options?: string | ElementCreationOptions,
  ): any {
    const element = globalEnv.rawCreateElementNS.call(getBindTarget(this), namespaceURI, name, options)
    return markElement(element)
  }

  // TODO: 放开
  // rawRootDocument.prototype.createTextNode = function createTextNode (data: string): Text {
  //   const element = globalEnv.rawCreateTextNode.call(getBindTarget(this), data)
  //   return markElement(element)
  // }

  rawRootDocument.prototype.createDocumentFragment = function createDocumentFragment(): DocumentFragment {
    const element = globalEnv.rawCreateDocumentFragment.call(getBindTarget(this))
    return markElement(element)
  }

  rawRootDocument.prototype.createComment = function createComment(data: string): Comment {
    const element = globalEnv.rawCreateComment.call(getBindTarget(this), data)
    return markElement(element)
  }

  // query element👇
  function querySelector(this: Document, selectors: string): any {
    const _this = getBindTarget(this)
    const currentAppName = getCurrentAppName()
    if (
      !currentAppName ||
      !selectors ||
      isUniqueElement(selectors) ||
      // ISSUE: https://github.com/jd-opensource/micro-app/issues/56
      rawDocument !== _this
    ) {
      return globalEnv.rawQuerySelector.call(_this, selectors)
    }

    return appInstanceMap.get(currentAppName)?.querySelector(selectors) ?? null
  }

  function querySelectorAll(this: Document, selectors: string): any {
    const _this = getBindTarget(this)
    const currentAppName = getCurrentAppName()
    if (
      !currentAppName ||
      !selectors ||
      isUniqueElement(selectors) ||
      rawDocument !== _this
    ) {
      return globalEnv.rawQuerySelectorAll.call(_this, selectors)
    }

    return appInstanceMap.get(currentAppName)?.querySelectorAll(selectors) ?? []
  }

  rawRootDocument.prototype.querySelector = querySelector
  rawRootDocument.prototype.querySelectorAll = querySelectorAll

  rawRootDocument.prototype.getElementById = function getElementById(this: Document, key: string): HTMLElement | null {
    const _this = getBindTarget(this)
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementById.call(_this, key)
    }

    try {
      return querySelector.call(_this, `#${key}`)
    } catch {
      return globalEnv.rawGetElementById.call(_this, key)
    }
  }

  rawRootDocument.prototype.getElementsByClassName = function getElementsByClassName(this: Document, key: string): HTMLCollectionOf<Element> {
    const _this = getBindTarget(this)
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementsByClassName.call(_this, key)
    }

    try {
      return querySelectorAll.call(_this, `.${key}`)
    } catch {
      return globalEnv.rawGetElementsByClassName.call(_this, key)
    }
  }

  rawRootDocument.prototype.getElementsByTagName = function getElementsByTagName(this: Document, key: string): HTMLCollectionOf<Element> {
    const _this = getBindTarget(this)
    const currentAppName = getCurrentAppName()
    if (
      !currentAppName ||
      isUniqueElement(key) ||
      isInvalidQuerySelectorKey(key) ||
      (!appInstanceMap.get(currentAppName)?.inline && /^script$/i.test(key))
    ) {
      return globalEnv.rawGetElementsByTagName.call(_this, key)
    }

    try {
      return querySelectorAll.call(_this, key)
    } catch {
      return globalEnv.rawGetElementsByTagName.call(_this, key)
    }
  }

  rawRootDocument.prototype.getElementsByName = function getElementsByName(this: Document, key: string): NodeListOf<HTMLElement> {
    const _this = getBindTarget(this)
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementsByName.call(_this, key)
    }

    try {
      return querySelectorAll.call(_this, `[name=${key}]`)
    } catch {
      return globalEnv.rawGetElementsByName.call(_this, key)
    }
  }
}

function releasePatchDocument(): void {
  const rawRootDocument = globalEnv.rawRootDocument
  rawRootDocument.prototype.createElement = globalEnv.rawCreateElement
  rawRootDocument.prototype.createElementNS = globalEnv.rawCreateElementNS
  rawRootDocument.prototype.createDocumentFragment = globalEnv.rawCreateDocumentFragment
  rawRootDocument.prototype.querySelector = globalEnv.rawQuerySelector
  rawRootDocument.prototype.querySelectorAll = globalEnv.rawQuerySelectorAll
  rawRootDocument.prototype.getElementById = globalEnv.rawGetElementById
  rawRootDocument.prototype.getElementsByClassName = globalEnv.rawGetElementsByClassName
  rawRootDocument.prototype.getElementsByTagName = globalEnv.rawGetElementsByTagName
  rawRootDocument.prototype.getElementsByName = globalEnv.rawGetElementsByName
}

// release patch
export function releasePatchElementAndDocument(): void {
  removeDomScope()
  releasePatchDocument()

  const rawRootElement = globalEnv.rawRootElement
  const rawRootNode = globalEnv.rawRootNode
  rawRootNode.prototype.appendChild = globalEnv.rawAppendChild
  rawRootNode.prototype.insertBefore = globalEnv.rawInsertBefore
  rawRootNode.prototype.replaceChild = globalEnv.rawReplaceChild
  rawRootNode.prototype.removeChild = globalEnv.rawRemoveChild
  rawRootNode.prototype.cloneNode = globalEnv.rawCloneNode
  rawRootElement.prototype.append = globalEnv.rawAppend
  rawRootElement.prototype.prepend = globalEnv.rawPrepend
  rawRootElement.prototype.querySelector = globalEnv.rawElementQuerySelector
  rawRootElement.prototype.querySelectorAll = globalEnv.rawElementQuerySelectorAll
  rawRootElement.prototype.setAttribute = globalEnv.rawSetAttribute
  rawDefineProperty(rawRootNode.prototype, 'parentNode', globalEnv.rawParentNodeDesc)
  rawDefineProperty(rawRootElement.prototype, 'innerHTML', globalEnv.rawInnerHTMLDesc)
}

// Set the style of micro-app-head and micro-app-body
let hasRejectMicroAppStyle = false
export function rejectMicroAppStyle(): void {
  if (!hasRejectMicroAppStyle) {
    hasRejectMicroAppStyle = true
    const style = pureCreateElement('style')
    globalEnv.rawSetAttribute.call(style, 'type', 'text/css')
    style.textContent = `\n${microApp.tagName}, micro-app-body { display: block; } \nmicro-app-head { display: none; }`
    globalEnv.rawDocument.head.appendChild(style)
  }
}
