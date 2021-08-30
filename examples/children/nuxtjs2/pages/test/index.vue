<template>
  <div style="height: 500px;text-align: center;">
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
  get visible() {
    return lodash.get(this.$route.query, 'show') === 'true'
  }
  showModal(show) {
    this.$router.replace({ query: { show } })
  }
  updated() { }
  destroyed() { }
}
</script>
