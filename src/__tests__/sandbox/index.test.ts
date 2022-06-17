/* eslint-disable promise/param-names */
import { commonStartEffect, releaseAllEffect, ports } from '../common/initial'
import microApp from '../..'
import Sandbox from '../../sandbox'

declare global {
  interface Window {
    escapeProperty1: string
    escapeProperty2: string
    escapeProperty3: string
    System: string
    'same-key': string
    '__REACT_ERROR_OVERLAY_GLOBAL_HOOK__': string
    key1: string
    key2: string
    key3: string
    _babelPolyfill: boolean
    boundFunction: any
  }
}

describe('sandbox', () => {
  // let appCon: Element
  beforeAll(() => {
    commonStartEffect(ports.sandbox)
    // appCon = document.querySelector('#app-container')!

    microApp.start({
      plugins: {
        global: [
          {
            scopeProperties: ['scopeProperty1', 'scopeProperty2', 'same-key'],
            escapeProperties: ['escapeProperty1', 'escapeProperty2', 'same-key'],
          },
          {
            scopeProperties: 'invalid scopeProperties',
            escapeProperties: 'invalid escapeProperties'
          },
          'invalid plugin' as any,
        ],
        modules: {
          'test-app-scopeProperties': [
            {
              scopeProperties: ['scopeProperty3'],
            },
            {
              scopeProperties: 'invalid scopeProperties',
              escapeProperties: 'invalid escapeProperties'
            },
            'invalid plugin' as any,
          ],
          'test-app-escapeProperties': [
            {
              escapeProperties: ['escapeProperty3'],
            },
            {
              scopeProperties: 'invalid scopeProperties',
              escapeProperties: 'invalid escapeProperties'
            },
            'invalid plugin' as any,
          ],
          'test-app1': 'invalid-module' as any,
        }
      },
    })
  })

  afterAll(() => {
    return releaseAllEffect()
  })

  // 一些需要返回 proxyWindow 的变量
  test('which keys should return proxyWindow in sandbox', () => {
    const proxyWindow = new Sandbox('test-app2', `http://127.0.0.1:${ports.sandbox}/common/`).proxyWindow
    expect(proxyWindow.window).toBe(proxyWindow)
    expect(proxyWindow.self).toBe(proxyWindow)
    // @ts-ignore
    expect(proxyWindow.globalThis).toBe(proxyWindow)
    expect(proxyWindow.top).toBe(proxyWindow)
    expect(proxyWindow.parent).toBe(proxyWindow)
  })

  // 在iframe中top和parent应该是不同的
  test('top and parent is different when base app in iframe', () => {
    Object.defineProperties(window, {
      top: {
        value: 1,
      },
      parent: {
        value: 2,
      }
    })
    const proxyWindow = new Sandbox('test-app3', `http://127.0.0.1:${ports.sandbox}/common/`).proxyWindow
    expect(proxyWindow.top).toBe(1)
    expect(proxyWindow.parent).toBe(2)
  })

  // 测试强隔离属性
  test('scopeProperties should prevent key in rawWidow', () => {
    const sandbox = new Sandbox('test-app-scopeProperties', `http://127.0.0.1:${ports.sandbox}/common/`)

    sandbox.start('')

    const proxyWindow: any = sandbox.proxyWindow

    // 原window上自带变量
    Object.defineProperties(window, {
      scopeProperty1: {
        value: 1,
        configurable: false,
        enumerable: true,
        writable: true,
      },
      scopeProperty2: {
        value: 2,
      },
      scopeProperty3: {
        value: 3,
      },
      notScopedProperty: {
        value: 4,
        configurable: false,
        enumerable: true,
        writable: true,
      }
    })

    Object.defineProperty(window, 'qqqqqqqqqq', {
      value: 11,
      configurable: false,
      enumerable: true,
      writable: true,
    })

    // proxyWindow 无法继承原window上被隔离的变量
    expect(proxyWindow.scopeProperty1).toBeUndefined()
    expect(proxyWindow.scopeProperty2).toBeUndefined()
    expect(proxyWindow.scopeProperty3).toBeUndefined()

    // proxyWindow 对隔离属性的设置只能作用于自身
    proxyWindow.scopeProperty1 = 'scopeProperty1-value'
    expect(proxyWindow.scopeProperty1).toBe('scopeProperty1-value')
    const proxyScopedPro1Desc = Object.getOwnPropertyDescriptor(proxyWindow, 'scopeProperty1')
    expect(proxyScopedPro1Desc?.configurable).toBeTruthy()

    proxyWindow.notScopedProperty = 'not-ScopedProperty-value'
    proxyWindow.qqqqqqqqqq = 11
    const proxyNotScopedProDesc = Object.getOwnPropertyDescriptor(proxyWindow, 'notScopedProperty')
    expect(proxyNotScopedProDesc?.configurable).toBeFalsy()
  })

  // 逃离属性可以逃逸到外层真实window上&卸载时清空escapeKeys
  test('escapeProperties should escape from microAppWindow to rawWindow', () => {
    const sandbox = new Sandbox('test-app-escapeProperties', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow

    Object.defineProperties(window, {
      __REACT_ERROR_OVERLAY_GLOBAL_HOOK__: {
        value: 'origin-react-hook',
        writable: true,
        configurable: true,
      },
    })

    // 可逃逸属性
    proxyWindow.escapeProperty1 = 'global-plugin-value'
    proxyWindow.System = 'static-value-System'
    proxyWindow.escapeProperty3 = 'module-plugin-value'

    // 不可逃逸属性
    // scoped的优先级高
    proxyWindow['same-key'] = 'scoped has a higher priority than escape'
    // staticEscapeProperties 的优先级比原window属性低
    proxyWindow.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = 'static-escape-key has lower priority than rawWindow'

    expect(window.escapeProperty1).toBe('global-plugin-value')
    expect(window.System).toBe('static-value-System')
    expect(window.escapeProperty3).toBe('module-plugin-value')
    expect(window['same-key']).toBeUndefined()
    expect(window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__).toBe('origin-react-hook')

    // 卸载时清空泄漏到外部window上的变量
    // @ts-ignore
    expect(sandbox.escapeKeys.size).toBe(3)
    // @ts-ignore
    expect(sandbox.active).toBeTruthy()
    sandbox.stop()
    // @ts-ignore
    expect(sandbox.escapeKeys.size).toBe(0)
    // @ts-ignore
    expect(sandbox.active).toBeFalsy()
    expect(window.escapeProperty1).toBeUndefined()
    expect(window.System).toBeUndefined()
    expect(window.escapeProperty3).toBeUndefined()
  })

  // escapeSetterKeyList 只能赋值给原生window
  test('escapeSetterKeyList should only acts on rawWindow', () => {
    const sandbox = new Sandbox('test-app-escapeSetterKeyList', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow

    proxyWindow.location = 'https://www.micro-app-test.com'

    expect(sandbox.microAppWindow.location).toBeUndefined()
  })

  // has方法从proxyWindow和rawWindow上同时判断
  test('proxyWindow combine with rawWindow in has', () => {
    const sandbox = new Sandbox('test-app-has', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow
    proxyWindow.inlineKey = 'inline-key-value'

    expect('location' in proxyWindow).toBe(true)
    expect('scopeProperty1' in proxyWindow).toBe(false)
    expect('inlineKey' in proxyWindow).toBe(true)
    expect('Math' in proxyWindow).toBe(true)
  })

  // 缓存 window 属性值时，也可以正确获取到 currentAppName
  test('test cache window property', () => {
    const sandbox = new Sandbox('test-app-has', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const doc = sandbox.proxyWindow.document
    Promise.resolve().then(() => {
      const div = doc.createElement('div')
      expect(div.__MICRO_APP_NAME__).toBe('test-app-has')
    })
  })

  // getOwnPropertyDescriptor 和 defineProperty
  test('getOwnPropertyDescriptor and defineProperty', () => {
    const sandbox = new Sandbox('test-app-defineProperty', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow
    proxyWindow.key1 = 'value1'

    Object.defineProperties(window, {
      key2: {
        value: 'value2',
        configurable: false,
        writable: true,
      },
      key3: { // key3 覆盖分支
        value: 'value3',
        configurable: true,
        writable: true,
        enumerable: true,
      },
    })

    // getOwnPropertyDescriptor取值时记入缓存
    expect(Object.getOwnPropertyDescriptor(proxyWindow, 'key1')?.configurable).toBeTruthy()
    expect(Object.getOwnPropertyDescriptor(proxyWindow, 'key2')?.configurable).toBeTruthy()
    expect(Object.getOwnPropertyDescriptor(proxyWindow, 'key3')?.configurable).toBeTruthy()
    expect(Object.getOwnPropertyDescriptor(proxyWindow, 'not-exist')).toBeUndefined()

    // defineProperty
    Object.defineProperty(proxyWindow, 'key1', {
      value: 'new-value1'
    })
    Object.defineProperty(proxyWindow, 'key2', {
      value: 'new-value2'
    })
    Object.defineProperty(proxyWindow, 'not-exist', {
      value: 'not-exist-value'
    })

    expect(proxyWindow.key1).toBe('new-value1')
    // Object.defineProperty定义不会触发proxy set钩子
    expect(window.key1).toBeUndefined()
    expect(window.key2).toBe('new-value2')
    // 兜底到原window上
    expect(proxyWindow.key2).toBe('new-value2')
    expect(proxyWindow['not-exist']).toBe('not-exist-value')
  })

  // ownKeys从proxyWindow和rawWindow获取所有到key
  test('ownKeys should get keys from proxyWindow & rawWindow', () => {
    const sandbox = new Sandbox('test-app-ownKeys', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow
    proxyWindow.ownKey1 = 'ownKey1-value'

    const keys = Reflect.ownKeys(proxyWindow)
    expect(keys.length).toBeGreaterThan(10)
    expect(keys.includes('ownKey1')).toBeTruthy()
  })

  // 删除属性
  test('deleteProperty from proxyWindow', () => {
    const sandbox = new Sandbox('test-app-deleteProperty', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow
    proxyWindow.deleteProperty1 = 'deleteProperty1-value'
    proxyWindow.escapeProperty1 = 'escapeProperty1-value'

    expect(window.escapeProperty1).toBe('escapeProperty1-value')

    delete proxyWindow.deleteProperty1
    delete proxyWindow.escapeProperty1
    delete proxyWindow.notExist

    expect(proxyWindow.deleteProperty1).toBeUndefined()
    expect(window.escapeProperty1).toBeUndefined()
  })

  // proxyWindow的hasOwnProperty是特殊处理的
  test('hasOwnProperty is customized for proxyWindow', () => {
    const sandbox = new Sandbox('test-app-hasOwnProperty', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow
    proxyWindow.hasOwnProperty1 = 'hasOwnProperty1-value'

    expect(proxyWindow.hasOwnProperty('hasOwnProperty1')).toBeTruthy()
    expect(proxyWindow.hasOwnProperty('location')).toBeTruthy()
    expect(proxyWindow.hasOwnProperty('not-exist')).toBeFalsy()
  })

  // active标记沙箱是否处于开启状态，并对一些场景进行拦截
  test('active is switch for sandbox', () => {
    const sandbox = new Sandbox('test-app-active', `http://127.0.0.1:${ports.sandbox}/common/`)
    const proxyWindow: any = sandbox.proxyWindow

    proxyWindow.notExecute = 'notExecute-value'
    expect(proxyWindow.notExecute).toBeUndefined()

    sandbox.start('')
    sandbox.start('') // 多次执行start无效

    proxyWindow.notExecute = 'notExecute-value'
    expect(proxyWindow.notExecute).toBe('notExecute-value')

    sandbox.stop()
    sandbox.stop() // 多次执行start无效
  })

  // proxyWindow没有此变量而rawWindow有，则优先使用rawWindow的descriptor
  test('priority of use descriptor from rawWindow', () => {
    const sandbox = new Sandbox('test-app-descriptor', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow

    Object.defineProperties(window, {
      'descriptor-key1': {
        value: 'descriptor-key1',
        configurable: true,
        writable: true,
        enumerable: true,
      },
      'descriptor-key2': {
        value: 'descriptor-key2',
        configurable: false,
        writable: false,
        enumerable: false,
      },
    })

    proxyWindow['descriptor-key1'] = 'new-descriptor-key1'
    proxyWindow['descriptor-key2'] = 'new-descriptor-key2'

    expect(proxyWindow['descriptor-key1']).toBe('new-descriptor-key1')
    // 原生window有相同值，且writable为false，value依然可以定义到proxyWindow上
    expect(proxyWindow['descriptor-key2']).toBe('new-descriptor-key2')
  })

  // 将原window上的_babelPolyfill设置为false
  test('_babelPolyfill should be false', () => {
    const sandbox = new Sandbox('test-app-_babelPolyfill', `http://127.0.0.1:${ports.sandbox}/common/`)
    window._babelPolyfill = true
    sandbox.start('')

    expect(window._babelPolyfill).toBeFalsy()
  })

  // 测试bind_function中的isBoundedFunction方法
  test('test bind_function of isBoundedFunction', () => {
    const sandbox = new Sandbox('test-isBoundedFunction', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow

    function willBind () {}
    const boundFunction = willBind.bind(window)
    window.boundFunction = boundFunction

    expect(proxyWindow.boundFunction.name).toBe('bound willBind')
    expect(proxyWindow.boundFunction).toBe(boundFunction)
  })

  // 测试重写eval、Image方法
  test('test set eval & Image', () => {
    const sandbox = new Sandbox('test-set-eval&Image', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow

    proxyWindow.eval = 'new-eval'
    expect(proxyWindow.eval).toBe('new-eval')

    proxyWindow.Image = 'new-image'
    expect(proxyWindow.Image).toBe('new-image')
  })

  // 分支覆盖 proxyWindow getter方法
  test('coverage: proxyWindow getter', () => {
    const sandbox = new Sandbox('test-coverage-proxy-getter', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    const proxyWindow: any = sandbox.proxyWindow

    Object.defineProperties(window, {
      'key1-for-proxy-getter': {
        get () {
          return 'key1-proxy-getter-value'
        },
        set () {},
        configurable: true,
        enumerable: true,
      },
    })

    proxyWindow['key1-for-proxy-getter'] = 'set value to proxyWindow'
    expect(Object.getOwnPropertyDescriptor(proxyWindow, 'key1-for-proxy-getter')?.writable).toBeTruthy()
  })

  // 分支覆盖: 在createDescriptorForMicroAppWindow 获取descriptor为空
  test('coverage: empty descriptor in createDescriptorForMicroAppWindow ', () => {
    // @ts-ignore
    delete window.parent
    const sandbox = new Sandbox('empty-descriptor-createDescriptorForMicroAppWindow', `http://127.0.0.1:${ports.sandbox}/common/`)
    sandbox.start('')
    expect(Object.getOwnPropertyDescriptor(window, 'parent')).toBeUndefined()
  })
})
