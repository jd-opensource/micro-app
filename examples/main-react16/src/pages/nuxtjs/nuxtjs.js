/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
import { useState, useEffect } from 'react'
import { Button, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import config from '../../config'
import './nuxtjs.less'

const antIcon = <LoadingOutlined style={{ fontSize: 30 }} spin />

function Nuxtjs () {
  const [data, changeData] = useState({from: '来自基座的初始化数据'})
  const [showLoading, hideLoading] = useState(true)
  useEffect(() => {
    console.time('Nuxtjs')
  }, [])
  return (
    <div>
      <div className='btn-con'>
        <Button
          type='primary'
          onClick={() => changeData({from: '来自基座的数据' + (+new Date())})}
          style={{width: '120px'}}
        >
          发送数据
        </Button>
      </div>
      {
        showLoading && <Spin indicator={antIcon} />
      }
      <micro-app
        name='Nuxtjs'
        url={`${config.nuxtjs}`}
        data={data}
        // onBeforemount={() => hideLoading(false)}
        onMounted={() => hideLoading(false)}
        // shadowDOM
        // destory
        // inline
        // disableScopecss
        // disableSandbox
      >
      </micro-app>
    </div>
  )
}

export default Nuxtjs
// 664 649 637 663 656 650 676 平均 656
// 751 660 683 706 695 687 689 平均 695
// 685 671 695 663 695 720 709 平均 691
