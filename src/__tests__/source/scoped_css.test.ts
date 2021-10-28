/* eslint-disable promise/param-names, no-extend-native */
import { commonStartEffect, releaseAllEffect, ports, setAppName } from '../common/initial'
import { defer } from '../../libs/utils'
import microApp from '../..'

describe('source scoped_css', () => {
  let appCon: Element
  beforeAll(() => {
    commonStartEffect(ports.scoped_css)
    microApp.start()
    appCon = document.querySelector('#app-container')!
  })

  afterAll(() => {
    return releaseAllEffect()
  })

  // 动态插入style标签，先插入后赋值
  test('set textContent after style element append to html', async () => {
    const microappElement1 = document.createElement('micro-app')
    microappElement1.setAttribute('name', 'test-app1')
    microappElement1.setAttribute('url', `http://127.0.0.1:${ports.scoped_css}/dynamic/`)

    appCon.appendChild(microappElement1)
    await new Promise((reslove) => {
      microappElement1.addEventListener('mounted', () => {
        setAppName('test-app1')
        // 动态创建style
        const dynamicStyle = document.createElement('style')
        document.head.appendChild(dynamicStyle)

        dynamicStyle.textContent = '* {margin: 0;} .test, html > .abc {color: red;}'

        defer(() => {
          expect(dynamicStyle.textContent).toBe('micro-app[name=test-app1] * {margin: 0;} micro-app[name=test-app1] .test,micro-app[name=test-app1] > .abc {color: red;}')
          reslove(true)
        })
      }, false)
    })
  })

  // safari浏览器补全丢失的引号
  test('complete quotation marks in safari', async () => {
    const rawUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15',
      writable: true,
      configurable: true,
    })

    const microappElement2 = document.createElement('micro-app')
    microappElement2.setAttribute('name', 'test-app2')
    microappElement2.setAttribute('url', `http://127.0.0.1:${ports.scoped_css}/dynamic/`)

    appCon.appendChild(microappElement2)
    await new Promise((reslove) => {
      microappElement2.addEventListener('mounted', () => {
        setAppName('test-app2')
        // 动态创建style
        const dynamicStyle = document.createElement('style')
        dynamicStyle.textContent = '.test-content1 {content: no quota;} .test-content2 {content: none;} .test-content3 {content: url(http://www.micro-app-test.com/);}'

        document.head.appendChild(dynamicStyle)

        defer(() => {
          expect(dynamicStyle.textContent).toBe('micro-app[name=test-app2] .test-content1 {content: "no quota";} micro-app[name=test-app2] .test-content2 {content: none;} micro-app[name=test-app2] .test-content3 {content: url(http://www.micro-app-test.com/);}')
          reslove(true)
        })
      }, false)
    })

    Object.defineProperty(navigator, 'userAgent', {
      value: rawUserAgent,
      writable: true,
      configurable: true,
    })
  })

  // 一些cssrules需要特殊处理
  test('some CSSRuleType should special handling', async () => {
    const microappElement3 = document.createElement('micro-app')
    microappElement3.setAttribute('name', 'test-app3')
    microappElement3.setAttribute('url', `http://127.0.0.1:${ports.scoped_css}/dynamic/`)

    appCon.appendChild(microappElement3)
    await new Promise((reslove) => {
      microappElement3.addEventListener('mounted', () => {
        setAppName('test-app3')
        // 动态创建style
        const dynamicStyle = document.createElement('style')
        dynamicStyle.textContent = '@font-face {font-family: test-font;} @media screen and (max-width: 300px) {body {background:lightblue;}} @supports (display: grid) {div {display: grid;}}'

        document.head.appendChild(dynamicStyle)

        defer(() => {
          expect(dynamicStyle.textContent).toBe('@font-face {font-family: test-font;}@media undefined {micro-app[name=test-app3] {background: lightblue;}}@supports (display: grid) {micro-app[name=test-app3] div {display: grid;}}')
          reslove(true)
        })
      }, false)
    })
  })

  // 补全静态资源地址
  test('complete static resource address', async () => {
    const rewIndexOf = String.prototype.indexOf
    const safariPolyfill = `//127.0.0.1:${ports.scoped_css}/safari-polyfill.png`
    String.prototype.indexOf = function (searchString: string): number {
      if (searchString === safariPolyfill) {
        return -1
      }
      return rewIndexOf.call(this, searchString)
    }
    const microappElement4 = document.createElement('micro-app')
    microappElement4.setAttribute('name', 'test-app4')
    microappElement4.setAttribute('url', `http://127.0.0.1:${ports.scoped_css}/dynamic/`)

    appCon.appendChild(microappElement4)
    await new Promise((reslove) => {
      microappElement4.addEventListener('mounted', () => {
        setAppName('test-app4')
        // 动态创建style
        const dynamicStyle1 = document.createElement('style')
        dynamicStyle1.textContent = '.static-path1 { background: url(http://www.micro-app-test.com/img.jpeg)} .static-path2 { background: url(data:image/png;base64,iVB...)} .static-path3 { background: url(../path1/img.png)} .static-path4 { background: url(./path1/img.png)}'
        // @ts-ignore
        dynamicStyle1.linkpath = 'http://www.micro-app-test.com/css/dynamic.css'

        document.head.appendChild(dynamicStyle1)
        expect(dynamicStyle1.textContent).toBe('micro-app[name=test-app4] .static-path1 {background: url(http://www.micro-app-test.com/img.jpeg);} micro-app[name=test-app4] .static-path2 {background: url(data:image/png;base64,iVB...);} micro-app[name=test-app4] .static-path3 {background: url("http://www.micro-app-test.com/path1/img.png");} micro-app[name=test-app4] .static-path4 {background: url("http://www.micro-app-test.com/css/path1/img.png");}')

        // safari 兼容 Safari会自动将cssRule的静态资源进行域名补全，需要单独处理
        const rawUserAgent = navigator.userAgent
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15',
          writable: true,
          configurable: true,
        })

        const dynamicStyle2 = document.createElement('style')
        dynamicStyle2.textContent = `.static-path5 { background: url("http:${safariPolyfill}")}`
        document.head.appendChild(dynamicStyle2)

        expect(dynamicStyle2.textContent).toBe(`micro-app[name=test-app4] .static-path5 {background: url("http:${safariPolyfill}");}`)

        Object.defineProperty(navigator, 'userAgent', {
          value: rawUserAgent,
          writable: true,
          configurable: true,
        })

        reslove(true)
      }, false)
    })

    String.prototype.indexOf = rewIndexOf
  })

  // 分支覆盖
  test('covering special branches', async () => {
    // 执行样式隔离时app已经被卸载
    const microappElement5 = document.createElement('micro-app')
    microappElement5.setAttribute('name', 'test-app5')
    microappElement5.setAttribute('url', `http://127.0.0.1:${ports.scoped_css}/common/`)
    microappElement5.setAttribute('destroy', 'true')

    appCon.appendChild(microappElement5)
    appCon.removeChild(microappElement5)

    // 模版样式sheet失效对动态添加的样式无影响
    const microappElement6 = document.createElement('micro-app')
    microappElement6.setAttribute('name', 'test-app6')
    microappElement6.setAttribute('url', `http://127.0.0.1:${ports.scoped_css}/common/`)
    microappElement6.setAttribute('destroy', 'true')

    appCon.appendChild(microappElement6)

    await new Promise((reslove) => {
      microappElement6.addEventListener('mounted', () => {
        setAppName('test-app6')
        // 动态创建style
        const dynamicStyle = document.createElement('style')
        document.head.appendChild(dynamicStyle)
        const templateStyle = document.body.querySelector('#micro-app-template-style')!
        document.body.removeChild(templateStyle)
        dynamicStyle.textContent = 'div {color: red}'

        defer(() => {
          // 所有style都被清空内容
          expect(dynamicStyle.textContent).toBe('micro-app[name=test-app6] div {color: red;}')
          reslove(true)
        })
      }, false)
    })
  })

  // styled-component降级处理
  test('temporary handle for styled component', async () => {
    const microappElement7 = document.createElement('micro-app')
    microappElement7.setAttribute('name', 'test-app7')
    microappElement7.setAttribute('url', `http://127.0.0.1:${ports.scoped_css}/common/`)

    appCon.appendChild(microappElement7)

    await new Promise((reslove) => {
      microappElement7.addEventListener('mounted', () => {
        setAppName('test-app7')
        // 模拟生产环境styled-component style标签
        const dynamicStyle1 = document.createElement('style')
        document.head.appendChild(dynamicStyle1)
        dynamicStyle1.appendChild(document.createTextNode(''))
        const sheet = dynamicStyle1.sheet!
        sheet.insertRule('.imred {color: red;}', 0)
        setTimeout(() => {
          expect(dynamicStyle1.textContent).toBe('')
        }, 10)

        // 模拟开发环境styled-component style标签
        const dynamicStyle2 = document.createElement('style')
        dynamicStyle2.setAttribute('data-styled', 'active')
        document.head.appendChild(dynamicStyle2)
        dynamicStyle2.textContent = '.imred {color: red;}'
        setTimeout(() => {
          expect(dynamicStyle2.textContent).toBe('.imred {color: red;}')
        }, 10)

        // 正常的style
        const dynamicStyle3 = document.createElement('style')
        document.head.appendChild(dynamicStyle3)
        document.head.removeChild(dynamicStyle3)

        dynamicStyle3.appendChild(document.createTextNode(''))
        setTimeout(() => {
          expect(dynamicStyle3.textContent).toBe('')
        }, 10)

        reslove(true)
      }, false)
    })
  })
})
