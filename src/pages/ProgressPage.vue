<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useProgressStore } from 'src/stores/ProgressStore';
import ProgressView from 'src/components/Progress/ProgressView.vue';

const mainStore = useMainStore()
const progressStore = useProgressStore();
</script>

<template>
  <div class="justify-center column items-center fit">
    <div style="width: 30rem;">
      <h1 style="font-weight: bold;">{{ progressStore.getProgress(mainStore.world.id).title }}</h1>
      <ProgressView :progress="progressStore.getProgress(mainStore.world.id)?.progress" />
    </div>
  </div>
</template>