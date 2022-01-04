export enum ObservedAttrName {
  NAME = 'name',
  URL = 'url',
  SUFFIX = 'suffix',
}

// app status
export enum appStates {
  NOT_LOADED = 'NOT_LOADED',
  LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE',
  LOAD_SOURCE_FINISHED = 'LOAD_SOURCE_FINISHED',
  LOAD_SOURCE_ERROR = 'LOAD_SOURCE_ERROR',
  MOUNTING = 'MOUNTING',
  MOUNTED = 'MOUNTED',
  UNMOUNT = 'UNMOUNT',
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

// keep-alive status
export enum keepAliveStates {
  KEEP_ALIVE_SHOW = 'KEEP_ALIVE_SHOW',
  KEEP_ALIVE_HIDDEN = 'KEEP_ALIVE_HIDDEN',
}
