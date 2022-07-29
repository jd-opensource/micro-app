/* eslint-disable no-useless-escape, no-cond-assign */
import type { AppInterface } from '@micro-app/types'
import { CompletionPath, getLinkFileDir, logError, trim, isFireFox } from '../libs/utils'
import microApp from '../micro_app'
import { globalLinks } from '../source/links'

// common reg
const rootSelectorREG = /(^|\s+)(html|:root)(?=[\s>~[.#:]+|$)/
const bodySelectorREG = /(^|\s+)((html[\s>~]+body)|body)(?=[\s>~[.#:]+|$)/

type parseErrorType = Error & { reason: string, filename?: string }
function parseError (msg: string, linkPath?: string): void {
  msg = linkPath ? `${linkPath} ${msg}` : msg
  const err = new Error(msg) as parseErrorType
  err.reason = msg
  if (linkPath) {
    err.filename = linkPath
  }

  throw err
}

/**
 * Reference https://github.com/reworkcss/css
 * CSSParser mainly deals with 3 scenes: styleRule, @, and comment
 * And scopecss deals with 2 scenes: selector & url
 * And can also disable scopecss with inline comments
 */
class CSSParser {
  private cssText = '' // css content
  private prefix = '' // prefix as micro-app[name=xxx]
  private baseURI = '' // domain name
  private linkPath = '' // link resource address, if it is the style converted from link, it will have linkPath
  private result = '' // parsed cssText
  private scopecssDisable = false // use block comments /* scopecss-disable */ to disable scopecss in your file, and use /* scopecss-enable */ to enable scopecss
  private scopecssDisableSelectors: Array<string> = [] // disable or enable scopecss for specific selectors
  private scopecssDisableNextLine = false // use block comments /* scopecss-disable-next-line */ to disable scopecss on a specific line

  public exec (
    cssText: string,
    prefix: string,
    baseURI: string,
    linkPath?: string,
  ): string {
    this.cssText = cssText
    this.prefix = prefix
    this.baseURI = baseURI
    this.linkPath = linkPath || ''
    this.matchRules()
    return isFireFox() ? decodeURIComponent(this.result) : this.result
  }

  public reset (): void {
    this.cssText = this.prefix = this.baseURI = this.linkPath = this.result = ''
    this.scopecssDisable = this.scopecssDisableNextLine = false
    this.scopecssDisableSelectors = []
  }

  // core action for match rules
  private matchRules (): void {
    this.matchLeadingSpaces()
    this.matchComments()
    while (
      this.cssText.length &&
      this.cssText.charAt(0) !== '}' &&
      (this.matchAtRule() || this.matchStyleRule())
    ) {
      this.matchComments()
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule
  private matchStyleRule (): boolean | void {
    const selectors = this.formatSelector(true)

    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false

    if (!selectors) return parseError('selector missing', this.linkPath)

    this.recordResult(selectors)

    this.matchComments()

    this.styleDeclarations()

    this.matchLeadingSpaces()

    return true
  }

  private formatSelector (skip: boolean): false | string {
    const m = this.commonMatch(/^[^{]+/, skip)
    if (!m) return false

    return m[0].replace(/(^|,[\n\s]*)([^,]+)/g, (_, separator, selector) => {
      selector = trim(selector)
      if (!(
        this.scopecssDisableNextLine ||
        (
          this.scopecssDisable && (
            !this.scopecssDisableSelectors.length ||
            this.scopecssDisableSelectors.includes(selector)
          )
        ) ||
        rootSelectorREG.test(selector)
      )) {
        if (bodySelectorREG.test(selector)) {
          selector = selector.replace(bodySelectorREG, this.prefix + ' micro-app-body')
        } else {
          selector = this.prefix + ' ' + selector
        }
      }

      return separator + selector
    })
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration
  private styleDeclarations (): boolean | void {
    if (!this.matchOpenBrace()) return parseError("Declaration missing '{'", this.linkPath)

    this.matchAllDeclarations()

    if (!this.matchCloseBrace()) return parseError("Declaration missing '}'", this.linkPath)

    return true
  }

  private matchAllDeclarations (): void {
    let cssValue = (this.commonMatch(/^(?:url\(["']?(?:[^)"'}]+)["']?\)|[^}/])*/, true) as RegExpExecArray)[0]

    if (cssValue) {
      if (
        !this.scopecssDisableNextLine &&
        (!this.scopecssDisable || this.scopecssDisableSelectors.length)
      ) {
        cssValue = cssValue.replace(/url\(["']?([^)"']+)["']?\)/gm, (all, $1) => {
          if (/^((data|blob):|#)/.test($1) || /^(https?:)?\/\//.test($1)) {
            return all
          }

          // ./a/b.png  ../a/b.png  a/b.png
          if (/^((\.\.?\/)|[^/])/.test($1) && this.linkPath) {
            this.baseURI = getLinkFileDir(this.linkPath)
          }

          return `url("${CompletionPath($1, this.baseURI)}")`
        })
      }

      this.recordResult(cssValue)
    }

    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false

    if (!this.cssText || this.cssText.charAt(0) === '}') return

    // extract comments in declarations
    if (this.cssText.charAt(0) === '/' && this.cssText.charAt(1) === '*') {
      this.matchComments()
    } else {
      this.commonMatch(/\/+/)
    }

    return this.matchAllDeclarations()
  }

  private matchAtRule (): boolean | void {
    if (this.cssText[0] !== '@') return false
    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false

    return this.keyframesRule() ||
      this.mediaRule() ||
      this.customMediaRule() ||
      this.supportsRule() ||
      this.importRule() ||
      this.charsetRule() ||
      this.namespaceRule() ||
      this.documentRule() ||
      this.pageRule() ||
      this.hostRule() ||
      this.fontFaceRule()
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSKeyframesRule
  private keyframesRule (): boolean | void {
    if (!this.commonMatch(/^@([-\w]+)?keyframes\s*/)) return false

    if (!this.commonMatch(/^[^{]+/)) return parseError('@keyframes missing name', this.linkPath)

    this.matchComments()

    if (!this.matchOpenBrace()) return parseError("@keyframes missing '{'", this.linkPath)

    this.matchComments()
    while (this.keyframeRule()) {
      this.matchComments()
    }

    if (!this.matchCloseBrace()) return parseError("@keyframes missing '}'", this.linkPath)

    this.matchLeadingSpaces()

    return true
  }

  private keyframeRule (): boolean {
    let r; const valList = []

    while (r = this.commonMatch(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/)) {
      valList.push(r[1])
      this.commonMatch(/^,\s*/)
    }

    if (!valList.length) return false

    this.styleDeclarations()

    this.matchLeadingSpaces()

    return true
  }

  // https://github.com/postcss/postcss-custom-media
  private customMediaRule (): boolean {
    if (!this.commonMatch(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/)) return false

    this.matchLeadingSpaces()

    return true
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSPageRule
  private pageRule (): boolean | void {
    if (!this.commonMatch(/^@page */)) return false

    this.formatSelector(false)

    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false

    return this.commonHandlerForAtRuleWithSelfRule('page')
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSFontFaceRule
  private fontFaceRule (): boolean | void {
    if (!this.commonMatch(/^@font-face\s*/)) return false

    return this.commonHandlerForAtRuleWithSelfRule('font-face')
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSMediaRule
  private mediaRule = this.createMatcherForAtRuleWithChildRule(/^@media *([^{]+)/, 'media')
  // https://developer.mozilla.org/en-US/docs/Web/API/CSSSupportsRule
  private supportsRule = this.createMatcherForAtRuleWithChildRule(/^@supports *([^{]+)/, 'supports')
  private documentRule = this.createMatcherForAtRuleWithChildRule(/^@([-\w]+)?document *([^{]+)/, 'document')
  private hostRule = this.createMatcherForAtRuleWithChildRule(/^@host\s*/, 'host')
  // https://developer.mozilla.org/en-US/docs/Web/API/CSSImportRule
  private importRule = this.createMatcherForNoneBraceAtRule('import')
  // Removed in most browsers
  private charsetRule = this.createMatcherForNoneBraceAtRule('charset')
  // https://developer.mozilla.org/en-US/docs/Web/API/CSSNamespaceRule
  private namespaceRule = this.createMatcherForNoneBraceAtRule('namespace')

  // common matcher for @media, @supports, @document, @host
  private createMatcherForAtRuleWithChildRule (reg: RegExp, name: string): () => boolean | void {
    return () => {
      if (!this.commonMatch(reg)) return false

      if (!this.matchOpenBrace()) return parseError(`@${name} missing '{'`, this.linkPath)

      this.matchComments()

      this.matchRules()

      if (!this.matchCloseBrace()) return parseError(`@${name} missing '}'`, this.linkPath)

      this.matchLeadingSpaces()

      return true
    }
  }

  // common matcher for @import, @charset, @namespace
  private createMatcherForNoneBraceAtRule (name: string): () => boolean {
    const reg = new RegExp('^@' + name + '\\s*([^;]+);')
    return () => {
      if (!this.commonMatch(reg)) return false
      this.matchLeadingSpaces()
      return true
    }
  }

  // common handler for @font-face, @page
  private commonHandlerForAtRuleWithSelfRule (name: string): boolean | void {
    if (!this.matchOpenBrace()) return parseError(`@${name} missing '{'`, this.linkPath)

    this.matchAllDeclarations()

    if (!this.matchCloseBrace()) return parseError(`@${name} missing '}'`, this.linkPath)

    this.matchLeadingSpaces()

    return true
  }

  // match and slice comments
  private matchComments (): void {
    while (this.matchComment());
  }

  // css comment
  private matchComment (): boolean | void {
    if (this.cssText.charAt(0) !== '/' || this.cssText.charAt(1) !== '*') return false
    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false

    let i = 2
    while (this.cssText.charAt(i) !== '' && (this.cssText.charAt(i) !== '*' || this.cssText.charAt(i + 1) !== '/')) ++i
    i += 2

    if (this.cssText.charAt(i - 1) === '') {
      return parseError('End of comment missing', this.linkPath)
    }

    // get comment content
    let commentText = this.cssText.slice(2, i - 2)

    this.recordResult(`/*${commentText}*/`)

    commentText = trim(commentText.replace(/^\s*!/, ''))

    // set ignore config
    if (commentText === 'scopecss-disable-next-line') {
      this.scopecssDisableNextLine = true
    } else if (/^scopecss-disable/.test(commentText)) {
      if (commentText === 'scopecss-disable') {
        this.scopecssDisable = true
      } else {
        this.scopecssDisable = true
        const ignoreRules = commentText.replace('scopecss-disable', '').split(',')
        ignoreRules.forEach((rule: string) => {
          this.scopecssDisableSelectors.push(trim(rule))
        })
      }
    } else if (commentText === 'scopecss-enable') {
      this.scopecssDisable = false
      this.scopecssDisableSelectors = []
    }

    this.cssText = this.cssText.slice(i)

    this.matchLeadingSpaces()

    return true
  }

  private commonMatch (reg: RegExp, skip = false): RegExpExecArray | null | void {
    const matchArray = reg.exec(this.cssText)
    if (!matchArray) return
    const matchStr = matchArray[0]
    this.cssText = this.cssText.slice(matchStr.length)
    if (!skip) this.recordResult(matchStr)
    return matchArray
  }

  private matchOpenBrace () {
    return this.commonMatch(/^{\s*/)
  }

  private matchCloseBrace () {
    return this.commonMatch(/^}/)
  }

  // match and slice the leading spaces
  private matchLeadingSpaces (): void {
    this.commonMatch(/^\s*/)
  }

  // splice string
  private recordResult (strFragment: string): void {
    // Firefox performance degradation when string contain special characters, see https://github.com/micro-zoe/micro-app/issues/256
    if (isFireFox()) {
      this.result += encodeURIComponent(strFragment)
    } else {
      this.result += strFragment
    }
  }
}

/**
 * common method of bind CSS
 */
function commonAction (
  styleElement: HTMLStyleElement,
  appName: string,
  prefix: string,
  baseURI: string,
  linkPath?: string,
) {
  if (!styleElement.__MICRO_APP_HAS_SCOPED__) {
    styleElement.__MICRO_APP_HAS_SCOPED__ = true

    // check global cache
    const globalLink = linkPath ? globalLinks.get(linkPath) : undefined
    if (globalLink?.hasBeenScoped) {
      return globalLink.code
    }

    // do scoped
    let result: string | null = null
    try {
      result = parser.exec(
        styleElement.textContent!,
        prefix,
        baseURI,
        linkPath,
      )
      parser.reset()
    } catch (e) {
      parser.reset()
      logError('An error occurred while parsing CSS:\n', appName, e)
    }

    if (result) {
      styleElement.textContent = result

      // set global cache
      if (globalLink) {
        globalLink.hasBeenScoped = true
        globalLink.code = result
      }
    }
  }
}

let parser: CSSParser
/**
 * scopedCSS
 * @param styleElement target style element
 * @param appName app name
 */
export default function scopedCSS (
  styleElement: HTMLStyleElement,
  app: AppInterface,
): HTMLStyleElement {
  if (app.scopecss) {
    const prefix = `${microApp.tagName}[name=${app.name}]`

    if (!parser) parser = new CSSParser()

    if (styleElement.textContent) {
      commonAction(
        styleElement,
        app.name,
        prefix,
        app.url,
        styleElement.__MICRO_APP_LINK_PATH__,
      )
    } else {
      const observer = new MutationObserver(function () {
        observer.disconnect()
        // styled-component will be ignore
        if (styleElement.textContent && !styleElement.hasAttribute('data-styled')) {
          commonAction(
            styleElement,
            app.name,
            prefix,
            app.url,
            styleElement.__MICRO_APP_LINK_PATH__,
          )
        }
      })

      observer.observe(styleElement, { childList: true })
    }
  }

  return styleElement
}
