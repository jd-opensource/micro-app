/* eslint-disable import/first -- the worker mock must be hoisted before sandbox imports. */
jest.mock('../../proxies/worker', () => ({
  __esModule: true,
  default: class Worker {},
  releaseWorkersByApp: jest.fn(),
}))

import globalEnv from '../../libs/global_env'
import microApp from '../../micro_app'
import WithSandBox from '../../sandbox/with'
import { patchWindow as patchIframeWindow } from '../../sandbox/iframe/window'
import { patchDocument as patchIframeDocument } from '../../sandbox/iframe/document'

describe('sandbox event listener cleanup', () => {
  beforeAll(() => {
    microApp.start({ plugins: {} })
  })

  test('release removes listeners registered with capture enabled', () => {
    const sandbox = new WithSandBox('capture-test', 'http://localhost:3000/')
    const listener = jest.fn()
    const documentListener = jest.fn()

    sandbox.proxyWindow.addEventListener('resize', listener, { capture: true })
    sandbox.proxyWindow.document.addEventListener('click', documentListener, { capture: true })
    globalEnv.rawWindow.dispatchEvent(new Event('resize'))
    globalEnv.rawDocument.dispatchEvent(new Event('click'))
    expect(listener).toHaveBeenCalledTimes(1)
    expect(documentListener).toHaveBeenCalledTimes(1)

    listener.mockClear()
    documentListener.mockClear()
    sandbox.releaseGlobalEffect({ destroy: true })
    globalEnv.rawWindow.dispatchEvent(new Event('resize'))
    globalEnv.rawDocument.dispatchEvent(new Event('click'))
    expect(listener).not.toHaveBeenCalled()
    expect(documentListener).not.toHaveBeenCalled()
  })

  test('iframe release removes listeners registered with capture enabled', () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const microWindow = iframe.contentWindow!
    const sandbox = {
      escapeProperties: [],
      proxyLocation: microWindow.location,
      options: { container: document.body },
    } as any
    const effect = patchIframeWindow('iframe-capture-test', microWindow as any, sandbox)
    const documentEffect = patchIframeDocument('iframe-capture-test', microWindow as any, sandbox)
    const listener = jest.fn()
    const documentListener = jest.fn()
    microWindow.addEventListener('resize', listener, { capture: true })
    microWindow.document.addEventListener('click', documentListener, { capture: true })
    globalEnv.rawWindow.dispatchEvent(new Event('resize'))
    globalEnv.rawDocument.dispatchEvent(new Event('click'))
    expect(listener).toHaveBeenCalledTimes(1)
    expect(documentListener).toHaveBeenCalledTimes(1)

    listener.mockClear()
    documentListener.mockClear()
    effect.release()
    documentEffect.release()
    globalEnv.rawWindow.dispatchEvent(new Event('resize'))
    globalEnv.rawDocument.dispatchEvent(new Event('click'))
    expect(listener).not.toHaveBeenCalled()
    expect(documentListener).not.toHaveBeenCalled()
    iframe.remove()
  })
})
