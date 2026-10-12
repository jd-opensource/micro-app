/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
import { useState, useEffect } from 'react'
import microApp from '@micro-zoe/micro-app'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import config from '../../config'
import './react17.less'

const antIcon = <LoadingOutlined style={{ fontSize: 30 }} spin />

function React17 () {
  const [showLoading, hideLoading] = useState(true)

  function handleData (data) {
    console.log('来自react17的数据', data)
  }

  useEffect(() => {
    microApp.addDataListener('react17', handleData)
    return function clearup () {
      microApp.removeDataListener('react17', handleData)
      microApp.clearDataListener('react17')
    }
  }, [])

  return (
    <div style={{height: '100%'}}>
      {
        showLoading && <Spin indicator={antIcon} />
      }
      <micro-app
        name='react17'
        url={`${config.react17}micro-app/react17`}
        data={{from: '来自基座的数据'}}
        onMounted={() => hideLoading(false)}
        // destroy
        // inline
        // keep-alive
        // iframe
      />
    </div>
  )
}

export default React17
