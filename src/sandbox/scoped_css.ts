/* eslint-disable no-useless-escape, no-cond-assign */
import type { AppInterface } from '@micro-app/types'
import { CompletionPath, getLinkFileDir, logError, trim, isFireFox } from '../libs/utils'
import microApp from '../micro_app'

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

    if (!selectors) return this.printError('selector missing', this.linkPath)

    this.recordResult(selectors)

    this.matchComments()

    this.styleDeclarations()

    this.matchLeadingSpaces()

    return true
  }

  private formatSelector (skip: boolean): false | string {
    const m = this.commonMatch(/^[^{]+/, skip)
    if (!m) return false

    /**
     * NOTE:
     *  1. :is(h1, h2, h3):has(+ h2, + h3, + h4) {}
     *    should be ==> micro-app[name=xxx] :is(h1, h2, h3):has(+ h2, + h3, + h4) {}
     *  2. :dir(ltr) {}
     *    should be ==> micro-app[name=xxx] :dir(ltr) {}
     *  3. body :not(div, .fancy) {}
     *    should be ==> micro-app[name=xxx] micro-app-body :not(div, .fancy) {}
     *  4. .a, .b, li:nth-child(3)
     *    should be ==> micro-app[name=xxx] .a, micro-app[name=xxx] .b, micro-app[name=xxx] li:nth-child(3)
     *  5. :is(.a, .b, .c) a {}
     *    should be ==> micro-app[name=xxx] :is(.a, .b, .c) a {}
     *  6. :where(.a, .b, .c) a {}
     *    should be ==> micro-app[name=xxx] :where(.a, .b, .c) a {}
     */
    const attributeValues: {[key: string]: any} = {}
    const matchRes = m[0].replace(/\[([^\]=]+)(?:=([^\]]+))?\]/g, (match, p1, p2) => {
      const mock = `__mock_${p1}Value__`
      attributeValues[mock] = p2
      return match.replace(p2, mock)
    })

    return matchRes.replace(/(^|,[\n\s]*)([^,]+)/g, (_, separator, selector) => {
      selector = trim(selector)
      selector = selector.replace(/\[[^\]=]+(?:=([^\]]+))?\]/g, (match:string, p1: string) => {
        if (attributeValues[p1]) {
          return match.replace(p1, attributeValues[p1])
        }
        return match
      })
      if (selector && !(
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
    if (!this.matchOpenBrace()) return this.printError("Declaration missing '{'", this.linkPath)

    this.matchAllDeclarations()

    if (!this.matchCloseBrace()) return this.printError("Declaration missing '}'", this.linkPath)

    return true
  }

  private matchAllDeclarations (nesting = 0): void {
    let cssValue = (this.commonMatch(/^(?:url\(["']?(?:[^)"'}]+)["']?\)|[^{}/])*/, true) as RegExpExecArray)[0]

    if (cssValue) {
      if (
        !this.scopecssDisableNextLine &&
        (!this.scopecssDisable || this.scopecssDisableSelectors.length)
      ) {
        cssValue = cssValue.replace(/url\((["']?)(.*?)\1\)/gm, (all, _, $1) => {
          if (/^((data|blob):|#|%23)/.test($1) || /^(https?:)?\/\//.test($1)) {
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

    if (!this.cssText.length) return

    // extract comments in declarations
    if (this.cssText.charAt(0) === '/') {
      if (this.cssText.charAt(1) === '*') {
        this.matchComments()
      } else {
        this.commonMatch(/\/+/)
      }
    } else if (this.cssText.charAt(0) === '{') {
      this.matchOpenBrace()
      nesting++
    } else if (this.cssText.charAt(0) === '}') {
      if (nesting < 1) return
      this.matchCloseBrace()
      nesting--
    }

    return this.matchAllDeclarations(nesting)
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
      this.containerRule() ||
      this.documentRule() ||
      this.pageRule() ||
      this.hostRule() ||
      this.fontFaceRule() ||
      this.layerRule()
  }

  // :global is CSS Modules rule, it will be converted to normal syntax
  // private matchGlobalRule (): boolean | void {
  //   if (this.cssText[0] !== ':') return false
  //   // reset scopecssDisableNextLine
  //   this.scopecssDisableNextLine = false

  //   return this.globalRule()
  // }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSKeyframesRule
  private keyframesRule (): boolean | void {
    if (!this.commonMatch(/^@([-\w]+)?keyframes\s*/)) return false

    if (!this.commonMatch(/^[^{]+/)) return this.printError('@keyframes missing name', this.linkPath)

    this.matchComments()

    if (!this.matchOpenBrace()) return this.printError("@keyframes missing '{'", this.linkPath)

    this.matchComments()
    while (this.keyframeRule()) {
      this.matchComments()
    }

    if (!this.matchCloseBrace()) return this.printError("@keyframes missing '}'", this.linkPath)

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

  // https://developer.mozilla.org/en-US/docs/Web/CSS/@layer
  private layerRule (): boolean | void {
    if (!this.commonMatch(/^@layer\s*([^{;]+)/)) return false

    if (!this.matchOpenBrace()) return !!this.commonMatch(/^[;]+/)

    this.matchComments()

    this.matchRules()

    if (!this.matchCloseBrace()) return this.printError('@layer missing \'}\'', this.linkPath)

    this.matchLeadingSpaces()

    return true
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSMediaRule
  private mediaRule = this.createMatcherForRuleWithChildRule(/^@media *([^{]+)/, '@media')
  // https://developer.mozilla.org/en-US/docs/Web/API/CSSSupportsRule
  private supportsRule = this.createMatcherForRuleWithChildRule(/^@supports *([^{]+)/, '@supports')
  private documentRule = this.createMatcherForRuleWithChildRule(/^@([-\w]+)?document *([^{]+)/, '@document')
  private hostRule = this.createMatcherForRuleWithChildRule(/^@host\s*/, '@host')
  // :global is CSS Modules rule, it will be converted to normal syntax
  // private globalRule = this.createMatcherForRuleWithChildRule(/^:global([^{]*)/, ':global')
  // https://developer.mozilla.org/en-US/docs/Web/API/CSSImportRule
  private importRule = this.createMatcherForNoneBraceAtRule('import')
  // Removed in most browsers
  private charsetRule = this.createMatcherForNoneBraceAtRule('charset')
  // https://developer.mozilla.org/en-US/docs/Web/API/CSSNamespaceRule
  private namespaceRule = this.createMatcherForNoneBraceAtRule('namespace')
  // https://developer.mozilla.org/en-US/docs/Web/CSS/@container
  private containerRule = this.createMatcherForRuleWithChildRule(/^@container *([^{]+)/, '@container')

  // common matcher for @media, @supports, @document, @host, :global, @container
  private createMatcherForRuleWithChildRule (reg: RegExp, name: string): () => boolean | void {
    return () => {
      if (!this.commonMatch(reg)) return false

      if (!this.matchOpenBrace()) return this.printError(`${name} missing '{'`, this.linkPath)

      this.matchComments()

      this.matchRules()

      if (!this.matchCloseBrace()) return this.printError(`${name} missing '}'`, this.linkPath)

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
    if (!this.matchOpenBrace()) return this.printError(`@${name} missing '{'`, this.linkPath)

    this.matchAllDeclarations()

    if (!this.matchCloseBrace()) return this.printError(`@${name} missing '}'`, this.linkPath)

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
      return this.printError('End of comment missing', this.linkPath)
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
    return this.commonMatch(/^}\s*/)
  }

  // match and slice the leading spaces
  private matchLeadingSpaces (): void {
    this.commonMatch(/^\s*/)
  }

  // splice string
  private recordResult (strFragment: string): void {
    // Firefox performance degradation when string contain special characters, see https://github.com/jd-opensource/micro-app/issues/256
    if (isFireFox()) {
      this.result += encodeURIComponent(strFragment)
    } else {
      this.result += strFragment
    }
  }

  private printError (msg: string, linkPath?: string): void {
    if (this.cssText.length) {
      parseError(msg, linkPath)
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

    if (result) styleElement.textContent = result
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
  linkPath?: string,
): HTMLStyleElement {
  if (app.scopecss) {
    const prefix = createPrefix(app.name)

    if (!parser) parser = new CSSParser()

    const escapeRegExp = (regStr: string) => regStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    if (styleElement.textContent) {
      commonAction(styleElement, app.name, prefix, app.url, linkPath)

      const observer = new MutationObserver(() => {
        const escapedPrefix = escapeRegExp(prefix)
        const isPrefixed = styleElement.textContent && new RegExp(escapedPrefix).test(styleElement.textContent)
        observer.disconnect()
        if (!isPrefixed) {
          styleElement.__MICRO_APP_HAS_SCOPED__ = false
          scopedCSS(styleElement, app, linkPath)
        }
      })
      observer.observe(styleElement, { childList: true, characterData: true })
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
            linkPath,
          )
        }
      })

      observer.observe(styleElement, { childList: true })
    }
  }

  return styleElement
}

export function createPrefix (appName: string, reg = false): string {
  const regCharacter = reg ? '\\' : ''
  return `${microApp.tagName}${regCharacter}[name=${appName}${regCharacter}]`
}
