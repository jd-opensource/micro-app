
## 前言
我们强烈建议你保持开发环境和线上环境路径(*即webpack的publicPath*)的一致性，以避免在部署后出现问题，无论是基座应用还是子应用。

比如一个应用，在部署时作为文件夹 `my-app` 放入服务器根目录，那么配置如下：
<!-- tabs:start -->
#### ** webpack **

```js
// webpack.config.js
module.exports = {
  output: {
    path: 'my-app',
    publicPath: process.env.NODE_ENV === 'production' ? '/my-app/' : '', // bad ❌
    publicPath: '/my-app/', // good 👍
  }
}
```

#### ** vue-cli **
```js
// vue.config.js
module.exports = {
  outputDir: 'my-app',
  publicPath: process.env.NODE_ENV === 'production' ? '/my-app/' : '', // bad ❌
  publicPath: '/my-app/', // good 👍
}
```
<!-- tabs:end -->

## 示例
正常来说只要开发环境和线上环境资源路径一致，并在部署后设置好nginx的跨域即可，在开发环境正常运行的项目，部署到服务器后，理论上也可以正常运行。

但在实际开发中经常会出现地址404、资源丢失等问题，这通常是因为服务器配置错误或者micro-app元素url属性地址错误导致。

我们以[micro-app-demo](https://github.com/micro-zoe/micro-app-demo-0.x)为例介绍部署相关内容，以供大家参考，因为`micro-app-demo`覆盖了history路由、hash路由、ssr、根路径、二级路径等大部分场景，是一个典型的案例。

#### 代码仓库目录结构：
```
.
├── child_apps
│   ├── angular11        // 子应用 angular11 (history路由)
│   ├── nextjs11         // 子应用 nextjs11 (history路由)
│   ├── nuxtjs2          // 子应用 nuxtjs2 (history路由) 
│   ├── react16          // 子应用 react16 (history路由)
│   ├── react17          // 子应用 react17 (hash路由)
│   ├── sidebar          // 子应用 sidebar，公共侧边栏
│   ├── vite-vue3        // 子应用 vite (hash路由)
│   ├── vue2             // 子应用 vue2 (history路由)
│   └── vue3             // 子应用 vue3 (history路由)
├── main_apps
│   ├── angular11        // 主应用 angular11 (history路由)
│   ├── nextjs11         // 主应用 nextjs11 (history路由)
│   ├── nuxtjs2          // 主应用 nuxtjs2 (history路由)
│   ├── react16          // 主应用 react16 (history路由)
│   ├── react17          // 主应用 react17 (history路由)
│   ├── vite-vue3        // 主应用 vite (history路由)
│   ├── vue2             // 主应用 vue2 (history路由)
│   └── vue3             // 主应用 vue3 (history路由)
├── package.json
└── yarn.lock
```

#### 部署到服务器的目录结构：

```
root(服务器根目录)
├── child
│   ├── angular11         // 子应用 angular11
│   ├── react16           // 子应用 react16
│   ├── react17           // 子应用 react17
│   ├── sidebar           // 子应用 sidebar
│   ├── vite              // 子应用 vite
│   ├── vue2              // 子应用 vue2
│   ├── vue3              // 子应用 vue3
│   ├── nextjs11          // 子应用 nextjs11，为每个基座应用单独打包，端口号：5001~5009
│   └── nuxtjs2           // 子应用 nuxtjs2，为每个基座应用单独打包，端口号：6001~6009
│ 
├── main-angular11        // 主应用 angular11
├── main-react16          // 主应用 react16
├── main-react17          // 主应用 react17
├── main-vite             // 主应用 vite
├── main-vue2             // 主应用 vue2
├── main-vue3             // 主应用 vue3
├── main-nextjs11         // 主应用 nextjs11，监听端口号：5000
├── main-nuxtjs2          // 主应用 nuxtjs2，监听端口号：7000
```

#### nginx配置如下：

以下配置仅供参考，具体项目根据实际情况调整。
```js
# micro-zoe.com 相关配置
server {
  listen       80;
  server_name  www.micro-zoe.com micro-zoe.com;

  location / {
    root /root/mygit/micro-zoe;
    index index.php index.html index.htm;
    # add_header Cache-Control;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
  }

  # 主应用main-angular11
  location /main-angular11 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /main-angular11/index.html;
  }

  # 主应用main-react16
  location /main-react16 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /main-react16/index.html;
  }

  # 主应用main-react17
  location /main-react17 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /main-react17/index.html;
  }

  # 主应用main-vite
  location /main-vite {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /main-vite/index.html;
  }

  # 主应用main-vue2
  location /main-vue2 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /main-vue2/index.html;
  }

  # 主应用main-vue3
  location /main-vue3 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /main-vue3/index.html;
  }

  # 子应用child-angular11
  location /child/angular11 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /child/angular11/index.html;
  }

  # 子应用child-react16
  location /child/react16 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /child/react16/index.html;
  }

  # 子应用child-react17
  location /child/react17 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /child/react17/index.html;
  }
  
  # 子应用child-sidebar
  location /child/sidebar {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /child/sidebar/index.html;
  }

  # 子应用child-vite
  location /child/vite {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /child/vite/index.html;
  }

  # 子应用child-vue2
  location /child/vue2 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /child/vue2/index.html;
  }

  # 子应用child-vue3
  location /child/vue3 {
    root /root/mygit/micro-zoe;
    add_header Access-Control-Allow-Origin *;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
      add_header Cache-Control max-age=7776000;
      add_header Access-Control-Allow-Origin *;
    }
    try_files $uri $uri/ /child/vue3/index.html;
  }
  
  error_page 404 /404.html;
      location = /40x.html {
  }

  error_page 500 502 503 504 /50x.html;
      location = /50x.html {
  }
}

# 主应用nextjs11部署后监听5000端口，设置代理指向5000端口，则可以通过 nextjs11.micro-zoe.com 访问主应用
server {
  listen       80;
  server_name  nextjs11.micro-zoe.com;

  root html;
  index index.html index.htm;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host:80;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # add_header Cache-Control;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
        add_header Cache-Control max-age=7776000;
        add_header Access-Control-Allow-Origin *;
    }
  }


  error_page 404 /404.html;
    location = /40x.html {
  }

  error_page 500 502 503 504 /50x.html;
    location = /50x.html {
  }
}

# 主应用nuxtjs2部署后监听7000端口，设置代理指向7000端口，则可以通过 nuxtjs2.micro-zoe.com 访问主应用
server {
  listen       80;
  server_name  nuxtjs2.micro-zoe.com;

  root html;
  index index.html index.htm;

  location / {
    proxy_pass http://127.0.0.1:7000;
    proxy_set_header Host $host:80;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # add_header Cache-Control;
    if ( $request_uri ~* ^.+.(js|css|jpg|png|gif|tif|dpg|jpeg|eot|svg|ttf|woff|json|mp4|rmvb|rm|wmv|avi|3gp)$ ){
        add_header Cache-Control max-age=7776000;
        add_header Access-Control-Allow-Origin *;
    }
  }


  error_page 404 /404.html;
    location = /40x.html {
  }

  error_page 500 502 503 504 /50x.html;
    location = /50x.html {
  }
}
```

#### 线上效果如下：
- main-vue2：[http://www.micro-zoe.com/main-vue2/](http://www.micro-zoe.com/main-vue2/)
- main-nextjs11：[http://nextjs11.micro-zoe.com/](http://nextjs11.micro-zoe.com/)
- main-nuxtjs2：[http://nuxtjs2.micro-zoe.com/](http://nuxtjs2.micro-zoe.com/)
