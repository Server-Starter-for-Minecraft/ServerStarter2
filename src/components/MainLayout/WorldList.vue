<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCssVar } from 'quasar';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import WorldTab from './WorldTab.vue';
import SearchWorldView from '../World/SearchWorldView.vue';
import IconButtonView from '../World/utils/IconButtonView.vue';
import { sortValue } from 'src/scripts/objSort';
import { moveScrollTop_Home } from '../World/HOME/scroll';

const router = useRouter()
const sysStore = useSystemStore()
const mainStore = useMainStore();
const searchWorldName = ref('')

const miniChangeWidth = 200
const drawer = ref(true)

async function createNewWorld() {
  // 新規ワールドの生成
  await mainStore.createNewWorld()

  // 画面遷移
  if (router.currentRoute.value.path === '/') {
    moveScrollTop_Home()
  }
  else {
    router.push('/')
  }
}
</script>

<template>
  <q-drawer
    v-model="drawer"
    :width="sysStore.systemSettings.user.drawerWidth"
    :breakpoint="0"
    :mini="sysStore.systemSettings.user.drawerWidth < miniChangeWidth"
    :mini-width="Math.min(miniChangeWidth, sysStore.systemSettings.user.drawerWidth)"
    class="column"
    style="height: 100vh;"
  >
    <div class="q-mini-drawer-only">
      <q-item clickable @click="sysStore.systemSettings.user.drawerWidth = 300">
        <q-avatar size="2rem">
          <q-icon
            size="2rem"
            :name="assets.svg.menuicon($q.dark.isActive ? 'white' : 'black')"
          />
        </q-avatar>
        <q-tooltip anchor="center middle" self="top middle" :delay="500">
          {{ $t('worldList.openList') }}
        </q-tooltip>
      </q-item>
    </div>
    <icon-button-view
      :icon-src="assets.svg.menuicon_open(getCssVar('primary')?.replace('#', '%23'))"
      :label="$t('worldList.allWorld')"
      :tooltip="$t('worldList.minimizeList')"
      @click="sysStore.systemSettings.user.drawerWidth = 100"
      class="q-mini-drawer-hide"
    />

    <search-world-view
      v-model="searchWorldName"
      :expand-drawer-btn-clickable="sysStore.systemSettings.user.drawerWidth < miniChangeWidth"
    />

    <q-scroll-area class="fit col">
      <q-list>
        <template
          v-for="(world, idx) in sortValue(
            mainStore.searchWorld(searchWorldName),
            (w1, w2) => {
              return (w2.last_date ?? 0) - (w1.last_date ?? 0)
            }
          )"
          :key="world"
        >
          <world-tab :world="world" :idx="idx" />
        </template>
      </q-list>
    </q-scroll-area>

    <icon-button-view
      icon-name="add"
      :label="$t('worldList.addWorld')"
      :tooltip="$t('worldList.addWorld')"
      @click="createNewWorld"
    />
    <q-separator class="q-mx-xs" />
    <icon-button-view
      icon-name="settings"
      :label="$t('worldList.systemSetting')"
      :tooltip="$t('worldList.systemSetting')"
      to="/system"
    />
  </q-drawer>
</template>