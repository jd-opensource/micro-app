We list the modifications required for the main application and the child application respectively, and introduce how to use `micro-app`.

### Main Application :id=main

**1. Install dependencies**
```bash
npm i @micro-zoe/micro-app --save
```

**2. Initialize `micro-app`**
```js
// index.js
import microApp from '@micro-zoe/micro-app'

microApp.start()
```

**3. Load Child Application**

`micro-app` loads child applications via the custom element `<micro-app>`, which is as simple as using an iframe.

<!-- tabs:start -->
#### ** React **
```js
export function MyPage () {
  return (
    <div>
      // name: app name, url: app address
      <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
    </div>
  )
}
```

#### ** Vue **
```html
<template>
  <!-- name: app name, url: app address -->
  <micro-app name='my-app' url='http://localhost:3000/'></micro-app>
</template>
```
<!-- tabs:end -->

> [!NOTE]
> 1. name: required parameter, must start with a letter, and cannot contain special characters (except hyphens and underscores)
>
> 2. url: required parameter, must point to the index.html of the child application, e.g., http://localhost:3000/ or http://localhost:3000/index.html


### Child Application :id=child

`micro-app` loads static resources of the child application from the main application via fetch. Since the domain names of the main application and the child application may not be the same, the child application needs to support Cross-Origin Resource Sharing (CORS).

The way to set up CORS for the child application is as follows:

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
# Adjust location according to actual situation
location / {
    add_header 'Access-Control-Allow-Origin' '*';
    # other configs...
}
```

#### ** nodejs **
Take express as an example, manually configure middleware
```js
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // other configs
})
```
<!-- tabs:end -->


Completing the above steps completes the integration of the micro-frontend. For more detailed integration steps, please refer to [Step by Step](/0.x/en-us/framework/introduce).