import type { AttrType, MicroAppElementType, AppInterface } from '@micro-app/types'
import { defer, formatURL, version, logError, isString } from './libs/utils'
import { ObservedAttrName, appStatus, lifeCycles } from './constants'
import CreateApp, { appInstanceMap } from './create_app'
import {
  patchElementPrototypeMethods,
  releasePatches,
  rejectMicroAppStyle,
} from './source/patch'
import {
  listenUmountOfNestedApp,
  replaseUnmountOfNestedApp,
} from './libs/additional'
import microApp from './micro_app'
import dispatchLifecyclesEvent from './interact/lifecycles_event'

// record all micro-app elements
export const elementInstanceMap = new Map<Element, boolean>()

/**
 * define element
 * @param tagName element name
 */
export function defineElement (tagName: string): void {
  class MicroAppElement extends HTMLElement implements MicroAppElementType {
    static get observedAttributes (): string[] {
      return ['name', 'url']
    }

    constructor () {
      super()
      // cloned node of umd container also trigger constructor, we should skip
      if (!this.querySelector('micro-app-head')) {
        this.performWhenFirstCreated()
      }
    }

    appName = ''
    appUrl = ''
    version = version
    isWating = false
    cacheData: Record<PropertyKey, unknown> | null = null
    hasConnected = false

    // 👇 Configuration
    // shadowDom: use shadowDOM, default is false
    // destroy: whether delete cache resources when unmount, default is false
    // inline: whether js runs in inline script mode, default is false
    // disableScopecss: whether disable css scoped, default is false
    // disableSandbox: whether disable sandbox, default is false
    // macro: used to solve the async render problem of vue3, default is false
    // baseRoute: route prefix, default is ''

    connectedCallback (): void {
      this.hasConnected = true
      if (!elementInstanceMap.has(this)) {
        this.performWhenFirstCreated()
      }

      defer(() => dispatchLifecyclesEvent(
        this,
        this.appName,
        lifeCycles.CREATED,
      ))

      this.initialMount()
    }

    disconnectedCallback (): void {
      this.hasConnected = false
      elementInstanceMap.delete(this)
      this.handleUnmount(this.getDisposeResult('destroy'))
      if (elementInstanceMap.size === 0) {
        releasePatches()
      }
    }

    attributeChangedCallback (attr: ObservedAttrName, _oldVal: string, newVal: string): void {
      if (
        this.legalAttribute(attr, newVal) &&
        this[attr === ObservedAttrName.NAME ? 'appName' : 'appUrl'] !== newVal
      ) {
        if (attr === ObservedAttrName.URL && !this.appUrl) {
          newVal = formatURL(newVal, this.appName)
          if (!newVal) {
            return logError('Invalid attribute url', this.appName)
          }
          this.appUrl = newVal
          this.handleInitialNameAndUrl()
        } else if (attr === ObservedAttrName.NAME && !this.appName) {
          if (this.cacheData) {
            microApp.setData(newVal, this.cacheData)
            this.cacheData = null
          }
          this.appName = newVal
          this.handleInitialNameAndUrl()
        } else if (!this.isWating) {
          this.isWating = true
          defer(this.handleAttributeUpdate)
        }
      }
    }

    // handle for connectedCallback run before attributeChangedCallback
    handleInitialNameAndUrl (): void {
      if (this.hasConnected) {
        this.initialMount()
      }
    }

    // Perform global initialization when the element count is 1
    performWhenFirstCreated (): void {
      if (elementInstanceMap.set(this, true).size === 1) {
        patchElementPrototypeMethods()
        rejectMicroAppStyle()
        replaseUnmountOfNestedApp()
        listenUmountOfNestedApp()
      }
    }

    /**
     * first mount of this app
     */
    initialMount (): void {
      if (!this.appName || !this.appUrl) return

      if (this.getDisposeResult('shadowDOM') && !this.shadowRoot) {
        this.attachShadow({ mode: 'open' })
      }

      const app = appInstanceMap.get(this.appName)
      if (app) {
        if (
          app.url === this.appUrl && (
            app.isPrefetch ||
            app.getAppStatus() === appStatus.UNMOUNT
          )
        ) {
          this.handleAppMount(app)
        } else if (app.isPrefetch) {
          logError(`the url ${this.appUrl} is different from prefetch url ${app.url}`, this.appName)
        } else {
          logError(`an app named ${this.appName} already exists`, this.appName)
        }
      } else {
        this.handleCreate()
      }
    }

    /**
     * handle for change of name an url after element inited
     */
    handleAttributeUpdate = (): void => {
      this.isWating = false
      const attrName = this.getAttribute('name')
      const attrUrl = formatURL(this.getAttribute('url'), this.appName)
      if (this.legalAttribute('name', attrName) && this.legalAttribute('url', attrUrl)) {
        const existApp = appInstanceMap.get(attrName!)
        if (attrName !== this.appName && existApp) {
          // handling of cached and non-prefetch apps
          if (appStatus.UNMOUNT !== existApp.getAppStatus() && !existApp.isPrefetch) {
            this.setAttribute('name', this.appName)
            return logError(`an app named ${attrName} already exists`, this.appName)
          }
        }

        if (attrName !== this.appName || attrUrl !== this.appUrl) {
          this.handleUnmount(attrName === this.appName)
          this.appName = attrName as string
          this.appUrl = attrUrl
          ;(this.shadowRoot ?? this).innerHTML = ''
          /**
           * when existApp not undefined
           * if attrName and this.appName are equal, existApp has been unmounted
           * if attrName and this.appName are not equal, existApp is prefetch or unmounted
           */
          if (existApp && existApp.url === attrUrl) {
            // mount app
            this.handleAppMount(existApp)
          } else {
            this.handleCreate()
          }
        }
      } else if (attrName !== this.appName) {
        this.setAttribute('name', this.appName)
      }
    }

    /**
     * judge the attribute is legal
     * @param name attribute name
     * @param val attribute value
     */
    legalAttribute (name: string, val: AttrType): boolean {
      if (!isString(val) || !val) {
        logError(`unexpected attribute ${name}, please check again`, this.appName)

        return false
      }

      return true
    }

    /**
     * mount app
     * some serious note before mount:
     * 1. is prefetch ?
     * 2. is remount in another container ?
     * 3. is remount with change properties of the container ?
     */
    handleAppMount (app: AppInterface): void {
      app.isPrefetch = false
      defer(() => app.mount(
        this.shadowRoot ?? this,
        this.getDisposeResult('inline'),
        this.getBaseRouteCompatible(),
      ))
    }

    // create app instance
    handleCreate (): void {
      const instance: AppInterface = new CreateApp({
        name: this.appName!,
        url: this.appUrl!,
        container: this.shadowRoot ?? this,
        inline: this.getDisposeResult('inline'),
        scopecss: !(this.getDisposeResult('disableScopecss') || this.getDisposeResult('shadowDOM')),
        useSandbox: !this.getDisposeResult('disableSandbox'),
        macro: this.getDisposeResult('macro'),
        baseroute: this.getBaseRouteCompatible(),
      })

      appInstanceMap.set(this.appName!, instance)
    }

    /**
     * unmount app
     * @param destroy delete cache resources when unmount
     */
    handleUnmount (destroy: boolean): void {
      const app = appInstanceMap.get(this.appName!)
      if (app && appStatus.UNMOUNT !== app.getAppStatus()) app.unmount(destroy)
    }

    /**
     * Get configuration
     * Global setting is lowest priority
     * @param name Configuration item name
     */
    getDisposeResult (name: string): boolean {
      // @ts-ignore
      return (this.hasAttribute(name) || microApp[name]) && this.getAttribute(name) !== 'false'
    }

    /**
     * 2021-09-08
     * get baseRoute
     * getAttribute('baseurl') is compatible writing of versions below 0.3.1
     */
    getBaseRouteCompatible (): string {
      return this.getAttribute('baseroute') ?? this.getAttribute('baseurl') ?? ''
    }

    /**
     * Data from the base application
     */
    set data (value: Record<PropertyKey, unknown> | null) {
      if (this.appName) {
        microApp.setData(this.appName, value!)
      } else {
        this.cacheData = value
      }
    }

    /**
     * get data only used in jsx-custom-event once
     */
    get data (): Record<PropertyKey, unknown> | null {
      if (this.appName) {
        return microApp.getData(this.appName, true)
      } else if (this.cacheData) {
        return this.cacheData
      }
      return null
    }
  }

  window.customElements.define(tagName, MicroAppElement)
}
