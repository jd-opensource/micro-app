import { AppInterface, plugins } from '@micro-app/types'
import { fetchSource } from '../fetch'
import { isFunction, isPlainObject, logError } from '../../libs/utils'
import microApp from '../../micro_app'

export interface IHTMLLoader {
  run (app: AppInterface, successCb: CallableFunction): void
}

export class HTMLLoader implements IHTMLLoader {
  private static instance: HTMLLoader;
  public static getInstance (): HTMLLoader {
    if (!this.instance) {
      this.instance = new HTMLLoader()
    }
    return this.instance
  }

  /**
   * run logic of load and format html
   * @param successCb success callback
   * @param errorCb error callback, type: (err: Error, meetFetchErr: boolean) => void
   */
  public run (app: AppInterface, successCb: CallableFunction): void {
    const appName = app.name
    const htmlUrl = app.ssrUrl || app.url
    const htmlPromise = htmlUrl.includes('.js')
      ? Promise.resolve(`<micro-app-head><script src='${htmlUrl}'></script></micro-app-head><micro-app-body></micro-app-body>`)
      : fetchSource(htmlUrl, appName, { cache: 'no-cache' })
    htmlPromise.then((htmlStr: string) => {
      if (!htmlStr) {
        const msg = 'html is empty, please check in detail'
        app.onerror(new Error(msg))
        return logError(msg, appName)
      }

      htmlStr = this.formatHTML(htmlUrl, htmlStr, appName)

      successCb(htmlStr, app)
    }).catch((e) => {
      logError(`Failed to fetch data from ${app.url}, micro-app stop rendering`, appName, e)
      app.onLoadError(e)
    })
  }

  private formatHTML (htmlUrl: string, htmlStr: string, appName: string) {
    return this.processHtml(htmlUrl, htmlStr, appName, microApp.options.plugins)
      .replace(/<head[^>]*>[\s\S]*?<\/head>/i, (match) => {
        return match
          .replace(/<head/i, '<micro-app-head')
          .replace(/<\/head>/i, '</micro-app-head>')
      })
      .replace(/<body[^>]*>[\s\S]*?<\/body>/i, (match) => {
        return match
          .replace(/<body/i, '<micro-app-body')
          .replace(/<\/body>/i, '</micro-app-body>')
      })
  }

  private processHtml (url: string, code: string, appName: string, plugins: plugins | void): string {
    if (!plugins) return code

    const mergedPlugins: NonNullable<plugins['global']> = []
    plugins.global && mergedPlugins.push(...plugins.global)
    plugins.modules?.[appName] && mergedPlugins.push(...plugins.modules[appName])

    if (mergedPlugins.length > 0) {
      return mergedPlugins.reduce((preCode, plugin) => {
        if (isPlainObject(plugin) && isFunction(plugin.processHtml)) {
          return plugin.processHtml!(preCode, url)
        }
        return preCode
      }, code)
    }
    return code
  }
}
