/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
import { useState, useEffect } from 'react'
import { Button, Spin, Col } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import microApp from '@micro-zoe/micro-app'
import config from '../../config'
import './vue2.less'
import lessStyles from './module.less'

const antIcon = <LoadingOutlined style={{ fontSize: 30 }} spin />

function Vue2 () {
  const [data, changeData] = useState({from: '来自基座的初始化数据'})
  const [showLoading, hideLoading] = useState(true)

  function mounted () {
    console.timeEnd('mounted-vue2')
    console.log('生命周期：mounted -- vue2', document.querySelector('micro-app'))
    microApp.preFetch([
      { name: 'my-app1', url: 'https://storage.360buyimg.com/launch/zeromock/umd-module.js', level: 3 }, // 加载资源并解析
    ])
    hideLoading(false)
  }

  function unmount () {
    console.log('生命周期：unmount -- vue2')
  }

  function jumpToHome () {
    microApp.router.push({name: 'vue2', path: '/micro-app/vue2/#/'})
  }

  function jumpToPage2 () {
    microApp.router.push({name: 'vue2', path: 'http://localhost:4001/micro-app/vue2/#/page2'})
  }

  function jumpToTable () {
    microApp.router.push({name: 'vue2', path: '/micro-app/vue2/#/table'})
  }

  useEffect(() => {
    console.time('vue2')
    console.time('mounted-vue2')
    // const releaseBeforeEach1 = microApp.router.beforeEach((to, from, appName) => {
    //   console.log('micro-app 全局 beforeEach: ', to, from, appName, window.location.hash)
    // })

    // const releaseAfterEach1 = microApp.router.afterEach((to, from, appName) => {
    //   console.log('micro-app 全局 afterEach: ', to, from, appName, window.location.hash)
    // })
    // return () => {
    //   releaseBeforeEach1()
    //   releaseAfterEach1()
    // }
  }, [])
  return (
    <div>
      <div className={lessStyles.testModule}>test-cssModule</div>
      <div className='btn-con'>
        <Col span={6} className='btn-con'>
          <Button
            type='primary'
            onClick={() => changeData({msg: '来自基座的数据' + (+new Date())})}
            style={{width: '120px'}}
          >
            发送数据
          </Button>
          <Button type="primary" onClick={jumpToHome}>基座控制子应用跳转home</Button>
          <Button type="primary" onClick={jumpToPage2}>基座控制子应用跳转page2</Button>
          <Button type="primary" onClick={jumpToTable}>基座控制子应用跳转table</Button>
        </Col>
      </div>
      {
        showLoading && <Spin indicator={antIcon} />
      }
      <micro-app
        name='vue2'
        // url={`${config.vue2}micro-app/vue2/`}
        url='http://localhost:9002/'
        data={data}
        // onBeforemount={() => hideLoading(false)}
        onMounted={mounted}
        onUnmount={unmount}
        onBeforeshow={mounted}
        // keep-alive
        // shadowDOM
        // destroy
        inline
        // disable-scopecss
        // disableSandbox
        // clear-data
        // iframe
      >
      </micro-app>
    </div>
  )
}

export default Vue2
