export const createIframe = (iframeId: string) => {
  const iframe = document.createElement('iframe')
  iframe.src = 'about:blank'
  iframe.id = iframeId
  iframe.style.display = 'none'

  return iframe
}
