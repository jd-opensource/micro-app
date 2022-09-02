import { pureCreateElement } from '../libs/utils'

export const runCodeToIframe = (iframe: HTMLIFrameElement, proxyWindow:Window | undefined, code:string) => {
  const iframeDoc = iframe.contentWindow?.document

  iframe.contentWindow && ((iframe.contentWindow as any).window.__MICRO_APP_PROXY_WINDOW__ = proxyWindow)

  const script = pureCreateElement('script')
  script.textContent = code
  iframeDoc?.body.appendChild(script)
}
