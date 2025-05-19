import type {
  AppInterface,
  LinkSourceInfo,
  AttrsType,
  fiberTasks,
} from '@micro-app/types'
import { fetchSource } from './fetch'
import {
  CompletionPath,
  promiseStream,
  pureCreateElement,
  defer,
  logError,
  getAttributes,
  injectFiberTask,
  serialExecFiberTasks,
} from '../libs/utils'
import scopedCSS, { createPrefix } from '../sandbox/scoped_css'
import {
  dispatchOnLoadEvent,
  dispatchOnErrorEvent,
} from './load_event'
import sourceCenter from './source_center'
import globalEnv from '../libs/global_env'

/**
 *
 * @param appName app.name
 * @param linkInfo linkInfo of current address
 */
function getExistParseCode(
  appName: string,
  prefix: string,
  linkInfo: LinkSourceInfo,
): string | void {
  const appSpace = linkInfo.appSpace
  for (const item in appSpace) {
    if (item !== appName) {
      const appSpaceData = appSpace[item]
      if (appSpaceData.parsedCode) {
        return appSpaceData.parsedCode.replace(new RegExp(createPrefix(item, true), 'g'), prefix)
      }
    }
  }
}

// transfer the attributes on the link to convertStyle
function setConvertStyleAttr(convertStyle: HTMLStyleElement, attrs: AttrsType): void {
  attrs.forEach((value, key) => {
    if (key === 'rel') return
    if (key === 'href') key = 'data-origin-href'
    globalEnv.rawSetAttribute.call(convertStyle, key, value)
  })
}

/**
 * Extract link elements
 * @param link link element
 * @param parent parent element of link
 * @param app app
 * @param microAppHead micro-app-head element
 * @param isDynamic dynamic insert
 */
export function extractLinkFromHtml(
  link: HTMLLinkElement,
  parent: Node | null,
  app: AppInterface,
  isDynamic = false,
): any {
  const rel = link.getAttribute('rel')
  let href = link.getAttribute('href')
  let replaceComment: Comment | null = null
  if (rel === 'stylesheet' && href) {
    href = CompletionPath(href, app.url)
    let linkInfo = sourceCenter.link.getInfo(href)
    const appSpaceData = {
      attrs: getAttributes(link),
    }
    if (!linkInfo) {
      linkInfo = {
        code: '',
        appSpace: {
          [app.name]: appSpaceData,
        }
      }
    } else {
      linkInfo.appSpace[app.name] = linkInfo.appSpace[app.name] || appSpaceData
    }

    sourceCenter.link.setInfo(href, linkInfo)

    if (!isDynamic) {
      app.source.links.add(href)
      replaceComment = document.createComment(`link element with href=${href} move to micro-app-head as style element`)
      linkInfo.appSpace[app.name].placeholder = replaceComment
    } else {
      return { address: href, linkInfo }
    }
  } else if (rel && ['prefetch', 'preload', 'prerender', 'modulepreload', 'icon'].includes(rel)) {
    // preload prefetch prerender ....
    if (isDynamic) {
      replaceComment = document.createComment(`link element with rel=${rel}${href ? ' & href=' + href : ''} removed by micro-app`)
    } else {
      parent?.removeChild(link)
    }
  } else if (href) {
    // dns-prefetch preconnect modulepreload search ....
    globalEnv.rawSetAttribute.call(link, 'href', CompletionPath(href, app.url))
  }

  if (isDynamic) {
    return { replaceComment }
  } else if (replaceComment) {
    return parent?.replaceChild(replaceComment, link)
  }
}

/**
 * Get link remote resources
 * @param wrapElement htmlDom
 * @param app app
 * @param microAppHead micro-app-head
 */
export function fetchLinksFromHtml(
  wrapElement: HTMLElement,
  app: AppInterface,
  microAppHead: Element,
  fiberStyleResult: Promise<void> | null,
): void {
  const styleList: Array<string> = Array.from(app.source.links)
  const fetchLinkPromise: Array<Promise<string> | string> = styleList.map((address) => {
    const linkInfo = sourceCenter.link.getInfo(address)!
    return linkInfo.code ? linkInfo.code : fetchSource(address, app.name)
  })

  const fiberLinkTasks: fiberTasks = fiberStyleResult ? [] : null
  
  //Keep the execution order of link code consistent with their order in the DOM document.
  const eachCallBacks: Array<CallableFunction> = []

  promiseStream<string>(fetchLinkPromise, (res: { data: string, index: number }) => {
    eachCallBacks[res.index] = () => injectFiberTask(fiberLinkTasks, () => fetchLinkSuccess(
      styleList[res.index],
      res.data,
      microAppHead,
      app,
    ))
  }, (err: { error: Error, index: number }) => {
    logError(err, app.name)
  }, () => {
    /**
     * 1. If fiberStyleResult exist, fiberLinkTasks must exist
     * 2. Download link source while processing style
     * 3. Process style first, and then process link
     */
    eachCallBacks.forEach((callback) => callback())

    if (fiberStyleResult) {
      fiberStyleResult.then(() => {
        fiberLinkTasks!.push(() => Promise.resolve(app.onLoad({ html: wrapElement })))
        serialExecFiberTasks(fiberLinkTasks)
      })
    } else {
      app.onLoad({ html: wrapElement })
    }
  })
}

/**
 * Fetch link succeeded, replace placeholder with style tag
 * NOTE:
 * 1. Only exec when init, no longer exec when remount
 * 2. Only handler html link element, not dynamic link or style
 * 3. The same prefix can reuse parsedCode
 * 4. Async exec with requestIdleCallback in prefetch or fiber
 * 5. appSpace[app.name].placeholder/attrs must exist
 * @param address resource address
 * @param code link source code
 * @param microAppHead micro-app-head
 * @param app app instance
 */
export function fetchLinkSuccess(
  address: string,
  code: string,
  microAppHead: Element,
  app: AppInterface,
): void {
  /**
   * linkInfo must exist, but linkInfo.code not
   * so we set code to linkInfo.code
   */
  const linkInfo = sourceCenter.link.getInfo(address)!
  linkInfo.code = code
  const appSpaceData = linkInfo.appSpace[app.name]
  const placeholder = appSpaceData.placeholder!
  /**
   * When prefetch app is replaced by a new app in the processing phase, since the linkInfo is common, when the linkInfo of the prefetch app is processed, it may have already been processed.
   * This causes placeholder to be possibly null
   * e.g.
   * 1. prefetch app.url different from <micro-app></micro-app>
   * 2. prefetch param different from <micro-app></micro-app>
   */
  if (placeholder) {
    const convertStyle = pureCreateElement('style')

    handleConvertStyle(
      app,
      address,
      convertStyle,
      linkInfo,
      appSpaceData.attrs,
    )

    if (placeholder.parentNode) {
      placeholder.parentNode.replaceChild(convertStyle, placeholder)
    } else {
      microAppHead.appendChild(convertStyle)
    }

    // clear placeholder
    appSpaceData.placeholder = null
  }
}

/**
 * Get parsedCode, update convertStyle
 * Actions:
 * 1. get scope css (through scopedCSS or oldData)
 * 2. record parsedCode
 * 3. set parsedCode to convertStyle if need
 * @param app app instance
 * @param address resource address
 * @param convertStyle converted style
 * @param linkInfo linkInfo in sourceCenter
 * @param attrs attrs of link
 */
export function handleConvertStyle(
  app: AppInterface,
  address: string,
  convertStyle: HTMLStyleElement,
  linkInfo: LinkSourceInfo,
  attrs: AttrsType,
): void {
  if (app.scopecss) {
    const appSpaceData = linkInfo.appSpace[app.name]
    appSpaceData.prefix = appSpaceData.prefix || createPrefix(app.name)
    if (!appSpaceData.parsedCode) {
      const existParsedCode = getExistParseCode(app.name, appSpaceData.prefix, linkInfo)
      if (!existParsedCode) {
        convertStyle.textContent = linkInfo.code
        scopedCSS(convertStyle, app, address)
      } else {
        convertStyle.textContent = existParsedCode
      }
      appSpaceData.parsedCode = convertStyle.textContent
    } else {
      convertStyle.textContent = appSpaceData.parsedCode
    }
  } else {
    convertStyle.textContent = linkInfo.code
  }

  setConvertStyleAttr(convertStyle, attrs)
}

/**
 * Handle css of dynamic link
 * @param address link address
 * @param app app
 * @param linkInfo linkInfo
 * @param originLink origin link element
 */
export function formatDynamicLink(
  address: string,
  app: AppInterface,
  linkInfo: LinkSourceInfo,
  originLink: HTMLLinkElement,
): HTMLStyleElement {
  const convertStyle = pureCreateElement('style')

  const handleDynamicLink = () => {
    handleConvertStyle(
      app,
      address,
      convertStyle,
      linkInfo,
      linkInfo.appSpace[app.name].attrs,
    )
    dispatchOnLoadEvent(originLink)
  }

  if (linkInfo.code) {
    defer(handleDynamicLink)
  } else {
    fetchSource(address, app.name).then((data: string) => {
      linkInfo.code = data
      handleDynamicLink()
    }).catch((err) => {
      logError(err, app.name)
      dispatchOnErrorEvent(originLink)
    })
  }

  return convertStyle
}
