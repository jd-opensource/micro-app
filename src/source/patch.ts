import type { Func, AppInterface } from '@micro-app/types'
import { appInstanceMap } from '../create_app'
import {
  CompletionPath,
  getCurrentAppName,
  pureCreateElement,
  setCurrentAppName,
  logWarn,
  isPlainObject,
  isString,
  isInvalidQuerySelectorKey,
  isUniqueElement,
} from '../libs/utils'
import scopedCSS from './scoped_css'
import { extractLinkFromHtml, foramtDynamicLink } from './links'
import { extractScriptElement, runScript, runDynamicRemoteScript } from './scripts'
import microApp from '../micro_app'
import globalEnv from '../libs/global_env'

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
      return scopedCSS(child, app.name)
    }
    return child
  } else if (child instanceof HTMLLinkElement) {
    if (child.hasAttribute('exclude')) {
      const linkReplaceComment = document.createComment('link element with exclude attribute ignored by micro-app')
      dynamicElementInMicroAppMap.set(child, linkReplaceComment)
      return linkReplaceComment
    } else if (!app.scopecss || child.hasAttribute('ignore')) {
      return child
    }

    const { url, info, replaceComment } = extractLinkFromHtml(
      child,
      parent,
      app,
      null,
      true,
    )

    if (url && info) {
      const replaceStyle = pureCreateElement('style')
      replaceStyle.linkpath = url
      foramtDynamicLink(url, info, app, child, replaceStyle)
      dynamicElementInMicroAppMap.set(child, replaceStyle)
      return replaceStyle
    } else if (replaceComment) {
      dynamicElementInMicroAppMap.set(child, replaceComment)
      return replaceComment
    }

    return child
  } else if (child instanceof HTMLScriptElement) {
    const { replaceComment, url, info } = extractScriptElement(
      child,
      parent,
      app,
      true,
    ) || {}

    if (url && info) {
      if (info.code) { // inline script
        const replaceElement = runScript(url, info.code, app, info.module, true)
        dynamicElementInMicroAppMap.set(child, replaceElement)
        return replaceElement
      } else { // remote script
        const replaceElement = runDynamicRemoteScript(url, info, app, child)
        dynamicElementInMicroAppMap.set(child, replaceElement)
        return replaceElement
      }
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
  /**
   * If passiveChild is not the child node, insertBefore replaceChild will have a problem, at this time, it will be degraded to appendChild
   * E.g: document.head.insertBefore(targetChild, document.head.childNodes[0])
   */
  if (parent === document.head) {
    const microAppHead = app.container!.querySelector('micro-app-head')!
    /**
     * 1. If passivechild exists, it must be insertBefore or replacechild
     * 2. When removeChild, targetChild may not be in microAppHead or head
     */
    if (passiveChild && !microAppHead.contains(passiveChild)) {
      return globalEnv.rawAppendChild.call(microAppHead, targetChild)
    } else if (rawMethod === globalEnv.rawRemoveChild && !microAppHead.contains(targetChild)) {
      if (parent.contains(targetChild)) {
        return rawMethod.call(parent, targetChild)
      }
      return targetChild
    } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
      return rawMethod.call(microAppHead, targetChild)
    }
    return rawMethod.call(microAppHead, targetChild, passiveChild)
  } else if (parent === document.body) {
    const microAppBody = app.container!.querySelector('micro-app-body')!
    if (passiveChild && !microAppBody.contains(passiveChild)) {
      return globalEnv.rawAppendChild.call(microAppBody, targetChild)
    } else if (rawMethod === globalEnv.rawRemoveChild && !microAppBody.contains(targetChild)) {
      if (parent.contains(targetChild)) {
        return rawMethod.call(parent, targetChild)
      }
      return targetChild
    } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
      return rawMethod.call(microAppBody, targetChild)
    }
    return rawMethod.call(microAppBody, targetChild, passiveChild)
  } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
    return rawMethod.call(parent, targetChild)
  }

  return rawMethod.call(parent, targetChild, passiveChild)
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
 * @param rawMethodraw method
 */
export function commonElementHander (
  parent: Node,
  newChild: Node,
  passiveChild: Node | null,
  rawMethod: Func,
): void {
  if (newChild?.__MICRO_APP_NAME__) {
    const app = appInstanceMap.get(newChild.__MICRO_APP_NAME__)
    if (app?.container) {
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
    return rawMethod.call(parent, newChild, passiveChild)
  } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
    const appName = getCurrentAppName()
    if (!(newChild instanceof Node) && appName) {
      const app = appInstanceMap.get(appName)
      if (app?.container) {
        if (parent === document.head) {
          return rawMethod.call(app.container.querySelector('micro-app-head'), newChild)
        } else if (parent === document.body) {
          return rawMethod.call(app.container.querySelector('micro-app-body'), newChild)
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

  // Rewrite setAttribute
  Element.prototype.setAttribute = function setAttribute (key: string, value: string): void {
    if (/^micro-app(-\S+)?/i.test(this.tagName) && key === 'data') {
      if (isPlainObject(value)) {
        const cloneValue: Record<PropertyKey, unknown> = {}
        Object.getOwnPropertyNames(value).forEach((propertyKey: PropertyKey) => {
          if (!(isString(propertyKey) && propertyKey.indexOf('__') === 0)) {
            // @ts-ignore
            cloneValue[propertyKey] = value[propertyKey]
          }
        })
        this.data = cloneValue
      } else if (value !== '[object Object]') {
        logWarn('property data must be an object', this.getAttribute('name'))
      }
    } else if (
      (
        (key === 'src' && /^(img|script)$/i.test(this.tagName)) ||
        (key === 'href' && /^link$/i.test(this.tagName))
      ) &&
      this.__MICRO_APP_NAME__ &&
      appInstanceMap.has(this.__MICRO_APP_NAME__)
    ) {
      const app = appInstanceMap.get(this.__MICRO_APP_NAME__)
      globalEnv.rawSetAttribute.call(this, key, CompletionPath(value, app!.url))
    } else {
      globalEnv.rawSetAttribute.call(this, key, value)
    }
  }

  // prototype methods of add element👇
  Node.prototype.appendChild = function appendChild<T extends Node> (newChild: T): T {
    return commonElementHander(this, newChild, null, globalEnv.rawAppendChild)
  }

  Node.prototype.insertBefore = function insertBefore<T extends Node> (newChild: T, refChild: Node | null): T {
    return commonElementHander(this, newChild, refChild, globalEnv.rawInsertBefore)
  }

  Node.prototype.replaceChild = function replaceChild<T extends Node> (newChild: Node, oldChild: T): T {
    return commonElementHander(this, newChild, oldChild, globalEnv.rawReplaceChild)
  }

  Element.prototype.append = function append (...nodes: (Node | string)[]): void {
    let i = 0
    const length = nodes.length
    while (i < length) {
      commonElementHander(this, nodes[i] as Node, null, globalEnv.rawAppend)
      i++
    }
  }

  Element.prototype.prepend = function prepend (...nodes: (Node | string)[]): void {
    let i = nodes.length
    while (i > 0) {
      commonElementHander(this, nodes[i - 1] as Node, null, globalEnv.rawPrepend)
      i--
    }
  }

  // prototype methods of delete element👇
  Node.prototype.removeChild = function removeChild<T extends Node> (oldChild: T): T {
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
      return globalEnv.rawRemoveChild.call(this, oldChild) as T
    }

    return globalEnv.rawRemoveChild.call(this, oldChild) as T
  }
}

/**
 * Mark the newly created element in the micro application
 * @param element new element
 */
function markElement <T extends { __MICRO_APP_NAME__: string }> (element: T): T {
  const appName = getCurrentAppName()
  appName && (element.__MICRO_APP_NAME__ = appName)
  return element
}

// methods of document
function patchDocument () {
  const rawDocument = globalEnv.rawDocument

  // create element 👇
  Document.prototype.createElement = function createElement (
    tagName: string,
    options?: ElementCreationOptions,
  ): HTMLElement {
    const element = globalEnv.rawCreateElement.call(this, tagName, options)
    return markElement(element)
  }

  Document.prototype.createElementNS = function createElementNS (
    namespaceURI: string,
    name: string,
    options?: string | ElementCreationOptions,
  ): any {
    const element = globalEnv.rawCreateElementNS.call(this, namespaceURI, name, options)
    return markElement(element)
  }

  Document.prototype.createDocumentFragment = function createDocumentFragment (): DocumentFragment {
    const element = globalEnv.rawCreateDocumentFragment.call(this)
    return markElement(element)
  }

  // query element👇
  function querySelector (this: Document, selectors: string): any {
    const appName = getCurrentAppName()
    if (
      !appName ||
      !selectors ||
      isUniqueElement(selectors) ||
      // see https://github.com/micro-zoe/micro-app/issues/56
      rawDocument !== this
    ) {
      return globalEnv.rawQuerySelector.call(this, selectors)
    }
    return appInstanceMap.get(appName)?.container?.querySelector(selectors) ?? null
  }

  function querySelectorAll (this: Document, selectors: string): any {
    const appName = getCurrentAppName()
    if (
      !appName ||
      !selectors ||
      isUniqueElement(selectors) ||
      rawDocument !== this
    ) {
      return globalEnv.rawQuerySelectorAll.call(this, selectors)
    }
    return appInstanceMap.get(appName)?.container?.querySelectorAll(selectors) ?? []
  }

  Document.prototype.querySelector = querySelector
  Document.prototype.querySelectorAll = querySelectorAll

  Document.prototype.getElementById = function getElementById (key: string): HTMLElement | null {
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementById.call(this, key)
    }

    try {
      return querySelector.call(this, `#${key}`)
    } catch {
      return globalEnv.rawGetElementById.call(this, key)
    }
  }

  Document.prototype.getElementsByClassName = function getElementsByClassName (key: string): HTMLCollectionOf<Element> {
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementsByClassName.call(this, key)
    }

    try {
      return querySelectorAll.call(this, `.${key}`)
    } catch {
      return globalEnv.rawGetElementsByClassName.call(this, key)
    }
  }

  Document.prototype.getElementsByTagName = function getElementsByTagName (key: string): HTMLCollectionOf<Element> {
    const appName = getCurrentAppName()
    if (
      !appName ||
      isUniqueElement(key) ||
      isInvalidQuerySelectorKey(key) ||
      (!appInstanceMap.get(appName)?.inline && /^script$/i.test(key))
    ) {
      return globalEnv.rawGetElementsByTagName.call(this, key)
    }

    try {
      return querySelectorAll.call(this, key)
    } catch {
      return globalEnv.rawGetElementsByTagName.call(this, key)
    }
  }

  Document.prototype.getElementsByName = function getElementsByName (key: string): NodeListOf<HTMLElement> {
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementsByName.call(this, key)
    }

    try {
      return querySelectorAll.call(this, `[name=${key}]`)
    } catch {
      return globalEnv.rawGetElementsByName.call(this, key)
    }
  }
}

function releasePatchDocument (): void {
  Document.prototype.createElement = globalEnv.rawCreateElement
  Document.prototype.createElementNS = globalEnv.rawCreateElementNS
  Document.prototype.createDocumentFragment = globalEnv.rawCreateDocumentFragment
  Document.prototype.querySelector = globalEnv.rawQuerySelector
  Document.prototype.querySelectorAll = globalEnv.rawQuerySelectorAll
  Document.prototype.getElementById = globalEnv.rawGetElementById
  Document.prototype.getElementsByClassName = globalEnv.rawGetElementsByClassName
  Document.prototype.getElementsByTagName = globalEnv.rawGetElementsByTagName
  Document.prototype.getElementsByName = globalEnv.rawGetElementsByName
}

// release patch
export function releasePatches (): void {
  setCurrentAppName(null)
  releasePatchDocument()
  Element.prototype.setAttribute = globalEnv.rawSetAttribute
  Node.prototype.appendChild = globalEnv.rawAppendChild
  Node.prototype.insertBefore = globalEnv.rawInsertBefore
  Node.prototype.replaceChild = globalEnv.rawReplaceChild
  Node.prototype.removeChild = globalEnv.rawRemoveChild
  Element.prototype.append = globalEnv.rawAppend
  Element.prototype.prepend = globalEnv.rawPrepend
}

// Set the style of micro-app-head and micro-app-body
let hasRejectMicroAppStyle = false
export function rejectMicroAppStyle (): void {
  if (!hasRejectMicroAppStyle) {
    hasRejectMicroAppStyle = true
    const style = pureCreateElement('style')
    style.setAttribute('type', 'text/css')
    style.textContent = `\n${microApp.tagName}, micro-app-body { display: block; } \nmicro-app-head { display: none; }`
    globalEnv.rawDocument.head.appendChild(style)
  }
}
