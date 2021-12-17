import { appInstanceMap } from '../create_app'
import { CompletionPath, isSafari, pureCreateElement, getLinkFileDir } from '../libs/utils'
import microApp from '../micro_app'
import globalEnv from '../libs/global_env'
import { extractImportCss } from './patch'

// https://developer.mozilla.org/zh-CN/docs/Web/API/CSSRule
enum CSSRuleType {
  STYLE_RULE = 1,
  MEDIA_RULE = 4,
  SUPPORTS_RULE = 12,
}

/**
 * Bind css scope
 * Special case:
 * 1. html-abc | abc-html
 * 2. html body.abc
 * 3. abchtml | htmlabc | abcbody | bodyabc
 * 4. html + body | html > body | html.body | html[name=xx] | body[name=xx]
 * 5. xxx, html xxx, body xxx
 *
 * TODO: BUG
  .test-b {
    border: 1px solid var(--color-a);
    border-bottom-color: var(--color-b);
  }
 */
function scopedStyleRule (rule: CSSStyleRule, prefix: string): string {
  const { selectorText, cssText } = rule
  if (/^((html[\s>~,]+body)|(html|body|:root))$/.test(selectorText)) {
    return cssText.replace(/^((html[\s>~,]+body)|(html|body|:root))/, prefix)
  } else if (selectorText === '*') {
    return cssText.replace('*', `${prefix} *`)
  }

  const builtInRootSelectorRE = /(^|\s+)((html[\s>~]+body)|(html|body|:root))(?=[\s>~]+|$)/

  return cssText.replace(/^[\s\S]+{/, (selectors) => {
    return selectors.replace(/(^|,)([^,]+)/g, (all, $1, $2) => {
      if (builtInRootSelectorRE.test($2)) {
        // body[name=xx]|body.xx|body#xx etc. do not need to handle
        return all.replace(builtInRootSelectorRE, prefix)
      }
      return `${$1} ${prefix} ${$2.replace(/^\s*/, '')}`
    })
  })
}

/**
 * Complete static resource address
 * @param cssText css content
 * @param baseURI domain name
 * @param textContent origin content
 * @param linkpath link resource address, if it is the style converted from link, it will have linkpath
 */
function scopedHost (
  cssText: string,
  baseURI: string,
  textContent: string,
  linkpath?: string,
) {
  return cssText.replace(/url\(["']?([^)"']+)["']?\)/gm, (all, $1) => {
    if (/^(data|blob):/.test($1)) {
      return all
    } else if (/^(https?:)?\/\//.test($1)) {
      if (isSafari()) {
        const purePath = $1.replace(/^https?:/, '')
        if (textContent.indexOf(purePath) === -1) {
          $1 = $1.replace(window.location.origin, '')
        } else {
          return all
        }
      } else {
        return all
      }
    }

    // ./a/b.png  ../a/b.png  a/b.png
    if (/^((\.\.?\/)|[^/])/.test($1) && linkpath) {
      baseURI = getLinkFileDir(linkpath)
    }

    return `url("${CompletionPath($1, baseURI)}")`
  })
}

// handle media and supports
function scopedPackRule (
  rule: CSSMediaRule | CSSSupportsRule,
  prefix: string,
  packName: string,
): string {
  const result = scopedRule(Array.from(rule.cssRules), prefix)
  return `@${packName} ${rule.conditionText} {${result}}`
}

/**
 * Process each cssrule
 * @param rules cssRule
 * @param prefix prefix as micro-app[name=xxx]
 */
function scopedRule (rules: CSSRule[], prefix: string): string {
  let result = ''
  for (const rule of rules) {
    switch (rule.type) {
      case CSSRuleType.STYLE_RULE:
        result += scopedStyleRule(rule as CSSStyleRule, prefix)
        break
      case CSSRuleType.MEDIA_RULE:
        result += scopedPackRule(rule as CSSMediaRule, prefix, 'media')
        break
      case CSSRuleType.SUPPORTS_RULE:
        result += scopedPackRule(rule as CSSSupportsRule, prefix, 'supports')
        break
      default:
        result += rule.cssText
        break
    }
  }

  return result.replace(/^\s+/, '')
}

/**
 * common method of bind CSS
 */
function commonAction (
  templateStyle: HTMLStyleElement,
  styleElement: HTMLStyleElement,
  originContent: string,
  prefix: string,
  baseURI: string,
  linkpath?: string,
) {
  const rules: CSSRule[] = Array.from(templateStyle.sheet?.cssRules ?? [])
  let result = scopedHost(
    scopedRule(rules, prefix),
    baseURI,
    originContent,
    linkpath,
  )
  /**
   * Solve the problem of missing content quotes in some Safari browsers
   * docs: https://developer.mozilla.org/zh-CN/docs/Web/CSS/content
   * If there are still problems, it is recommended to use the attr()
   */
  if (isSafari()) {
    result = result.replace(/([;{]\s*content:\s*)([^\s"][^";}]*)/gm, (all, $1, $2) => {
      if (
        $2 === 'none' ||
        /^(url\()|(counter\()|(attr\()|(open-quote)|(close-quote)/.test($2)
      ) {
        return all
      }
      return `${$1}"${$2}"`
    })
  }
  styleElement.textContent = result
}

/**
 * scopedCSS
 * @param styleElement target style element
 * @param appName app name
 */
export default function scopedCSS (styleElement: HTMLStyleElement, appName: string, microAppHead?: Element): HTMLStyleElement {
  const app = appInstanceMap.get(appName)
  if (app?.scopecss) {
    const prefix = `${microApp.tagName}[name=${appName}]`
    let templateStyle = globalEnv.templateStyle
    if (!templateStyle) {
      globalEnv.templateStyle = templateStyle = pureCreateElement('style')
      templateStyle.setAttribute('id', 'micro-app-template-style')
      globalEnv.rawDocument.body.appendChild(templateStyle)
      templateStyle.sheet!.disabled = true
    }

    if (styleElement.textContent?.match('@import')) {
      globalEnv.rawWindow.requestIdleCallback(() => { extractImportCss(styleElement, app, microAppHead) })
    }

    if (styleElement.textContent) {
      templateStyle.textContent = styleElement.textContent
      commonAction(templateStyle, styleElement, styleElement.textContent, prefix, app.url, styleElement.linkpath)
      templateStyle.textContent = ''
    } else {
      const observer = new MutationObserver(function () {
        observer.disconnect()
        // styled-component will not be processed temporarily
        if (
          (!styleElement.textContent && styleElement.sheet?.cssRules?.length) ||
          styleElement.hasAttribute('data-styled')
        ) return
        commonAction(styleElement, styleElement, styleElement.textContent!, prefix, app.url, styleElement.linkpath)
      })

      observer.observe(styleElement, { childList: true })
    }
  }

  return styleElement
}
