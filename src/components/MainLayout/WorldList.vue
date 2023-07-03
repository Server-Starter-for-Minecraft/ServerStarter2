<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import WorldTab from './WorldTab.vue';
import SearchWorldView from '../World/SearchWorldView.vue';
import IconButtonView from '../World/utils/IconButtonView.vue';
import { assets } from 'src/assets/assets';

const mainStore = useMainStore();
const searchWorldName = ref('')
const drawer = ref(true)
const miniDrawer = ref(true)

function openHP() {
  window.API.sendOpenBrowser('https://civiltt.github.io/ServerStarter/')
}
</script>

<template>
  <q-drawer
    v-model="drawer"
    :breakpoint="1"
    :mini="miniDrawer"
    :mini-width="100"
    @mouseover="miniDrawer = false"
    @mouseout="miniDrawer = true"
    :class="`column ${$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'}`"
    style="height: 100vh;"
  >
    <q-img :src="assets.png.mainImage" class="img">
      <div class="absolute-full">
        <q-img :src="assets.svg.systemLogo" fit="contain" style="height: 100%;"/>
        <q-btn class="absolute-full" @click="openHP"/>
      </div>
    </q-img>

    <search-world-view v-model="searchWorldName"/>
    
    <q-scroll-area class="fit col">
      <q-list>
        <template v-for="(world, idx) in mainStore.searchWorld(searchWorldName)" :key="world">
          <world-tab :world="world" :idx="idx"/>
        </template>
      </q-list>
    </q-scroll-area>

    <icon-button-view icon-name="add" label="ワールドを追加" @click="async () => await mainStore.createNewWorld()"/>
    <q-separator class="q-mx-xs"/>
    <icon-button-view icon-name="settings" label="システム設定" to="/system"/>
  </q-drawer>
</template>

<style scoped lang="scss">
.img {
  height: 100px;
}
</style>