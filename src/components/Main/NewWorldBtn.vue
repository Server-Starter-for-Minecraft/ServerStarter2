<script setup lang="ts">
import { WorldEdited } from 'app/src-electron/schema/world';
import { deepCopy } from 'src/scripts/deepCopy';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';

function setNewWorld() {
  function saveFunc() {
    useMainStore().worldList.push(useWorldEditStore().getEditedWorld())
  }

  // TODO: フロントエンドで扱うWorld型をWorldEdited型に変更
  const newWorld: WorldEdited = {
    name: '',
    container: useSystemStore().worldContainers.default,
    version: {
      id: '',
      type: 'vanilla',
      release: true
    },
    additional: {},
    memory: useSystemStore().systemSettings.world.memory,
    authority: {groups: [], players: [], removed: []}
  }

  useWorldEditStore().setEditer(deepCopy(newWorld), saveFunc, { title: '新規ワールド' })
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