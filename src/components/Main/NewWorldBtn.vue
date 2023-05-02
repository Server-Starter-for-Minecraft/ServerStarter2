<script setup lang="ts">
import { World } from 'app/src-electron/api/schema';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';

function setNewWorld() {
  function saveFunc() {
    useMainStore().worldList.push(useWorldEditStore().world)
  }

  const newWorld: World = {
    name: '',
    container: useSystemStore().worldContainers.default,
    version: {
      id: '',
      type: 'vanilla',
      release: true
    },
    additional: {}
  }

  useWorldEditStore().setEditer(newWorld, saveFunc, { title: '新規ワールド' })
}
</script>

<template>
  <q-btn
    color="primary"
    to="world-edit"
    style="font-size: 1.2rem;"
    @click="setNewWorld"
  >
    新規作成
  </q-btn>
</template>