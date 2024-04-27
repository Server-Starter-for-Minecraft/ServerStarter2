<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useMainStore } from 'src/stores/MainStore';
import { keys } from 'src/scripts/obj';
import HeaderView from 'src/components/World/HeaderView.vue';
import SettingTabsView from 'src/components/World/SettingTabsView.vue';

const router = useRouter();
const mainStore = useMainStore();
const isSelectSuggestMode = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  mainStore.selectedWorldID === '';
const isNoContents = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  keys(mainStore.showingWorldList).length === 0;
</script>

<template>
  <div
    class="column full-width window-height"
    :class="isNoContents() || isSelectSuggestMode() ? 'noContents' : ''"
  >
    <HeaderView />
    <SettingTabsView />

    <div class="fit col">
      <router-view />
    </div>
  </div>
  <div v-if="isNoContents()" class="absolute-center text-h5">
    {{ $t('mainLayout.noWorld') }}
  </div>
  <div v-else-if="isSelectSuggestMode()" class="absolute-center text-h5">
    {{ $t('mainLayout.selectWorld') }}
  </div>
</template>

<style scoped lang="scss">
.noContents {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
}
</style>
