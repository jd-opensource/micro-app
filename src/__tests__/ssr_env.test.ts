import './common/set_ssr_env'
import preFetch from '../prefetch'
import { initGlobalEnv } from '../libs/global_env'
import microApp from '../micro_app'

describe('test ssr environment', () => {
  beforeAll(() => {
    global.console.error = jest.fn()
  })
  // 在非浏览器环境使用prefetch
  test('run prefetch in non browser environment', () => {
    preFetch([])
    expect(console.error).toBeCalledWith('[micro-app] preFetch is only supported in browser environment')
  })

  // 在非浏览器环境执行start
  test('run start in non browser environment', () => {
    microApp.start()
    initGlobalEnv()
    expect(console.error).toBeCalledWith('[micro-app] micro-app is not supported in this environment')
  })
})
