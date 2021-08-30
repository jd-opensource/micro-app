<template>
  <div class="app-layout">
    <a-tabs :active-key="$route.name" @change="callback">
      <a-tab-pane key="index" tab="page1"></a-tab-pane>
      <a-tab-pane key="test" tab="page2"></a-tab-pane>
      <a-tab-pane key="test2" tab="page3"></a-tab-pane>
    </a-tabs>
    <Nuxt
      :keep-alive="keepAlive"
      :keepAliveProps="keepAliveProps"
      class="app-layout-content"
      :class="pageClass"
    />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
@Component({
  components: {}
})
export default class extends Vue {
  get pageClass() {
    return " xt-page-" + this.$route.name;
  }
  keepAlive = true;
  keepAliveProps = {
    // include: [
    // ],
    // exclude: [
    // ],
  };
  callback(name) {
    this.$router.replace({ name })
  }
  updated() { }
  destroyed() { }
}
</script>
<style lang="less" scoped>
.app-layout {
  width: 100vw;
}
.app-layout-content {
  // min-height: 100vh;
  box-sizing: border-box;
}
</style>
<style lang="less">
@time: 0.2s;
.page-enter-active,
.page-leave-active {
  transition: opacity @time;
}
.page-enter,
.page-leave-to {
  opacity: 0;
}

.layout-enter-active,
.layout-leave-active {
  transition: opacity @time;
}
.layout-enter,
.layout-leave-to {
  opacity: 0;
}
</style>
