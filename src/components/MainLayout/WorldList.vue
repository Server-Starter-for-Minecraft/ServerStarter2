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

function openHP() {
  window.API.sendOpenBrowser('https://civiltt.github.io/ServerStarter/')
}
</script>

<template>
  <q-drawer
    v-model="drawer"
    :width="sysStore.systemSettings().user.drawerWidth"
    :breakpoint="0"
    :mini="sysStore.systemSettings().user.drawerWidth < miniChangeWidth"
    :mini-width="Math.min(miniChangeWidth, sysStore.systemSettings().user.drawerWidth)"
    :class="`column ${$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'}`"
    style="height: 100vh;"
  >
    <q-img :src="assets.png.mainImage" class="img">
      <div class="absolute-full">
        <q-img
          :src="assets.svg.systemLogo_text_dark"
          fit="contain"
          class="q-mini-drawer-hide"
          style="height: 100%;"
        />
        <q-img
          :src="assets.svg.systemLogo"
          fit="contain"
          class="q-mini-drawer-only"
          style="height: 100%;"
        />
        <q-btn class="absolute-full" @click="openHP"/>
      </div>
    </q-img>

    <div class="q-mini-drawer-only">
      <q-item clickable @click="sysStore.systemSettings().user.drawerWidth = 300">
        <q-avatar size="2rem" >
          <q-img :src="assets.svg.menuicon_white" />
        </q-avatar>
      </q-item>
    </div>
    <icon-button-view
      :icon-src="assets.svg.menuicon_open"
      label="ワールド一覧"
      @click="sysStore.systemSettings().user.drawerWidth = 100"
      class="q-mini-drawer-hide"
    />
    <!-- <search-world-view v-model="searchWorldName"/> -->
    
    <q-scroll-area class="fit col">
      <q-list>
        <template v-for="(world, idx) in mainStore.searchWorld(searchWorldName)" :key="world">
          <world-tab :world="world" :idx="idx"/>
        </template>
      </q-list>
    </q-scroll-area>

    <icon-button-view icon-name="add" label="ワールドを追加" @click="mainStore.createNewWorld()"/>
    <q-separator class="q-mx-xs"/>
    <icon-button-view icon-name="settings" label="システム設定" to="/system"/>
  </q-drawer>
</template>

<style scoped lang="scss">
.img {
  height: 100px;
}
</style>