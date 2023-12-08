export enum ObservedAttrName {
  NAME = 'name',
  URL = 'url',
}

// app status
export enum appStates {
  CREATED = 'created',
  LOADING = 'loading',
  LOAD_FAILED = 'load_failed',
  BEFORE_MOUNT = 'before_mount',
  MOUNTING = 'mounting',
  MOUNTED = 'mounted',
  UNMOUNT = 'unmount',
}

// lifecycles
export enum lifeCycles {
  CREATED = 'created',
  BEFOREMOUNT = 'beforemount',
  MOUNTED = 'mounted',
  UNMOUNT = 'unmount',
  ERROR = 'error',
  // 👇 keep-alive only
  BEFORESHOW = 'beforeshow',
  AFTERSHOW = 'aftershow',
  AFTERHIDDEN = 'afterhidden',
}

// global event of child app
export enum microGlobalEvent {
  ONMOUNT = 'onmount',
  ONUNMOUNT = 'onunmount',
}

// keep-alive status
export enum keepAliveStates {
  KEEP_ALIVE_SHOW = 'keep_alive_show',
  KEEP_ALIVE_HIDDEN = 'keep_alive_hidden',
}

// micro-app config
export enum MicroAppConfig {
  DESTROY = 'destroy',
  DESTORY = 'destory',
  INLINE = 'inline',
  DISABLESCOPECSS = 'disableScopecss',
  DISABLESANDBOX = 'disableSandbox',
  DISABLE_SCOPECSS = 'disable-scopecss',
  DISABLE_SANDBOX = 'disable-sandbox',
  DISABLE_MEMORY_ROUTER = 'disable-memory-router',
  DISABLE_PATCH_REQUEST = 'disable-patch-request',
  KEEP_ROUTER_STATE = 'keep-router-state',
  HIDDEN_ROUTER = 'hidden-router',
  KEEP_ALIVE = 'keep-alive',
  CLEAR_DATA ='clear-data',
  SSR = 'ssr',
  FIBER = 'fiber',
}

// prefetch level
export const PREFETCH_LEVEL: number[] = [1, 2, 3]

// memory router constants
export const DEFAULT_ROUTER_MODE = 'search'
export const ROUTER_MODE_HISTORY = 'history'
export const ROUTER_MODE_CUSTOM = 'custom'
export const ROUTER_MODE_LIST: string[] = [
  DEFAULT_ROUTER_MODE,
  ROUTER_MODE_HISTORY,
  ROUTER_MODE_CUSTOM,
]

// event bound to child app window
export const SCOPE_WINDOW_EVENT = [
  'popstate',
  'hashchange',
  'load',
  'beforeunload',
  'unload',
  'unmount',
  'appstate-change',
  'statechange',
  'mounted',
]

// on event bound to child app window
export const SCOPE_WINDOW_ON_EVENT = [
  'onpopstate',
  'onhashchange',
  'onload',
  'onbeforeunload',
  'onunload',
  'onerror'
]

// event bound to child app document
export const SCOPE_DOCUMENT_EVENT = [
  'DOMContentLoaded',
  'readystatechange',
]

// on event bound to child app document
export const SCOPE_DOCUMENT_ON_EVENT = [
  'onreadystatechange',
]

// global key point to window
export const GLOBAL_KEY_TO_WINDOW: Array<PropertyKey> = [
  'window',
  'self',
  'globalThis',
]

export const RAW_GLOBAL_TARGET: Array<PropertyKey> = ['rawWindow', 'rawDocument']

/**
 * global key must be static key, they can not rewrite
 * e.g.
 * window.Promise = newValue
 * new Promise ==> still get old value, not newValue, because they are cached by top function
 * NOTE:
 * 1. Do not add fetch, XMLHttpRequest, EventSource
 */
export const GLOBAL_CACHED_KEY = 'window,self,globalThis,document,Document,Array,Object,String,Boolean,Math,Number,Symbol,Date,Function,Proxy,WeakMap,WeakSet,Set,Map,Reflect,Element,Node,RegExp,Error,TypeError,JSON,isNaN,parseFloat,parseInt,performance,console,decodeURI,encodeURI,decodeURIComponent,encodeURIComponent,navigator,undefined,location,history'
