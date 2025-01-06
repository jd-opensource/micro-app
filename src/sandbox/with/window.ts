import type {
  microAppWindowType,
  CommonEffectHook,
  MicroEventListener,
  timeInfo,
  WithSandBoxInterface,
} from '@micro-app/types'
import globalEnv from '../../libs/global_env'
import bindFunctionToRawTarget from '../bind_function'
import {
  SCOPE_WINDOW_EVENT_OF_WITH,
  SCOPE_WINDOW_ON_EVENT_OF_WITH,
  RAW_GLOBAL_TARGET,
} from '../../constants'
import {
  isString,
  includes,
  unique,
  throttleDeferForSetAppName,
  rawDefineProperty,
  rawHasOwnProperty,
  removeDomScope,
  getRootContainer,
  formatEventType,
} from '../../libs/utils'
import {
  appInstanceMap,
} from '../../create_app'

/**
 * patch window of child app
 * @param appName app name
 * @param microAppWindow microWindow of child app
 * @param sandbox WithSandBox
 * @returns EffectHook
 */
export function patchWindow (
  appName: string,
  microAppWindow: microAppWindowType,
  sandbox: WithSandBoxInterface,
): CommonEffectHook {
  patchWindowProperty(microAppWindow)
  createProxyWindow(appName, microAppWindow, sandbox)
  return patchWindowEffect(microAppWindow, appName)
}

/**
 * rewrite special properties of window
 * @param appName app name
 * @param microAppWindow child app microWindow
 */
function patchWindowProperty (
  microAppWindow: microAppWindowType,
):void {
  const rawWindow = globalEnv.rawWindow
  Object.getOwnPropertyNames(rawWindow)
    .filter((key: string) => {
      return /^on/.test(key) && !SCOPE_WINDOW_ON_EVENT_OF_WITH.includes(key)
    })
    .forEach((eventName: string) => {
      const { enumerable, writable, set } = Object.getOwnPropertyDescriptor(rawWindow, eventName) || {
        enumerable: true,
        writable: true,
      }
      rawDefineProperty(microAppWindow, eventName, {
        enumerable,
        configurable: true,
        get: () => rawWindow[eventName],
        set: writable ?? !!set
          ? (value) => { rawWindow[eventName] = value }
          : undefined,
      })
    })
}

/**
 * create proxyWindow with Proxy(microAppWindow)
 * @param appName app name
 * @param microAppWindow micro app window
 * @param sandbox WithSandBox
 */
function createProxyWindow (
  appName: string,
  microAppWindow: microAppWindowType,
  sandbox: WithSandBoxInterface,
): void {
  const rawWindow = globalEnv.rawWindow
  const descriptorTargetMap = new Map<PropertyKey, 'target' | 'rawWindow'>()

  const proxyWindow = new Proxy(microAppWindow, {
    get: (target: microAppWindowType, key: PropertyKey): unknown => {
      throttleDeferForSetAppName(appName)
      if (
        Reflect.has(target, key) ||
        (isString(key) && /^__MICRO_APP_/.test(key)) ||
        includes(sandbox.scopeProperties, key)
      ) {
        if (includes(RAW_GLOBAL_TARGET, key)) removeDomScope()
        return Reflect.get(target, key)
      }

      return bindFunctionToRawTarget(Reflect.get(rawWindow, key), rawWindow)
    },
    set: (target: microAppWindowType, key: PropertyKey, value: unknown): boolean => {
      if (includes(sandbox.rawWindowScopeKeyList, key)) {
        Reflect.set(rawWindow, key, value)
      } else if (
        // target.hasOwnProperty has been rewritten
        !rawHasOwnProperty.call(target, key) &&
        rawHasOwnProperty.call(rawWindow, key) &&
        !includes(sandbox.scopeProperties, key)
      ) {
        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key)
        const { configurable, enumerable, writable, set } = descriptor!
        // set value because it can be set
        rawDefineProperty(target, key, {
          value,
          configurable,
          enumerable,
          writable: writable ?? !!set,
        })

        sandbox.injectedKeys.add(key)
      } else {
        // all scopeProperties will add to injectedKeys, use for key in window (Proxy.has)
        if (!Reflect.has(target, key) || includes(sandbox.scopeProperties, key)) {
          sandbox.injectedKeys.add(key)
        }
        Reflect.set(target, key, value)
      }

      if (
        (
          includes(sandbox.escapeProperties, key) ||
          (
            // TODO: staticEscapeProperties 合并到 escapeProperties
            includes(sandbox.staticEscapeProperties, key) &&
            !Reflect.has(rawWindow, key)
          )
        ) &&
        !includes(sandbox.scopeProperties, key)
      ) {
        !Reflect.has(rawWindow, key) && sandbox.escapeKeys.add(key)
        Reflect.set(rawWindow, key, value)
      }

      return true
    },
    has: (target: microAppWindowType, key: PropertyKey): boolean => {
      /**
       * Some keywords, such as Vue, need to meet two conditions at the same time:
       * 1. window.Vue --> undefined
       * 2. 'Vue' in window --> false
       * Issue https://github.com/jd-opensource/micro-app/issues/686
       */
      if (includes(sandbox.scopeProperties, key)) {
        if (sandbox.injectedKeys.has(key)) {
          return Reflect.has(target, key) // true
        }
        return !!target[key] // false
      }
      return Reflect.has(target, key) || Reflect.has(rawWindow, key)
    },
    // Object.getOwnPropertyDescriptor(window, key)
    getOwnPropertyDescriptor: (target: microAppWindowType, key: PropertyKey): PropertyDescriptor|undefined => {
      if (rawHasOwnProperty.call(target, key)) {
        descriptorTargetMap.set(key, 'target')
        return Object.getOwnPropertyDescriptor(target, key)
      }

      if (rawHasOwnProperty.call(rawWindow, key)) {
        descriptorTargetMap.set(key, 'rawWindow')
        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key)
        if (descriptor && !descriptor.configurable) {
          descriptor.configurable = true
        }
        return descriptor
      }

      return undefined
    },
    // Object.defineProperty(window, key, Descriptor)
    defineProperty: (target: microAppWindowType, key: PropertyKey, value: PropertyDescriptor): boolean => {
      const from = descriptorTargetMap.get(key)
      if (from === 'rawWindow') {
        return Reflect.defineProperty(rawWindow, key, value)
      }
      return Reflect.defineProperty(target, key, value)
    },
    // Object.getOwnPropertyNames(window)
    ownKeys: (target: microAppWindowType): Array<string | symbol> => {
      return unique(Reflect.ownKeys(rawWindow).concat(Reflect.ownKeys(target)))
    },
    deleteProperty: (target: microAppWindowType, key: PropertyKey): boolean => {
      if (rawHasOwnProperty.call(target, key)) {
        sandbox.injectedKeys.has(key) && sandbox.injectedKeys.delete(key)
        sandbox.escapeKeys.has(key) && Reflect.deleteProperty(rawWindow, key)
        return Reflect.deleteProperty(target, key)
      }
      return true
    },
  })

  sandbox.proxyWindow = proxyWindow
}

/**
 * Rewrite side-effect events
 * @param microAppWindow micro window
 */
function patchWindowEffect (microAppWindow: microAppWindowType, appName: string): CommonEffectHook {
  const eventListenerMap = new Map<string, Set<MicroEventListener>>()
  const sstEventListenerMap = new Map<string, Set<MicroEventListener>>()
  const intervalIdMap = new Map<number, timeInfo>()
  const timeoutIdMap = new Map<number, timeInfo>()
  const {
    rawWindow,
    rawAddEventListener,
    rawRemoveEventListener,
    rawDispatchEvent,
    rawSetInterval,
    rawSetTimeout,
    rawClearInterval,
    rawClearTimeout,
  } = globalEnv

  /**
   * All events will bind to microAppElement or rawWindow
   * Some special events, such as popstate、load、unmount、appstate-change、statechange..., bind to microAppElement, others bind to rawWindow
   * NOTE:
   *  1、At first, microAppWindow = new EventTarget(), but it can not compatible with iOS 14 or below, so microAppElement was used instead. (2024.1.22)
   * @param type event name
   * @returns microAppElement/rawWindow
   */
  function getEventTarget (type: string): EventTarget {
    if (SCOPE_WINDOW_EVENT_OF_WITH.includes(type) && appInstanceMap.get(appName)?.container) {
      return getRootContainer(appInstanceMap.get(appName)!.container!)
    }
    return rawWindow
  }

  /**
   * listener may be null, e.g test-passive
   * TODO:
   *  1. listener 是否需要绑定microAppWindow，否则函数中的this指向原生window
   *  2. 如果this不指向proxyWindow 或 microAppWindow，应该要做处理
   *  window.addEventListener.call(非window, type, listener, options)
   */
  microAppWindow.addEventListener = function (
    type: string,
    listener: MicroEventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    type = formatEventType(type, appName)
    const listenerList = eventListenerMap.get(type)
    if (listenerList) {
      listenerList.add(listener)
    } else {
      eventListenerMap.set(type, new Set([listener]))
    }
    listener && (listener.__MICRO_APP_MARK_OPTIONS__ = options)
    rawAddEventListener.call(getEventTarget(type), type, listener, options)
  }

  microAppWindow.removeEventListener = function (
    type: string,
    listener: MicroEventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    type = formatEventType(type, appName)
    const listenerList = eventListenerMap.get(type)
    if (listenerList?.size && listenerList.has(listener)) {
      listenerList.delete(listener)
    }
    rawRemoveEventListener.call(getEventTarget(type), type, listener, options)
  }

  microAppWindow.dispatchEvent = function (event: Event): boolean {
    return rawDispatchEvent.call(getEventTarget(event?.type), event)
  }

  microAppWindow.setInterval = function (
    handler: TimerHandler,
    timeout?: number,
    ...args: any[]
  ): number {
    const intervalId = rawSetInterval.call(rawWindow, handler, timeout, ...args)
    intervalIdMap.set(intervalId, { handler, timeout, args })
    return intervalId
  }

  microAppWindow.setTimeout = function (
    handler: TimerHandler,
    timeout?: number,
    ...args: any[]
  ): number {
    const handlerWithCleanup: TimerHandler = typeof handler === 'string' ? handler : function(...args: any[]) {
      timeoutIdMap.delete(timeoutId);
      handler(...args);
    }
    const timeoutId = rawSetTimeout.call(rawWindow, handlerWithCleanup, timeout, ...args)
    timeoutIdMap.set(timeoutId, { handler: handlerWithCleanup, timeout, args })
    return timeoutId
  }

  microAppWindow.clearInterval = function (intervalId: number) {
    intervalIdMap.delete(intervalId)
    rawClearInterval.call(rawWindow, intervalId)
  }

  microAppWindow.clearTimeout = function (timeoutId: number) {
    timeoutIdMap.delete(timeoutId)
    rawClearTimeout.call(rawWindow, timeoutId)
  }

  // reset snapshot data
  const reset = (): void => {
    sstEventListenerMap.clear()
  }

  /**
   * NOTE:
   *  1. about timer(events & properties should record & rebuild at all modes, exclude default mode)
   *  2. record maybe call twice when unmount prerender, keep-alive app manually with umd mode
   * 4 modes: default-mode、umd-mode、prerender、keep-alive
   * Solution:
   *  1. default-mode(normal): clear events & timers, not record & rebuild anything
   *  2. umd-mode(normal): not clear timers, record & rebuild events
   *  3. prerender/keep-alive(default, umd): not clear timers, record & rebuild events
   */
  const record = (): void => {
    // record window event
    eventListenerMap.forEach((listenerList, type) => {
      if (listenerList.size) {
        const cacheList = sstEventListenerMap.get(type) || []
        sstEventListenerMap.set(type, new Set([...cacheList, ...listenerList]))
      }
    })
  }

  // rebuild event and timer before remount app
  const rebuild = (): void => {
    // rebuild window event
    sstEventListenerMap.forEach((listenerList, type) => {
      for (const listener of listenerList) {
        microAppWindow.addEventListener(type, listener, listener?.__MICRO_APP_MARK_OPTIONS__)
      }
    })

    reset()
  }

  // release all event listener & interval & timeout when unmount app
  const release = (clearTimer: boolean): void => {
    // Clear window binding events
    if (eventListenerMap.size) {
      eventListenerMap.forEach((listenerList, type) => {
        for (const listener of listenerList) {
          rawRemoveEventListener.call(getEventTarget(type), type, listener)
        }
      })
      eventListenerMap.clear()
    }

    // default mode(not keep-alive or isPrerender)
    if (clearTimer) {
      intervalIdMap.forEach((_, intervalId: number) => {
        rawClearInterval.call(rawWindow, intervalId)
      })

      timeoutIdMap.forEach((_, timeoutId: number) => {
        rawClearTimeout.call(rawWindow, timeoutId)
      })

      intervalIdMap.clear()
      timeoutIdMap.clear()
    }
  }

  return {
    reset,
    record,
    rebuild,
    release,
  }
}
