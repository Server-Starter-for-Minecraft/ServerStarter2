<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useProgressStore } from 'src/stores/ProgressStore';
import ProgressView from 'src/components/Progress/ProgressView.vue';

const mainStore = useMainStore();
const progressStore = useProgressStore();
</script>

<template>
  <div class="fit" style="position: relative">
    <div class="q-pa-md absolute-center" style="width: 40rem; max-width: 100%">
      <h1 class="q-pa-none" style="font-weight: bold">
        {{ progressStore.getProgress(mainStore.world.id).title }}
      </h1>
      <ProgressView
        :progress="progressStore.getProgress(mainStore.world.id)?.progress"
      />
    </div>
  </div>
</template>
