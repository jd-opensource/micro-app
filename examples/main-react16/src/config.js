
let config = {
  react16: 'http://localhost:3001/',
  react17: 'http://localhost:3002/',
  vue2: 'http://localhost:4001/',
  vue3: 'http://localhost:4002/',
  nuxtjs: 'http://localhost:4003/',
  angular11: 'http://localhost:6001/',
  vite: 'http://localhost:7001/',
}
const isEnvPro = process.env.NODE_ENV === 'production'

if (isEnvPro) {
  const baseUrl = `${location.origin}/`
  config = {
    react16: baseUrl,
    react17: baseUrl,
    vue2: baseUrl,
    vue3: baseUrl,
    nuxtjs: baseUrl,
    angular11: baseUrl,
    vite: baseUrl,
  }
}

export default config
