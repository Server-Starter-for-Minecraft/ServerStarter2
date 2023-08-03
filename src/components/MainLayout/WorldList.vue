<script setup lang="ts">
import { ref } from 'vue';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import WorldTab from './WorldTab.vue';
import SearchWorldView from '../World/SearchWorldView.vue';
import IconButtonView from '../World/utils/IconButtonView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore();
const searchWorldName = ref('')

const miniChangeWidth = 200
const drawer = ref(true)
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
          <q-img :src="assets.svg.menuicon_white" />
        </q-avatar>
        <q-tooltip anchor="center middle" self="top middle" :delay="500">
          ワールド一覧を開く
        </q-tooltip>
      </q-item>
    </div>
    <icon-button-view
      :icon-src="assets.svg.menuicon_open"
      :label="$t('worldList.allWorld')"
      tooltip="ワールド一覧を最小化"
      @click="sysStore.systemSettings.user.drawerWidth = 100"
      class="q-mini-drawer-hide"
    />

    <search-world-view
      v-model="searchWorldName"
      :expand-drawer-btn-clickable="sysStore.systemSettings.user.drawerWidth < miniChangeWidth"
    />

    <q-scroll-area class="fit col">
      <q-list>
        <template v-for="(world, idx) in mainStore.searchWorld(searchWorldName)" :key="world">
          <world-tab :world="world" :idx="idx" />
        </template>
      </q-list>
    </q-scroll-area>

    <icon-button-view
      icon-name="add"
      :label="$t('worldList.addWorld')"
      :tooltip="$t('worldList.addWorld')"
      @click="mainStore.createNewWorld()"
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