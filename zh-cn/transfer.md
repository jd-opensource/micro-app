从0.x版本迁移到1.0只针对于旧项目，如果在迁移中发现问题，请及时反馈。

### 迁移步骤
**1、安装最新版本**
```bash
npm i @micro-zoe/micro-app@latest --save
```

**2、在start中增加配置**
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start({
  'disable-memory-router': true, // 关闭虚拟路由系统
  'disable-patch-request': true, // 关闭对子应用请求的拦截
})
```

### vite迁移
这里只针对子应用是vite的情况，主应用为vite不需要特殊处理。

如果你已经接入vite子应用且正常运行，不建议进行迁移操作，除非遇到问题。

##### 迁移步骤：


###### 步骤1：删除子应用vite.config.js中的配置

![alt](https://img11.360buyimg.com/imagetools/jfs/t1/139617/40/34382/151613/642ea0aaF6702a8f3/6499828d857d86d4.png ':size=900')


###### 步骤2：开启iframe沙箱
删除之前的两个配置项：`inline`、`disableSandbox`，然后开启iframe沙箱。

```html
<micro-app name='名称' url='地址' iframe></micro-app>
```

###### 步骤3：删除主应用中的自定义插件
![alt](https://img11.360buyimg.com/imagetools/jfs/t1/183018/25/34575/44563/642ea0a9F91294e53/03f1ef93b1531932.png ':size=900')


###### 步骤4：删除手动注册的通信对象
删除手动注册的通信对象，改用默认的通信方式进行数据通信，参考[数据通信](/zh-cn/data)章节。

![alt](https://img10.360buyimg.com/imagetools/jfs/t1/98342/11/36602/21989/642ea0a9F6e5a197f/841d7fbd1e2c7bd1.png ':size=700')
