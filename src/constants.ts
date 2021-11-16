export enum ObservedAttrName {
  NAME = 'name',
  URL = 'url',
  SSR = 'ssr'
}

// app status
export enum appStatus {
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
}
