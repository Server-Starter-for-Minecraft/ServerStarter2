<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import WorldTab from './WorldTab.vue';
import SearchWorldView from '../World/SearchWorldView.vue';
import IconButtonView from '../World/IconButtonView.vue';

const store = useMainStore();
const searchWorldName = ref('')
const drawer = ref(true)
const miniDrawer = ref(false)
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
    <search-world-view v-model="searchWorldName"/>
    
    <q-scroll-area class="fit col">
      <q-list>
        <template v-for="(world, idx) in store.searchWorld(searchWorldName)" :key="world">
          <world-tab :world="world" :idx="idx"/>
        </template>
      </q-list>
    </q-scroll-area>

    <icon-button-view icon-name="add" label="ワールドを追加"/>
    <q-separator class="q-mx-xs"/>
    <icon-button-view icon-name="settings" label="システム設定"/>
  </q-drawer>
</template>