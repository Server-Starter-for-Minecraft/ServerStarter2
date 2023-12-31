<script setup lang="ts">
import { ref } from 'vue';
import { getCssVar } from 'quasar';
import { WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { keys } from 'src/scripts/obj';
import { sortValue } from 'src/scripts/objSort';
import WorldTab from './WorldTab.vue';
import NewWorldBtn from './NewWorldBtn.vue';
import SearchWorldView from '../World/SearchWorldView.vue';
import IconButtonView from '../World/utils/IconButtonView.vue';

interface Prop {
  minWidth: number
  maxWidth: number
}
defineProps<Prop>()

const sysStore = useSystemStore()
const mainStore = useMainStore();
const searchWorldName = ref('')

const miniChangeWidth = 200
const drawer = ref(true)

/**
 * 表示するワールド一覧を更新する際に、表示するワールドがなくなる場合は、
 * 現在選択しているワールドを補完する
 * 
 * (World FolderのVisibilityを変更したときに、表示するものがなくなることがあるため対応)
 */
function interpolateCurrentWorld(worlds: Record<WorldID, WorldEdited>) {
  if (keys(worlds).length === 0) {
    worlds[mainStore.world.id] = mainStore.world
  }
  return worlds
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
      <q-item clickable @click="sysStore.systemSettings.user.drawerWidth = maxWidth">
        <q-avatar size="2rem">
          <q-icon
            size="2rem"
            :name="assets.svg.menuicon($q.dark.isActive ? 'white' : 'black')"
          />
        </q-avatar>
        <q-tooltip anchor="center middle" self="top middle" :delay="500">
          {{ $t('mainLayout.openList') }}
        </q-tooltip>
      </q-item>
    </div>
    <icon-button-view
      :icon-src="assets.svg.menuicon_open(getCssVar('primary')?.replace('#', '%23'))"
      :label="$t('mainLayout.allWorld')"
      :tooltip="$t('mainLayout.minimizeList')"
      @click="sysStore.systemSettings.user.drawerWidth = minWidth"
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
            interpolateCurrentWorld(mainStore.searchWorld(searchWorldName)),
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

    <new-world-btn :mini-change-width="miniChangeWidth" />
    <q-separator class="q-mx-xs" />
    <icon-button-view
      icon-name="settings"
      :label="$t('mainLayout.systemSetting')"
      :tooltip="$t('mainLayout.systemSetting')"
      to="/system"
    />
  </q-drawer>
</template>