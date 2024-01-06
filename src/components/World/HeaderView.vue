<script setup lang="ts">
import { ref } from 'vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from '../util/base/ssTooltip.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const copied = ref(false)

const statusColor = {
  'Stop': 'negative',
  'Ready': 'grey',
  'Running': 'primary',
  'CheckLog': 'grey'
}

function copyIP() {
  navigator.clipboard.writeText(mainStore.worldIP ?? sysStore.publicIP)
    .then(() => {
      copied.value = true
      setTimeout(() => { copied.value = false }, 10000)
    })
}
</script>

<template>
  <div class="flex items-center full-width q-py-sm q-px-md">
    <template v-if="$router.currentRoute.value.path.slice(0, 7) !== '/system'">
      <div class="title text-omit q-pr-md">
        {{ mainStore.world.name }}
        <SsTooltip :name="mainStore.world.name" anchor="bottom start" self="center start" />
      </div>
      <div 
        :class="`text-${statusColor[consoleStore.status(mainStore.world.id)]}`"
        class="q-mr-md"
      >
      {{ $t(`console.status.${consoleStore.status(mainStore.world.id)}`) }}
      </div>
    </template>
    <span v-else class="title q-pr-md">{{ $t('systemsetting.title') }}</span>
    <q-space />
    <div class="row q-gutter-sm items-center">
      <div class="force-oneline">
        <span class="user-select">IP : {{ mainStore.worldIP ?? sysStore.publicIP }}</span>
      </div>
      <q-btn
        dense
        flat
        size=".6rem"
        :icon="copied ? 'done' : 'content_copy'"
        :color="copied ? 'primary' : ''"
        @click="copyIP"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.title {
  font-size: 1.5rem;
}

.force-oneline {
  white-space: nowrap;
}

.user-select {
  user-select: text;
}
</style>
