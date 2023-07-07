<script setup lang="ts">
import { WorldID } from 'app/src-electron/schema/world';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

function getStatus(worldID: WorldID) {
  return mainStore.newWorlds.includes(worldID) ? 'NewWorld' : consoleStore.status(worldID)
}
</script>

<template>
  <q-item>
    <q-item-section>
      <div class="row items-center">
        <template v-if="$router.currentRoute.value.path.slice(0, 7) !== '/system'">
          <span class="title q-pr-md">{{ mainStore.world.name }}</span>
          <span class="text-red">{{ getStatus(mainStore.world.id) }}</span>
        </template>
        <template v-else>
          <span class="title q-pr-md">システム設定</span>
        </template>
      </div>
    </q-item-section>
    <q-item-section side>
      IP {{ sysStore.publicIP }}
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.title {
  font-size: 1.5rem;
}
</style>