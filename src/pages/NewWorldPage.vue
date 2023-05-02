<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import WorldEditPage from '../components/WorldEdit/WorldEditVue.vue';
import { useSystemStore } from 'src/stores/SystemStore';

// idは '' を渡すことで最新バージョンをデフォルトで提示する
useWorldEditStore().world = {
  name: '',
  container: useSystemStore().worldContainers.default,
  settings: {
    version: {
      id: '',
      type: 'vanilla',
      release: true
    },
  },
  additional: {}
}

async function saveFunc() {
  useMainStore().worldList.push(useWorldEditStore().world)
}
</script>

<template>
  <WorldEditPage title="新規ワールド" :save-func="saveFunc"/>
</template>