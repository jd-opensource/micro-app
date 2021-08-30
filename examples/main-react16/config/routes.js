export default [
  {
    path: '/',
    component: '../layouts/BlankLayout',
    routes: [
      {
        path: '/',
        component: '../layouts/SecurityLayout',
        routes: [
          {
            path: '/',
            component: '../layouts/BasicLayout',
            authority: ['admin', 'user'],
            routes: [
              {
                path: '/',
                redirect: '/react16',
              },
              {
                path: '/react16',
                name: 'react16',
                icon: 'StarOutlined',
                component: './react16/react16',
                exact: false,
              },
              {
                path: '/react17',
                name: 'react17',
                icon: 'TrademarkOutlined',
                component: './react17/react17',
                exact: false,
              },
              {
                path: '/vue2',
                name: 'vue2',
                icon: 'FireOutlined',
                component: './vue2/vue2',
                exact: false,
              },
              {
                path: '/vue3',
                name: 'vue3',
                icon: 'ThunderboltOutlined',
                component: './vue3/vue3',
                exact: false,
              },
              {
                path: '/nuxtjs',
                name: 'nuxtjs',
                icon: 'ThunderboltOutlined',
                component: './nuxtjs/nuxtjs',
                exact: false,
              },
              {
                path: '/vite',
                name: 'vite',
                icon: 'SendOutlined',
                component: './vite/vite',
                exact: false,
              },
              {
                path: '/angular11',
                name: 'angular11',
                icon: 'HistoryOutlined',
                component: './angular11/angular11',
                exact: false,
              },
              {
                path: '/multiple',
                name: 'multiple',
                icon: 'HddOutlined',
                component: './multiple/multiple',
                exact: false,
              },
              {
                name: 'self',
                path: '/self',
                icon: 'CloudOutlined',
                component: './self',
              },
              {
                component: './404',
              },
            ],
          },
          {
            component: './404',
          },
        ],
      },
    ],
  },
  {
    component: './404',
  },
];
