<p align="center">
  <a href="https://jd-opensource.github.io/micro-app/">
    <img src="https://zeroing.jd.com/micro-app/media/logo.png" alt="logo" width="200"/>
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@micro-zoe/micro-app">
    <img src="https://img.shields.io/npm/v/@micro-zoe/micro-app.svg" alt="version"/>
  </a>
  <a href="https://www.npmjs.com/package/@micro-zoe/micro-app">
    <img src="https://img.shields.io/npm/dt/@micro-zoe/micro-app.svg" alt="downloads"/>
  </a>
  <a href="https://github.com/jd-opensource/micro-app/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@micro-zoe/micro-app.svg" alt="license"/>
  </a>
  <a href="https://github.com/jd-opensource/micro-app/blob/dev/Contact.md">
    <img src="https://img.shields.io/badge/chat-wechat-blue" alt="WeChat">
  </a>
  <a href="https://travis-ci.com/github/jd-opensource/micro-app">
    <img src="https://api.travis-ci.com/jd-opensource/micro-app.svg?branch=master" alt="travis"/>
  </a>
  <a href="https://coveralls.io/github/jd-opensource/micro-app?branch=master">
    <img src="https://coveralls.io/repos/github/jd-opensource/micro-app/badge.svg?branch=master" alt="coveralls"/>
  </a>
</p>

[English](https://github.com/jd-opensource/micro-app)｜简体中文｜[官网文档](https://jd-opensource.github.io/micro-app/)｜[讨论组](https://github.com/jd-opensource/micro-app/discussions)｜[微信群](./Contact.md)

# 📖简介
micro-app是京东零售推出的一款微前端框架，它基于类WebComponent进行渲染，从组件化的思维实现微前端，旨在降低上手难度、提升工作效率。它是目前接入微前端成本最低的框架，并且提供了JS沙箱、样式隔离、元素隔离、预加载、虚拟路由系统、插件系统、数据通信等一系列完善的功能。

micro-app与技术栈无关，对前端框架没有限制，任何框架都可以作为基座应用嵌入任何类型的子应用。

# 如何使用
## 主应用

**1、安装依赖**
```bash
yarn add @micro-zoe/micro-app
```

**2、在入口文件引入**
```js
// main.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

**3、在页面中嵌入微前端应用**
```html
<!-- 👇 name为应用名称，url为应用地址 -->
<micro-app name='my-app' url='http://localhost:3000/'></micro-app>
```

## 子应用

**在webpack-dev-server的headers中设置跨域支持。**
```js
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
},
```

以上即完成微前端的嵌入，效果如下：

<img src="https://img12.360buyimg.com/imagetools/jfs/t1/196940/34/1541/38365/610a14fcE46c21374/c321b9f8fa50a8fc.png" alt="result" width='900'/>

更多详细配置可以查看[官网文档](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/start)

# 🤝 参与共建
如果您对这个项目感兴趣，欢迎参与贡献，也欢迎 "Star" 支持一下 ^_^

### 本地运行
1、克隆项目
```
git clone https://github.com/jd-opensource/micro-app.git
```

2、安装依赖
```
yarn bootstrap
```

3、运行项目
```
yarn start # 访问 http://localhost:3000
```

更多命令请查看[DEVELP](https://github.com/jd-opensource/micro-app/blob/master/DEVELOP.zh-cn.md)

# FAQ
[问题汇总](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/questions)
<details>

  <summary>micro-app的优势在哪里？</summary>
  上手简单、侵入性低，只需改动少量的代码即可接入微前端，同时提供丰富的功能。

  具体细节请参考文章：[micro-app介绍](https://github.com/jd-opensource/micro-app/issues/8)

</details>
<details>
  <summary>兼容性如何？</summary>
  micro-app依赖于CustomElements和Proxy两个较新的API。

  对于不支持CustomElements的浏览器，可以通过引入polyfill进行兼容，详情可参考：[webcomponents/polyfills](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements)。

  但是Proxy暂时没有做兼容，所以对于不支持Proxy的浏览器无法运行micro-app。

  浏览器兼容性可以查看：[Can I Use](https://caniuse.com/?search=Proxy)

  总体如下：
  - PC端：除了IE浏览器，其它浏览器基本兼容。
  - 移动端：ios10+、android5+
</details>

<details>
  <summary>子应用一定要支持跨域吗？</summary>
  是的！

  如果是开发环境，可以在webpack-dev-server中设置headers支持跨域。
  ```js
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }
  ```

  如果是线上环境，可以通过[配置nginx](https://segmentfault.com/a/1190000012550346)支持跨域。
</details>

<details>
  <summary>支持vite吗?</summary>
  
  支持，详情请查看[适配vite](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/framework/vite)
</details>

<details>
  <summary>支持ssr吗?</summary>
  
  支持，详情请查看[nextjs](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/framework/nextjs)、[nuxtjs](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/framework/nuxtjs)
</details>


# 贡献者们
<a href="https://github.com/jd-opensource/micro-app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jd-opensource/micro-app" />
</a>


# License
[MIT License](https://github.com/jd-opensource/micro-app/blob/master/LICENSE)
