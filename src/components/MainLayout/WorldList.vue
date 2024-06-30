<script setup lang="ts">
import { ref } from 'vue';
import { getCssVar } from 'quasar';
import { assets } from 'src/assets/assets';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import SearchWorldView from '../World/SearchWorldView.vue';
import IconButtonView from '../World/utils/IconButtonView.vue';
import NewWorldBtn from './NewWorldBtn.vue';
import WorldTab from './WorldTab.vue';

interface Prop {
  minWidth: number;
  maxWidth: number;
}
defineProps<Prop>();

const sysStore = useSystemStore();
const mainStore = useMainStore();

const miniChangeWidth = 200;
const drawer = ref(true);
</script>

<template>
  <q-drawer
    v-model="drawer"
    :width="sysStore.systemSettings.user.drawerWidth"
    :breakpoint="0"
    :mini="sysStore.systemSettings.user.drawerWidth < miniChangeWidth"
    :mini-width="
      Math.min(miniChangeWidth, sysStore.systemSettings.user.drawerWidth)
    "
    class="column"
    style="height: 100vh"
  >
    <div class="q-mini-drawer-only">
      <q-item
        clickable
        @click="sysStore.systemSettings.user.drawerWidth = maxWidth"
      >
        <q-avatar size="2rem">
          <q-icon
            size="2rem"
            :name="assets.svg.menuicon($q.dark.isActive ? 'white' : 'black')"
          />
        </q-avatar>
        <SsTooltip
          :name="$t('mainLayout.openList')"
          anchor="center middle"
          self="top middle"
        />
      </q-item>
    </div>
    <IconButtonView
      :icon-src="
        assets.svg.menuicon_open(getCssVar('primary')?.replace('#', '%23'))
      "
      :label="$t('mainLayout.allWorld')"
      :tooltip="$t('mainLayout.minimizeList')"
      @click="sysStore.systemSettings.user.drawerWidth = minWidth"
      class="q-mini-drawer-hide"
    />

    <SearchWorldView
      :expand-width="maxWidth"
      :expand-drawer-btn-clickable="
        sysStore.systemSettings.user.drawerWidth < miniChangeWidth
      "
    />

    <q-scroll-area class="fit col">
      <q-list>
        <template
          v-for="(world, idx) in mainStore.allWorlds.filteredWorlds()"
          :key="world"
        >
          <WorldTab :world_item="world" :idx="idx" />
        </template>
      </q-list>
    </q-scroll-area>

    <NewWorldBtn :mini-change-width="miniChangeWidth" />
    <q-separator class="q-mx-xs" />
    <IconButtonView
      icon-name="settings"
      :label="$t('mainLayout.systemSetting')"
      :tooltip="$t('mainLayout.systemSetting')"
      to="/system"
    />
  </q-drawer>
</template>
