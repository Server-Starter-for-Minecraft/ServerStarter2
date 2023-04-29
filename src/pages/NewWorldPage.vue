<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import WorldEditPage from '../components/WorldEdit/WorldEditVue.vue';

useMainStore().setHeader('新規ワールド', {showMenuBtn: true});
// TODO: 新規ワールドにおけるcontainerは？
// idは '' を渡すことで最新バージョンをデフォルトで提示する
useWorldEditStore().world = {
  name: '',
  container: '',
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
  <WorldEditPage :save-func="saveFunc"/>
</template>