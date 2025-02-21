/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event'
import React from 'react'
import { Spin, Row, Col, Button, Modal } from 'antd'
import { LoadingOutlined } from '@ant-design/icons';
import microApp from '@micro-zoe/micro-app'
import config from '../../config'
import './react16.less'

const antIcon = <LoadingOutlined style={{ fontSize: 30 }} spin />

const globalData1 = { type: '全局数据' }
export default class App extends React.Component {
  state = {
    data: {
      name: '初始化数据'
    },
    name: 'react#16',
    url: `${config.react16}micro-app/react16/index.html`,
    // url: 'http://127.0.0.1:8080/micro-app/react16',
    showLoading: true,
    showMicroApp: true,
    testNum: 0,
    showModal: false,
    routerMode: 'native',
    baseroute: '/micro-app/demo/react16',
  }

  handleCreated = () => {
    console.log(`生命周期：created -- ${this.state.name}`)
    // Promise.resolve().then(() => microApp.router.push({name: this.state.name, path: this.state.baseroute + '/page2'}))
  }

  beforemount = (e) => {
    console.log(`生命周期：beforemount -- ${this.state.name}`, e)
  }

  mounted = () => {
    console.timeEnd(`mounted-${this.state.name}`)
    console.log(`主应用-生命周期：mounted -- ${this.state.name}`, document.querySelector('micro-app'))
    this.setState({
      showLoading: false
    })
  }

  unmount = () => {
    this.setState({
      showLoading: false
    })
    console.log(`生命周期：unmount -- ${this.state.name}`)
  }

  error = (e) => {
    console.log(`生命周期：error -- ${this.state.name}`, e)
  }

  handleBeforeshow = (e) => {
    console.log(`生命周期：keep-alive beforeshow -- ${this.state.name}`, e)
  }

  handleAftershow = (e) => {
    console.timeEnd(`mounted-${this.state.name}`)
    console.log(`生命周期：keep-alive aftershow -- ${this.state.name}`, document.querySelector('micro-app'))
    this.setState({
      showLoading: false
    })
  }

  handleAfterhidden = (e) => {
    console.log(`生命周期：keep-alive afterhidden -- ${this.state.name}`, e)
  }

  changeData = () => {
    this.setState({
      data: { name: '通过data属性修改的数据', date: new Date() },
    })
  }

  dispatchData = () => {
    // // 全新数据
    // microApp.setData(this.state.name, { dispatch: 'data from dispatch' + (+new Date()) })

    // // 相同的data
    // microApp.setData(this.state.name, this.state.data)

    // 数据内容不同
    microApp.setData(this.state.name, { key2: '新的key2' }, (res) => {
      console.log('数据已经发送完成', res)

      // 循环嵌套
      // microApp.setData(this.state.name, { key4: '新的key4' }, () => {
      //   console.log('循环嵌套发送数据完成1')
      // })
    })

    // 强制发送数据
    microApp.forceSetData(this.state.name, { key3: '新的key3' }, (res) => {
      console.log('强制发送数据完成', res)

      // 循环嵌套
      // microApp.setData(this.state.name, { key5: '新的key5' }, () => {
      //   console.log('循环嵌套发送数据完成2')
      // })
    })
  }

  // 清空数据
  clearData = () => {
    microApp.clearData(this.state.name)
  }

  dispatchGlobalData = () => {
    // 发送新的数据
    // microApp.setGlobalData({name: '全局数据' + (+new Date())})

    // 合并值
    microApp.setGlobalData({a: 1})

    microApp.setGlobalData({b: 2}, (res) => {
      console.log('发送全局数据成功', res)
    })

    microApp.forceSetGlobalData({c: 3}, (res) => {
      console.log('强制发送全局数据成功', res)
    })

    microApp.setGlobalData({d: 4})
  }

  clearGlobalData = () => {
    microApp.clearGlobalData()
  }

  handleDataChange = (e) => {
    console.log('通过生命周期onDataChange监听到来自子应用的数据', e)
    Modal.info({
      title: '来自子应用的数据',
      content: (
        <div>
          <p>{JSON.stringify(e.detail.data)}</p>
        </div>
      ),
      onOk() {},
    });

    // microApp.setData(this.state.name, {
    //   time: new Date(),
    // })
  }

  toggleShow = () => {
    this.setState({
      showMicroApp: !this.state.showMicroApp,
    })
  }

  changeNameUrl = () => {
    if (this.state.name === 'vue2-change') {
      this.setState({
        name: 'react16',
        url: `${config.react16}micro-app/react16/?a=1`,
      })
    } else {
      this.setState({
        name: 'vue2-change',
        url: `${config.vue2}micro-app/vue2/`,
      })
    }
  }

  // 主动卸载应用
  useUnmountApp = () => {
    // unmountApp 会删除micro-app元素
    // 当先通过unmountApp卸载应用后再通过setState控制元素展示，会导致react报错，因为micro-app元素已经不存在了
    // 此处先通过setState控制应用卸载，再通过unmountApp删除缓存状态，避免报错
    this.setState({
      showMicroApp: false,
    }, () => {
      microApp.unmountApp(this.state.name, {
        // destroy: true,
        clearAliveState: true,
      }).then((result) => {
        if (result) {
          console.log('unmountApp方法 -- 卸载成功')
        } else {
          console.log('unmountApp方法 -- 卸载失败')
        }
      })
    })
  }

  changeTestNum = () => {
    this.setState({
      testNum: this.state.testNum + 1,
    })
  }

  jumpToHome = () => {
    const basePath = ['native', 'native-scope'].includes(this.state.routerMode) ? this.state.baseroute : '/micro-app/react16'
    microApp.router.push({name: this.state.name, path: basePath + '/'})
  }

  jumpToPage2 = () => {
    const basePath = ['native', 'native-scope'].includes(this.state.routerMode) ? this.state.baseroute : '/micro-app/react16'
    microApp.router.push({name: this.state.name, path: basePath + '/page2'}).then(() => {
      console.log('跳转成功')
    }).catch(() => {
      console.error('跳转失败')
    })
  }

  jumpToNest = () => {
    const basePath = ['native', 'native-scope'].includes(this.state.routerMode) ? this.state.baseroute : '/micro-app/react16'
    microApp.router.push({name: this.state.name, path: basePath + '/nest'})
  }

  useRouterGo = () => {
    microApp.router.go(-1)
  }

  useRouterBack = () => {
    microApp.router.back()
  }

  useRouterForward = () => {
    microApp.router.forward()
  }

  useCurrentRoute = () => {
    console.log('router.current', microApp.router.current.get('react16'))

    // setTimeout(() => {
    //   microApp.router.current.get('react16').assign('?b=222')
    // }, 3000);
  }

  useRouterAttachToURL = () => {
    microApp.router.attachToURL(this.state.name)
  }

  useRouterAttachAllToURL = () => {
    microApp.router.attachAllToURL()
  }

  handleGlobalDataForBaseApp = (data) => {
    console.log(`这是全局数据--基座应用-${this.state.name}`, data)
    return {msg: '主应用接收全局数据成功'}
  }

  // 手动重新加载子应用
  useReload = () => {
    microApp.reload(this.state.name, true).then((result) => {
      if (result) {
        console.log('执行 microApp.reload 重新渲染成功')
      } else {
        console.log('执行 microApp.reload 重新渲染失败')
      }
    })
  }

  // 手动渲染子应用
  useRenderApp = () => {
    this.setState({
      showModal: !this.state.showModal,
    }, () => {
      setTimeout(() => {
        microApp.renderApp({
          name: 'manual',
          url: this.state.url,
          container: '#manual-con',
          // inline: true,
          // 'keep-alive': true,
          // destroy: true,
          // disableSandbox: true,
          // 'disable-sandbox': true,
          // disableScopecss: true,
          // 'disable-scopecss': true,
          // shadowDOM: true,
          // 'disable-memory-router': true,
          // 'keep-router-state': true,
          // 'hidden-router': true,
          // 'disable-patch-request': true,
          // fiber: true,
          // ssr: true,
          // baseroute: '/micro-app/demo/react16',
          // 'default-page'='/micro-app/react16/page2'
          data: { from: '来自动态modal的数据' },
          onDataChange: (e) => {
            Modal.info({
              title: '来自子应用manual的数据',
              content: (
                <div>
                  <p>{JSON.stringify(e.detail.data)}</p>
                </div>
              ),
              onOk() {},
            });
          },
          lifeCycles: {
            created (e) {
              console.log('created - renderApp', e)
            },
            beforemount (e) {
              console.log('beforemount - renderApp', e)
            },
            mounted (e) {
              console.log('mounted - renderApp', e)
            },
            unmount (e) {
              console.log('unmount - renderApp', e)
            },
            error (e) {
              console.log('error - renderApp', e)
            },
            beforeshow (e) {
              console.log('beforeshow - renderApp', e)
            },
            aftershow (e) {
              console.log('aftershow - renderApp', e)
            },
            afterhidden (e) {
              console.log('afterhidden - renderApp', e)
            },
          },
        }).then((result) => {
          if (result) {
            console.log('执行 microApp.renderApp 手动渲染成功')
          } else {
            console.log('执行 microApp.renderApp 手动渲染失败')
          }
        })
      }, 1)
    })
  }

  componentDidMount () {
    console.time(`mounted-${this.state.name}`)
    console.time(this.state.name)

    microApp.addDataListener(this.state.name, (data) => {
      console.log('来自子应用react16的数据', data)
      return {msg: '接受子应用的数据成功'}
    })

    microApp.addGlobalDataListener(this.handleGlobalDataForBaseApp)

    // setTimeout(() => {
    //   this.setState({
    //     showMicroApp: !this.state.showMicroApp,
    //   })
    // }, 0);

    // this.releaseBeforeEach1 = microApp.router.beforeEach((to, from, appName) => {
    //   // const a = document.createElement('div')
    //   // a.innerHTML = '44444444'
    //   // document.body.appendChild(a)
    //   console.log('全局 beforeEach: ', to, from, appName)
    // })

    // this.releaseBeforeEach2 = microApp.router.beforeEach({
    //   react16 (to, from) {
    //     console.log('指定 beforeEach: ', to, from)
    //   }
    // })

    // this.releaseAfterEach1 = microApp.router.afterEach((to, from, appName) => {
    //   console.log('全局 afterEach: ', to, from, appName)
    // })

    // this.releaseAfterEach2 = microApp.router.afterEach({
    //   react16 (to, from) {
    //     console.log('指定 afterEach: ', to, from)
    //   }
    // })

    microApp.router.setBaseAppRouter(this.props.history)
  }

  componentWillUnmount ()  {
    microApp.clearDataListener(this.state.name)
    microApp.removeGlobalDataListener(this.handleGlobalDataForBaseApp)
    this.releaseBeforeEach1?.()
    this.releaseBeforeEach2?.()
    this.releaseAfterEach1?.()
    this.releaseAfterEach2?.()
  }

  render () {
    return (
      <>
        <Row className='react16'>
          <Col span={6} className='btn-con'>
            <Button type="primary" onClick={this.toggleShow}>微应用是否展示</Button>
            <Button type="primary" onClick={this.changeData}>data属性发送数据</Button>
            <Button type="primary" onClick={this.dispatchData}>手动发送数据</Button>
            <Button type="primary" onClick={this.clearData}>手动清空数据</Button>
            <Button type="primary" onClick={this.dispatchGlobalData}>发送全局数据</Button>
            {/* <Button type="primary" onClick={this.clearGlobalData}>清空全局数据</Button> */}
            <Button type="primary" onClick={this.changeNameUrl}>切换应用</Button>
            <Button type="primary" onClick={this.useUnmountApp}>主动卸载应用</Button>
            <Button type="primary" onClick={this.jumpToHome}>控制子应用跳转home</Button>
            <Button type="primary" onClick={this.jumpToPage2}>控制子应用跳转page2</Button>
            <Button type="primary" onClick={this.jumpToNest}>控制子应用跳转nest</Button>
            <Button type="primary" onClick={this.useRouterGo}>调用router.go</Button>
            <Button type="primary" onClick={this.useRouterBack}>调用router.back</Button>
            <Button type="primary" onClick={this.useRouterForward}>调用router.forward</Button>
            <Button type="primary" onClick={this.useCurrentRoute}>调用router.current</Button>
            <Button type="primary" onClick={this.useRouterAttachToURL}>调用router.attachToURL</Button>
            <Button type="primary" onClick={this.useRouterAttachAllToURL}>调用router.attachAllToURL</Button>
            <Button type="primary" onClick={this.useReload}>重新加载子应用-reload</Button>
            <Button type="primary" onClick={this.useRenderApp}>手动加载子应用-renderApp</Button>
            <Button type="primary" onClick={this.changeTestNum}>{this.state.testNum}</Button>
          </Col>
          <Col span={18} className='app-con-react16'>
            { this.state.showLoading && <Spin indicator={antIcon} /> }
            { !this.state.showLoading && <h3>微应用{this.state.name}</h3> }
            {
              this.state.showMicroApp && (
                <micro-app
                  name={this.state.name}
                  url={this.state.url}
                  data={this.state.data}
                  onCreated={this.handleCreated}
                  onBeforemount={this.beforemount}
                  onMounted={this.mounted}
                  onUnmount={this.unmount}
                  onError={this.error}
                  onBeforeshow={this.handleBeforeshow}
                  onAftershow={this.handleAftershow}
                  onAfterhidden={this.handleAfterhidden}
                  onDataChange={this.handleDataChange}
                  baseroute={this.state.baseroute}
                  // keep-alive
                  // destroy
                  inline
                  // disableSandbox
                  // disable-sandbox
                  // disableScopecss
                  // disable-scopecss
                  // shadowDOM
                  // disable-memory-router
                  router-mode={this.state.routerMode}
                  // keep-router-state
                  default-page='/micro-app/react16/page2'
                  // hidden-router
                  // disable-patch-request
                  // fiber
                  // ssr
                  // clear-data
                  // iframe
                >
                </micro-app>
              )
            }
            {/* <iframe src={this.state.url} onLoad={this.mounted} width='600' height='700'></iframe> */}
            <Modal
              visible={this.state.showModal}
              maskClosable={true}
              title="Title"
              width={500}
              height={500}
              destroyOnClose
              onOk={() => this.setState({showModal: false})}
              onCancel={() => this.setState({showModal: false})}
            >
              <div id='manual-con'></div>
            </Modal>
          </Col>
        </Row>
      </>
    )
  }
}
