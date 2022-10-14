import type { Func, AppInterface, NormalKey } from '@micro-app/types'
import { appInstanceMap } from '../create_app'
import {
  CompletionPath,
  getCurrentAppName,
  pureCreateElement,
  removeDomScope,
  logWarn,
  isPlainObject,
  isString,
  isInvalidQuerySelectorKey,
  isUniqueElement,
  isProxyDocument,
  isFunction,
  isElement,
  isNode,
  rawDefineProperty,
} from '../libs/utils'
import scopedCSS from '../sandbox/scoped_css'
import { extractLinkFromHtml, formatDynamicLink } from './links'
import {
  extractScriptElement,
  runDynamicInlineScript,
  runDynamicRemoteScript,
  checkExcludeUrl,
  checkIgnoreUrl,
} from './scripts'
import microApp from '../micro_app'
import globalEnv from '../libs/global_env'
import { fixReactHMRConflict } from '../sandbox/adapter'

// Record element and map element
const dynamicElementInMicroAppMap = new WeakMap<Node, Element | Comment>()

/**
 * Process the new node and format the style, link and script element
 * @param parent parent node
 * @param child new node
 * @param app app
 */
function handleNewNode (parent: Node, child: Node, app: AppInterface): Node {
  if (child instanceof HTMLStyleElement) {
    if (child.hasAttribute('exclude')) {
      const replaceComment = document.createComment('style element with exclude attribute ignored by micro-app')
      dynamicElementInMicroAppMap.set(child, replaceComment)
      return replaceComment
    } else if (app.scopecss && !child.hasAttribute('ignore')) {
      return scopedCSS(child, app)
    }
    return child
  } else if (child instanceof HTMLLinkElement) {
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
      parent,
      app,
      true,
    )

    if (address && linkInfo) {
      const replaceStyle = formatDynamicLink(address, app, linkInfo, child)
      dynamicElementInMicroAppMap.set(child, replaceStyle)
      return replaceStyle
    } else if (replaceComment) {
      dynamicElementInMicroAppMap.set(child, replaceComment)
      return replaceComment
    }

    return child
  } else if (child instanceof HTMLScriptElement) {
    if (
      child.src &&
      isFunction(microApp.options.excludeAssetFilter) &&
      microApp.options.excludeAssetFilter(child.src)
    ) {
      return child
    }

    const { replaceComment, address, scriptInfo } = extractScriptElement(
      child,
      parent,
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
 * @param targetChild target node
 * @param passiveChild second param of insertBefore and replaceChild
 */
function invokePrototypeMethod (
  app: AppInterface,
  rawMethod: Func,
  parent: Node,
  targetChild: Node,
  passiveChild?: Node | null,
): any {
  const hijackParent = getHijackParent(parent, app)
  /**
   * If passiveChild is not the child node, insertBefore replaceChild will have a problem, at this time, it will be degraded to appendChild
   * E.g: document.head.insertBefore(targetChild, document.head.childNodes[0])
   */
  if (hijackParent) {
    /**
     * WARNING:
     * Verifying that the parentNode of the targetChild points to document.body will cause other problems ?
     */
    if (hijackParent.tagName === 'MICRO-APP-BODY' && rawMethod !== globalEnv.rawRemoveChild) {
      const descriptor = Object.getOwnPropertyDescriptor(targetChild, 'parentNode')
      if (!descriptor || descriptor.configurable) {
        rawDefineProperty(targetChild, 'parentNode', {
          configurable: true,
          get () {
            /**
             * When operate child from parentNode async, may have been unmount
             * e.g.
             * target.parentNode.remove(target)
             */
            return !app.container ? hijackParent : document.body
          },
        })
      }
    }
    /**
     * 1. If passiveChild exists, it must be insertBefore or replaceChild
     * 2. When removeChild, targetChild may not be in microAppHead or head
     */
    if (passiveChild && !hijackParent.contains(passiveChild)) {
      return globalEnv.rawAppendChild.call(hijackParent, targetChild)
    } else if (rawMethod === globalEnv.rawRemoveChild && !hijackParent.contains(targetChild)) {
      if (parent.contains(targetChild)) {
        return rawMethod.call(parent, targetChild)
      }
      return targetChild
    }

    if (
      __DEV__ &&
      targetChild instanceof HTMLIFrameElement &&
      rawMethod === globalEnv.rawAppendChild
    ) {
      fixReactHMRConflict(app)
    }

    return invokeRawMethod(rawMethod, hijackParent, targetChild, passiveChild)
  }

  return invokeRawMethod(rawMethod, parent, targetChild, passiveChild)
}

// head/body map to micro-app-head/micro-app-body
function getHijackParent (node: Node, app: AppInterface): HTMLElement | null | undefined {
  if (node === document.head) {
    return app?.querySelector<HTMLElement>('micro-app-head')
  }
  if (node === document.body) {
    return app?.querySelector<HTMLElement>('micro-app-body')
  }
  return null
}

function invokeRawMethod (
  rawMethod: Func,
  parent: Node,
  targetChild: Node,
  passiveChild?: Node | null
) {
  if (isPendMethod(rawMethod)) {
    return rawMethod.call(parent, targetChild)
  }

  return rawMethod.call(parent, targetChild, passiveChild)
}

function isPendMethod (method: CallableFunction) {
  return method === globalEnv.rawAppend || method === globalEnv.rawPrepend
}

// Get the map element
function getMappingNode (node: Node): Node {
  return dynamicElementInMicroAppMap.get(node) ?? node
}

/**
 * method of handle new node
 * @param parent parent node
 * @param newChild new node
 * @param passiveChild passive node
 * @param rawMethod method
 */
function commonElementHandler (
  parent: Node,
  newChild: Node,
  passiveChild: Node | null,
  rawMethod: Func,
) {
  const currentAppName = getCurrentAppName()
  if (
    isNode(newChild) &&
    (
      newChild.__MICRO_APP_NAME__ ||
      (currentAppName && !newChild.__PURE_ELEMENT__)
    )
  ) {
    newChild.__MICRO_APP_NAME__ = newChild.__MICRO_APP_NAME__ || currentAppName!
    const app = appInstanceMap.get(newChild.__MICRO_APP_NAME__)
    if (app?.container) {
      if (isElement(newChild)) {
        if (/^(img|script|iframe)$/i.test(newChild.tagName)) {
          if (newChild.hasAttribute('src')) {
            globalEnv.rawSetAttribute.call(newChild, 'src', CompletionPath(newChild.getAttribute('src')!, app.url))
          }
          if (newChild.hasAttribute('srcset')) {
            globalEnv.rawSetAttribute.call(newChild, 'srcset', CompletionPath(newChild.getAttribute('srcset')!, app.url))
          }
        } else if (/^link$/i.test(newChild.tagName) && newChild.hasAttribute('href')) {
          globalEnv.rawSetAttribute.call(newChild, 'href', CompletionPath(newChild.getAttribute('href')!, app.url))
        }
      }

      return invokePrototypeMethod(
        app,
        rawMethod,
        parent,
        handleNewNode(parent, newChild, app),
        passiveChild && getMappingNode(passiveChild),
      )
    } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
      return rawMethod.call(parent, newChild)
    }
  } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
    if (!isNode(newChild) && currentAppName) {
      const app = appInstanceMap.get(currentAppName)
      if (app?.container) {
        if (parent === document.head) {
          return rawMethod.call(app.querySelector('micro-app-head'), newChild)
        } else if (parent === document.body) {
          return rawMethod.call(app.querySelector('micro-app-body'), newChild)
        }
      }
    }
    return rawMethod.call(parent, newChild)
  }

  return rawMethod.call(parent, newChild, passiveChild)
}

/**
 * Rewrite element prototype method
 */
export function patchElementPrototypeMethods (): void {
  patchDocument()

  // prototype methods of add element👇
  Element.prototype.appendChild = function appendChild<T extends Node> (newChild: T): T {
    return commonElementHandler(this, newChild, null, globalEnv.rawAppendChild)
  }

  Element.prototype.insertBefore = function insertBefore<T extends Node> (newChild: T, refChild: Node | null): T {
    return commonElementHandler(this, newChild, refChild, globalEnv.rawInsertBefore)
  }

  Element.prototype.replaceChild = function replaceChild<T extends Node> (newChild: Node, oldChild: T): T {
    return commonElementHandler(this, newChild, oldChild, globalEnv.rawReplaceChild)
  }

  Element.prototype.append = function append (...nodes: (Node | string)[]): void {
    let i = 0
    const length = nodes.length
    while (i < length) {
      commonElementHandler(this, nodes[i] as Node, null, globalEnv.rawAppend)
      i++
    }
  }

  Element.prototype.prepend = function prepend (...nodes: (Node | string)[]): void {
    let i = nodes.length
    while (i > 0) {
      commonElementHandler(this, nodes[i - 1] as Node, null, globalEnv.rawPrepend)
      i--
    }
  }

  // prototype methods of delete element👇
  Element.prototype.removeChild = function removeChild<T extends Node> (oldChild: T): T {
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

  // patch cloneNode
  Element.prototype.cloneNode = function cloneNode (deep?: boolean): Node {
    const clonedNode = globalEnv.rawCloneNode.call(this, deep)
    this.__MICRO_APP_NAME__ && (clonedNode.__MICRO_APP_NAME__ = this.__MICRO_APP_NAME__)
    return clonedNode
  }

  function getQueryTarget (node: Node): Node | null {
    const currentAppName = getCurrentAppName()
    if ((node === document.body || node === document.head) && currentAppName) {
      const app = appInstanceMap.get(currentAppName)
      if (app?.container) {
        if (node === document.body) {
          return app.querySelector('micro-app-body')
        } else if (node === document.head) {
          return app.querySelector('micro-app-head')
        }
      }
    }
    return null
  }

  Element.prototype.querySelector = function querySelector (selectors: string): Node | null {
    const target = getQueryTarget(this) ?? this
    return globalEnv.rawElementQuerySelector.call(target, selectors)
  }

  Element.prototype.querySelectorAll = function querySelectorAll (selectors: string): NodeListOf<Node> {
    const target = getQueryTarget(this) ?? this
    return globalEnv.rawElementQuerySelectorAll.call(target, selectors)
  }

  rawDefineProperty(Element.prototype, 'innerHTML', {
    get () {
      return globalEnv.rawInnerHTMLDesc.get.call(this)
    },
    set (code: string) {
      globalEnv.rawInnerHTMLDesc.set.call(this, code)
      const currentAppName = getCurrentAppName()
      Array.from(this.children).forEach((child) => {
        if (isElement(child) && currentAppName) {
          child.__MICRO_APP_NAME__ = currentAppName
        }
      })
    }
  })
}

/**
 * Mark the newly created element in the micro application
 * @param element new element
 */
function markElement <T extends { __MICRO_APP_NAME__: string }> (element: T): T {
  const currentAppName = getCurrentAppName()
  if (currentAppName) element.__MICRO_APP_NAME__ = currentAppName
  return element
}

// methods of document
function patchDocument () {
  const rawDocument = globalEnv.rawDocument
  const rawRootDocument = globalEnv.rawRootDocument

  function getBindTarget (target: Document): Document {
    return isProxyDocument(target) ? rawDocument : target
  }

  // create element 👇
  rawRootDocument.prototype.createElement = function createElement (
    tagName: string,
    options?: ElementCreationOptions,
  ): HTMLElement {
    const element = globalEnv.rawCreateElement.call(getBindTarget(this), tagName, options)
    return markElement(element)
  }

  rawRootDocument.prototype.createElementNS = function createElementNS (
    namespaceURI: string,
    name: string,
    options?: string | ElementCreationOptions,
  ): any {
    const element = globalEnv.rawCreateElementNS.call(getBindTarget(this), namespaceURI, name, options)
    return markElement(element)
  }

  rawRootDocument.prototype.createDocumentFragment = function createDocumentFragment (): DocumentFragment {
    const element = globalEnv.rawCreateDocumentFragment.call(getBindTarget(this))
    return markElement(element)
  }

  // query element👇
  function querySelector (this: Document, selectors: string): any {
    const _this = getBindTarget(this)
    const currentAppName = getCurrentAppName()
    if (
      !currentAppName ||
      !appInstanceMap.get(currentAppName)?.container ||
      !selectors ||
      isUniqueElement(selectors) ||
      // see https://github.com/micro-zoe/micro-app/issues/56
      rawDocument !== _this
    ) {
      return globalEnv.rawQuerySelector.call(_this, selectors)
    }

    return appInstanceMap.get(currentAppName)?.querySelector(selectors) ?? null
  }

  function querySelectorAll (this: Document, selectors: string): any {
    const _this = getBindTarget(this)
    const currentAppName = getCurrentAppName()
    if (
      !currentAppName ||
      !appInstanceMap.get(currentAppName)?.container ||
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

  rawRootDocument.prototype.getElementById = function getElementById (key: string): HTMLElement | null {
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

  rawRootDocument.prototype.getElementsByClassName = function getElementsByClassName (key: string): HTMLCollectionOf<Element> {
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

  rawRootDocument.prototype.getElementsByTagName = function getElementsByTagName (key: string): HTMLCollectionOf<Element> {
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

  rawRootDocument.prototype.getElementsByName = function getElementsByName (key: string): NodeListOf<HTMLElement> {
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

/**
 * patchSetAttribute is different from other patch
 * NOTE:
 * 1. it not dependent on sandbox
 * 2. it should exec when first micro-app-element created & release when all app unmounted
 */
let hasRewriteSetAttribute = false
export function patchSetAttribute (): void {
  if (hasRewriteSetAttribute) return
  hasRewriteSetAttribute = true
  Element.prototype.setAttribute = function setAttribute (key: string, value: any): void {
    if (/^micro-app(-\S+)?/i.test(this.tagName) && key === 'data') {
      if (isPlainObject(value)) {
        const cloneValue: Record<NormalKey, unknown> = {}
        Object.getOwnPropertyNames(value).forEach((ownKey: NormalKey) => {
          if (!(isString(ownKey) && ownKey.indexOf('__') === 0)) {
            cloneValue[ownKey] = value[ownKey]
          }
        })
        this.data = cloneValue
      } else if (value !== '[object Object]') {
        logWarn('property data must be an object', this.getAttribute('name'))
      }
    } else {
      const appName = this.__MICRO_APP_NAME__ || getCurrentAppName()
      if (
        appName &&
        appInstanceMap.has(appName) &&
        (
          ((key === 'src' || key === 'srcset') && /^(img|script|iframe)$/i.test(this.tagName)) ||
          (key === 'href' && /^link$/i.test(this.tagName))
        )
      ) {
        const app = appInstanceMap.get(appName)
        value = CompletionPath(value, app!.url)
      }

      globalEnv.rawSetAttribute.call(this, key, value)
    }
  }
}

function releasePatchDocument (): void {
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
export function releasePatches (): void {
  removeDomScope()
  releasePatchDocument()

  Element.prototype.appendChild = globalEnv.rawAppendChild
  Element.prototype.insertBefore = globalEnv.rawInsertBefore
  Element.prototype.replaceChild = globalEnv.rawReplaceChild
  Element.prototype.removeChild = globalEnv.rawRemoveChild
  Element.prototype.append = globalEnv.rawAppend
  Element.prototype.prepend = globalEnv.rawPrepend
  Element.prototype.cloneNode = globalEnv.rawCloneNode
  Element.prototype.querySelector = globalEnv.rawElementQuerySelector
  Element.prototype.querySelectorAll = globalEnv.rawElementQuerySelectorAll
  rawDefineProperty(Element.prototype, 'innerHTML', globalEnv.rawInnerHTMLDesc)
}

// exec when last child unmount
export function releasePatchSetAttribute (): void {
  hasRewriteSetAttribute = false
  Element.prototype.setAttribute = globalEnv.rawSetAttribute
}

// Set the style of micro-app-head and micro-app-body
let hasRejectMicroAppStyle = false
export function rejectMicroAppStyle (): void {
  if (!hasRejectMicroAppStyle) {
    hasRejectMicroAppStyle = true
    const style = pureCreateElement('style')
    globalEnv.rawSetAttribute.call(style, 'type', 'text/css')
    style.textContent = `\n${microApp.tagName}, micro-app-body { display: block; } \nmicro-app-head { display: none; }`
    globalEnv.rawDocument.head.appendChild(style)
  }
}
