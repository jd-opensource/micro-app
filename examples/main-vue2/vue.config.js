const path = require('path');

module.exports = {
  devServer: {
    hot: false,
    disableHostCheck: true,
    port: 4000,
    open: true,
    overlay: {
      warnings: false,
      errors: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  lintOnSave: false,
  // 自定义webpack配置
  configureWebpack: {

  },
  chainWebpack: config => {
    config.resolve.alias
    .set("@micro-zoe/micro-app", '@micro-zoe/micro-app/lib/index.esm.js')
  },
}
