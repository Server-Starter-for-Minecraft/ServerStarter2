<script setup lang="ts">
import { useRouter } from 'vue-router';
import { keys } from 'app/src-public/scripts/obj/obj';
import { useMainStore } from 'src/stores/MainStore';
import { useWorldStore } from 'src/stores/WorldStore';
import HeaderView from 'src/components/World/HeaderView.vue';
import SettingTabsView from 'src/components/World/SettingTabsView.vue';

const router = useRouter();
const mainStore = useMainStore();
const worldStore = useWorldStore();
const isSelectSuggestMode = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  mainStore.selectedWorldID === '';
const isNoContents = () =>
  router.currentRoute.value.path.slice(0, 7) !== '/system' &&
  keys(mainStore.allWorlds.filteredWorlds).length === 0;

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
    class="absolute-center text-h5 full-width"
    style="max-width: max-content; margin: 0 auto"
  >
    <!-- TODO: エラーの原因を表示 -->
    <div class="row items-center">
      <q-avatar size="8rem">
        <q-icon name="warning" color="negative" />
      </q-avatar>
      <span class="col">
        {{
          $t('mainLayout.failedLoading', {
            name: worldStore.worldList[mainStore.selectedWorldID].world.name,
          })
        }}
      </span>
    </div>
  </div>
  <div v-else-if="isLoading()" class="absolute-center text-h5">
    <div class="row items-center q-gutter-x-md">
      <q-spinner color="primary" size="3em" />
      <span class="col">
        {{
          $t('mainLayout.loading', {
            name: worldStore.worldList[mainStore.selectedWorldID].world.name,
          })
        }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.noContents {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
}
</style>
