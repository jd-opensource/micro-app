<template>
  <div style="height: 500px;text-align: center;">
    <h1>数据</h1>
    <pre v-html="data"></pre>
    <a-button type="primary" @click="showModal(true)">Open Modal</a-button>
    <a-modal v-model="visible" title="Basic Modal" @cancel="showModal(false)">
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import lodash from "lodash";
@Component({
  components: {}
})
export default class extends Vue {
  data = ""
  get visible() {
    return lodash.get(this.$route.query, 'show') === 'true'
  }
  showModal(show) {
    this.$router.replace({ query: { show } })
  }
  created() {
    if (lodash.hasIn(window, 'microApp')) {
      lodash.invoke(window, 'microApp.addDataListener', this.handleDataChange, true)
    }
  }
  beforeDestroy() {
    if (lodash.hasIn(window, 'microApp')) {
      lodash.invoke(window, 'microApp.removeDataListener', this.handleDataChange)
    }
  }
  handleDataChange(data) {
    this.data = JSON.stringify(data, null, 4);
    console.log('vue2 来自基座应用的数据', data)
  }
  updated() { }
  destroyed() { }
}
</script>
