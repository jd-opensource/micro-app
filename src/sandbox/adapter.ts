import type {
  BaseSandboxType,
  AppInterface,
} from '@micro-app/types'
import globalEnv from '../libs/global_env'
import {
  defer,
  isNode,
  rawDefineProperties,
  isMicroAppBody,
  getPreventSetState,
  throttleDeferForIframeAppName,
  isAnchorElement,
} from '../libs/utils'
import {
  appInstanceMap,
  isIframeSandbox,
} from '../create_app'
import microApp from '../micro_app'
import { AppManager } from '../app_manager'

export class BaseSandbox implements BaseSandboxType {
  constructor (appName: string, url: string) {
    this.appName = appName
    this.url = url
    this.injectReactHMRProperty()
  }

  // keys that can only assigned to rawWindow
  public rawWindowScopeKeyList: PropertyKey[] = [
    'location',
  ]

  // keys that can escape to rawWindow
  public staticEscapeProperties: PropertyKey[] = [
    'System',
    '__cjsWrapper',
  ]

  // keys that scoped in child app
  public staticScopeProperties: PropertyKey[] = [
    'webpackJsonp',
    'webpackHotUpdate',
    'Vue',
    // TODO: 是否可以和constants/SCOPE_WINDOW_ON_EVENT合并
    'onpopstate',
    'onhashchange',
    'event',
  ]

  public appName: string
  public url: string
  // Properties that can only get and set in microAppWindow, will not escape to rawWindow
  public scopeProperties: PropertyKey[] = Array.from(this.staticScopeProperties)
  // Properties that can be escape to rawWindow
  public escapeProperties: PropertyKey[] = []
  // Properties newly added to microAppWindow
  public injectedKeys = new Set<PropertyKey>()
  // Properties escape to rawWindow, cleared when unmount
  public escapeKeys = new Set<PropertyKey>()
  // Promise used to mark whether the sandbox is initialized
  public sandboxReady!: Promise<void>
  // reset mount, unmount when stop in default mode
  public clearHijackUmdHooks!: () => void

  // adapter for react
  private injectReactHMRProperty (): void {
    if (__DEV__) {
      // react child in non-react env
      this.staticEscapeProperties.push('__REACT_ERROR_OVERLAY_GLOBAL_HOOK__')
      // in react parent
      if (globalEnv.rawWindow.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
        this.staticScopeProperties = this.staticScopeProperties.concat([
          '__REACT_ERROR_OVERLAY_GLOBAL_HOOK__',
          '__reactRefreshInjected',
        ])
      }
    }
  }
}

/**
 * TODO:
 *  1、将class Adapter去掉，改为CustomWindow，或者让CustomWindow继承Adapter
 *  2、with沙箱中的常量放入CustomWindow，虽然和iframe沙箱不一致，但更合理
 * 修改时机：在iframe沙箱支持插件后再修改
 */
export class CustomWindow {}

// Fix conflict of babel-polyfill@6.x
export function fixBabelPolyfill6 (): void {
  if (globalEnv.rawWindow._babelPolyfill) globalEnv.rawWindow._babelPolyfill = false
}

/**
 * Fix error of hot reload when parent&child created by create-react-app in development environment
 * Issue: https://github.com/jd-opensource/micro-app/issues/382
 */
export function fixReactHMRConflict (app: AppInterface): void {
  if (__DEV__) {
    const rawReactErrorHook = globalEnv.rawWindow.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__
    const childReactErrorHook = app.sandBox?.proxyWindow.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__
    if (rawReactErrorHook && childReactErrorHook) {
      globalEnv.rawWindow.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = childReactErrorHook
      defer(() => {
        globalEnv.rawWindow.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = rawReactErrorHook
      })
    }
  }
}

/**
 * update dom tree of target dom
 * @param container target dom
 * @param appName app name
 */
export function patchElementTree (
  container: Node,
  appName: string,
): void {
  const children = Array.from(container.childNodes)

  children.length && children.forEach((child) => {
    patchElementTree(child, appName)
  })

  updateElementInfo(container, appName)
}

/**
 * rewrite baseURI, ownerDocument, __MICRO_APP_NAME__ of target node
 * @param node target node
 * @param appName app name
 * @returns target node
 */
export function updateElementInfo <T> (node: T, appName: string | null): T {
  if (
    appName &&
    isNode(node) &&
    node.__MICRO_APP_NAME__ !== appName &&
    !node.__PURE_ELEMENT__ &&
    !getPreventSetState()
  ) {
    /**
     * TODO:
     *  1. 测试baseURI和ownerDocument在with沙箱中是否正确
     *    经过验证with沙箱不能重写ownerDocument，否则react点击事件会触发两次
    */
    const props: {[kye:string]:any} = {
      __MICRO_APP_NAME__: {
        configurable: true,
        enumerable: true,
        writable: true,
        value: appName,
      },
    }
    if (isAnchorElement(node)) {
      // a 标签
      const microApp = AppManager.getInstance().get(appName)
      if (microApp) {
        props.href = {
          get() {
            return this.getAttribute('href')
          },
          set(value: string) {
            if (value === undefined) {
              return
            }
            this.setAttribute('href', value)
          },
        }
      }
    }
    rawDefineProperties(node, props)

    /**
     * In FireFox, iframe Node.prototype will point to native Node.prototype after insert to document
     *
     * Performance:
     *  iframe element.__proto__ === browser HTMLElement.prototype // Chrome: false, FireFox: true
     *  iframe element.__proto__ === iframe HTMLElement.prototype // Chrome: true, FireFox: false
     *
     * NOTE:
     *  1. Node.prototype.baseURI
     *  2. Node.prototype.ownerDocument
     *  3. Node.prototype.parentNode
     *  4. Node.prototype.getRootNode
     *  5. Node.prototype.cloneNode
     *  6. Element.prototype.innerHTML
     *  7. Image
     */
    if (isIframeSandbox(appName)) {
      const proxyWindow = appInstanceMap.get(appName)?.sandBox?.proxyWindow
      if (proxyWindow) {
        rawDefineProperties(node, {
          baseURI: {
            configurable: true,
            enumerable: true,
            get: () => proxyWindow.location.href,
          },
          ownerDocument: {
            configurable: true,
            enumerable: true,
            get: () => node !== proxyWindow.document ? proxyWindow.document : null,
          },
          parentNode: getIframeParentNodeDesc(
            appName,
            globalEnv.rawParentNodeDesc,
          ),
          getRootNode: {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function getRootNode (): Node {
              return proxyWindow.document
            }
          },
        })
      }
    }
  }

  return node
}

/**
 * get Descriptor of Node.prototype.parentNode for iframe
 * @param appName app name
 * @param parentNode parentNode Descriptor of iframe or browser
 */
export function getIframeParentNodeDesc (
  appName: string,
  parentNodeDesc: PropertyDescriptor,
): PropertyDescriptor {
  return {
    configurable: true,
    enumerable: true,
    get (this: Node) {
      throttleDeferForIframeAppName(appName)
      const result: ParentNode = parentNodeDesc.get?.call(this)
      /**
       * If parentNode is <micro-app-body>, return rawDocument.body
       * Scenes:
       *  1. element-ui@2/lib/utils/vue-popper.js
       *    if (this.popperElm.parentNode === document.body) ...
       * e.g.:
       *  1. element-ui@2.x el-dropdown
       * WARNING:
       *  Will it cause other problems ?
       *  e.g. target.parentNode.remove(target)
       */
      if (isMicroAppBody(result) && appInstanceMap.get(appName)?.container) {
        const customParent = microApp.options.getRootElementParentNode?.(this, appName)
        if (customParent) {
          return customParent
        }
        if (microApp?.options?.inheritBaseBody !== true) {
          return appInstanceMap.get(appName)?.container?.querySelector('micro-app-body') || globalEnv.rawDocument.body
        }
        return globalEnv.rawDocument.body
      }
      return result
    }
  }
}
