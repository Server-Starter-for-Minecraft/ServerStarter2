<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useMainStore } from 'src/stores/MainStore';
import { keys } from 'src/scripts/obj';
import HeaderView from 'src/components/World/HeaderView.vue';
import SettingTabsView from 'src/components/World/SettingTabsView.vue';

const router = useRouter();
const mainStore = useMainStore();
const isNoContents = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  keys(mainStore.showingWorldList).length === 0;
</script>

<template>
  <div
    class="column full-width window-height"
    :class="isNoContents() ? 'noContents' : ''"
  >
    <HeaderView />
    <SettingTabsView />

    <div class="fit col">
      <router-view />
    </div>
  </div>
  <div v-if="isNoContents()" class="absolute-center text-h5">
    表示可能なワールドがありません
  </div>
</template>

<style scoped lang="scss">
.noContents {
  filter: blur(5px);
  opacity: 0.6;
  pointer-events: none;
}
</style>
