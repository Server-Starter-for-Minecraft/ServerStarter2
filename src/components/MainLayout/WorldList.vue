<script setup lang="ts">
import { ref } from 'vue';
import { assets } from 'src/assets/assets';
import { useMainStore } from 'src/stores/MainStore';
import WorldTab from './WorldTab.vue';
import SearchWorldView from '../World/SearchWorldView.vue';
import IconButtonView from '../World/utils/IconButtonView.vue';

const mainStore = useMainStore();
const searchWorldName = ref('')

function openHP() {
  window.API.sendOpenBrowser('https://civiltt.github.io/ServerStarter/')
}
</script>

<template>
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

  <search-world-view v-model="searchWorldName"/>
  
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
</template>

<style scoped lang="scss">
.img {
  height: 100px;
}
</style>