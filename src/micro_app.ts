import type { OptionsType, MicroAppConfigType, lifeCyclesType, plugins, fetchType } from '@micro-app/types'
import { defineElement } from './micro_app_element'
import preFetch, { getGlobalAssets } from './prefetch'
import { logError, logWarn, isFunction, isBrowser, isPlainObject } from './libs/utils'
import { EventCenterForBaseApp } from './interact'
import { initGlobalEnv } from './libs/global_env'

class MicroApp extends EventCenterForBaseApp implements MicroAppConfigType {
  tagName = 'micro-app'
  shadowDOM?: boolean
  destroy?: boolean
  inline?: boolean
  disableScopecss?: boolean
  disableSandbox?: boolean
  macro?: boolean
  lifeCycles?: lifeCyclesType
  plugins?: plugins
  fetch?: fetchType
  preFetch = preFetch
  start (options?: OptionsType) {
    if (!isBrowser || !window.customElements) {
      return logError('micro-app is not supported in this environment')
    }

    if (options?.tagName) {
      if (/^micro-app(-\S+)?/.test(options.tagName)) {
        this.tagName = options.tagName
      } else {
        return logError(`${options.tagName} is invalid tagName`)
      }
    }

    if (window.customElements.get(this.tagName)) {
      return logWarn(`element ${this.tagName} is already defined`)
    }

    initGlobalEnv()

    if (options && isPlainObject(options)) {
      this.shadowDOM = options.shadowDOM
      this.destroy = options.destroy
      this.inline = options.inline
      this.disableScopecss = options.disableScopecss
      this.disableSandbox = options.disableSandbox
      this.macro = options.macro
      if (isFunction(options.fetch)) this.fetch = options.fetch

      if (isPlainObject(options.lifeCycles)) {
        this.lifeCycles = options.lifeCycles
      }

      if (isPlainObject(options.plugins)) {
        this.plugins = options.plugins
      }

      // load app assets when browser is idle
      if (options.preFetchApps) {
        preFetch(options.preFetchApps)
      }

      // load global assets when browser is idle
      if (options.globalAssets) {
        getGlobalAssets(options.globalAssets)
      }
    }

    defineElement(this.tagName)
  }
}

export default new MicroApp()
