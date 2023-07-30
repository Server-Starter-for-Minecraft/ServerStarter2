<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import FolderCard from 'src/components/SystemSettings/Folder/FolderCard.vue';

const sysStore = useSystemStore()
</script>

<template>
  <div class="q-pa-md">
    <p class="q-my-sm text-body2" style="opacity: .6;">
      ワールドデータの保存先を設定
    </p>

    <template v-for="n in sysStore.systemSettings.container.length" :key="sysStore.systemSettings.container[n-1].title">
      <FolderCard v-model="sysStore.systemSettings.container[n - 1]" />
    </template>
  </div>
</template>