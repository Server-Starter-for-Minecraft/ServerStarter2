<script setup lang="ts">
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { useSystemStore } from 'src/stores/SystemStore';

const folder = defineModel<WorldContainerSetting>({ required: true })

const sysStore = useSystemStore()

function removeFolder() {
  sysStore.systemSettings.container.splice(
    sysStore.systemSettings.container.map(c => c.name).indexOf(folder.value.name), 1
  )
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="text-omit" style="font-size: 1.1rem;">{{ folder.name }}</div>
      <div class="text-caption text-omit" style="opacity: .6;">{{ folder.container }}</div>
    </q-card-section>

    <q-checkbox v-model="folder.visible" />
  </q-card>
</template>