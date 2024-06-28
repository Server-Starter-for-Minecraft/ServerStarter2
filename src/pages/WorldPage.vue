<script setup lang="ts">
import { useRouter } from 'vue-router';
import { keys } from 'app/src-public/scripts/obj/obj';
import { useMainStore } from 'src/stores/MainStore';
import HeaderView from 'src/components/World/HeaderView.vue';
import SettingTabsView from 'src/components/World/SettingTabsView.vue';
import FailedLoadingView from 'src/components/World/FailedLoadingView.vue';
import LoadingView from 'src/components/World/LoadingView.vue';

const router = useRouter();
const mainStore = useMainStore();
const isSelectSuggestMode = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  mainStore.selectedWorldID === '';
const isNoContents = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  keys(mainStore.allWorlds.filteredWorlds()).length === 0;

const isLoading = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  mainStore.world === void 0;
const isFailedLoading = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  mainStore.world === void 0 &&
  mainStore.errorWorlds.has(mainStore.selectedWorldID);
</script>

<template>
  <div
    class="column full-width window-height"
    :class="
      isNoContents() ||
      isSelectSuggestMode() ||
      isLoading() ||
      isFailedLoading()
        ? 'noContents'
        : ''
    "
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
  <div
    v-else-if="isFailedLoading()"
    class="absolute-center text-h5 centerContent"
  >
    <FailedLoadingView />
  </div>
  <div v-else-if="isLoading()" class="absolute-center text-h5">
    <LoadingView />
  </div>
</template>

<style scoped lang="scss">
.noContents {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
}

.centerContent {
  width: 100%;
  max-width: max-content;
  margin: 0 auto;
}
</style>
