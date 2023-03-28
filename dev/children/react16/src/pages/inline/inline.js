/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
import { useState } from 'react'
import { Button, Spin } from 'antd'
import microApp from '@micro-zoe/micro-app'
import config from '../../config'
import './inline.less'

function Vue2 () {
  const [data] = useState({from: '来自基座的初始化数据'})
  const [showLoading, hideLoading] = useState(true)
  return (
    <div>
      <h3>子应用多层嵌套</h3>
      <div className='btn-con'>
        <Button
          type='primary'
          onClick={() => microApp.setData('vue2', {dispatch: 'data from dispatch' + (+new Date())})}
          style={{width: '120px'}}
        >
          发送数据
        </Button>
      </div>
      {
        showLoading && <Spin />
      }
      <micro-app
        name='inline'
        url={`${config.vue2}micro-app/vue2/`}
        data={data}
        // onBeforemount={() => hideLoading(false)}
        onMounted={() => hideLoading(false)}
        // shadowDOM
        destory
        // inline
        // disableScopecss
        // disableSandbox
      />
    </div>
  )
}

export default Vue2
