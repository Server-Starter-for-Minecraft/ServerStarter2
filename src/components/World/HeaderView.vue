<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const statusColor = {
  'Stop': 'negative',
  'Ready': 'grey',
  'Running': 'primary',
  'CheckLog': 'grey'
}
</script>

<template>
  <div class="flex items-center full-width q-py-sm q-px-md">
    <template v-if="$router.currentRoute.value.path.slice(0, 7) !== '/system'">
      <div class="title text-omit q-pr-md">{{ mainStore.world.name }}</div>
      <div 
        :class="`text-${statusColor[consoleStore.status(mainStore.world.id)]}`"
        class="q-mr-md"
      >
      {{ $t(`console.status.${consoleStore.status(mainStore.world.id)}`) }}
      </div>
    </template>
    <span v-else class="title q-pr-md">{{ $t('systemsetting.title') }}</span>
    <q-space />
    <div class="force-oneline">IP : {{ sysStore.publicIP }}</div>
  </div>
</template>

<style scoped lang="scss">
.title {
  font-size: 1.5rem;
}

.force-oneline {
  white-space: nowrap;
}
</style>