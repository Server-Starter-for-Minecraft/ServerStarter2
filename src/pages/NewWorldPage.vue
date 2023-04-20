<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import WorldEditPage from '../components/WorldEdit/WorldEditVue.vue';

useMainStore().setHeader('新規ワールド', {showMenuBtn: true});
useWorldEditStore().world = {
  name: '',
  settings: {
    version: {
      id: '1.19.2',
      type: 'vanilla',
      release: true
    }
  },
  datapacks: [],
  plugins: [],
  mods: []
}

async function saveFunc() {
  useMainStore().worldList.push(useWorldEditStore().world)
}
</script>

<template>
  <WorldEditPage :save-func="saveFunc"/>
</template>