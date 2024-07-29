我们分别列出主应用和子应用需要进行的修改，具体介绍`micro-app`的使用方式。

### 主应用 :id=main

**1、安装依赖**
```bash
npm i @micro-zoe/micro-app --save
```

**2、初始化`micro-app`**
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

**3、加载子应用**

micro-app通过自定义元素`<micro-app>`加载子应用，使用方式像iframe一样简洁

<!-- tabs:start -->
#### ** React **
```js
export function MyPage () {
  return (
    <div>
      // name：应用名称, url：应用地址
      <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
    </div>
  )
}
```

#### ** Vue **
```html
<template>
  <!-- name：应用名称, url：应用地址 -->
  <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
</template>
```
<!-- tabs:end -->

> [!NOTE]
> 1、name：必传参数，必须以字母开头，且不可以带特殊符号(中划线、下划线除外)
>
> 2、url：必传参数，必须指向子应用的index.html，如：http://localhost:3000/ 或 http://localhost:3000/index.html


### 子应用 :id=child

micro-app从主应用通过fetch加载子应用的静态资源，由于主应用与子应用的域名不一定相同，所以子应用需要支持跨域。

子应用设置跨域方式如下：

<!-- tabs:start -->
#### ** webpack **
```js
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  }
}
```

#### ** vite **
```js
export default defineConfig({
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  }
})
```

#### ** nginx **
```js
# location根据实际情况调整
location / {
    add_header 'Access-Control-Allow-Origin' '*';
    # 其它配置...
}
```

#### ** nodejs **
以express为例，手动配置中间件
```js
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // 其它配置
})
```
<!-- tabs:end -->


完成以上步骤即完成微前端的接入，更详细的接入步骤请参考[手把手](/zh-cn/framework/introduce)。
